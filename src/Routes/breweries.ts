import express, { Express } from 'express';
import { getBeerGroupsByBrewery, getBeersByBrewery } from '../DBclient/beerclient';
import { prismaCtx } from '..';

const brewereyRoutes: Express = express();

// Get all breweries basic info
brewereyRoutes.get('/api/breweries/basic', async (req, res) => {
  try {
    const breweries = await prismaCtx.prisma.breweries.findMany({
        select: {
            id: true,
            name: true,
            last_mod: true,
        },
    });
    return res.send(breweries);
    } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong getting breweries' });
    }
});

// Get all breweries
brewereyRoutes.get('/api/breweries', async (req, res) => {
  try {
    const breweries = await prismaCtx.prisma.breweries.findMany();
    return res.send(breweries);
    } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong getting breweries' });
    }
});

// Get brewery by id
brewereyRoutes.get('/api/breweries/:id', async (req, res) => {
  try {
    const brewery = await prismaCtx.prisma.breweries.findUnique({
        where: {
            id: parseInt(req.params.id),
        },
    });
    if (!brewery) {
        res.statusCode = 404;
        return res.json({ Error: 'Brewery not found' });
    }
    return res.send(brewery);
    } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong getting brewery' });
    }
});

// Get beers by brewery
brewereyRoutes.get('/api/breweries/:id', async (req, res) => {
  try {
    const beers = await getBeersByBrewery(parseInt(req.params.id));
    return res.send(beers);
    } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong getting beers by brewery' });
    }
});

// Get beers group by brewery
brewereyRoutes.get('/api/breweries', async (req, res) => {
  try {
    const beerGroups = await getBeerGroupsByBrewery();
    return res.send(beerGroups);
    } catch (err) {
    res.statusCode = 500;
    return res.json({ Error: 'Something went wrong getting beers by brewery' });
    }
});

export default brewereyRoutes;