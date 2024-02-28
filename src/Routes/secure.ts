import express, { Express, Request, Response } from 'express';
import { prismaCtx } from '../';
import { getCategories } from '../DBclient/gettableinfo';

const secureRoutes: Express = express();

// Get categories with api key
secureRoutes.get('/secure/api/categories/', async (req: Request, res: Response) => {
  const categories = await getCategories();
  return res.send(categories);
});

// Get styles with api key
secureRoutes.get('/secure/api/styles/', async (req: Request, res: Response) => {
  const styles = await prismaCtx.prisma.styles.findMany();
  return res.send(styles);
});

// Get breweries with api key
secureRoutes.get('/secure/api/breweries/', async (req: Request, res: Response) => {
  const breweries = await prismaCtx.prisma.breweries.findMany();
  return res.send(breweries);
});

// Get all beers with api key
secureRoutes.get('/secure/api/beers/', async (req: Request, res: Response) => {
  const beers = await prismaCtx.prisma.beers.findMany();
  return res.send(beers);
});

export default secureRoutes;
