import { prismaCtx } from '..';

export const getCategories = async () => {
  const categories = await prismaCtx.prisma.categories.findMany();
  return categories;
};

export const getCollections = async () => {
  const collections = await prismaCtx.prisma.collections.findMany({
    orderBy: {
      updated_at: 'desc',
    },
  });
  return collections;
};

export const getCollectionSize = async (collection_id: number) => {
  const collectionSize = await prismaCtx.prisma.collection_beers.count({
    where: {
      collection_id: collection_id,
    },
  });
  return collectionSize;
};
