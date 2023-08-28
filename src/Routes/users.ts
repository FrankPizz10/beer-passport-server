import express, { Express, Request, Response } from 'express';
import { prismaCtx } from '../index';
import { addUser, getAllUsers, getUserByUid } from '../DBclient/userclient';
import { Prisma } from '@prisma/client';

const userRoutes: Express = express();

// Get all users
userRoutes.get('/api/users', async (req: Request, res: Response) => {
  const users = await getAllUsers();
  res.send(users);
});

// Get user by uid
userRoutes.get('/api/userbyuid/:uid', async (req: Request, res: Response) => {
  try {
    const user = await getUserByUid(req.params.uid);
    if (!user) {
      res.statusCode = 404;
      return res.send('User not found');
    }
    return res.send(user);
  } catch (err) {
    console.log('Errored');
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

// Add user
userRoutes.post('/api/users', async (req: Request, res: Response) => {
  if (!req.body.uid || !req.body.email || !req.body.age || !req.body.user_name) {
    res.statusCode = 400;
    return res.send('Missing uid, email, age, or user_name');
  }
  try {
    const user = await addUser(req.body, prismaCtx);
    return res.send(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      res.statusCode = 400;
      return res.send('User already exists');
    }
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

export default userRoutes;
