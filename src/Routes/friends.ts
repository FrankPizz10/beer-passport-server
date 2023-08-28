import express, { Express, Request, Response } from 'express';
import { getFriendsByUserId } from '../DBclient/userclient';

const firendRoutes: Express = express();

// Get all friends for a user
firendRoutes.get('/api/friends/:user_id', async (req: Request, res: Response) => {
  if (!req.params.user_id || isNaN(parseInt(req.params.user_id))) {
    return res.status(400).send('Invalid user_id');
  }
  const friends = await getFriendsByUserId(parseInt(req.params.user_id));
  res.send(friends);
});

export default firendRoutes;
