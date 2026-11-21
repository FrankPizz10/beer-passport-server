// Lazy Prisma singleton for the discovery module. Kept separate from
// src/index.ts (which owns the legacy prismaCtx and starts the HTTP server)
// so discovery handlers and their tests never import the server entrypoint.
import { PrismaClient } from '@prisma/client';
import { createContext } from '../../context';

let prisma: PrismaClient | undefined;

export const getPrisma = (): PrismaClient => {
  if (!prisma) {
    prisma = createContext().prisma;
  }
  return prisma;
};
