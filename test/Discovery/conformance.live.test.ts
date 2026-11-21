/**
 * S5 live conformance, relevance, and latency harness. Opt-in: runs only
 * when PILOT_LIVE_DB=1, against a real local PostgreSQL loaded with the
 * full baseline catalog (14 categories, 147 styles, 1,339 breweries, 5,894
 * beers) with the discovery migration applied and the search vector
 * refreshed. DATABASE_URL must point at that database.
 *
 * Only the Firebase identity is faked (the clientCompat pattern); routing,
 * the Phase 0 middleware, the Prisma layer, and the ranked SQL are real.
 *
 * Latency protocol (PILOT_BRIEF.md): 10 warm-up requests, then 100 measured
 * requests per case, p95 reported and asserted against the brief's targets:
 * search under 300 ms single-term unfiltered, under 500 ms with two
 * filters, browse under 400 ms, detail under 200 ms.
 */
import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
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

const live = process.env.PILOT_LIVE_DB === '1';
const describeLive = live ? describe : describe.skip;

jest.setTimeout(300000);

describeLive('live discovery conformance (S5)', () => {
  let server: Server;
  let baseUrl: string;

  const get = async (path: string) => {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: 'Bearer live-token' },
    });
    return { status: res.status, body: await res.json() };
  };

  beforeAll(async () => {
    (admin.auth as unknown as jest.Mock).mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: 'live-uid',
        user_id: 'live-uid',
      }),
    });
    (getUserByUid as unknown as jest.Mock).mockResolvedValue({
      id: 1,
      uid: 'live-uid',
      user_name: 'live',
    });
    const app = express();
    app.use(express.json());
    app.use('/api/v1', decodeUserToken, discoveryRoutes);
    await new Promise<void>(resolve => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
    await getPrisma().$disconnect();
  });

  it('detail 3951 matches the contract example against real data', async () => {
    const { status, body } = await get('/api/v1/beverages/3951');
    expect(status).toBe(200);
    expect(body.name).toBe('90 Minute IPA');
    expect(body.brewery).toMatchObject({ id: 459, name: 'Dogfish Head Craft Brewery' });
    expect(body.style).toEqual({ id: 32, name: 'Imperial or Double India Pale Ale' });
    expect(body.category).toEqual({ id: 3, name: 'North American Ale' });
    expect(body.abv).toBe(9.0);
    expect(body.ibu).toBeNull();
    expect(body.srm).toBeNull();
    // The contract example lightly normalizes this text; the stored source
    // data reads "90 Minute .IPA." Assert the real stored prefix.
    expect(body.description).toContain('Esquire Magazine calls our 90 Minute');
    expect(body.image_kind).toBe('initials');
    expect(body.image_provenance).toBeNull();
  });

  it('detail 3914 matches the contract example against real data', async () => {
    const { status, body } = await get('/api/v1/beverages/3914');
    expect(status).toBe(200);
    expect(body.name).toBe('Samuel Adams Boston Lager');
    expect(body.brewery).toMatchObject({ id: 157, name: 'Boston Beer Company' });
    expect(body.style).toEqual({ id: 95, name: 'American-Style Lager' });
    expect(body.category).toEqual({ id: 8, name: 'North American Lager' });
    expect(body.abv).toBe(4.75);
  });

  it('detail 4271 matches the contract example against real data', async () => {
    const { status, body } = await get('/api/v1/beverages/4271');
    expect(status).toBe(200);
    expect(body.name).toBe('Sierra Nevada Pale Ale');
    expect(body.brewery).toMatchObject({ id: 1142, name: 'Sierra Nevada Brewing Co.' });
    expect(body.style).toEqual({ id: 26, name: 'American-Style Pale Ale' });
    expect(body.abv).toBe(5.6);
  });

  it('detail for a beer with no description serializes description as null', async () => {
    const { status, body } = await get('/api/v1/beverages/412');
    expect(status).toBe(200);
    expect(body.description).toBeNull();
  });

  it('browse returns all 14 categories and counts that sum to the catalog', async () => {
    const { status, body } = await get('/api/v1/discovery/browse');
    expect(status).toBe(200);
    const byCategory = body.shelves.find((s: { id: string }) => s.id === 'by_category');
    expect(byCategory.items).toHaveLength(14);
    const total = byCategory.items.reduce(
      (sum: number, item: { beer_count: number }) => sum + item.beer_count,
      0,
    );
    expect(total).toBe(5894);
    const popular = body.shelves.find((s: { id: string }) => s.id === 'popular_breweries');
    expect(popular.items[0]).toMatchObject({ id: 157, name: 'Boston Beer Company' });
    expect(popular.items).toHaveLength(10);
  });

  describe('relevance query set (fixed in the implementation plan)', () => {
    const rankOf = async (path: string, id: number, pageSize = 10) => {
      const { body } = await get(`${path}${path.includes('?') ? '&' : '?'}page_size=${pageSize}`);
      const ids = body.results.map((r: { id: number }) => r.id);
      const index = ids.indexOf(id);
      return { rank: index === -1 ? null : index + 1, ids, total: body.pagination.total_results };
    };

    it('q=90 minute: 3951 in first 5', async () => {
      const { rank } = await rankOf('/api/v1/discovery/search?q=90%20minute', 3951, 5);
      expect(rank).not.toBeNull();
      expect(rank as number).toBeLessThanOrEqual(5);
    });

    it('q=sierra nevada pale: 4271 in first 5', async () => {
      const { rank } = await rankOf('/api/v1/discovery/search?q=sierra%20nevada%20pale', 4271, 5);
      expect(rank).not.toBeNull();
      expect(rank as number).toBeLessThanOrEqual(5);
    });

    it('q=boston lager: 3914 in first 5', async () => {
      const { rank } = await rankOf('/api/v1/discovery/search?q=boston%20lager', 3914, 5);
      expect(rank).not.toBeNull();
      expect(rank as number).toBeLessThanOrEqual(5);
    });

    it('q=ipa with style_id 32: all results carry the style, recognizable IPAs in first 5', async () => {
      // The plan's stated expectation for this case is "a recognizable IPA
      // in first 5", not a specific beer: for the single generic term "ipa"
      // every FTS rank ties, and the trigram tiebreak favors short names,
      // so 90 Minute IPA lands at rank 10 (recorded in PILOT_IMPL_NOTES).
      const { body } = await get('/api/v1/discovery/search?q=ipa&style_id=32&page_size=50');
      expect(body.results.length).toBeGreaterThan(0);
      for (const result of body.results) {
        expect(result.style?.id).toBe(32);
      }
      for (const result of body.results.slice(0, 5)) {
        expect(result.name).toMatch(/IPA|India Pale Ale/);
      }
      const ids = body.results.map((r: { id: number }) => r.id);
      expect(ids).toContain(3951);
    });

    it('q=siera nevada (misspelling): 4271 in first 10', async () => {
      const { rank } = await rankOf('/api/v1/discovery/search?q=siera%20nevada', 4271, 10);
      expect(rank).not.toBeNull();
      expect(rank as number).toBeLessThanOrEqual(10);
    });

    it('q=dogfish: Dogfish Head beers surface, 3951 among the first page', async () => {
      const { body } = await get('/api/v1/discovery/search?q=dogfish&page_size=20');
      expect(body.results.length).toBeGreaterThan(0);
      for (const result of body.results.slice(0, 5)) {
        expect(result.brewery?.id).toBe(459);
      }
      expect(body.results.map((r: { id: number }) => r.id)).toContain(3951);
    });

    it('filter-only brewery_id 157: paginating to exhaustion returns every beer exactly once', async () => {
      const seen = new Set<number>();
      let page = 1;
      let totalPages = 1;
      do {
        const { body } = await get(
          `/api/v1/discovery/search?brewery_id=157&page=${page}&page_size=50`,
        );
        totalPages = body.pagination.total_pages;
        for (const result of body.results) {
          expect(result.brewery?.id).toBe(157);
          expect(seen.has(result.id)).toBe(false);
          seen.add(result.id);
        }
        page += 1;
      } while (page <= totalPages);
      const direct = await getPrisma().beers.count({ where: { brewery_id: 157 } });
      expect(seen.size).toBe(direct);
    });
  });

  describe('latency (brief protocol: 10 warm-up, 100 measured, p95)', () => {
    const measure = async (path: string) => {
      for (let i = 0; i < 10; i++) await get(path);
      const samples: number[] = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await get(path);
        samples.push(performance.now() - start);
      }
      samples.sort((a, b) => a - b);
      return samples[Math.floor(0.95 * samples.length) - 1];
    };

    it('search single-term unfiltered p95 under 300 ms', async () => {
      const p95 = await measure('/api/v1/discovery/search?q=lager');
      console.log(`latency search unfiltered p95: ${p95.toFixed(1)} ms`);
      expect(p95).toBeLessThan(300);
    });

    it('search with two filters p95 under 500 ms', async () => {
      const p95 = await measure('/api/v1/discovery/search?q=ipa&style_id=32&category_id=3');
      console.log(`latency search two filters p95: ${p95.toFixed(1)} ms`);
      expect(p95).toBeLessThan(500);
    });

    it('browse p95 under 400 ms', async () => {
      const p95 = await measure('/api/v1/discovery/browse');
      console.log(`latency browse p95: ${p95.toFixed(1)} ms`);
      expect(p95).toBeLessThan(400);
    });

    it('detail p95 under 200 ms', async () => {
      const p95 = await measure('/api/v1/beverages/3951');
      console.log(`latency detail p95: ${p95.toFixed(1)} ms`);
      expect(p95).toBeLessThan(200);
    });
  });
});
