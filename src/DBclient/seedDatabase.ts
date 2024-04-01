import { prismaCtx } from '..';
import { Prisma, PrismaClient } from '@prisma/client';

const getDataFromProd = async (filepath: string) => {
  const url = process.env.PROD_API_URL + filepath;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.PROD_API_KEY,
    },
  });
  return await response.json();
};

export const seedDatabase = async () => {
  console.log('Seeding database...');
  try {
    await prismaCtx.prisma.$transaction(
      async prisma => {
        await seedBreweries(prisma);
        await seedCategories(prisma);
        await seedStyles(prisma);
        await seedBeers(prisma);
        await seedUsers(prisma);
        await seedCollections(prisma);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database configuration
        maxWait: 5000, // default: 2000
        timeout: 30000, // default: 5000
      },
    );
    console.log('Database seeded...');
  } catch (err) {
    console.error('Error seeding database', err);
  }
};

const seedBeers = async (
  prisma: Omit<
    PrismaClient<
      Prisma.PrismaClientOptions,
      never,
      Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
    >,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
  >,
) => {
  if ((await prisma.beers.count()) > 0) {
    return;
  }
  const beers = await getDataFromProd('/beers');
  console.log('Beers read....');
  try {
    await prisma.beers.createMany({
      data: beers.map(
        (beer: {
          id: string;
          name: string;
          brewery_id: string;
          style_id: string;
          cat_id: string;
          abv: string | undefined;
          ibu: string | undefined;
          srm: string | undefined;
          upc: string | undefined;
          descript: string;
          last_mod: string;
        }) => ({
          id: parseInt(beer.id),
          name: beer.name,
          brewery_id: parseId(beer.brewery_id),
          style_id: parseId(beer.style_id),
          cat_id: parseId(beer.cat_id),
          abv: beer.abv != undefined ? parseFloat(beer.abv) : undefined,
          ibu: beer.ibu != undefined ? parseFloat(beer.ibu) : undefined,
          srm: beer.srm != undefined ? parseFloat(beer.srm) : undefined,
          upc: beer.upc != undefined ? parseInt(beer.upc) : undefined,
          descript: beer.descript,
          last_mod: tryParseDate(beer.last_mod),
        }),
      ),
    });
    console.log('Beers seeded...');
  } catch (err) {
    console.error('Error seeding beers', err);
  }
};

const seedBreweries = async (
  prisma: Omit<
    PrismaClient<
      Prisma.PrismaClientOptions,
      never,
      Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
    >,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
  >,
) => {
  if ((await prisma.breweries.count()) > 0) {
    return;
  }
  const breweries = await getDataFromProd('/breweries');
  console.log('Breweries read...');
  await prisma.breweries.createMany({
    data: breweries.map(
      (brewery: {
        id: string;
        name: string;
        address1: string;
        address2: string;
        city: string;
        state: string;
        code: string;
        country: string;
        phone: string;
        website: string;
        descript: string;
        last_mod: string | number | Date;
      }) => ({
        id: parseInt(brewery.id),
        name: brewery.name,
        address1: brewery.address1,
        address2: brewery.address2,
        city: brewery.city,
        state: brewery.state,
        code: brewery.code,
        country: brewery.country,
        phone: brewery.phone,
        website: brewery.website,
        descript: brewery.descript,
        last_mod: new Date(brewery.last_mod),
      }),
    ),
  });
  console.log('Breweries seeded...');
};

const seedStyles = async (
  prisma: Omit<
    PrismaClient<
      Prisma.PrismaClientOptions,
      never,
      Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
    >,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
  >,
) => {
  if ((await prisma.styles.count()) > 0) {
    return;
  }
  const styles = await getDataFromProd('/styles');
  console.log('Styles read...');
  await prisma.styles.createMany({
    data: styles.map(
      (style: {
        id: string;
        cat_id: string;
        style_name: string;
        last_mod: string | number | Date;
      }) => ({
        id: parseInt(style.id),
        cat_id: parseInt(style.cat_id),
        style_name: style.style_name,
        last_mod: new Date(style.last_mod),
      }),
    ),
  });
  console.log('Styles seeded...');
};

const seedCategories = async (
  prisma: Omit<
    PrismaClient<
      Prisma.PrismaClientOptions,
      never,
      Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
    >,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
  >,
) => {
  if ((await prisma.categories.count()) > 0) {
    return;
  }
  const categories = await getDataFromProd('/categories');
  console.log('Categories read...');
  await prisma.categories.createMany({
    data: categories.map(
      (category: { id: string; cat_name: string; last_mod: string | number | Date }) => ({
        id: parseInt(category.id),
        cat_name: category.cat_name,
        last_mod: new Date(category.last_mod),
      }),
    ),
  });
  console.log('Categories seeded...');
};

const seedUsers = async (
  prisma: Omit<
    PrismaClient<
      Prisma.PrismaClientOptions,
      never,
      Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
    >,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
  >,
) => {
  if ((await prisma.users.count()) > 0) {
    return;
  }
  console.log('Seeding users...');
  await prisma.users.createMany({
    data: [
      {
        uid: 'ziEpTbNdFCgWqUiqkZTqlMSRRMA3',
        age: 21,
        email: 'f1@gmail.com',
        user_name: 'Frank1',
      },
      {
        uid: '76pM1VmJzoT0Ogjuf3Upaquog752',
        age: 22,
        email: 'f2@gmail.com',
        user_name: 'Frank2',
      },
      {
        uid: '17qVEFCiGJWUwfoz0FHnnJQAl4D2',
        age: 23,
        email: 'f3@gmail.com',
        user_name: 'Frank3',
      },
      {
        uid: '26vpFlcZLnY2GvBYgMQtw8CCItT2',
        age: 24,
        email: 'f4@gmail.com',
        user_name: 'Frank4',
      },
      {
        uid: 'UgE5Lker7UexwFXdkxXIIrKiUCg1',
        age: 25,
        email: 'f5@gmail.com',
        user_name: 'Frank5',
      },
    ],
  });
  console.log('Users seeded...');
};

const seedCollections = async (
  prisma: Omit<
    PrismaClient<
      Prisma.PrismaClientOptions,
      never,
      Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
    >,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
  >,
) => {
  if ((await prisma.collections.count()) > 0) {
    return;
  }
  console.log('Seeding collections...');
  await prisma.collections.createMany({
    data: [
      {
        name: 'Test Collection 1',
        description: 'Test Collection 1 Description',
        difficulty: 1,
      },
    ],
  });
  console.log('Collections seeded...');
};

function tryParseDate(last_mod: string): Date {
  try {
    const parsedDate = new Date(last_mod);

    if (isNaN(parsedDate.getTime())) {
      return new Date();
    }

    return parsedDate;
  } catch (err) {
    console.error('Error parsing date:', err);
    return new Date(); // Return a default date in case of any error
  }
}

function parseId(id: string): number | undefined {
  if (isNaN(parseInt(id))) {
    console.log('NaN');
    return undefined;
  }
  return parseInt(id);
}
