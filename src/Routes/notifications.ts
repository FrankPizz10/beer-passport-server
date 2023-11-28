import express, { Express } from 'express';
import { prismaCtx } from '..';

const notificationsRoutes: Express = express();

// Get notifications by user id
notificationsRoutes.get('/api/notifications', async (req, res) => {
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

// Set notifications token
notificationsRoutes.post('/api/notification-token', async (req, res) => {
  const { pushToken } = req.body;
  if (!pushToken) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing pushToken' });
  }
  try {
    await prismaCtx.prisma.users.update({
      where: {
        id: parseInt(res.locals.user.id),
      },
      data: {
        notification_token: pushToken,
      },
    });
    return res.send({ message: 'Token updated successfully' });
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

export default notificationsRoutes;
