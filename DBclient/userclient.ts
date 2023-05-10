import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

export const getAllUsers = async () => {
  const users = await prisma.users.findMany();
  return users;
};

export const addUser = async (user: any) => {
  const newUser = await prisma.users.create({
    data: {
      uid: user.uid,
    },
  });
  return newUser;
};

export const getUser = async (id: string) => {
  const user = await prisma.users.findUnique({
    where: {
      uid: id,
    },
  });
  return user;
};

export const updateOrCreateUserBeers = async (
  user_id: number,
  beer_id: number,
  tried: boolean,
  liked: boolean
) => {
  const triedBeer = await prisma.user_beers.upsert({
    where: {
      user_id_beer_id: {
        user_id: user_id,
        beer_id: beer_id,
      },
    },
    update: {
      tried: tried,
      liked: liked,
    },
    create: {
      user_id: user_id,
      beer_id: beer_id,
      tried: tried,
      liked: liked,
    },
  });
  return triedBeer;
};

export const getUserBeersByUserId = async (id: number) => {
  const userBeers = await prisma.user_beers.findMany({
    where: {
      user_id: id,
    },
  });
  return userBeers;
};
