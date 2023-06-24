import { prismaCtx } from '../index';

export const getAllBeers = async () => {
  const beers = await prismaCtx.prisma.beers.findMany();
  return beers as Beer[];
};

export const getBeerByCategory = async (cat: string) => {
  // Get category that contains cat
  const category = await prismaCtx.prisma.categories.findFirst({
    where: {
      cat_name: {
        contains: cat,
      },
    },
  });
  const id = category?.id;
  const beers = await prismaCtx.prisma.beers.findMany({
    where: {
      cat_id: {
        equals: id,
      },
    },
  });
  return beers.splice(0, 20);
};

export const getBeerById = async (id: number) => {
  const beer = await prismaCtx.prisma.beers.findUnique({
    where: {
      id: id,
    },
    include: {
      category: true,
      brewery: true,
      style: true,
      collections: true,
    },
  });
  return beer;
};

export const getCollectionsById = async (collectionId: number) => {
  const collections = await prismaCtx.prisma.collections.findUnique({
    where: {
      id: collectionId,
    },
  });
  return collections;
};

export const getBeersInCollection = async (collectionId: number) => {
  const beers = await prismaCtx.prisma.beers.findMany({
    where: {
      collection_id: collectionId,
    },
  });
  return beers;
};
