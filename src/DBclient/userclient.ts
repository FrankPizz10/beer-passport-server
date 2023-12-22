import { Context } from '../../context';
import { prismaCtx } from '..';
import { getCollectionSize } from './gettableinfo';

export const getAllUsers = async () => {
  const users = await prismaCtx.prisma.users.findMany();
  return users;
};

export const getAllUserBasicInfo = async () => {
  const users = await prismaCtx.prisma.users.findMany({
    select: {
      user_name: true,
      id: true,
      private: true,
    },
  });
  return users;
};

export const getUserByUid = async (id: string) => {
  const user = await prismaCtx.prisma.users.findUnique({
    where: {
      uid: id,
    },
  });
  return user;
};

export const getUserById = async (id: number) => {
  const user = await prismaCtx.prisma.users.findUnique({
    where: {
      id: id,
    },
  });
  return user;
};

export const updateOrCreateUserBeers = async (
  user_id: number,
  beer_id: number,
  liked: boolean,
  collection_id: number | undefined,
  ctx: Context,
) => {
  const newUserBeer = await ctx.prisma.user_beers.upsert({
    where: {
      user_id_beer_id: {
        user_id: user_id,
        beer_id: beer_id,
      },
    },
    update: {
      liked: liked,
    },
    create: {
      user_id: user_id,
      beer_id: beer_id,
      liked: liked,
    },
  });
  if (collection_id) {
    const badgeProgress = await calcUserBadgeProgress(user_id, collection_id);
    const earned = Math.abs(1 - badgeProgress) < 0.001 ? true : false;
    await updateUserBadge(user_id, collection_id, earned, badgeProgress, ctx);
  }
  return newUserBeer;
};

export const getUserBeersByUserId = async (id: number) => {
  const userBeers = await prismaCtx.prisma.user_beers.findMany({
    where: {
      user_id: id,
    },
  });
  return userBeers;
};

export const getUserBeerByUserIdAndBeerId = async (user_id: number, beer_id: number) => {
  const userBeer = await prismaCtx.prisma.user_beers.findUnique({
    where: {
      user_id_beer_id: {
        user_id: user_id,
        beer_id: beer_id,
      },
    },
  });
  return userBeer;
};

export const getTriedBeersByUserId = async (id: number) => {
  const triedBeers = await prismaCtx.prisma.user_beers.findMany({
    where: {
      user_id: id,
    },
  });
  return triedBeers;
};

export const getLikedBeersByUserId = async (id: number) => {
  const likedBeers = await prismaCtx.prisma.user_beers.findMany({
    where: {
      user_id: id,
      liked: true,
    },
  });
  return likedBeers;
};

// Returns the progress of a user's badge for a given collection
const calcUserBadgeProgress = async (user_id: number, collection_id: number) => {
  const collectionProgress = await getCollectionProgress(user_id, collection_id);
  const collectionSize = await getCollectionSize(collection_id);
  if (collectionSize === 0) {
    throw new Error('Collection size is 0');
  }
  return parseFloat((collectionProgress / collectionSize).toFixed(2));
};

const updateUserBadge = async (
  user_id: number,
  collection_id: number,
  earned: boolean,
  progress: number,
  ctx: Context,
) => {
  await ctx.prisma.user_badges.upsert({
    where: {
      user_id_collection_id: {
        user_id: user_id,
        collection_id: collection_id,
      },
    },
    update: {
      earned: earned,
      progress: progress,
    },
    create: {
      user_id: user_id,
      collection_id: collection_id,
      earned: earned,
      progress: progress,
    },
  });
  if (earned) {
    const collection = await ctx.prisma.collections.findUnique({
      where: {
        id: collection_id,
      },
    });
    await ctx.prisma.notifications.create({
      data: {
        user_id: user_id,
        type: 'BADGE_EARNED',
        message: `You earned the ${collection?.name} badge!`,
      },
    });
  }
};

export const getUserBadgesByUserId = async (user_id: number) => {
  const userBadges = await prismaCtx.prisma.user_badges.findMany({
    where: {
      user_id: user_id,
    },
    include: {
      collections: true,
    },
  });
  return userBadges;
};

const getCollectionProgress = async (user_id: number, collection_id: number) => {
  const collectionBeers = await prismaCtx.prisma.collection_beers.findMany({
    where: {
      collection_id: collection_id,
    },
  });
  const userBeers = await prismaCtx.prisma.user_beers.findMany({
    where: {
      user_id: user_id,
    },
  });
  let progress = 0;
  for (let i = 0; i < collectionBeers.length; i++) {
    const collectionBeer = collectionBeers[i];
    const userBeer = userBeers.find(beer => beer.beer_id === collectionBeer.beer_id);
    if (userBeer) {
      progress++;
    }
  }
  return progress;
};

export const getFriendsByUserId = async (user_id: number) => {
  const friends = await prismaCtx.prisma.friends.findMany({
    where: {
      user_1: user_id,
    },
    include: {
      users_friends_user_2Tousers: true,
    },
  });
  return friends;
};

export const deleteUser = async (id: string, ctx: Context) => {
  const deletedUser = await ctx.prisma.users.delete({
    where: {
      uid: id,
    },
  });
  return deletedUser;
};

export const addFriend = async (user1: number, user2: number) => {
  const friend = await prismaCtx.prisma.friends.create({
    data: {
      user_1: user1,
      user_2: user2,
    },
  });
  return friend;
};
