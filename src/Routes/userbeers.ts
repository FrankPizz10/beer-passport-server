import express, { Express, Request, Response } from 'express';
import { prismaCtx } from '../index';
import {
  getLikedBeersByUserId,
  getTriedBeersByUserId,
  getUserBeerByUserIdAndBeerId,
  getUserBeersByUserId,
  getUserById,
  updateOrCreateUserBeers,
} from '../DBclient/userclient';
import { getBeerById } from '../DBclient/beerclient';

const userbeerRoutes: Express = express();

// Update or create user beer
userbeerRoutes.post('/api/userbeers', async (req: Request, res: Response) => {
  const userBeerParams: UserBeer = {
    user_id: req.body.userBeer.user_id,
    beer_id: req.body.userBeer.beer_id,
    liked: req.body.userBeer.liked,
    collection_id: req.body.userBeer.collection_id,
  };
  if (!userBeerParams.user_id || !userBeerParams.beer_id || userBeerParams.liked === undefined) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing user_id, beer_id, or liked' });
  }
  const beer = await getBeerById(userBeerParams.beer_id);
  if (!beer) {
    res.statusCode = 400;
    return res.json({ Error: 'Beer not found' });
  }
  const user = await getUserById(userBeerParams.user_id);
  if (!user) {
    res.statusCode = 400;
    return res.json({ Error: 'User not found' });
  }
  const userBeer = await updateOrCreateUserBeers(userBeerParams, prismaCtx);
  return res.send(userBeer);
});

// Get user beers by user
userbeerRoutes.get('/api/userbeers/:id', async (req: Request, res: Response) => {
  try {
    const beers = await getUserBeersByUserId(parseInt(req.params.id));
    if (!beers) {
      res.statusCode = 204;
      return res.json({ Error: 'User beers not found' });
    }
    return res.send(beers);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get user beer by user and beer
userbeerRoutes.get('/api/userbeer/:user_id/:beer_id', async (req: Request, res: Response) => {
  try {
    const userBeer = await getUserBeerByUserIdAndBeerId(
      parseInt(req.params.user_id),
      parseInt(req.params.beer_id),
    );
    if (!userBeer) {
      res.statusCode = 204;
      return res.json({ Error: 'User beer not found' });
    }
    return res.send(userBeer);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get tried beers by user id
userbeerRoutes.get('/api/triedbeers/:id', async (req: Request, res: Response) => {
  try {
    const triedBeers = await getTriedBeersByUserId(parseInt(req.params.id));
    if (!triedBeers) {
      res.statusCode = 204;
      return res.json({ Error: 'User not found' });
    }
    return res.send(triedBeers);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get liked beers by user id
userbeerRoutes.get('/api/likedbeers/:id', async (req: Request, res: Response) => {
  try {
    const likedBeers = await getLikedBeersByUserId(parseInt(req.params.id));
    if (!likedBeers) {
      res.statusCode = 204;
      return res.json({ Error: 'User not found' });
    }
    return res.send(likedBeers);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

export default userbeerRoutes;
