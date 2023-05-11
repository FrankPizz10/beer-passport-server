import { PrismaClient, Prisma } from "@prisma/client";
import { getAllBeers } from "./beerclient";
const prisma = new PrismaClient();

export const getAllUsers = async () => {
  const users = await prisma.users.findMany();
  return users;
};

export const addUser = async (user: any) => {
  const newUser = await prisma.users.create({
    data: {
      uid: user.uid,
      email: user.email,
      age: user.age,
      user_name: user.user_name,
    },
  });
  await addAllNewUserBeers(newUser.id);
  return newUser;
};

const addAllNewUserBeers = async (user_id: number) => {
  const beers = await getAllBeers();
  await Promise.all(
    beers.map(async (beer) => {
      return updateOrCreateUserBeers(user_id, beer.id, false, false);
    })
  );
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

export const getTriedBeersByUserId = async (id: number) => {
  const triedBeers = await prisma.user_beers.findMany({
    where: {
      user_id: id,
      tried: true,
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
  });
  return likedBeers;
};
