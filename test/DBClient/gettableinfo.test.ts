import { getCategories, getCollectionSize, getCollections } from '../../src/DBclient/gettableinfo';
import { prismaMock } from '../../singleton';

describe('gettableingo', () => {
  test('getCategories', async () => {
    const category = {
      id: 1,
      cat_name: 'test',
      last_mod: new Date(),
    };
    prismaMock.categories.findMany.mockResolvedValue([category]);
    await expect(getCategories()).resolves.toEqual([category]);
  });

  test('getCollections', async () => {
    const collection = {
      id: 1,
      name: 'test',
      difficulty: 1,
      description: 'test',
      created_at: new Date(),
      updated_at: new Date(),
    };
    prismaMock.collections.findMany.mockResolvedValue([collection]);
    await expect(getCollections()).resolves.toEqual([collection]);
    expect(prismaMock.collections.findMany).toHaveBeenCalledWith({
      orderBy: {
        updated_at: 'desc',
      },
    });
  });

  test('getCollectionSize', async () => {
    const collectionId = 123;
    const expectedSize = 5;
    prismaMock.collection_beers.count.mockResolvedValue(expectedSize);

    expect(await getCollectionSize(collectionId)).toBe(expectedSize);
    expect(prismaMock.collection_beers.count).toHaveBeenCalledWith({
      where: {
        collection_id: collectionId,
      },
    });
  });
});
