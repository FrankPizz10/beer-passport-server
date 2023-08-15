import express, { Express, Request, Response } from 'express';
import {
  getLikedBeersByUserId,
  getTriedBeersByUserId,
  getUserBeerByUserIdAndBeerId,
  getUserBeersByUserId,
} from '../DBclient/userclient';

const userbeerRoutes: Express = express();

// Update or create user beer
userbeerRoutes.post('/api/userbeers', async (req: Request, res: Response) => {
  const userBeerParams: UserBeer = {
    user_id: req.body.userBeer.user_id,
    beer_id: req.body.userBeer.beer_id,
    liked: req.body.userBeer.liked,
    collection_id: req.body.userBeer.collection_id,
  };
  // if (!userBeerParams.user_id || !userBeerParams.beer_id || userBeerParams.liked === undefined) {
  //   res.statusCode = 400;
  //   return res.send('Missing user_id, beer_id, or liked');
  // }
  // const beer = await getBeerById(userBeerParams.beer_id);
  // if (!beer) {
  //   res.statusCode = 400;
  //   return res.send('Beer not found');
  // }
  // if (beer.collection_id && !userBeerParams.collection_id) {
  //   res.statusCode = 400;
  //   return res.send('Beer is in a collection, but no collection_id provided');
  // }
  // if (userBeerParams.collection_id && !beer.collection_id) {
  //   res.statusCode = 400;
  //   return res.send('Beer is not in a collection, but collection_id provided');
  // }
  // if (beer.collection_id && userBeerParams.collection_id) {
  //   if (beer.collection_id !== userBeerParams.collection_id) {
  //     res.statusCode = 400;
  //     return res.send('Beer is in a different collection than the one provided');
  //   }
  // }
  // const userBeer = await updateOrCreateUserBeers(userBeerParams, prismaCtx);
  // res.send(userBeer);
});

// Get user beers by user
userbeerRoutes.get('/api/userbeers/:id', async (req: Request, res: Response) => {
  try {
    const beers = await getUserBeersByUserId(parseInt(req.params.id));
    if (!beers) {
      res.statusCode = 204;
      return res.send('User beers not found');
    }
    res.send(beers);
  } catch (err) {
    res.statusCode = 500;
    return res.send('Something went wrong');
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
      return res.send('User beer not found');
    }
    res.send(userBeer);
  } catch (err) {
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

// Get tried beers by user id
userbeerRoutes.get('/api/triedbeers/:id', async (req: Request, res: Response) => {
  try {
    const triedBeers = await getTriedBeersByUserId(parseInt(req.params.id));
    if (!triedBeers) {
      res.statusCode = 204;
      return res.send('User not found');
    }
    res.send(triedBeers);
  } catch (err) {
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

// Get liked beers by user id
userbeerRoutes.get('/api/likedbeers/:id', async (req: Request, res: Response) => {
  try {
    const likedBeers = await getLikedBeersByUserId(parseInt(req.params.id));
    if (!likedBeers) {
      res.statusCode = 204;
      return res.send('User not found');
    }
    res.send(likedBeers);
  } catch (err) {
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

export default userbeerRoutes;
