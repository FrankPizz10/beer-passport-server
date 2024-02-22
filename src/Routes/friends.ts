import express, { Express, Request, Response } from 'express';
import { addFriend, getFriendsByUserId } from '../DBclient/userclient';
import { prismaCtx } from '..';
import { sendNotifications } from '../Notifications/sendNotifications';

const firendRoutes: Express = express();

// Get all friends for a user
firendRoutes.get('/api/friends/', async (req: Request, res: Response) => {
  const friends = await getFriendsByUserId(parseInt(res.locals.user.id));
  return res.send(friends);
});

// Check if a user is a friend
firendRoutes.get('/api/friends/:user2', async (req: Request, res: Response) => {
  if (!req.params.user2 || isNaN(parseInt(req.params.user2))) {
    return res.status(400).json({ Error: 'Invalid user2' });
  }
  const friends = await prismaCtx.prisma.users.findMany({
    where: {
      id: parseInt(req.params.user2),
      friends_friends_user_2Tousers: {
        some: {
          user_1: res.locals.user.id,
        },
      },
    },
  });
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
  try {
    const friend = await addFriend(parseInt(res.locals.user.id), parseInt(req.params.user2));
    await prismaCtx.prisma.notifications.upsert({
      where: {
        user_id_message: {
          user_id: parseInt(req.params.user2),
          message: `${res.locals.user.user_name} added you as a friend`,
        },
      },
      update: {
        updated_at: new Date(),
      },
      create: {
        user_id: parseInt(req.params.user2),
        type: 'NEW_FRIEND',
        message: `${res.locals.user.user_name} added you as a friend`,
      },
    });
    const friend2 = await prismaCtx.prisma.users.findUnique({
      where: {
        id: parseInt(req.params.user2),
      },
    });
    if (friend2 && friend2.notification_token) {
      sendNotifications([friend2.notification_token], {
        title: 'New Friend',
        body: `${res.locals.user.user_name} added you as a friend`,
      });
    }
    return res.send(friend);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ Error: 'Cannot add friend' });
  }
});

// Delete a friend for a user
firendRoutes.delete('/api/friends/:user2', async (req: Request, res: Response) => {
  if (!req.params.user2 || isNaN(parseInt(req.params.user2))) {
    return res.status(400).json({ Error: 'Invalid user2' });
  }
  const friend = await prismaCtx.prisma.friends.deleteMany({
    where: {
      user_1: res.locals.user.id,
      user_2: parseInt(req.params.user2),
    },
  });
  return res.send(friend);
});

export default firendRoutes;
