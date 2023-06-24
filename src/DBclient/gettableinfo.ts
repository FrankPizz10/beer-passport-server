import { prismaCtx } from '..';

export const getCategories = async () => {
  const categories = await prismaCtx.prisma.categories.findMany();
  return categories;
};

export const getCollections = async () => {
  const collections = await prismaCtx.prisma.collections.findMany();
  return collections;
};

export const getCollectionSize = async (collection_id: number) => {
  const collectionSize = await prismaCtx.prisma.collections.count({
    where: {
      id: collection_id,
    },
  });
  return collectionSize;
};
