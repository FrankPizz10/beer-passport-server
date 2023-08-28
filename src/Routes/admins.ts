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
  const beerParams: CreateBeer = {
    brewery_id: parseInt(req.body.beer.brewery_id),
    name: req.body.beer.name,
    cat_id: parseInt(req.body.beer.cat_id),
    style_id: parseInt(req.body.beer.style_id),
    abv: req.body.beer.abv,
    ibu: req.body.beer.ibu,
    srm: req.body.beer.srm,
    upc: req.body.beer.upc,
    filepath: req.body.beer.filepath,
    descript: req.body.beer.descript,
    collection_id: req.body.beer.collection_id,
  };
  console.log(beerParams);
  if (
    !beerParams.brewery_id ||
    !beerParams.name ||
    !beerParams.cat_id ||
    !beerParams.style_id ||
    !beerParams.descript
  ) {
    res.statusCode = 400;
    return res.send('Missing required fields');
  }
  try {
    const beer = await addBeer(beerParams, prismaCtx);
    return res.send(beer);
  } catch (e) {
    console.log(e);
    res.statusCode = 503;
    return res.send('Error adding beer');
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
    return res.send('Missing required fields');
  }
  try {
    const collection = await addCollection(collectionParams, prismaCtx);
    return res.send(collection);
  } catch (e) {
    console.log(e);
    res.statusCode = 503;
    return res.send('Error adding collection');
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
    return res.send('Missing required fields');
  }
  try {
    const collectionBeer = await addBeerToCollection(collectionBeerParams, prismaCtx);
    return res.send(collectionBeer);
  } catch (e: any) {
    console.log(e);
    res.statusCode = 503;
    return res.send('Error adding beer to collection');
  }
});

export default adminRoutes;
