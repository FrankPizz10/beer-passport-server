import { getAllBeers, getBeerById } from './beerclient';
import { Context } from '../../context';
import { prismaCtx } from '..';
import { getCollectionSize } from './gettableinfo';

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
    },
  });
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

const updateUserbadges = async (user_id: number, ctx: Context) => {
  const usersStartedCollections = await ctx.prisma.user_beers
    .findMany({
      where: {
        user_id: user_id,
      },
    })
    .then(userBeers => userBeers.map(userBeer => userBeer.collection_id));
};

// Returns the progress of a user's badge for a given collection
const calcUserBadgeProgress = async (user_id: number, collection_id: number) => {
  const userBeers = await getUserBeersByUserId(user_id);
  const collectionSize = await getCollectionSize(collection_id);
  const badgeProgress = userBeers.reduce(async (acc, userBeer) => {
    const beer = await getBeerById(userBeer.beer_id);
    if (beer && beer.collection_id === collection_id) {
      (await acc) + 1;
    }
    return await acc;
  }, Promise.resolve(0));
  return Math.ceil((await badgeProgress) / collectionSize);
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
  return userBadges;
};
