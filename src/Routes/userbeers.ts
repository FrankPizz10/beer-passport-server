import express, { Express, Request, Response } from 'express';
import { prismaCtx } from '../index';
import {
  getLikedBeersByUserId,
  getTriedBeersByUserId,
  getUserBeerByUserIdAndBeerId,
  getUserBeersByUserId,
  getUserById,
  updateOrCreateUserBeer,
} from '../DBclient/userclient';
import { getBeerById } from '../DBclient/beerclient';

const userbeerRoutes: Express = express();

// Update or create user beer
userbeerRoutes.post('/api/userbeers', async (req: Request, res: Response) => {
  if (!req.body.beer_id || req.body.liked === undefined) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing beer_id, or liked' });
  }
  const beer = await getBeerById(req.body.beer_id, false, false, false);
  if (!beer) {
    res.statusCode = 400;
    return res.json({ Error: 'Beer not found' });
  }
  const user = await getUserById(res.locals.user.id);
  if (!user) {
    res.statusCode = 400;
    return res.json({ Error: 'User not found' });
  }
  const userBeer = await updateOrCreateUserBeer(
    res.locals.user.id,
    parseInt(req.body.beer_id),
    req.body.liked,
    parseInt(req.body.collection_id),
    prismaCtx,
  );
  return res.send(userBeer);
});

// Delete user beer / Un try beer
userbeerRoutes.delete('/api/userbeers/:beer_id', async (req: Request, res: Response) => {
  try {
    const userBeer = await prismaCtx.prisma.user_beers.delete({
      where: {
        user_id_beer_id: {
          user_id: parseInt(res.locals.user.id),
          beer_id: parseInt(req.params.beer_id),
        },
      },
    });
    return res.send(userBeer);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get liked and tried user beers by user
userbeerRoutes.get('/api/userbeers/count', async (req: Request, res: Response) => {
  try {
    const likedBeersCount = await prismaCtx.prisma.user_beers.count({
      where: {
        user_id: parseInt(res.locals.user.id),
        liked: true,
      },
    });
    const triedBeersCount = await prismaCtx.prisma.user_beers.count({
      where: {
        user_id: parseInt(res.locals.user.id),
      },
    });
    return res.send({ likedBeersCount: likedBeersCount, triedBeersCount: triedBeersCount });
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get user beers by user
userbeerRoutes.get('/api/userbeers/:id', async (req: Request, res: Response) => {
  try {
    const id =
      req.params.id && req.params.id !== 'undefined' ? parseInt(req.params.id) : res.locals.user.id;
    const beers = await getUserBeersByUserId(id);
    if (!beers) {
      res.statusCode = 404;
      return res.json({ Error: 'User beers not found' });
    }
    return res.send(beers);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get user beer by user and beer
userbeerRoutes.get('/api/userbeer/:beer_id', async (req: Request, res: Response) => {
  try {
    const userBeer = await getUserBeerByUserIdAndBeerId(
      parseInt(res.locals.user.id),
      parseInt(req.params.beer_id),
    );
    if (!userBeer) {
      res.statusCode = 404;
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
    const id =
      req.params.id && req.params.id !== 'undefined' ? parseInt(req.params.id) : res.locals.user.id;
    const triedBeers = await getTriedBeersByUserId(id);
    if (!triedBeers) {
      res.statusCode = 404;
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
    const id =
      req.params.id && req.params.id !== 'undefined' ? parseInt(req.params.id) : res.locals.user.id;
    const likedBeers = await getLikedBeersByUserId(id);
    if (!likedBeers) {
      res.statusCode = 404;
      return res.json({ Error: 'User not found' });
    }
    return res.send(likedBeers);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get top x liked beers
userbeerRoutes.get('/api/toplikedbeers/', async (req: Request, res: Response) => {
  let beerQuantity;
  try {
    beerQuantity = req.query.limit ? parseInt(req.query.limit.toString()) : 20;
    if (beerQuantity > 50) {
      res.statusCode = 400;
      return res.json({ Error: 'Limit is too high' });
    }
  } catch (err) {
    res.statusCode = 400;
    return res.json({ Error: 'Invalid limit' });
  }
  try {
    const topLikedBeers = await prismaCtx.prisma.user_beers.groupBy({
      by: ['beer_id'],
      where: {
        liked: true,
      },
      orderBy: {
        _count: {
          liked: 'desc',
        },
      },
      take: beerQuantity,
    });
    if (!topLikedBeers) {
      res.statusCode = 404;
      return res.json({ Error: 'Beers not found' });
    }
    const beers = [];
    for (const beer of topLikedBeers) {
      const beerInfo = await getBeerById(beer.beer_id, true, true, true);
      beers.push(beerInfo);
    }
    return res.send(beers);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

export default userbeerRoutes;
