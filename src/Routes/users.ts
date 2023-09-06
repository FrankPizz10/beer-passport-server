import express, { Express, Request, Response } from 'express';
import { prismaCtx } from '../index';
import { addUser, deleteUser, getAllUsers, getUserByUid } from '../DBclient/userclient';
import { Prisma } from '@prisma/client';

const userRoutes: Express = express();

// Get all users
userRoutes.get('/api/users', async (req: Request, res: Response) => {
  const users = await getAllUsers();
  return res.send(users);
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

// Get user by id
userRoutes.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await prismaCtx.prisma.users.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });
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
  const add_user = {
    uid: req.body.uid,
    email: req.body.email,
    age: parseInt(req.body.age),
    user_name: req.body.user_name,
  };
  try {
    const user = await addUser(add_user, prismaCtx);
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

// Delete user
userRoutes.delete('/api/users/:uid', async (req: Request, res: Response) => {
  try {
    const user = await deleteUser(req.params.uid, prismaCtx);
    return res.send(user);
  } catch (err) {
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

export default userRoutes;
