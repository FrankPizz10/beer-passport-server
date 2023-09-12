import express, { Express, Request, Response } from 'express';
import { addFriend, getFriendsByUserId } from '../DBclient/userclient';

const firendRoutes: Express = express();

// Get all friends for a user
firendRoutes.get('/api/friends/', async (req: Request, res: Response) => {
  const friends = await getFriendsByUserId(parseInt(res.locals.user.id));
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
  return res.send(friend);
});

export default firendRoutes;
