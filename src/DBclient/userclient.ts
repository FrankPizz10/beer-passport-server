import { getAllBeers, getBeerById } from './beerclient';
import { Context } from '../../context';
import { prismaCtx } from '..';
import { getCollectionSize } from './gettableinfo';
import { collection } from 'firebase/firestore';

export const getAllUsers = async () => {
  const users = await prismaCtx.prisma.users.findMany();
  return users;
};

export const addUser = async (user: AddUser, ctx: Context) => {
  const newUser = await ctx.prisma.users.create({
    data: {
      uid: user.uid,
      email: user.email,
      age: user.age,
      user_name: user.user_name,
    },
  });
  // await addAllNewUserBeers(newUser.id, ctx);
  return newUser;
};

// const addAllNewUserBeers = async (user_id: number, ctx: Context) => {
//   const beers: Beer[] = await getAllBeers();
//   await Promise.all(
//     beers.map(async beer => {
//       const userBeer: UserBeer = {
//         user_id: user_id,
//         beer_id: beer.id,
//         tried: false,
//         liked: false,
//       };
//       return updateOrCreateUserBeers(userBeer, ctx);
//     }),
//   );
// };

export const getUser = async (id: string) => {
  const user = await prismaCtx.prisma.users.findUnique({
    where: {
      uid: id,
    },
  });
  return user;
};

export const updateOrCreateUserBeers = async (userBeer: UserBeer, ctx: Context) => {
  const triedBeer = await ctx.prisma.user_beers.upsert({
    where: {
      user_id_beer_id: {
        user_id: userBeer.user_id,
        beer_id: userBeer.beer_id,
      },
    },
    update: {
      liked: userBeer.liked,
    },
    create: {
      user_id: userBeer.user_id,
      beer_id: userBeer.beer_id,
      liked: userBeer.liked,
      collection_id: userBeer.collection_id,
    },
  });
  if (userBeer.collection_id) {
    const badgeProgress = await calcUserBadgeProgress(userBeer.user_id, userBeer.collection_id);
    const earned = badgeProgress === 1 ? true : false;
    await updateUserBadges(userBeer.user_id, userBeer.collection_id, earned, badgeProgress, ctx);
  }
  return triedBeer;
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
  const collectionProgress = (await getUserBeersByCollectionId(user_id, collection_id)).length;
  const collectionSize = await getCollectionSize(collection_id);
  return parseFloat((collectionProgress / collectionSize).toFixed(2));
};

const updateUserBadges = async (
  user_id: number,
  collection_id: number,
  earned: boolean,
  progress: number,
  ctx: Context,
) => {
  const userBadges = await ctx.prisma.user_badges.upsert({
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
};

export const getUserBadgesByUserId = async (user_id: number) => {
  const userBadges = await prismaCtx.prisma.user_badges.findMany({
    where: {
      user_id: user_id,
    },
  });
  return userBadges;
};

const getUserBeersByCollectionId = async (user_id: number, collection_id: number) => {
  const userBeers = await prismaCtx.prisma.user_beers.findMany({
    where: {
      collection_id: collection_id,
    },
  });
  return userBeers;
};
