import express, { Express, Request, Response } from 'express';
import { getCollectionBeerByCollectionIdAndBeerId } from '../DBclient/beerclient';

const collectionbeerRoutes: Express = express();

// Get collectionBeer by collection id and beer id
collectionbeerRoutes.get(
  '/api/collectionbeer/:collection_id/:beer_id',
  async (req: Request, res: Response) => {
    try {
      const collectionBeer = await getCollectionBeerByCollectionIdAndBeerId(
        parseInt(req.params.collection_id),
        parseInt(req.params.beer_id),
      );
      if (!collectionBeer) {
        res.statusCode = 404;
        return res.json({ Error: 'CollectionBeer not found' });
      }
      return res.send(collectionBeer);
    } catch (err) {
      res.statusCode = 500;
      return res.json({ Error: 'Something went wrong' });
    }
  },
);

export default collectionbeerRoutes;
