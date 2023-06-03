import { prismaCtx } from "../index";

export const getAllBeers = async () => {
  const beers = await prismaCtx.prisma.beers.findMany();
  return beers;
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
    },
  });
  return beer;
};
