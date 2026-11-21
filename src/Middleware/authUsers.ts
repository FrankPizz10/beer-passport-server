import { getUserByUid } from '../DBclient/userclient';
import { admin } from '../Firebase/firebase';
import { Request, Response, NextFunction } from 'express';
import { captureException } from '@sentry/node';
import { timingSafeEqual, scryptSync } from 'crypto';
import { getApiKeys } from '../DBclient/apikeysclient';
import dotenv from 'dotenv';

dotenv.config();

const VALID_API_DURATION = 3; // months

// Firebase Admin verification failures carry a string `code` prefixed with
// 'auth/' (for example 'auth/id-token-expired' or 'auth/argument-error').
// Those are credential problems and map to 401. Anything else thrown while
// verifying is treated as a genuine internal error and maps to 500.
const isAuthError = (e: unknown): boolean => {
  const code = (e as { code?: unknown })?.code;
  return typeof code === 'string' && code.startsWith('auth/');
};

// POST /api/users is the one /api route an unregistered caller must be able
// to reach: it creates the database profile. The middleware is mounted at
// '/api' in src/index.ts, so req.path is '/users' there; when the middleware
// is mounted without a prefix it is '/api/users'. Accept both.
const isRegistrationRequest = (req: Request): boolean => {
  if (req.method !== 'POST') return false;
  const path = (req.path || '').replace(/\/+$/, '');
  return path === '/users' || path === '/api/users';
};

export const decodeUserToken = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    res.statusCode = 401;
    return res.json({ message: 'Unauthorized' });
  }
  const token = req.headers.authorization.split(' ')[1];
  if (!token || token === 'undefined') {
    res.statusCode = 401;
    return res.json({ message: 'Unauthorized' });
  }
  let decodeValue;
  try {
    decodeValue = await admin.auth().verifyIdToken(token);
  } catch (e) {
    if (isAuthError(e)) {
      // Invalid or expired token.
      res.statusCode = 401;
      return res.json({ message: 'Unauthorized' });
    }
    captureException(e);
    console.log('Failed auth', e);
    res.statusCode = 500;
    return res.json({ message: 'Auth Internal Error' });
  }
  if (!decodeValue) {
    res.statusCode = 401;
    return res.json({ message: 'Unauthorized' });
  }
  // Expose the verified token uid so handlers (registration, F-1) can bind
  // actions to the authenticated identity instead of a client-supplied uid.
  res.locals.firebaseUid = decodeValue.uid || decodeValue.user_id;
  let user;
  try {
    user = await getUserByUid(decodeValue.user_id);
  } catch (e) {
    captureException(e);
    console.log('Failed auth', e);
    res.statusCode = 500;
    return res.json({ message: 'Auth Internal Error' });
  }
  if (!user) {
    // Verified Firebase identity with no database row. Registration is the
    // only route allowed through in this state; every other /api route gets
    // a clean 401 instead of a null res.locals.user (QA finding F-8).
    if (isRegistrationRequest(req)) {
      res.locals.user = null;
      return next();
    }
    res.statusCode = 401;
    return res.json({ message: 'Unauthorized' });
  }
  res.locals.user = user;
  return next();
};

export const decodeAdminToken = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    res.statusCode = 401;
    return res.json({ message: 'Unauthorized' });
  }
  const token = req.headers.authorization.split(' ')[1];
  if (!token || token === 'undefined') {
    res.statusCode = 401;
    return res.json({ message: 'Unauthorized' });
  }
  let decodeValue;
  try {
    decodeValue = await admin.auth().verifyIdToken(token);
  } catch (e) {
    if (isAuthError(e)) {
      // Invalid or expired token (a malformed header lands here too).
      res.statusCode = 401;
      return res.json({ message: 'Unauthorized' });
    }
    res.statusCode = 500;
    return res.json({ message: 'Auth Admin Internal Error' });
  }
  if (!decodeValue) {
    res.statusCode = 401;
    return res.json({ message: 'Unauthorized' });
  }
  if (!decodeValue.admin) {
    // Authenticated, but not an admin: the textbook 403 case.
    res.statusCode = 403;
    return res.json({ message: 'Unauthorized Admin' });
  }
  res.locals.firebaseUid = decodeValue.uid || decodeValue.user_id;
  let user;
  try {
    user = await getUserByUid(decodeValue.user_id);
  } catch (e) {
    res.statusCode = 500;
    return res.json({ message: 'Auth Admin Internal Error' });
  }
  if (!user) {
    // Same unresolvable-identity rule as decodeUserToken. Note this removes
    // the previous accidental behavior where an admin-claim token with no
    // database row had full admin access (QA finding F-10).
    res.statusCode = 401;
    return res.json({ message: 'Unauthorized' });
  }
  res.locals.user = user;
  return next();
};

export const decodeAPIKey = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    res.statusCode = 401;
    return res.json({ message: 'Unauthorized' });
  }
  const token = req.headers.authorization.split(' ')[1];
  if (!token || token === 'undefined') {
    res.statusCode = 401;
    return res.json({ message: 'Unauthorized' });
  }
  try {
    if (compareAPIKeys(await getApiKeys(), token)) return next();
    res.statusCode = 401;
    return res.json({ message: 'Unauthorized' });
  } catch (e) {
    res.statusCode = 500;
    return res.json({ message: 'Auth Admin Internal Error' });
  }
};

const compareAPIKeys = (
  storedKeys: { key: string; lastMod: Date; revoked?: boolean }[],
  suppliedKey: string,
) => {
  for (const storedKey of storedKeys) {
    // A revoked key must never authenticate (QA finding F-2).
    if (storedKey.revoked) continue;
    if (!isStillValidApiKey(storedKey.lastMod, VALID_API_DURATION)) continue;
    const [hashedPassword, salt] = storedKey.key.split('.');
    const buffer = scryptSync(suppliedKey, salt, 64) as Buffer;
    if (timingSafeEqual(Buffer.from(hashedPassword, 'hex'), buffer)) {
      return true; // If a match is found, return true
    }
  }
  return false; // If no match is found, return false
};

// Validate the input date is less than validPeriod months ago
function isStillValidApiKey(inputDate: Date, validPeriod: number): boolean {
  // Get the current date
  const currentDate = new Date();

  // Calculate the date x months ago
  const xMonthsAgo = new Date();
  xMonthsAgo.setMonth(currentDate.getMonth() - validPeriod);

  // Check if the input date is more recent than x months ago
  return inputDate > xMonthsAgo;
}
