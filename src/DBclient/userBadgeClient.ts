import { createHash } from 'crypto';
import { prismaCtx } from '..';
import { user_beers } from '@prisma/client';

interface UserBadge {
  id: string;
  user_id: number;
  earned: boolean;
  progress: number;
  updated_at: Date;
  collection: {
    id: number;
    name: string;
    difficulty: number;
    description: string;
  };
}

export const calculateCollectionProgress = async (userId: number): Promise<UserBadge[]> => {
  const [collections, userBeers] = await getCollectionsAndUserBeers(userId);

  const collectionProgress: UserBadge[] = collections
    .map(collection => {
      const collectionBeers = collection.collection_beers;
      const userBeersInCollection = userBeers.filter(userBeer =>
        collectionBeers.some(collectionBeer => collectionBeer.beer_id === userBeer.beer_id),
      );
      const progress = userBeersInCollection.length / collectionBeers.length;
      if (progress > 0) {
        return {
          id: createHash('sha256').update(`${userId}-${collection.id}`).digest('hex'),
          user_id: userId,
          earned: Math.abs(progress - 1) < 0.0001,
          progress,
          updated_at: new Date(),
          collection: {
            id: collection.id,
            name: collection.name,
            difficulty: collection.difficulty,
            description: collection.description,
          },
        };
      }
      return null;
    })
    .filter(Boolean) as UserBadge[];

  return collectionProgress;
};

export const calcCollectionProgressionForUserBeer = async (
  user_id: number,
  beer_id: number,
): Promise<UserBadge[]> => {
  const [collections, userBeer] = await Promise.all([
    prismaCtx.prisma.collections.findMany({
      include: {
        collection_beers: true,
      },
    }),
    prismaCtx.prisma.user_beers.findUnique({
      where: {
        user_id_beer_id: {
          beer_id,
          user_id,
        },
      },
    }),
  ]);
  const collectionProgress: UserBadge[] = collections
    .map(collection => {
      const collectionBeers = collection.collection_beers;
      const userBeerInCollection =
        userBeer &&
        collectionBeers.some(collectionBeer => collectionBeer.beer_id === userBeer.beer_id);
      const progress = userBeerInCollection ? 1 : 0;
      if (progress > 0) {
        return {
          id: createHash('sha256').update(`${user_id}-${collection.id}`).digest('hex'),
          user_id,
          earned: true,
          progress,
          updated_at: new Date(),
          collection: {
            id: collection.id,
            name: collection.name,
            difficulty: collection.difficulty,
            description: collection.description,
          },
        };
      }
      return null;
    })
    .filter(Boolean) as UserBadge[];
  return collectionProgress;
};

export const getUserBadgeCount = async (userId: number): Promise<number> => {
  const [collections, userBeers] = await getCollectionsAndUserBeers(userId);

  const completedcount = collections
    .map(collection => {
      const collectionBeers = collection.collection_beers;
      const userBeersInCollection = userBeers.filter(userBeer =>
        collectionBeers.some(collectionBeer => collectionBeer.beer_id === userBeer.beer_id),
      );
      const progress = userBeersInCollection.length / collectionBeers.length;
      if (Math.abs(progress - 1) < 0.0001) {
        return 1 as const; // Ensure the return value is of type 1 | 0
      }
      return 0 as const; // Ensure the return value is of type 1 | 0
    })
    .reduce((acc, curr) => (acc + curr) as 0 | 1, 0);

  return completedcount;
};

const getCollectionsAndUserBeers = async (
  userId: number,
): Promise<[typeof collections, user_beers[]]> => {
  const [collections, userBeers] = await Promise.all([
    prismaCtx.prisma.collections.findMany({
      include: {
        collection_beers: true,
      },
    }),
    prismaCtx.prisma.user_beers.findMany({
      where: {
        user_id: userId,
      },
    }),
  ]);
  return [collections, userBeers];
};
