import express, { Express, Request, Response } from 'express';
import { prismaCtx } from '../index';
import { deleteUser, getAllUserBasicInfo } from '../DBclient/userclient';
import { Prisma } from '@prisma/client';

const userRoutes: Express = express();

// Get all user basic info
userRoutes.get('/api/users', async (req: Request, res: Response) => {
  const users = await getAllUserBasicInfo();
  return res.send(users);
});

// Get user name by id
userRoutes.get('/api/users/:id', async (req: Request, res: Response) => {
  if (isNaN(parseInt(req.params.id))) {
    res.statusCode = 400;
    return res.json({ Error: 'Invalid id' });
  }
  const user = await prismaCtx.prisma.users.findUnique({
    where: {
      id: parseInt(req.params.id),
    },
    select: {
      user_name: true,
    },
  });
  if (!user) {
    res.statusCode = 404;
    return res.json({ Error: 'User not found' });
  }
  return res.send(user);
});

// Get basic info for user by user name
userRoutes.get('/api/userbyname/:user_name', async (req: Request, res: Response) => {
  const user = await prismaCtx.prisma.users.findUnique({
    where: {
      user_name: req.params.user_name,
    },
    select: {
      id: true,
      user_name: true,
      private: true,
    },
  });
  if (!user) {
    res.statusCode = 404;
    return res.json({ Error: 'User not found' });
  }
  return res.send(user);
});

// Get user by uid
userRoutes.get('/api/userbyuid/', async (req: Request, res: Response) => {
  const user = await prismaCtx.prisma.users.findUnique({
    where: {
      uid: res.locals.user.uid,
    },
  });
  if (!user) {
    res.statusCode = 404;
    return res.json({ Error: 'User not found' });
  }
  return res.send(user);
});

// Check if a user or email exists
userRoutes.post('/userexists/', async (req: Request, res: Response) => {
  if (!req.body.user_name || !req.body.email) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing user_name or email' });
  }
  try {
    const userName = await prismaCtx.prisma.users.findUnique({
      where: {
        user_name: req.body.user_name,
      },
    });
    if (userName) {
      res.statusCode = 200;
      return res.json({ exists: true, type: 'user_name' });
    }
    const email = await prismaCtx.prisma.users.findUnique({
      where: {
        email: req.body.email,
      },
    });
    if (email) {
      res.statusCode = 200;
      return res.json({ exists: true, type: 'email' });
    }
    return res.send({ exists: false });
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Add user
userRoutes.post('/api/users', async (req: Request, res: Response) => {
  if (!req.body.uid || !req.body.email || !req.body.age || !req.body.user_name) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing uid, email, age, or user_name' });
  }
  try {
    const user = await prismaCtx.prisma.users.create({
      data: {
        uid: req.body.uid,
        email: req.body.email,
        age: parseInt(req.body.age),
        user_name: req.body.user_name,
      },
    });
    return res.send(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      res.statusCode = 400;
      return res.json({ Error: 'User already exists' });
    }
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Delete user
userRoutes.delete('/api/users/', async (req: Request, res: Response) => {
  try {
    const user = await deleteUser(res.locals.user.uid, prismaCtx);
    return res.send(user);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

export default userRoutes;
