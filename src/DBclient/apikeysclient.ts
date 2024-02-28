import { prismaCtx } from '..';

export const getApiKeys = async (): Promise<{ key: string; lastMod: Date; }[]> => {
  const apiKeys = await prismaCtx.prisma.api_keys.findMany();
  return apiKeys.map(apiKey => ({key: apiKey.key, lastMod: apiKey.last_mod}));
};
