import express, { Express, Request, Response } from 'express';
import { prismaCtx } from '../index';
import { decodeAdminToken } from '../Middleware/authUsers';
import {
  deleteUser,
  getAllUsers,
  getUserByUid,
  updateOrCreateUserBeers,
} from '../DBclient/userclient';
const adminRoutes: Express = express();

adminRoutes.use('/admin', decodeAdminToken);

adminRoutes.get('/admin', (req: Request, res: Response) => {
  return res.send('Success!');
});

// Get all users
adminRoutes.get('/admin/users', async (req: Request, res: Response) => {
  const users = await getAllUsers();
  return res.send(users);
});

// Get user by id
adminRoutes.get('/admin/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await prismaCtx.prisma.users.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });
    if (!user) {
      res.statusCode = 404;
      return res.json({ Errror: 'User not found' });
    }
    return res.send(user);
  } catch (err) {
    console.log('Errored');
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Get user by uid
adminRoutes.get('/admin/userbyuid/:uid', async (req: Request, res: Response) => {
  try {
    const user = await getUserByUid(req.params.uid);
    if (!user) {
      res.statusCode = 404;
      return res.json({ Error: 'User not found' });
    }
    return res.send(user);
  } catch (err) {
    console.log('Errored');
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
});

// Delete user
adminRoutes.delete('/admin/users/:uid', async (req: Request, res: Response) => {
  try {
    const user = await deleteUser(req.params.uid, prismaCtx);
    return res.send(user);
  } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong' });
  }
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

// Update a beer
adminRoutes.put('/admin/beers/:id', async (req: Request, res: Response) => {
  if (!req.body.name) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing required fields' });
  }
  try {
    const beer = await prismaCtx.prisma.beers.update({
      where: {
        id: parseInt(req.params.id),
      },
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
    return res.json({ Error: 'Error updating beer' });
  }
});

// Delete a beer
adminRoutes.delete('/admin/beers/:id', async (req: Request, res: Response) => {
  try {
    const beer = await prismaCtx.prisma.beers.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    return res.send(beer);
  } catch (e) {
    console.log(e);
    res.statusCode = 503;
    return res.json({ Error: 'Error deleting beer' });
  }
});

// Add a new collection
adminRoutes.post('/admin/collections', async (req: Request, res: Response) => {
  if (!req.body.name || !req.body.description || !req.body.difficulty) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing required fields' });
  }
  try {
    const collection = await prismaCtx.prisma.collections.create({
      data: {
        name: req.body.name,
        difficulty: parseInt(req.body.difficulty),
        description: req.body.description,
      },
    });
    return res.send(collection);
  } catch (e) {
    console.log(e);
    res.statusCode = 503;
    return res.json({ Error: 'Error adding collection' });
  }
});

// Update a collection
adminRoutes.put('/admin/collections/:id', async (req: Request, res: Response) => {
  if (
    !req.body.name ||
    !req.body.description ||
    !req.body.difficulty ||
    !req.params.id ||
    !parseInt(req.params.id)
  ) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing required fields' });
  }
  try {
    const collection = await prismaCtx.prisma.collections.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
        difficulty: parseInt(req.body.difficulty),
        description: req.body.description,
      },
    });
    return res.send(collection);
  } catch (e) {
    console.log(e);
    res.statusCode = 503;
    return res.json({ Error: 'Error updating collection' });
  }
});

// Add a beer to a collection
adminRoutes.post('/admin/collections/addBeer', async (req: Request, res: Response) => {
  if (!req.body.collection_id || !req.body.beer_id) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing required fields' });
  }
  try {
    const collectionBeer = await prismaCtx.prisma.collection_beers.create({
      data: {
        collection_id: parseInt(req.body.collection_id),
        beer_id: parseInt(req.body.beer_id),
      },
    });
    const relatedUserBeers = await prismaCtx.prisma.user_beers.findMany({
      where: {
        beer_id: parseInt(req.body.beer_id),
      },
    });
    for (const beer of relatedUserBeers) {
      updateOrCreateUserBeers(
        beer.user_id,
        beer.beer_id,
        beer.liked,
        parseInt(req.body.collection_id),
        prismaCtx,
      );
    }
    return res.send(collectionBeer);
  } catch (e) {
    console.log(e);
    res.statusCode = 503;
    return res.json({ Error: 'Error adding beer to collection' });
  }
});

// Delete a beer from a collection
adminRoutes.delete('/admin/collections/deleteBeer', async (req: Request, res: Response) => {
  if (!req.body.collection_id || !req.body.beer_id) {
    res.statusCode = 400;
    return res.json({ Error: 'Missing required fields' });
  }
  try {
    const collectionBeer = await prismaCtx.prisma.collection_beers.delete({
      where: {
        collection_id_beer_id: {
          collection_id: parseInt(req.body.collection_id),
          beer_id: parseInt(req.body.beer_id),
        },
      },
    });
    return res.send(collectionBeer);
  } catch (e) {
    console.log(e);
    res.statusCode = 503;
    return res.json({ Error: 'Error deleting beer from collection' });
  }
});

// Delete a collection
adminRoutes.delete('/admin/collections/:id', async (req: Request, res: Response) => {
  try {
    const collection = await prismaCtx.prisma.collections.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    return res.send(collection);
  } catch (e) {
    console.log(e);
    res.statusCode = 503;
    return res.json({ Error: 'Error deleting collection' });
  }
});

export default adminRoutes;
