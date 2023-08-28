import express, { Express, Request, Response } from 'express';
import { getUserBadgesByUserId } from '../DBclient/userclient';

const userbadgeRoutes: Express = express();

// Get user badges by user id
userbadgeRoutes.get('/api/userbadges/:id', async (req: Request, res: Response) => {
  try {
    const userBadges = await getUserBadgesByUserId(parseInt(req.params.id));
    if (!userBadges) {
      res.statusCode = 204;
      return res.send('UserBadges not found');
    }
    return res.send(userBadges);
  } catch (err) {
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

export default userbadgeRoutes;
