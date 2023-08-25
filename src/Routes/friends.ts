import express, { Express, Request, Response } from 'express';
import { getFriendsByUserId } from '../DBclient/userclient';

const firendRoutes: Express = express();

// Get all friends for a user
firendRoutes.get('/api/friends/:user_id', async (req: Request, res: Response) => {
  const friends = await getFriendsByUserId(parseInt(req.params.user_id));
  res.send(friends);
});

export default firendRoutes;
