import { Prisma } from '@prisma/client';
import prisma from '../../client';

export const getBeerByCategory = async (cat: string) => {
  // Get category that contains cat
  const category = await prisma.categories.findFirst({
    where: {
      cat_name: {
        contains: cat,
      },
    },
  });
  const id = category?.id;
  const beers = await prisma.beers.findMany({
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
  return beers != null ? beers.splice(0, 20) : [];
};

export const getBeerById = async (
  id: number,
  includeCategory: boolean,
  includeBrewery: boolean,
  includeStyle: boolean,
) => {
  const beer = await prisma.beers.findUnique({
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
  const collections = await prisma.collections.findUnique({
    where: {
      id: collectionId,
    },
  });
  return collections;
};

export const getBeersByCollectionId = async (collectionId: number) => {
  const beers = await prisma.collection_beers.findMany({
    where: {
      collection_id: collectionId,
    },
  });
  return beers;
};

export const getCollectionsByBeerId = async (beerId: number) => {
  const collections = await prisma.collection_beers.findMany({
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
  const collectionBeer = await prisma.collection_beers.findUnique({
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
  const beers = await prisma.beers.findMany({
    where: {
      brewery_id: breweryId,
    },
  });
  return beers;
};

export const getBeersByCategory = async (catId: number, limit?: number) => {
  const beers = await prisma.beers.findMany({
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
  const beers = await prisma.beers.groupBy({
    by: ['brewery_id'],
    _count: {
      id: true,
    },
  });
  return beers;
};

export const getTopLikedBeers = async (beerQuantity: number, catId?: number) => {
  const topLikedBeers = await prisma.user_beers.groupBy({
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
  // Get top trending beers
  const topTrendingBeers = await prisma.user_beers.groupBy({
    by: ['beer_id'],
    where: {
      liked: true,
      updated_at: {
        gte: new Date(new Date().getDate() - 7), // Filter updated_at within the last 7 days
      },
    },
    orderBy: {
      _count: {
        liked: 'desc',
      },
    },
    take: beerQuantity,
  });
  // If there are not enough top trending beers, get top liked beers
  let topLikedBeers;
  if (!topTrendingBeers || topTrendingBeers.length < beerQuantity) {
    topLikedBeers = await prisma.user_beers.groupBy({
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
  }
  let combinedBeers;
  // Add topliked beers to top trending beers if they are not already there
  if (topLikedBeers) {
    combinedBeers = topTrendingBeers.concat(
      topLikedBeers.filter(
        beer => !topTrendingBeers.some(trendingBeer => trendingBeer.beer_id === beer.beer_id),
      ),
    );
  }
  if (!combinedBeers && topTrendingBeers && topTrendingBeers.length == 0) {
    return getTopBeersHelper([], beerQuantity, catId);
  } else if (combinedBeers) {
    return getTopBeersHelper(combinedBeers, beerQuantity, catId);
  }
  return getTopBeersHelper(topTrendingBeers, beerQuantity, catId);
};

export const getTopBeersHelper = async (
  topBeers: Prisma.PickArray<Prisma.User_beersGroupByOutputType, 'beer_id'[]>[],
  beerQuantity: number,
  catId?: number,
) => {
  // First get the top liked beers
  const beers: { id: number; name: string; cat_id: number | null }[] = [];
  if (!catId) {
    beers.push(
      ...(await prisma.beers.findMany({
        where: {
          id: {
            in: topBeers.map(beer => beer.beer_id),
          },
        },
        select: {
          id: true,
          name: true,
          cat_id: true,
        },
      })),
    );
  } else {
    beers.push(
      ...(await prisma.beers.findMany({
        where: {
          id: {
            in: topBeers.map(beer => beer.beer_id),
          },
          cat_id: catId,
        },
        select: {
          id: true,
          name: true,
          cat_id: true,
        },
      })),
    );
  }
  // If there are not enough top liked beers, get extra beers
  const extraBeers: { id: number; name: string; cat_id: number | null }[] = [];
  if (!catId) {
    if (beers.length < beerQuantity) {
      const allBeers = await prisma.beers.findMany({
        select: {
          id: true,
          name: true,
          last_mod: true,
          cat_id: true,
        },
        where: {
          NOT: {
            id: {
              in: beers.map(beer => beer.id),
            },
          },
        },
        take: beerQuantity - beers.length,
      });
      extraBeers.push(...allBeers);
    }
  } else {
    if (beers.length < beerQuantity) {
      const extra = await prisma.beers.findMany({
        select: {
          id: true,
          name: true,
          last_mod: true,
          cat_id: true,
        },
        where: {
          cat_id: catId,
          NOT: {
            id: {
              in: beers.map(beer => beer.id),
            },
          },
        },
        take: beerQuantity - beers.length,
      });
      extraBeers.push(...extra);
    }
  }
  return [...beers, ...extraBeers];
};
