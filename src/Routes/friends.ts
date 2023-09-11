import express, { Express, Request, Response } from 'express';
import { addFriend, getFriendsByUserId } from '../DBclient/userclient';

const firendRoutes: Express = express();

// Get all friends for a user
firendRoutes.get('/api/friends/:user_id', async (req: Request, res: Response) => {
  if (!req.params.user_id || isNaN(parseInt(req.params.user_id))) {
    return res.status(400).json({ Error: 'Invalid user_id' });
  }
  const friends = await getFriendsByUserId(parseInt(req.params.user_id));
  return res.send(friends);
});

// Add a friend for a user
firendRoutes.post('/api/friends/:user1/:user2', async (req: Request, res: Response) => {
  if (!req.params.user1 || isNaN(parseInt(req.params.user1))) {
    return res.status(400).json({ Error: 'Invalid user1' });
  }
  if (!req.params.user2 || isNaN(parseInt(req.params.user2))) {
    return res.status(400).json({ Error: 'Invalid user2' });
  }
  if (req.params.user1 === req.params.user2) {
    return res.status(400).json({ Error: 'Cannot add yourself as a friend' });
  }
  const friend = await addFriend(parseInt(req.params.user1), parseInt(req.params.user2));
  return res.send(friend);
});

export default firendRoutes;
