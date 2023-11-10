import { getUserByUid } from '../DBclient/userclient';
import { admin } from '../Firebase/firebase';
import { Request, Response, NextFunction } from 'express';
import { captureException } from '@sentry/node';

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
