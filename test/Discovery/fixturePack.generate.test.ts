/**
 * Contract fixture pack generator (implementation plan section 2). NOT a
 * test: a gated generation step, run on demand with
 * PILOT_GENERATE_PACK=1 and PILOT_LIVE_DB=1 against the loaded local
 * catalog. It captures real responses from the real handlers and writes
 * test/Discovery/fixtures/contract-fixture-pack.json, which the mobile
 * mock (M3) and future conformance diffing consume. Never hand-edit the
 * pack; regenerate it when the catalog changes.
 */
import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { decodeUserToken } from '../../src/Middleware/authUsers';
import { admin } from '../../src/Firebase/firebase';
import { getUserByUid } from '../../src/DBclient/userclient';
import discoveryRoutes from '../../src/Routes/discovery';
import { getPrisma } from '../../src/Discovery/db';

jest.mock('../../src/Firebase/firebase', () => ({
  admin: { auth: jest.fn() },
}));
jest.mock('../../src/DBclient/userclient', () => ({
  getUserByUid: jest.fn(),
}));
jest.mock('../../src/DBclient/apikeysclient', () => ({
  getApiKeys: jest.fn(),
}));
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

const generate = process.env.PILOT_GENERATE_PACK === '1';
const describeGen = generate ? describe : describe.skip;

jest.setTimeout(120000);

describeGen('fixture pack generation', () => {
  it('writes the contract fixture pack from live responses', async () => {
    (admin.auth as unknown as jest.Mock).mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({ uid: 'pack-uid', user_id: 'pack-uid' }),
    });
    (getUserByUid as unknown as jest.Mock).mockResolvedValue({
      id: 1,
      uid: 'pack-uid',
      user_name: 'pack',
    });
    const app = express();
    app.use(express.json());
    app.use('/api/v1', decodeUserToken, discoveryRoutes);
    const server: Server = await new Promise(resolve => {
      const s = app.listen(0, () => resolve(s));
    });
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const get = async (path: string) => {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: { Authorization: 'Bearer pack-token' },
      });
      return res.json();
    };
    try {
      const pack = {
        generated_from: 'live local catalog (5,894 beers), discovery handlers',
        search_90_minute: await get('/api/v1/discovery/search?q=90%20minute'),
        browse: await get('/api/v1/discovery/browse'),
        beverage_3951: await get('/api/v1/beverages/3951'),
        beverage_3914: await get('/api/v1/beverages/3914'),
        beverage_4271: await get('/api/v1/beverages/4271'),
        beverage_412_null_description: await get('/api/v1/beverages/412'),
      };
      const dir = join(__dirname, 'fixtures');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'contract-fixture-pack.json'), JSON.stringify(pack, null, 2));
      expect(pack.beverage_3951.name).toBe('90 Minute IPA');
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
      await getPrisma().$disconnect();
    }
  });
});
