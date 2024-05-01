import { Context } from '../../context';
import prisma from '../../client';
import { getCollectionSize } from './gettableinfo';
import { calcCollectionProgressionForUserBeer } from './userBadgeClient';

export const getAllUsers = async () => {
  const users = await prisma.users.findMany();
  return users;
};

export const getAllUserBasicInfo = async () => {
  const users = await prisma.users.findMany({
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
    const user = await prisma.users.findUnique({
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
    const user = await prisma.users.findUnique({
      where: {
        id: id,
      },
    });
    return user;
  } catch (e) {
    throw new Error('Error fetching user');
  }
};

export const updateOrCreateUserBeer = async (user_id: number, beer_id: number, liked: boolean) => {
  const newUserBeer = await prisma.user_beers.upsert({
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
          await prisma.collections.findUnique({
            where: {
              id: badge.collection.id,
            },
          })
        )?.name;
        await prisma.notifications.upsert({
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
  const userBeers = await prisma.user_beers.findMany({
    where: {
      user_id: id,
    },
  });
  return userBeers;
};

export const getUserBeerByUserIdAndBeerId = async (user_id: number, beer_id: number) => {
  const userBeer = await prisma.user_beers.findUnique({
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
  const triedBeers = await prisma.user_beers.findMany({
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
  const likedBeers = await prisma.user_beers.findMany({
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
  const userBadges = await prisma.user_badges.findMany({
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
  const collectionBeers = await prisma.collection_beers.findMany({
    where: {
      collection_id: collection_id,
    },
  });
  const userBeers = await prisma.user_beers.findMany({
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
  const friends = await prisma.friends.findMany({
    where: {
      user_1: user_id,
    },
    include: {
      users_friends_user_2Tousers: true,
    },
  });
  return friends;
};

export const deleteUser = async (id: string) => {
  const deletedUser = await prisma.users.delete({
    where: {
      uid: id,
    },
  });
  return deletedUser;
};

export const addFriend = async (user1: number, user2: number) => {
  const friend = await prisma.friends.create({
    data: {
      user_1: user1,
      user_2: user2,
    },
  });
  return friend;
};
