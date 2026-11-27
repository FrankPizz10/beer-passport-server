/**
 * Handler conformance tests for the discovery pilot endpoints, against the
 * examples in API_CONTRACT.md. The app is mounted exactly as src/index.ts
 * mounts it (/api/v1 behind the real decodeUserToken). Firebase and the
 * user lookup are mocked (the clientCompat pattern); the discovery Prisma
 * layer is faked with the contract's real records, so these tests assert
 * response shapes, status codes, and error bodies without a database. The
 * same examples are re-verified against the live catalog by the S5 harness
 * (test/Discovery/conformance.live.test.ts, opt-in via PILOT_LIVE_DB=1).
 *
 * Corrected contract: a verified token whose user has no database row gets
 * 401 from the Phase 0 middleware (CTO directive 2026-11-21). The contract
 * draft's 404 for that case was fictitious and is not asserted anywhere.
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
jest.mock('../../src/Discovery/db', () => ({
  getPrisma: jest.fn(),
}));

const mockVerifyIdToken = jest.fn();
const mockGetUserByUid = getUserByUid as unknown as jest.Mock;
const mockGetPrisma = getPrisma as unknown as jest.Mock;

const dbUser = { id: 7, uid: 'firebase-uid-1', user_name: 'tester', email: 'a@b.c' };

const beer3951 = {
  id: 3951,
  name: '90 Minute IPA',
  brewery_id: 459,
  cat_id: 3,
  style_id: 32,
  abv: 9.0,
  ibu: 0,
  srm: 0,
  descript: 'Esquire Magazine calls our 90 Minute IPA "perhaps the best I.P.A. in America."',
  discontinued: false,
  brewery: {
    id: 459,
    name: 'Dogfish Head Craft Brewery',
    city: 'Milton',
    state: 'Delaware',
    country: 'United States',
    website: 'http://www.dogfish.com',
  },
  style: { id: 32, style_name: 'Imperial or Double India Pale Ale' },
  category: { id: 3, cat_name: 'North American Ale' },
};

const fakePrisma = {
  $connect: jest.fn(async () => undefined),
  $queryRaw: jest.fn(async (strings: TemplateStringsArray) => {
    const sql = strings.join(' ');
    if (sql.includes('COUNT')) return [{ count: BigInt(1) }];
    return [
      {
        id: 3951,
        name: '90 Minute IPA',
        abv: 9.0,
        cat_id: 3,
        brewery_id: 459,
        brewery_name: 'Dogfish Head Craft Brewery',
        style_id: 32,
        style_name: 'Imperial or Double India Pale Ale',
        category_name: 'North American Ale',
      },
    ];
  }),
  styles: {
    findUnique: jest.fn(async ({ where }: { where: { id: number } }) =>
      where.id === 32 ? { id: 32 } : null,
    ),
    findMany: jest.fn(async () => [{ id: 32, style_name: 'Imperial or Double India Pale Ale' }]),
  },
  breweries: {
    findUnique: jest.fn(async () => ({ id: 157 })),
    findMany: jest.fn(async () => [{ id: 157, name: 'Boston Beer Company' }]),
  },
  categories: {
    findUnique: jest.fn(async () => ({ id: 3 })),
    findMany: jest.fn(async () => [{ id: 3, cat_name: 'North American Ale' }]),
  },
  beverage_images: { findMany: jest.fn(async () => []) },
  beers: {
    findUnique: jest.fn(async ({ where }: { where: { id: number } }) =>
      where.id === 3951 ? beer3951 : null,
    ),
    groupBy: jest.fn(async ({ by }: { by: string[] }) => {
      if (by[0] === 'brewery_id') return [{ brewery_id: 157, _count: { id: 96 } }];
      if (by[0] === 'style_id') return [{ style_id: 32, _count: { id: 61 } }];
      return [{ cat_id: 3, _count: { id: 1412 } }];
    }),
    findMany: jest.fn(async () => [
      {
        id: 4271,
        name: 'Sierra Nevada Pale Ale',
        abv: 5.6,
        cat_id: 3,
        brewery: { id: 1142, name: 'Sierra Nevada Brewing Co.' },
        style: { id: 26, style_name: 'American-Style Pale Ale' },
        category: { id: 3, cat_name: 'North American Ale' },
      },
    ]),
  },
};

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  (admin.auth as unknown as jest.Mock).mockReturnValue({
    verifyIdToken: mockVerifyIdToken,
  });
  mockGetPrisma.mockReturnValue(fakePrisma);
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
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPrisma.mockReturnValue(fakePrisma);
  mockVerifyIdToken.mockResolvedValue({ uid: 'firebase-uid-1', user_id: 'firebase-uid-1' });
  mockGetUserByUid.mockResolvedValue(dbUser);
});

const get = async (path: string, token?: string) => {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, body: await res.json() };
};

describe('auth seam (Phase 0 middleware, corrected 401 model)', () => {
  it('returns 401 with the Phase 0 message shape when no token is sent', async () => {
    const { status, body } = await get('/api/v1/discovery/search?q=ipa');
    expect(status).toBe(401);
    expect(body).toEqual({ message: 'Unauthorized' });
  });

  it('returns 401 for a verified token whose user has no database row', async () => {
    mockGetUserByUid.mockResolvedValue(null);
    const { status } = await get('/api/v1/discovery/search?q=ipa', 'token');
    expect(status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    mockVerifyIdToken.mockRejectedValue(
      Object.assign(new Error('expired'), { code: 'auth/id-token-expired' }),
    );
    const { status } = await get('/api/v1/beverages/3951', 'token');
    expect(status).toBe(401);
  });
});

describe('GET /api/v1/health', () => {
  it('reports ok when the database answers', async () => {
    const { status, body } = await get('/api/v1/health', 'token');
    expect(status).toBe(200);
    expect(body).toEqual({ status: 'ok', db: 'ok' });
  });
});

describe('GET /api/v1/discovery/search', () => {
  it('matches the contract example shape for q=90 minute', async () => {
    const { status, body } = await get('/api/v1/discovery/search?q=90%20minute', 'token');
    expect(status).toBe(200);
    expect(body.results).toEqual([
      {
        id: 3951,
        name: '90 Minute IPA',
        brewery: { id: 459, name: 'Dogfish Head Craft Brewery' },
        style: { id: 32, name: 'Imperial or Double India Pale Ale' },
        category: { id: 3, name: 'North American Ale' },
        abv: 9.0,
        image_url: null,
        image_kind: 'initials',
      },
    ]);
    expect(body.pagination).toEqual({
      page: 1,
      page_size: 20,
      total_results: 1,
      total_pages: 1,
    });
    expect(body).not.toHaveProperty('error');
  });

  it('returns 400 with the contract error body for page_size out of range', async () => {
    const { status, body } = await get('/api/v1/discovery/search?page_size=51', 'token');
    expect(status).toBe(400);
    expect(body).toEqual({
      error: { code: 'invalid_parameter', message: 'page_size must be between 1 and 50.' },
    });
  });

  it('returns 400 for an unknown filter ID, never an empty 200', async () => {
    const { status, body } = await get('/api/v1/discovery/search?style_id=99999', 'token');
    expect(status).toBe(400);
    expect(body.error.code).toBe('invalid_parameter');
  });

  it('returns 400 for a filter ID above the Postgres int4 range, without querying (QA F1)', async () => {
    const { status, body } = await get(
      '/api/v1/discovery/search?style_id=99999999999999999999',
      'token',
    );
    expect(status).toBe(400);
    expect(body.error.code).toBe('invalid_parameter');
    expect(fakePrisma.styles.findUnique).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/discovery/browse', () => {
  it('returns the four fixed shelves in contract order with contract kinds', async () => {
    const { status, body } = await get('/api/v1/discovery/browse', 'token');
    expect(status).toBe(200);
    expect(body.shelves.map((s: { id: string }) => s.id)).toEqual([
      'popular_breweries',
      'styles_to_explore',
      'by_category',
      'newest_additions',
    ]);
    expect(body.shelves.map((s: { kind: string }) => s.kind)).toEqual([
      'brewery',
      'style',
      'category',
      'beverage',
    ]);
    expect(body.shelves[0].items[0]).toEqual({
      id: 157,
      name: 'Boston Beer Company',
      beer_count: 96,
    });
    expect(body.shelves[3].items[0]).toMatchObject({
      id: 4271,
      name: 'Sierra Nevada Pale Ale',
      image_kind: 'initials',
    });
  });
});

describe('GET /api/v1/beverages/:id', () => {
  it('matches the contract detail example for 3951, with stored 0 IBU as null', async () => {
    const { status, body } = await get('/api/v1/beverages/3951', 'token');
    expect(status).toBe(200);
    expect(body).toEqual({
      id: 3951,
      name: '90 Minute IPA',
      brewery: {
        id: 459,
        name: 'Dogfish Head Craft Brewery',
        city: 'Milton',
        state: 'Delaware',
        country: 'United States',
        website: 'http://www.dogfish.com',
      },
      style: { id: 32, name: 'Imperial or Double India Pale Ale' },
      category: { id: 3, name: 'North American Ale' },
      abv: 9.0,
      ibu: null,
      srm: null,
      description: 'Esquire Magazine calls our 90 Minute IPA "perhaps the best I.P.A. in America."',
      discontinued: false,
      archived: false,
      image_url: null,
      image_kind: 'initials',
      image_provenance: null,
    });
  });

  it('returns 404 with code not_found for an unknown id', async () => {
    const { status, body } = await get('/api/v1/beverages/999999', 'token');
    expect(status).toBe(404);
    expect(body.error.code).toBe('not_found');
  });

  it('returns 404 (not 400) for a non-integer id, per contract decision 5', async () => {
    const { status, body } = await get('/api/v1/beverages/abc', 'token');
    expect(status).toBe(404);
    expect(body.error.code).toBe('not_found');
  });

  it('returns 404 for an integer id above the Postgres int4 range, without querying (QA F1)', async () => {
    const { status, body } = await get('/api/v1/beverages/99999999999999999999', 'token');
    expect(status).toBe(404);
    expect(body.error.code).toBe('not_found');
    expect(fakePrisma.beers.findUnique).not.toHaveBeenCalled();
  });
});
