import express, { Express, Request, Response } from 'express';
import { getUserBadgesByUserId } from '../DBclient/userclient';
import { prismaCtx } from '..';

const userbadgeRoutes: Express = express();

// Get user badges by user id
userbadgeRoutes.get('/api/userbadges/', async (req: Request, res: Response) => {
  try {
    const userBadges = await getUserBadgesByUserId(parseInt(res.locals.user.id));
    if (!userBadges) {
      res.statusCode = 204;
      return res.json({ Error: 'UserBadges not found' });
    }
    return res.send(userBadges);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get badge count
userbadgeRoutes.get('/api/userbadges/count', async (req: Request, res: Response) => {
  try {
    const badgeCount = await prismaCtx.prisma.user_badges.count({
      where: {
        user_id: parseInt(res.locals.user.id),
      },
    });
    return res.send({ badgeCount: badgeCount });
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong with user badge count' });
  }
});

// Used to get friends badges
userbadgeRoutes.get('/api/userbadges/:id', async (req: Request, res: Response) => {
  try {
    const userBadges = await getUserBadgesByUserId(parseInt(req.params.id));
    if (!userBadges) {
      res.statusCode = 204;
      return res.json({ Error: 'UserBadges not found' });
    }
    return res.send(userBadges);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

export default userbadgeRoutes;