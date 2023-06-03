import { getAllBeers } from "./beerclient";
import { Context } from "../../context";
import { prismaCtx } from "..";

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
  await addAllNewUserBeers(newUser.id, ctx);
  return newUser;
};

const addAllNewUserBeers = async (user_id: number, ctx: Context) => {
  const beers: Beer[] = await getAllBeers();
  await Promise.all(
    beers.map(async (beer) => {
      return updateOrCreateUserBeers(user_id, beer.id, false, false, ctx);
    })
  );
};

export const getUser = async (id: string) => {
  const user = await prismaCtx.prisma.users.findUnique({
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
  liked: boolean,
  ctx: Context
) => {
  const triedBeer = await ctx.prisma.user_beers.upsert({
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
  const userBeers = await prismaCtx.prisma.user_beers.findMany({
    where: {
      user_id: id,
    },
  });
  return userBeers;
};

export const getUserBeerByUserIdAndBeerId = async (
  user_id: number,
  beer_id: number
) => {
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
      tried: true,
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
