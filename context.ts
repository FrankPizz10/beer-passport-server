import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import dotenv from 'dotenv';

dotenv.config();

export type Context = {
  prisma: PrismaClient;
};

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
};

export const createMockContext = (): MockContext => {
  return {
    prisma: mockDeep<PrismaClient>(),
  };
};

export const createContext = (): Context => {
  if (process.env.ENVIRONMENT === 'DEV') {
    return {
      prisma: new PrismaClient({ log: ['query', 'info', 'warn', 'error'], datasources: { db: { url: process.env.DATABASE_URL } } }),
    };
  }
  else {
    return {
      prisma: new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } }),
    };
  }
};
