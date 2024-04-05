import { prismaCtx } from '../index';

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
    select: {
      id: true,
      name: true,
    },
  });
  return beers.splice(0, 20);
};

export const getBeerById = async (
  id: number,
  includeCategory: boolean,
  includeBrewery: boolean,
  includeStyle: boolean,
) => {
  const beer = await prismaCtx.prisma.beers.findUnique({
    where: {
      id: id,
    },
    include: {
      category: includeCategory,
      brewery: includeBrewery,
      style: includeStyle,
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

export const getBeersByBrewery = async (breweryId: number) => {
  const beers = await prismaCtx.prisma.beers.findMany({
    where: {
      brewery_id: breweryId,
    },
  });
  return beers;
};

export const getBeersByCategory = async (catId: number) => {
  const beers = await prismaCtx.prisma.beers.findMany({
    where: {
      cat_id: catId,
    },
  });
  return beers;
};

export const getBeerGroupsByBrewery = async () => {
  const beers = await prismaCtx.prisma.beers.groupBy({
    by: ['brewery_id'],
    _count: {
      id: true,
    },
  });
  return beers;
};

export const getTopLikedBeers = async (beerQuantity: number, catId?: number) => {
  const topLikedBeers = await prismaCtx.prisma.user_beers.groupBy({
    by: ['beer_id'],
    where: {
      liked: true,
    },
    orderBy: {
      _count: {
        liked: 'desc',
      },
    },
    take: beerQuantity,
  });

  if (!topLikedBeers) {
    return [];
  }

  const beers = [];

  for (const beer of topLikedBeers) {
    const beerInfo = await getBeerById(beer.beer_id, false, false, false);
    if (!catId || beerInfo?.cat_id === catId) {
      beers.push(beerInfo);
    }
  }

  return beers;
};
