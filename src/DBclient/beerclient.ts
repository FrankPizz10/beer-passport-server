import { Context } from '../../context';
import { prismaCtx } from '../index';

export const getAllBeers = async () => {
  const beers = await prismaCtx.prisma.beers.findMany();
  return beers as Beer[];
};

export const getBeerByCategory = async (cat: string) => {
  // Get category that contains cat
  const category = await prismaCtx.prisma.categories.findFirst({
    where: {
      cat_name: {
        contains: cat,
      },
    },
  });
  const id = category?.id;
  const beers = await prismaCtx.prisma.beers.findMany({
    where: {
      cat_id: {
        equals: id,
      },
    },
  });
  return beers.splice(0, 20);
};

export const getBeerById = async (id: number) => {
  const beer = await prismaCtx.prisma.beers.findUnique({
    where: {
      id: id,
    },
    include: {
      category: true,
      brewery: true,
      style: true,
    },
  });
  return beer;
};

export const getCollectionById = async (collectionId: number) => {
  const collections = await prismaCtx.prisma.collections.findUnique({
    where: {
      id: collectionId,
    },
  });
  return collections;
};

export const getBeersByCollectionId = async (collectionId: number) => {
  const beers = await prismaCtx.prisma.collection_beers.findMany({
    where: {
      collection_id: collectionId,
    },
  });
  return beers;
};

export const getCollectionsByBeerId = async (beerId: number) => {
  const collections = await prismaCtx.prisma.collection_beers.findMany({
    where: {
      beer_id: beerId,
    },
  });
  return collections;
};

export const addBeer = async (beer: CreateBeer, ctx: Context) => {
  const newBeer = await ctx.prisma.beers.create({
    data: {
      brewery_id: beer.brewery_id,
      name: beer.name,
      cat_id: beer.cat_id,
      style_id: beer.style_id,
      abv: beer.abv,
      ibu: beer.ibu,
      srm: beer.srm,
      upc: beer.upc,
      filepath: beer.filepath,
      descript: beer.descript,
    },
  });
  return newBeer;
};

export const addCollection = async (collection: CreateCollection, ctx: Context) => {
  const newCollection = await ctx.prisma.collections.create({
    data: {
      name: collection.name,
      difficulty: collection.difficulty,
      description: collection.description,
    },
  });
  return newCollection;
};

export const addBeerToCollection = async (
  addBeerToCollection: AddBeerToCollection,
  ctx: Context,
) => {
  const newCollectionBeer = await ctx.prisma.collection_beers.create({
    data: {
      beer_id: addBeerToCollection.beer_id,
      collection_id: addBeerToCollection.collection_id,
    },
  });
  return newCollectionBeer;
};

export const getCollectionBeerByCollectionIdAndBeerId = async (
  collection_id: number,
  beer_id: number,
) => {
  const collectionBeer = await prismaCtx.prisma.collection_beers.findUnique({
    where: {
      collection_id_beer_id: {
        collection_id: collection_id,
        beer_id: beer_id,
      },
    },
  });
  return collectionBeer;
};
