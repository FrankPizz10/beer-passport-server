import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

export const getAllBeers = async () => {
  const beers = await prisma.beers.findMany();
  // const beers = await prisma.$queryRaw(Prisma.sql`SELECT * FROM beers`);
  return beers.splice(0, 10);
};

export const getBeerByCategory = async (cat: string) => {
  // Get category that contains cat
  const category = await prisma.categories.findFirst({
    where: {
      cat_name: {
        contains: cat,
      },
    },
  });
  const id = category?.id;
  const beers = await prisma.beers.findMany({
    where: {
      cat_id: {
        equals: id,
      },
    },
  });
  return beers.splice(0, 20);
};

export const getBeerById = async (id: number) => {
  const beer = await prisma.beers.findUnique({
    where: {
      id: id,
    },
    include: {
      category: true,
      style: true,
      brewery: true,
    },
  });
  return beer;
};
