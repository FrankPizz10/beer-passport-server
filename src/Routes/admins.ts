import express, { Express, Request, Response } from 'express';
import { prismaCtx } from '../index';
import { decodeAdminToken } from '../Middleware/authAdmin';
import { addBeer, addBeerToCollection, addCollection } from '../DBclient/beerclient';
const adminRoutes: Express = express();

adminRoutes.use('/admin', decodeAdminToken);

adminRoutes.get('/admin', (req: Request, res: Response) => {
  return res.send('Success!');
});

// Add a beer to the database
adminRoutes.post('/admin/beers', async (req: Request, res: Response) => {
  if (!req.body.name) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing required fields' });
  }
  try {
    const beer = await prismaCtx.prisma.beers.create({
      data: {
        brewery_id: req.body.brewery_id != null ? parseInt(req.body.brewery_id) : null,
        name: req.body.name,
        cat_id: req.body.cat_id != null ? parseInt(req.body.cat_id) : null,
        style_id: req.body.style_id != null ? parseInt(req.body.style_id) : null,
        abv: req.body.abv,
        ibu: req.body.ibu,
        srm: req.body.srm,
        upc: req.body.upc,
        descript: req.body.descript,
      },
    });
    return res.send(beer);
  } catch (e) {
    console.log(e);
    res.statusCode = 503;
    return res.json({ Error: 'Error adding beer' });
  }
});

// Add a new collection
adminRoutes.post('/admin/collections', async (req: Request, res: Response) => {
  console.log(req.body);
  const collectionParams: CreateCollection = {
    name: req.body.collection.name,
    difficulty: parseInt(req.body.collection.difficulty),
    description: req.body.collection.description,
  };
  if (!collectionParams.name || !collectionParams.description || !collectionParams.difficulty) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing required fields' });
  }
  try {
    const collection = await addCollection(collectionParams, prismaCtx);
    return res.send(collection);
  } catch (e) {
    console.log(e);
    res.statusCode = 503;
    return res.json({ Error: 'Error adding collection' });
  }
});

// Add a beer to a collection
adminRoutes.post('/admin/collections/addBeer', async (req: Request, res: Response) => {
  const collectionBeerParams: AddBeerToCollection = {
    collection_id: parseInt(req.body.addBeerToColelction.collection_id),
    beer_id: parseInt(req.body.addBeerToColelction.beer_id),
  };
  if (!collectionBeerParams?.collection_id || !collectionBeerParams?.beer_id) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing required fields' });
  }
  try {
    const collectionBeer = await addBeerToCollection(collectionBeerParams, prismaCtx);
    return res.send(collectionBeer);
  } catch (e: any) {
    console.log(e);
    res.statusCode = 503;
    return res.json({ Error: 'Error adding beer to collection' });
  }
});

export default adminRoutes;
