import { prismaCtx } from '..';

export const getApiKeys = async () => {
  const apiKeys = await prismaCtx.prisma.api_keys.findMany();
  return apiKeys.map((apiKey) => apiKey.key);
};