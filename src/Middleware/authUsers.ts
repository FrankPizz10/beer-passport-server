import { admin } from '../Firebase/firebase';
import { Request, Response, NextFunction } from 'express';

export const decodeUserToken = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    return res.json({ message: 'Unauthorized' });
  }
  console.log('Headers', req.headers.authorization);
  const token = req.headers.authorization.split(' ')[1];
  console.log('Token', token);
  try {
    const decodeValue = await admin.auth().verifyIdToken(token);
    if (decodeValue) {
      return next();
    }
    return res.json({ message: 'Unauthorized' });
  } catch (e) {
    return res.json({ message: 'Auth Internal Error' });
  }
};
