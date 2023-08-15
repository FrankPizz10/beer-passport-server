import express, { Express, Request, Response } from 'express';
import { getCollections } from '../DBclient/gettableinfo';
import { getBeersByCollectionId, getCollectionById } from '../DBclient/beerclient';

const collectionRoutes: Express = express();

// Get all collections
collectionRoutes.get('/api/collections', async (req: Request, res: Response) => {
  const collections = await getCollections();
  res.send(collections);
});

// Get collection by id
collectionRoutes.get('/api/collections/:id', async (req: Request, res: Response) => {
  try {
    const collection = await getCollectionById(parseInt(req.params.id));
    if (!collection) {
      res.statusCode = 204;
      return res.send('Collection not found');
    }
    res.send(collection);
  } catch (err) {
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

// Get all beers in a collection
collectionRoutes.get('/api/collections/:id/beers', async (req: Request, res: Response) => {
  try {
    const beers = await getBeersByCollectionId(parseInt(req.params.id));
    if (!beers) {
      res.statusCode = 204;
      return res.send('Collection not found');
    }
    res.send(beers);
  } catch (err) {
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

export default collectionRoutes;
