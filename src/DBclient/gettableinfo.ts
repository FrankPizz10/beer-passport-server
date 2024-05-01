import prisma from '../../client';

export const getCategories = async () => {
  const categories = await prisma.categories.findMany();
  return categories;
};

export const getCollections = async () => {
  const collections = await prisma.collections.findMany({
    orderBy: {
      updated_at: 'desc',
    },
  });
  return collections;
};

export const getCollectionSize = async (collection_id: number) => {
  const collectionSize = await prisma.collection_beers.count({
    where: {
      collection_id: collection_id,
    },
  });
  return collectionSize;
};
