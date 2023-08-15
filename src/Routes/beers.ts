import express, { Express, Request, Response } from 'express';
import { getAllBeers, getBeerByCategory, getBeerById } from '../DBclient/beerclient';
import { getCategories } from '../DBclient/gettableinfo';

const beerRoutes: Express = express();

// Get all beers
beerRoutes.get('/api/beers', async (req: Request, res: Response) => {
  const beers = await getAllBeers();
  res.send(beers);
});

// Get beer by category
beerRoutes.post('/api/beers/cat', async (req: Request, res: Response) => {
  if (!req.body.cat) {
    res.statusCode = 400;
    return res.send('No category provided');
  }
  try {
    const beers = await getBeerByCategory(req.body.cat);
    res.send(beers);
  } catch (err) {
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

// Get categories
beerRoutes.get('/api/categories', async (req: Request, res: Response) => {
  const categories = await getCategories();
  res.send(categories);
});

// Get beer by id
beerRoutes.get('/api/beers/:id', async (req: Request, res: Response) => {
  try {
    const beer = await getBeerById(parseInt(req.params.id));
    if (!beer) {
      res.statusCode = 204;
      return res.send('Beer not found');
    }
    res.send(beer);
  } catch (err) {
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

export default beerRoutes;
