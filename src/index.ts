import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import {
  addBeer,
  addBeerToCollection,
  addCollection,
  getAllBeers,
  getBeerByCategory,
  getBeerById,
  getBeersInCollection,
  getCollectionBeerByCollectionIdAndBeerId,
  getCollectionById,
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
import { decodeUserToken } from './Middleware/authUsers';
import { decodeAdminToken } from './Middleware/authAdmin';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import adminRoutes from './Routes/admins';

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

// app.use(decodeUserToken);
// app.use('/api/beers', decodeAdminToken);
// app.use('/api/collections/addBeer', decodeAdminToken);
// app.use('/api/collections', decodeAdminToken);

app.use(adminRoutes);

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
  if (!req.body.uid || !req.body.email || !req.body.age || !req.body.user_name) {
    res.statusCode = 400;
    return res.send('Missing uid, email, age, or user_name');
  }
  try {
    const user = await addUser(req.body, prismaCtx);
    res.send(user);
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError) {
      res.statusCode = 400;
      return res.send('User already exists');
    }
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

// Get all beers
app.get('/api/beers', async (req: Request, res: Response) => {
  const beers = await getAllBeers();
  res.send(beers);
});

// Get beer by category
app.post('/api/beers/cat', async (req: Request, res: Response) => {
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
app.get('/api/categories', async (req: Request, res: Response) => {
  const categories = await getCategories();
  res.send(categories);
});

// Get beer by id
app.get('/api/beers/:id', async (req: Request, res: Response) => {
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

// Update or create user beer
app.post('/api/userbeers', async (req: Request, res: Response) => {
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
app.get('/api/userbeers/:id', async (req: Request, res: Response) => {
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
app.get('/api/userbeer/:user_id/:beer_id', async (req: Request, res: Response) => {
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

// Get user by uid
app.get('/api/userbyuid/:uid', async (req: Request, res: Response) => {
  try {
    const user = await getUser(req.params.uid);
    if (!user) {
      res.statusCode = 204;
      res.send('User not found');
    }
    res.send(user);
  } catch (err) {
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

// Get tried beers by user id
app.get('/api/triedbeers/:id', async (req: Request, res: Response) => {
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
app.get('/api/likedbeers/:id', async (req: Request, res: Response) => {
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

// Get all collections
app.get('/api/collections', async (req: Request, res: Response) => {
  const collections = await getCollections();
  res.send(collections);
});

// Get collection by id
app.get('/api/collections/:id', async (req: Request, res: Response) => {
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
app.get('/api/collections/:id/beers', async (req: Request, res: Response) => {
  try {
    const beers = await getBeersInCollection(parseInt(req.params.id));
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

// Get user badges by user id
app.get('/api/userbadges/:id', async (req: Request, res: Response) => {
  try {
    const userBadges = await getUserBadgesByUserId(parseInt(req.params.id));
    if (!userBadges) {
      res.statusCode = 204;
      return res.send('UserBadges not found');
    }
    res.send(userBadges);
  } catch (err) {
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});

// Get collectionBeer by collection id and beer id
app.get('/api/collectionbeer/:collection_id/:beer_id', async (req: Request, res: Response) => {
  try {
    const collectionBeer = await getCollectionBeerByCollectionIdAndBeerId(
      parseInt(req.params.collection_id),
      parseInt(req.params.beer_id),
    );
    if (!collectionBeer) {
      res.statusCode = 204;
      return res.send('CollectionBeer not found');
    }
    res.send(collectionBeer);
  } catch (err) {
    res.statusCode = 500;
    return res.send('Something went wrong');
  }
});
