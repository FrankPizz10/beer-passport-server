import { getUserByUid } from '../DBclient/userclient';
import { admin } from '../Firebase/firebase';
import { Request, Response, NextFunction } from 'express';
import { captureException } from '@sentry/node';
import { timingSafeEqual, scryptSync } from 'crypto';
import { getApiKeys } from '../DBclient/apikeysclient';
import dotenv from 'dotenv';

dotenv.config();

const VALID_API_DURATION = 3; // months

export const decodeUserToken = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    return res.json({ message: 'Unauthorized' });
  }
  const token = req.headers.authorization.split(' ')[1];
  if (!token || token === 'undefined') {
    return res.json({ message: 'Unauthorized' });
  }
  try {
    const decodeValue = await admin.auth().verifyIdToken(token);
    if (decodeValue) {
      res.locals.user = await getUserByUid(decodeValue.user_id);
      return next();
    }
    return res.json({ message: 'Unauthorized' });
  } catch (e) {
    captureException(e);
    console.log('Failed auth', e);
    return res.json({ message: 'Auth Internal Error' });
  }
};

export const decodeAdminToken = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    return res.json({ message: 'Unauthorized' });
  }
  const token = req.headers.authorization.split(' ')[1];
  try {
    const decodeValue = await admin.auth().verifyIdToken(token);
    if (!decodeValue) {
      return res.json({ message: 'Unauthorized Admin' });
    }
    if (decodeValue.admin) {
      res.locals.user = await getUserByUid(decodeValue.user_id);
      return next();
    }
    return res.json({ message: 'Unauthorized Admin' });
  } catch (e) {
    return res.json({ message: 'Auth Admin Internal Error' });
  }
};

export const decodeAPIKey = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    return res.json({ message: 'Unauthorized' });
  }
  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.json({ message: 'Unauthorized' });
    }
    if (compareAPIKeys(await getApiKeys(), token)) return next();
    return res.json({ message: 'Unauthorized' });
  } catch (e) {
    return res.json({ message: 'Auth Admin Internal Error' });
  }
};

const compareAPIKeys = (storedKeys: { key: string; lastMod: Date }[], suppliedKey: string) => {
  for (const storedKey of storedKeys) {
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
