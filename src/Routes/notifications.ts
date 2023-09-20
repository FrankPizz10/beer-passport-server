import express, { Express, Request, Response } from 'express';
import { prismaCtx } from '..';

const notificationsRoutes: Express = express();

// Get notifications by user id
notificationsRoutes.get('/api/notifications/:id', async (req, res) => {
  try {
    const notifications = await prismaCtx.prisma.notifications.findMany({
      where: {
        user_id: parseInt(res.locals.user.id),
      },
    });
    return res.send(notifications);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});
