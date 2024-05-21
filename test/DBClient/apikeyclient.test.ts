import { prismaMock } from '../../singleton';
import * as apikeyclient from '../../src/DBclient/apikeysclient';

describe('Api Key Client', () => {
  test('should return all api keys', async () => {
    const apiKeys = [
      { id: 1, key: 'key1', last_mod: new Date() },
      { id: 2, key: 'key2', last_mod: new Date() },
      { id: 3, key: 'key3', last_mod: new Date() },
    ];
    prismaMock.api_keys.findMany.mockResolvedValue(apiKeys);
    const result = await apikeyclient.getApiKeys();
    expect(result).toEqual(apiKeys.map(apiKey => ({ key: apiKey.key, lastMod: apiKey.last_mod })));
  });
});
