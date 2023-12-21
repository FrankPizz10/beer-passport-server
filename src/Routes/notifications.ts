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

// Get number of unviewed notifications and list of ids
notificationsRoutes.get('/api/notifications/unviewed', async (req, res) => {
  try {
    const unViewed = await prismaCtx.prisma.notifications.findMany({
      where: {
        user_id: parseInt(res.locals.user.id),
        viewed: false,
      },
    });
    return res.send({ unViewedCount: unViewed.length, unViewedIds: unViewed.map(n => n.id) });
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Mark notifications as viewed
notificationsRoutes.post('/api/notifications/view', async (req, res) => {
  if (!req.body.notificationIds || !Array.isArray(req.body.notificationIds)) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing or malformed notificationIds' });
  }
  if (req.body.notificationIds.length === 0) {
    res.statusCode = 204;
    return res.json({ Error: 'No notificationIds provided' });
  }
  const invalidIds = req.body.notificationIds.filter((id: string) => isNaN(parseInt(id)));
  if (invalidIds.length > 0) {
    res.statusCode = 400;
    return res.json({ Error: 'Invalid notificationIds' });
  }
  try {
    await prismaCtx.prisma.notifications.updateMany({
      where: {
        id: {
          in: req.body.notificationIds,
        },
        AND: {
          user_id: parseInt(res.locals.user.id),
        },
      },
      data: {
        viewed: true,
      },
    });
    return res.send({ message: 'Notifications updated successfully' });
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
