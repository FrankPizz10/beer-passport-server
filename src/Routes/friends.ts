import express, { Express, Request, Response } from 'express';
import { addFriend, getFriendsByUserId } from '../DBclient/userclient';
import { prismaCtx } from '..';

const firendRoutes: Express = express();

// Get all friends for a user
firendRoutes.get('/api/friends/', async (req: Request, res: Response) => {
  const friends = await getFriendsByUserId(parseInt(res.locals.user.id));
  return res.send(friends);
});

// Get all users that are not friend or user
firendRoutes.get('/api/notfriends', async (req: Request, res: Response) => {
  const friends = await prismaCtx.prisma.users.findMany({
    where: {
      id: {
        not: res.locals.user.id,
      },
      NOT: {
        friends_friends_user_2Tousers: {
          some: {
            user_1: res.locals.user.id,
          },
        },
      },
    },
    select: {
      id: true,
      user_name: true,
      private: true,
    },
  });
  return res.send(friends);
});

// Add a friend for a user
firendRoutes.post('/api/friends/:user2', async (req: Request, res: Response) => {
  if (!req.params.user2 || isNaN(parseInt(req.params.user2))) {
    return res.status(400).json({ Error: 'Invalid user2' });
  }
  if (res.locals.user.id === req.params.user2) {
    return res.status(400).json({ Error: 'Cannot add yourself as a friend' });
  }
  const friend = await addFriend(parseInt(res.locals.user.id), parseInt(req.params.user2));
  await prismaCtx.prisma.notifications.create({
    data: {
      user_id: parseInt(req.params.user2),
      type: 'NEW_FRIEND',
      message: `${res.locals.user.username} added you as a friend`,
    },
  });

  return res.send(friend);
});

export default firendRoutes;
