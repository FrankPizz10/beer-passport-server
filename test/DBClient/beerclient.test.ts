import { prismaMock } from '../../singleton';
import * as beerclient from '../../src/DBclient/beerclient';

describe('beerclient Test', () => {
  const testCategory = {
    id: 1,
    cat_name: 'test',
    last_mod: new Date(),
  };
  const testBeer = {
    id: 1,
    name: 'test',
    brewery_id: 1,
    cat_id: testCategory.id,
    style_id: 1,
    abv: 1,
    ibu: 1,
    srm: 1,
    upc: 1,
    descript: 'test',
    last_mod: new Date(),
  };
  const generateBeers = (length: number, categoryId: number) =>
    Array.from({ length }, (_, i) => ({
      id: i,
      name: 'test',
      brewery_id: 1,
      cat_id: categoryId,
      style_id: 1,
      abv: 1,
      ibu: 1,
      srm: 1,
      upc: 1,
      descript: 'test',
      last_mod: new Date(),
    }));
  test('getBeerByCategory', async () => {
    prismaMock.categories.findFirst.mockResolvedValue(testCategory);
    prismaMock.beers.findMany.mockResolvedValue([testBeer]);

    await expect(beerclient.getBeerByCategory('test')).resolves.toEqual([testBeer]);
    expect(prismaMock.categories.findFirst).toHaveBeenCalledWith({
      where: {
        cat_name: {
          contains: 'test',
        },
      },
    });
    expect(prismaMock.beers.findMany).toHaveBeenCalledWith({
      where: {
        cat_id: {
          equals: 1,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
  });

  // test that it returns only the first 20 beers
  test('getBeersByCategory returns twenty beers', async () => {
    const category = {
      id: 1,
      cat_name: 'test',
      last_mod: new Date(),
    };
    const beers = generateBeers(21, category.id);

    prismaMock.beers.findMany.mockResolvedValue(beers);
    await expect(beerclient.getBeerByCategory('test')).resolves.toEqual(beers.slice(0, 20));
  });

  // test that it returns an empty array when no beers are found
  test('getBeersByCategory returns empty array', async () => {
    prismaMock.categories.findFirst.mockResolvedValue(null);
    await expect(beerclient.getBeerByCategory('test')).resolves.toEqual([]);
  });

  test('getBeerById', async () => {
    prismaMock.beers.findUnique.mockResolvedValue(testBeer);

    await expect(beerclient.getBeerById(1, true, true, true)).resolves.toEqual(testBeer);
    expect(prismaMock.beers.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      include: {
        category: true,
        brewery: true,
        style: true,
      },
    });
  });

  test('getBeerById without includes', async () => {
    prismaMock.beers.findUnique.mockResolvedValue(testBeer);

    await expect(beerclient.getBeerById(1, false, false, false)).resolves.toEqual(testBeer);
    expect(prismaMock.beers.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      include: {
        category: false,
        brewery: false,
        style: false,
      },
    });
  });

  test('getCollectionById', async () => {
    const collection = {
      id: 1,
      name: 'test',
      difficulty: 1,
      description: 'test',
      created_at: new Date(),
      updated_at: new Date(),
    };
    prismaMock.collections.findUnique.mockResolvedValue(collection);

    await expect(beerclient.getCollectionById(1)).resolves.toEqual(collection);
    expect(prismaMock.collections.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });

  test('getBeersByCollectionId', async () => {
    const collectionBeers = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      collection_id: i,
      beer_id: i,
      created_at: new Date(),
      updated_at: new Date(),
    }));
    prismaMock.collection_beers.findMany.mockResolvedValue(collectionBeers);

    await expect(beerclient.getBeersByCollectionId(1)).resolves.toEqual(collectionBeers);
    expect(prismaMock.collection_beers.findMany).toHaveBeenCalledWith({
      where: {
        collection_id: 1,
      },
    });
  });

  test('getCollectionsByBeerId', async () => {
    const collections = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      collection_id: i,
      beer_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    }));
    prismaMock.collection_beers.findMany.mockResolvedValue(collections);

    await expect(beerclient.getCollectionsByBeerId(1)).resolves.toEqual(collections);
    expect(prismaMock.collection_beers.findMany).toHaveBeenCalledWith({
      where: {
        beer_id: 1,
      },
    });
  });

  test('getCollectionBeerByCollectionIdAndBeerId', async () => {
    const collectionBeer = {
      id: 1,
      collection_id: 1,
      beer_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };
    prismaMock.collection_beers.findUnique.mockResolvedValue(collectionBeer);

    await expect(beerclient.getCollectionBeerByCollectionIdAndBeerId(1, 1)).resolves.toEqual(
      collectionBeer,
    );
    expect(prismaMock.collection_beers.findUnique).toHaveBeenCalledWith({
      where: {
        collection_id_beer_id: {
          collection_id: 1,
          beer_id: 1,
        },
      },
    });
  });

  test('getBeersByBrewery', async () => {
    const beers = generateBeers(10, 1);
    prismaMock.beers.findMany.mockResolvedValue(beers);

    await expect(beerclient.getBeersByBrewery(1)).resolves.toEqual(beers);
    expect(prismaMock.beers.findMany).toHaveBeenCalledWith({
      where: {
        brewery_id: 1,
      },
    });
  });

  test('getBeersByCategory', async () => {
    const beers = generateBeers(10, 1);
    prismaMock.beers.findMany.mockResolvedValue(beers);

    await expect(beerclient.getBeersByCategory(1)).resolves.toEqual(beers);
    expect(prismaMock.beers.findMany).toHaveBeenCalledWith({
      where: {
        cat_id: 1,
      },
      select: {
        id: true,
        name: true,
        cat_id: true,
      },
    });
  });

  test('getBeersByCategory with limit', async () => {
    const beers = generateBeers(10, 1);
    prismaMock.beers.findMany.mockResolvedValue(beers.slice(0, 5));
    await expect(beerclient.getBeersByCategory(1, 5)).resolves.toEqual(beers.slice(0, 5));
    expect(prismaMock.beers.findMany).toHaveBeenCalledWith({
      where: {
        cat_id: 1,
      },
      select: {
        id: true,
        name: true,
        cat_id: true,
      },
      take: 5,
    });
  });

  test('getBeersByCategory with limit greater than number of beers', async () => {
    const beers = generateBeers(10, 1);
    prismaMock.beers.findMany.mockResolvedValue(beers);

    await expect(beerclient.getBeersByCategory(1, 20)).resolves.toEqual(beers);
    expect(prismaMock.beers.findMany).toHaveBeenCalledWith({
      where: {
        cat_id: 1,
      },
      select: {
        id: true,
        name: true,
        cat_id: true,
      },
      take: 20,
    });
  });

  test('getBeersByCategory with no beers', async () => {
    prismaMock.beers.findMany.mockResolvedValue([]);
    await expect(beerclient.getBeersByCategory(1)).resolves.toEqual([]);
  });

  test('getBeerGroupsByBrewery', async () => {
    const beerGroups = [
      { brewery_id: 1, count: 5 },
      { brewery_id: 2, count: 3 },
      { brewery_id: 3, count: 7 },
    ];
    (prismaMock.beers.groupBy as jest.Mock).mockResolvedValue(beerGroups);
    const result = await beerclient.getBeerGroupsByBrewery();
    expect(result).toEqual(beerGroups);
    expect(prismaMock.beers.groupBy).toHaveBeenCalledWith({
      by: ['brewery_id'],
      _count: {
        id: true,
      },
    });
  });

  test('getBeerGroupsByBrewery with no beers', async () => {
    (prismaMock.beers.groupBy as jest.Mock).mockResolvedValue([]);
    const result = await beerclient.getBeerGroupsByBrewery();
    expect(result).toEqual([]);
  });

  test('getTopLikedBeers', async () => {
    const topLikedBeers = [
      { id: 1, name: 'Test1', cat_id: 1 },
      { id: 2, name: 'Test2', cat_id: 1 },
      { id: 3, name: 'Test3', cat_id: 1 },
    ];

    // Mocking the helper function
    const getTopBeersHelperMock = jest.spyOn(beerclient, 'getTopBeersHelper');
    getTopBeersHelperMock.mockResolvedValue(topLikedBeers);

    const userBeers = [
      { beer_id: 1, liked: true },
      { beer_id: 2, liked: true },
      { beer_id: 3, liked: true },
    ];
    (prismaMock.user_beers.groupBy as jest.Mock).mockResolvedValue(userBeers);
    const result = await beerclient.getTopLikedBeers(3, 1);
    expect(result).toEqual(topLikedBeers);
    expect(prismaMock.user_beers.groupBy).toHaveBeenCalledWith({
      by: ['beer_id'],
      where: {
        liked: true,
      },
      orderBy: {
        _count: {
          liked: 'desc',
        },
      },
      take: 3,
    });
    expect(getTopBeersHelperMock).toHaveBeenCalledWith(userBeers, 3, 1);
    getTopBeersHelperMock.mockRestore();
  });

  test('getTopLikedBeers with no beers', async () => {
    const getTopBeersHelperMock = jest.spyOn(beerclient, 'getTopBeersHelper');
    getTopBeersHelperMock.mockResolvedValue([]);
    (prismaMock.user_beers.groupBy as jest.Mock).mockResolvedValue([]);
    const result = await beerclient.getTopLikedBeers(3, 1);
    expect(result).toEqual([]);
    getTopBeersHelperMock.mockRestore();
  });

  test('getTopLikedBeers with no beers and no category', async () => {
    const getTopBeersHelperMock = jest.spyOn(beerclient, 'getTopBeersHelper');
    getTopBeersHelperMock.mockResolvedValue([]);
    (prismaMock.user_beers.groupBy as jest.Mock).mockResolvedValue([]);
    const result = await beerclient.getTopLikedBeers(3);
    expect(result).toEqual([]);
    getTopBeersHelperMock.mockRestore();
  });

  test('getTopTrendingBeers', async () => {
    const topTrendingBeers = [
      { id: 1, name: 'Test1', cat_id: 1 },
      { id: 2, name: 'Test2', cat_id: 1 },
      { id: 3, name: 'Test3', cat_id: 1 },
    ];

    // Mocking the helper function
    const getTopBeersHelperMock = jest.spyOn(beerclient, 'getTopBeersHelper');
    getTopBeersHelperMock.mockResolvedValue(topTrendingBeers);

    const userBeers = [
      { beer_id: 1, liked: true },
      { beer_id: 2, liked: true },
      { beer_id: 3, liked: true },
    ];
    (prismaMock.user_beers.groupBy as jest.Mock).mockResolvedValue(userBeers);
    const result = await beerclient.getTopLikedBeers(3, 1);
    expect(result).toEqual(topTrendingBeers);
    expect(prismaMock.user_beers.groupBy).toHaveBeenCalledWith({
      by: ['beer_id'],
      where: {
        liked: true,
      },
      orderBy: {
        _count: {
          liked: 'desc',
        },
      },
      take: 3,
    });
    expect(getTopBeersHelperMock).toHaveBeenCalledWith(userBeers, 3, 1);
    getTopBeersHelperMock.mockRestore();
  });

  test('getTopTrendingBeers with no beers', async () => {
    const getTopBeersHelperMock = jest.spyOn(beerclient, 'getTopBeersHelper');
    getTopBeersHelperMock.mockResolvedValue([]);
    (prismaMock.user_beers.groupBy as jest.Mock).mockResolvedValue([]);
    const result = await beerclient.getTopLikedBeers(3, 1);
    expect(result).toEqual([]);
    getTopBeersHelperMock.mockRestore();
  });

  test('getTopTrendingBeers with no beers and no category', async () => {
    const getTopBeersHelperMock = jest.spyOn(beerclient, 'getTopBeersHelper');
    getTopBeersHelperMock.mockResolvedValue([]);
    (prismaMock.user_beers.groupBy as jest.Mock).mockResolvedValue([]);
    const result = await beerclient.getTopLikedBeers(3);
    expect(result).toEqual([]);
    getTopBeersHelperMock.mockRestore();
  });

  const topBeers = [{ beer_id: 1 }, { beer_id: 2 }, { beer_id: 3 }];

  const beers = [
    {
      id: 1,
      name: 'Test1',
      cat_id: 1,
      brewery_id: 1,
      style_id: 1,
      abv: 1,
      ibu: 1,
      srm: 1,
      upc: 1,
      descript: 'Test1',
      last_mod: new Date(),
    },
    {
      id: 2,
      name: 'Test2',
      cat_id: 1,
      brewery_id: 1,
      style_id: 1,
      abv: 1,
      ibu: 1,
      srm: 1,
      upc: 1,
      descript: 'Test2',
      last_mod: new Date(),
    },
    {
      id: 3,
      name: 'Test3',
      cat_id: 1,
      brewery_id: 1,
      style_id: 1,
      abv: 1,
      ibu: 1,
      srm: 1,
      upc: 1,
      descript: 'Test3',
      last_mod: new Date(),
    },
  ];

  test('getTopBeersHelper no cat id enough beers', async () => {
    prismaMock.beers.findMany.mockResolvedValue(beers);

    const result = await beerclient.getTopBeersHelper(topBeers, 3);
    expect(result).toEqual(beers);
    expect(prismaMock.beers.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.beers.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        cat_id: true,
      },
      where: {
        id: {
          in: beers.map(beer => beer.id),
        },
      },
    });
  });

  test('getTopBeersHelper with cat id enough beers', async () => {
    prismaMock.beers.findMany.mockResolvedValue(beers);

    const result = await beerclient.getTopBeersHelper(topBeers, 3, 1);
    expect(result).toEqual(beers);
    expect(prismaMock.beers.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.beers.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        cat_id: true,
      },
      where: {
        id: {
          in: beers.map(beer => beer.id),
        },
        cat_id: 1,
      },
    });
  });
  const extraBeers = [
    {
      id: 4,
      name: 'Test4',
      cat_id: 1,
      brewery_id: 1,
      style_id: 1,
      abv: 1,
      ibu: 1,
      srm: 1,
      upc: 1,
      descript: 'Test4',
      last_mod: new Date(),
    },
    {
      id: 5,
      name: 'Test5',
      cat_id: 1,
      brewery_id: 1,
      style_id: 1,
      abv: 1,
      ibu: 1,
      srm: 1,
      upc: 1,
      descript: 'Test5',
      last_mod: new Date(),
    },
  ];
  test('getTopBeersHelper no cat id not enough beers', async () => {
    const beerQuantity = 5;
    prismaMock.beers.findMany.mockResolvedValueOnce(beers).mockResolvedValueOnce(extraBeers);
    const result = await beerclient.getTopBeersHelper(topBeers, beerQuantity);
    expect(result).toEqual([...beers, ...extraBeers]);
    expect(prismaMock.beers.findMany).toHaveBeenCalledTimes(2);
    expect(prismaMock.beers.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        last_mod: true,
        cat_id: true,
      },
      where: {
        NOT: {
          id: {
            in: beers.map(beer => beer.id),
          },
        },
      },
      take: beerQuantity - beers.length,
    });
  });

  test('getTopBeersHelper with cat id not enough beers', async () => {
    const beerQuantity = 5;
    prismaMock.beers.findMany.mockResolvedValueOnce(beers).mockResolvedValueOnce(extraBeers);
    const result = await beerclient.getTopBeersHelper(topBeers, beerQuantity, 1);
    expect(result).toEqual([...beers, ...extraBeers]);
    expect(prismaMock.beers.findMany).toHaveBeenCalledTimes(2);
    expect(prismaMock.beers.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        last_mod: true,
        cat_id: true,
      },
      where: {
        cat_id: 1,
        NOT: {
          id: {
            in: beers.map(beer => beer.id),
          },
        },
      },
      take: beerQuantity - beers.length,
    });
  });
});
