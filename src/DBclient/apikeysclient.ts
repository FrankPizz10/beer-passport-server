import { prismaCtx } from '..';

export const getApiKeys = async (): Promise<{ key: string; lastMod: Date; revoked: boolean }[]> => {
  const apiKeys = await prismaCtx.prisma.api_keys.findMany();
  // The revoked flag must travel with the key: decodeAPIKey rejects revoked
  // keys (QA finding F-2). Before this change revocation was never read.
  return apiKeys.map(apiKey => ({ key: apiKey.key, lastMod: apiKey.last_mod, revoked: apiKey.revoked }));
};
