import express, { Express, Request, Response } from 'express';
import {
  getBeerByCategory,
  getBeerById,
  getCollectionsByBeerId,
  getTrendingBeers,
} from '../DBclient/beerclient';
import { getCategories } from '../DBclient/gettableinfo';
import { prismaCtx } from '..';

const beerRoutes: Express = express();

// Get all beers
beerRoutes.get('/api/beers', async (req: Request, res: Response) => {
  const beers = await prismaCtx.prisma.beers.findMany();
  return res.send(beers);
});

// Get all basic beer info
beerRoutes.get('/api/beers/basic', async (req: Request, res: Response) => {
  const beers = await prismaCtx.prisma.beers.findMany({
    select: {
      id: true,
      name: true,
      last_mod: true,
    },
  });
  return res.send(beers);
});

// Get beer by category
beerRoutes.post('/api/beers/cat', async (req: Request, res: Response) => {
  if (!req.body.cat) {
    res.statusCode = 400;
    return res.json({ Error: 'No category provided' });
  }
  try {
    const beers = await getBeerByCategory(req.body.cat);
    return res.send(beers);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get categories
beerRoutes.get('/api/categories', async (req: Request, res: Response) => {
  const categories = await getCategories();
  return res.send(categories);
});

// Get category by id
beerRoutes.get('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const category = await prismaCtx.prisma.categories.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });
    if (!category) {
      res.statusCode = 404;
      return res.json({ Error: 'Category not found' });
    }
    return res.send(category);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get beers by category
beerRoutes.get('/api/categories/:id/beers', async (req, res) => {
  let beerQuantity;
  try {
    beerQuantity = req.query.limit ? parseInt(req.query.limit.toString()) : 20;
    if (beerQuantity > 100) {
      res.statusCode = 400;
      return res.json({ Error: 'Limit is too high' });
    }
  } catch (err) {
    res.statusCode = 400;
    return res.json({ Error: 'Invalid limit' });
  }
  try {
    const beers = await getTrendingBeers(beerQuantity, parseInt(req.params.id));
    return res.send(beers);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong getting beers by brewery' });
  }
});

// Get newest beer
beerRoutes.get('/api/beers/newest', async (req: Request, res: Response) => {
  try {
    const beer = await prismaCtx.prisma.beers.findFirst({
      orderBy: {
        last_mod: 'desc',
      },
    });
    if (!beer) {
      res.statusCode = 404;
      console.log('No beers found');
      return res.json({ Error: 'No beers found' });
    }
    return res.send({ lastMod: beer.last_mod });
  } catch (err) {
    res.statusCode = 500;
    console.log('Something went wrong');
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get beer by id
beerRoutes.get('/api/beers/:id', async (req, res) => {
  try {
    const beer = await getBeerById(
      parseInt(req.params.id),
      req.query.includeCategory === 'true' ? true : false,
      req.query.includeBrewery === 'true' ? true : false,
      req.query.includeStyle === 'true' ? true : false,
    );
    if (!beer) {
      res.statusCode = 404;
      return res.json({ Error: 'Beer not found' });
    }
    return res.send(beer);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get Beer by name
beerRoutes.get('/api/beers/name/:name', async (req: Request, res: Response) => {
  try {
    const beer = await prismaCtx.prisma.beers.findFirst({
      where: {
        name: req.params.name,
      },
    });
    if (!beer) {
      res.statusCode = 404;
      return res.json({ Error: 'Beer not found' });
    }
    return res.send(beer);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get all collections beer belongs to
beerRoutes.get('/api/beers/:id/collections', async (req: Request, res: Response) => {
  try {
    const collections = await getCollectionsByBeerId(parseInt(req.params.id));
    if (!collections) {
      res.statusCode = 404;
      return res.json({ Error: 'Beer does notbelong to any collections' });
    }
    return res.send(collections);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

export default beerRoutes;
