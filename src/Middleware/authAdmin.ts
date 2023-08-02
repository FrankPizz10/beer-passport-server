import { admin } from '../Firebase/firebase';
import { Request, Response, NextFunction } from 'express';

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
    if (decodeValue.admin === true) {
        console.log("Admin Verified");
        return next();
    }
    return res.json({ message: 'Unauthorized Admin' });
  } catch (e) {
    return res.json({ message: 'Internal Error' });
  }
};
