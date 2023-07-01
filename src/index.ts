import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import {
  getAllBeers,
  getBeerByCategory,
  getBeerById,
  getBeersInCollection,
  getCollectionsById,
} from './DBclient/beerclient';
import {
  getAllUsers,
  addUser,
  getUser,
  updateOrCreateUserBeers,
  getUserBeersByUserId,
  getTriedBeersByUserId,
  getLikedBeersByUserId,
  getUserBeerByUserIdAndBeerId,
  getUserBadgesByUserId,
} from './DBclient/userclient';
import { getCategories, getCollections } from './DBclient/gettableinfo';
import { createContext } from '../context';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT;

app.use(
  bodyParser.urlencoded({
    extended: false,
  }),
);

app.use(bodyParser.json());
app.use(cors());

export const prismaCtx = createContext();

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

export const server = app.listen(PORT, () => {
  console.log(`⚡️[server]: Beer Passport Server is running at http://localhost:${PORT}`);
});

// Get all users
app.get('/api/users', async (req: Request, res: Response) => {
  const users = await getAllUsers();
  res.send(users);
});

// Add user
app.post('/api/users', async (req: Request, res: Response) => {
  const user = await addUser(req.body, prismaCtx);
  res.send(user);
});

// Get all beers
app.get('/api/beers', async (req: Request, res: Response) => {
  const beers = await getAllBeers();
  res.send(beers);
});

// Get beer by category
app.post('/api/beers/cat', async (req: Request, res: Response) => {
  const beers = await getBeerByCategory(req.body.cat);
  res.send(beers);
});

// Get categories
app.get('/api/categories', async (req: Request, res: Response) => {
  const categories = await getCategories();
  res.send(categories);
});

// Get beer by id
app.get('/api/beers/:id', async (req: Request, res: Response) => {
  const beer = await getBeerById(parseInt(req.params.id));
  res.send(beer);
});

// Update or create user beer
app.post('/api/userbeers', async (req: Request, res: Response) => {
  const beer = await getBeerById(req.body.beer_id);
  if (!beer || beer.collection_id !== req.body.collection_id) {
    res.statusCode = 400;
    res.send('Beer not found or not in collection');
  }
  const collectionId = req.body.collection_id ? req.body.collection_id : null;
  const userBeerParams: UserBeer = {
    user_id: req.body.user_id,
    beer_id: req.body.beer_id,
    liked: req.body.liked,
    collection_id: collectionId,
  };
  const userBeer = await updateOrCreateUserBeers(userBeerParams, prismaCtx);
  res.send(userBeer);
});

// Get user beers by user
app.get('/api/userbeers/:id', async (req: Request, res: Response) => {
  const beers = await getUserBeersByUserId(parseInt(req.params.id));
  res.send(beers);
});

// Get user beer by user and beer
app.get('/api/userbeer/:user_id/:beer_id', async (req: Request, res: Response) => {
  const beer = await getUserBeerByUserIdAndBeerId(
    parseInt(req.params.user_id),
    parseInt(req.params.beer_id),
  );
  res.send(beer);
});

// Get user by uid
app.get('/api/userbyuid/:uid', async (req: Request, res: Response) => {
  const user = await getUser(req.params.uid);
  if (!user) {
    res.statusCode = 404;
    res.send('User not found');
  }
  res.send(user);
});

// Get tried beers by user id
app.get('/api/triedbeers/:id', async (req: Request, res: Response) => {
  const triedBeers = await getTriedBeersByUserId(parseInt(req.params.id));
  res.send(triedBeers);
});

// Get liked beers by user id
app.get('/api/likedbeers/:id', async (req: Request, res: Response) => {
  const likedBeers = await getLikedBeersByUserId(parseInt(req.params.id));
  res.send(likedBeers);
});

// Get all collections
app.get('/api/collections', async (req: Request, res: Response) => {
  const collections = await getCollections();
  res.send(collections);
});

// Get collection by id
app.get('/api/collections/:id', async (req: Request, res: Response) => {
  const collection = await getCollectionsById(parseInt(req.params.id));
  res.send(collection);
});

// Get all beers in a collection
app.get('/api/collections/:id/beers', async (req: Request, res: Response) => {
  const beers = await getBeersInCollection(parseInt(req.params.id));
  res.send(beers);
});

// Get user badges by user id
app.get('/api/userbadges/:id', async (req: Request, res: Response) => {
  const userBadges = await getUserBadgesByUserId(parseInt(req.params.id));
  res.send(userBadges);
});
