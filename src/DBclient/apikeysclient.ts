import prisma from '../../client';

export const getApiKeys = async (): Promise<{ key: string; lastMod: Date }[]> => {
  const apiKeys = await prisma.api_keys.findMany();
  return apiKeys.map(apiKey => ({ key: apiKey.key, lastMod: apiKey.last_mod }));
};
