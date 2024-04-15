import { Prisma } from '@prisma/client';
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

export const getBeersByCategory = async (catId: number, limit?: number) => {
  const beers = await prismaCtx.prisma.beers.findMany({
    where: {
      cat_id: catId,
    },
    select: {
      id: true,
      name: true,
      cat_id: true,
    },
    take: limit,
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

  return getTopBeersHelper(topLikedBeers, beerQuantity, catId);
};

// Get trending beers that were liked and updated in the last week
export const getTrendingBeers = async (beerQuantity: number, catId?: number) => {
  const topTrendingBeers = await prismaCtx.prisma.user_beers.groupBy({
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

  return getTopBeersHelper(topTrendingBeers, beerQuantity, catId);
};

const getTopBeersHelper = async (
  topBeers: Prisma.PickArray<Prisma.User_beersGroupByOutputType, 'beer_id'[]>[],
  beerQuantity: number,
  catId?: number,
) => {
  if (catId && (!topBeers || topBeers.length === 0)) {
    return getBeersByCategory(catId, beerQuantity);
  }

  if (!catId && (!topBeers || topBeers.length === 0)) {
    return await prismaCtx.prisma.beers.findMany({
      select: {
        id: true,
        name: true,
        last_mod: true,
        cat_id: true,
      },
      take: beerQuantity,
    });
  }

  let extraBeers: { id: number; name: string; cat_id: number | null }[] = [];
  if (catId && topBeers.length < beerQuantity) {
    extraBeers = await getBeersByCategory(catId, beerQuantity - topBeers.length);
  }

  if (!catId && topBeers.length < beerQuantity) {
    const allBeers = await prismaCtx.prisma.beers.findMany({
      select: {
        id: true,
        name: true,
        last_mod: true,
        cat_id: true,
      },
      take: beerQuantity - topBeers.length,
    });
    extraBeers = allBeers;
  }

  const beers = [];

  for (const beer of topBeers) {
    const beerInfo = await prismaCtx.prisma.beers.findUnique({
      where: {
        id: beer.beer_id,
      },
      select: {
        id: true,
        name: true,
        cat_id: true,
      },
    });
    if (!catId || beerInfo?.cat_id === catId) {
      beers.push(beerInfo);
    }
  }

  return [...beers, ...extraBeers];
};
