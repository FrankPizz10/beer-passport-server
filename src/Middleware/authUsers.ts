import { getUserByUid } from '../DBclient/userclient';
import { admin } from '../Firebase/firebase';
import { Request, Response, NextFunction } from 'express';
import { captureException } from '@sentry/node';
import { timingSafeEqual, scryptSync } from 'crypto';
import { getApiKeys } from '../DBclient/apikeysclient';

export const decodeUserToken = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    return res.json({ message: 'Unauthorized' });
  }
  const token = req.headers.authorization.split(' ')[1];
  try {
    const decodeValue = await admin.auth().verifyIdToken(token);
    if (decodeValue) {
      res.locals.user = await getUserByUid(decodeValue.user_id);
      return next();
    }
    return res.json({ message: 'Unauthorized' });
  } catch (e) {
    captureException(e);
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
  console.log('Decoding Api Key');
  if (!req.headers.authorization) {
    return res.json({ message: 'Unauthorized' });
  }
  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.json({ message: 'Unauthorized' });
    }
    if (compareAPIKeys(await getApiKeys(), token))
      return next();
    return res.json({ message: 'Unauthorized' });
  } catch (e) {
    return res.json({ message: 'Auth Admin Internal Error' });
  }
}

const compareAPIKeys = (storedKeys: string[], suppliedKey: string) => {
  for (const storedKey of storedKeys) {
    const [hashedPassword, salt] = storedKey.split('.');
    const buffer = scryptSync(suppliedKey, salt, 64) as Buffer;
    if (timingSafeEqual(Buffer.from(hashedPassword, 'hex'), buffer)) {
      return true; // If a match is found, return true
    }
  }
  return false; // If no match is found, return false
}
