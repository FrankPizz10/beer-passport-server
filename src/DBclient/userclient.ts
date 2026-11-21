import { Context } from '../../context';
import { prismaCtx } from '..';
import { getCollectionSize } from './gettableinfo';
import { calcCollectionProgressionForUserBeer } from './userBadgeClient';

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
  try {
    const user = await prismaCtx.prisma.users.findUnique({
      where: {
        uid: id,
      },
    });
    return user;
  } catch (e) {
    throw new Error('Error fetching user');
  }
};

export const getUserById = async (id: number) => {
  try {
    const user = await prismaCtx.prisma.users.findUnique({
      where: {
        id: id,
      },
    });
    return user;
  } catch (e) {
    throw new Error('Error fetching user');
  }
};

export const updateUserEmail = async (uid: string, email: string) => {
  const user = prismaCtx.prisma.users.update({
    where: {
      uid: uid,
    },
    data: {
      email: email,
    },
  });
  return user;
};

export const updateOrCreateUserBeer = async (
  user_id: number,
  beer_id: number,
  liked: boolean,
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
      updated_at: new Date(),
    },
    create: {
      user_id: user_id,
      beer_id: beer_id,
      liked: liked,
    },
  });
  const sendNotifications = async () => {
    const newCompletedBadges = (
      await calcCollectionProgressionForUserBeer(user_id, beer_id)
    ).filter(badge => badge.earned);
    newCompletedBadges.forEach(async badge => {
      try {
        const collectionName = (
          await ctx.prisma.collections.findUnique({
            where: {
              id: badge.collection.id,
            },
          })
        )?.name;
        await ctx.prisma.notifications.upsert({
          where: {
            user_id_message: {
              user_id: user_id,
              message: `You earned the ${collectionName} badge!`,
            },
          },
          update: {
            updated_at: new Date(),
            viewed: false,
          },
          create: {
            user_id: user_id,
            type: 'BADGE_EARNED',
            message: `You earned the ${collectionName} badge!`,
          },
        });
      } catch (e) {
        throw new Error('Error creating notification');
      }
    });
  };
  sendNotifications();
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
    include: {
      beers: true,
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
    include: {
      beers: true,
    },
  });
  return likedBeers;
};

// Returns the progress of a user's badge for a given collection
export const calcUserBadgeProgress = async (user_id: number, collection_id: number) => {
  const collectionProgress = await getCollectionProgress(user_id, collection_id);
  const collectionSize = await getCollectionSize(collection_id);
  if (collectionSize === 0) {
    throw new Error('Collection size is 0');
  }
  return parseFloat((collectionProgress / collectionSize).toFixed(2));
};

export const updateUserBadge = async (
  user_id: number,
  collection_id: number,
  earned: boolean,
  progress: number,
  ctx: Context,
) => {
  try {
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
        updated_at: new Date(),
      },
      create: {
        user_id: user_id,
        collection_id: collection_id,
        earned: earned,
        progress: progress,
      },
    });
  } catch (e) {
    throw new Error('Error updating user badge');
  }
  if (earned) {
    const collection = await ctx.prisma.collections.findUnique({
      where: {
        id: collection_id,
      },
    });
    try {
      await ctx.prisma.notifications.upsert({
        where: {
          user_id_message: {
            user_id: user_id,
            message: `You earned the ${collection?.name} badge!`,
          },
        },
        update: {
          updated_at: new Date(),
        },
        create: {
          user_id: user_id,
          type: 'BADGE_EARNED',
          message: `You earned the ${collection?.name} badge!`,
        },
      });
    } catch (e) {
      throw new Error('Error creating notification');
    }
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
      // Field-limited projection (QA finding F-3): this used to include the
      // complete users row, leaking every friend's email, Firebase uid, age,
      // and Expo notification_token to anyone who friended them. The mobile
      // client (beer-passport, Models/SQLData.ts) defines its User type as
      // exactly { id, user_name, private }, and FriendScreen reads only id
      // and user_name from this object, so those three fields are the
      // approved set. Do not widen without a client need.
      users_friends_user_2Tousers: {
        select: {
          id: true,
          user_name: true,
          private: true,
        },
      },
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
  // Normalize pair ordering (QA finding F-6): the PostgreSQL schema carries
  // the check constraint friends_user_order_check (user_1 < user_2), so the
  // smaller id must always be stored as user_1. Inserting the raw
  // (caller, target) pair violated the constraint whenever the target's id
  // was smaller than the caller's, failing with a generic 400.
  const ordered =
    user1 < user2 ? { user_1: user1, user_2: user2 } : { user_1: user2, user_2: user1 };
  const friend = await prismaCtx.prisma.friends.create({
    data: ordered,
  });
  return friend;
};
