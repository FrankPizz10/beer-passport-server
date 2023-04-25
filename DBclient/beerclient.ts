import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

export const getAllBeers = async () => {
  const beers = await prisma.beers.findMany();
  // const beers = await prisma.$queryRaw(Prisma.sql`SELECT * FROM beers`);
  return beers[0];
};
