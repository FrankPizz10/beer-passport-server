import csvParser from 'csv-parser';
import fs from 'fs';
import { prismaCtx } from '..';

const readCSVData = async (filepath: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const beers: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Promise<any[]>((resolve, reject) => {
    fs.createReadStream('../beer-passport-server/data' + filepath)
      .pipe(csvParser())
      .on('data', row => {
        beers.push(row);
      })
      .on('end', () => {
        resolve(beers);
      })
      .on('error', err => {
        reject(err);
      });
  });
};

export const seedDatabase = async () => {
  console.log('Seeding database...');
  await seedBreweries();
  await seedStyles();
  await seedCategories();
  await seedBeers();
  if (process.env.NODE_ENV !== 'production') {
    await seedUsers();
    await seedCollections();
  }
  console.log('Database seeded...');
};

const seedBeers = async () => {
  if ((await prismaCtx.prisma.beers.count()) > 0) {
    return;
  }
  const beers = await readCSVData('/beers.csv');
  console.log('Beers read....');
  await prismaCtx.prisma.beers.createMany({
    data: beers.map(beer => ({
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
    })),
  });
  console.log('Beers seeded...');
};

const seedBreweries = async () => {
  if ((await prismaCtx.prisma.breweries.count()) > 0) {
    return;
  }
  const breweries = await readCSVData('/breweries.csv');
  console.log('Breweries read...');
  await prismaCtx.prisma.breweries.createMany({
    data: breweries.map(brewery => ({
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
    })),
  });
  console.log('Breweries seeded...');
};

const seedStyles = async () => {
  if ((await prismaCtx.prisma.styles.count()) > 0) {
    return;
  }
  const styles = await readCSVData('/styles.csv');
  console.log('Styles read...');
  await prismaCtx.prisma.styles.createMany({
    data: styles.map(style => ({
      id: parseInt(style.id),
      cat_id: parseInt(style.cat_id),
      style_name: style.style_name,
      last_mod: new Date(style.last_mod),
    })),
  });
  console.log('Styles seeded...');
};

const seedCategories = async () => {
  if ((await prismaCtx.prisma.categories.count()) > 0) {
    return;
  }
  const categories = await readCSVData('/categories.csv');
  console.log('Categories read...');
  await prismaCtx.prisma.categories.createMany({
    data: categories.map(category => ({
      id: parseInt(category.id),
      cat_name: category.cat_name,
      last_mod: new Date(category.last_mod),
    })),
  });
  console.log('Categories seeded...');
};

const seedUsers = async () => {
  if ((await prismaCtx.prisma.users.count()) > 0) {
    return;
  }
  console.log('Seeding users...');
  await prismaCtx.prisma.users.createMany({
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

const seedCollections = async () => {
  if ((await prismaCtx.prisma.collections.count()) > 0) {
    return;
  }
  console.log('Seeding collections...');
  await prismaCtx.prisma.collections.createMany({
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
