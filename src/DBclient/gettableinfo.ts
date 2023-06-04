import { prismaCtx } from '..';

export const getCategories = async () => {
  const categories = await prismaCtx.prisma.categories.findMany();
  return categories;
};
