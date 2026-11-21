/**
 * Mobile client compatibility suite (Phase 0, P0.4).
 *
 * Purpose: prove that the Phase 0 status-code changes do not break the
 * current mobile client (beer-passport, Models/Requests.ts). The client's
 * request pattern, verified from that file, is:
 *   - attach the Firebase ID token as `Authorization: Bearer <token>`
 *   - always parse the response body as JSON (`await response.json()`;
 *     18 such calls in that file) and read data fields from the result
 *   - it never reads the `message` field (zero `.message` reads) and does
 *     not branch on 401/403/500; its only status branching is four
 *     `response.status === 204` early returns and one 200 health check
 *   - the client therefore does not depend on the message strings at all;
 *     this suite asserts a stricter contract than the client requires
 *     (body shapes and message strings preserved, only statuses changed)
 *
 * This suite drives the REAL auth middleware over HTTP, mounted exactly as
 * src/index.ts mounts it (`/api` behind decodeUserToken, `/secure` behind
 * decodeAPIKey, and an `/admin` gate using decodeAdminToken the way
 * src/Routes/admins.ts applies it), and asserts through a client-shaped
 * helper that:
 *   - success responses are unchanged (200, same body)
 *   - every error body is still a JSON object whose only field is the
 *     string `message`, with the pre-existing message strings preserved
 *   - only the status codes changed: 200 -> 401 / 403
 *
 * Firebase verification and the database are mocked. No network beyond
 * loopback, no live DB.
 */
import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { scryptSync } from 'crypto';
import { decodeAdminToken, decodeAPIKey, decodeUserToken } from '../../src/Middleware/authUsers';
import { admin } from '../../src/Firebase/firebase';
import { getUserByUid } from '../../src/DBclient/userclient';
import { getApiKeys } from '../../src/DBclient/apikeysclient';

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

const mockVerifyIdToken = jest.fn();
const mockGetUserByUid = getUserByUid as unknown as jest.Mock;
const mockGetApiKeys = getApiKeys as unknown as jest.Mock;

const dbUser = { id: 7, uid: 'firebase-uid-1', user_name: 'tester', email: 'a@b.c' };

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  (admin.auth as unknown as jest.Mock).mockReturnValue({
    verifyIdToken: mockVerifyIdToken,
  });
  const app = express();
  app.use(express.json());
  app.use('/api', decodeUserToken);
  app.get('/api/ping', (req, res) => res.json({ ok: true }));
  app.use('/secure', decodeAPIKey);
  app.get('/secure/ping', (req, res) => res.json({ ok: true }));
  // Mirrors adminRoutes.use('/admin', decodeAdminToken) in admins.ts.
  app.use('/admin', decodeAdminToken);
  app.get('/admin/ping', (req, res) => res.json({ ok: true }));
  await new Promise<void>(resolve => {
    server = app.listen(0, () => resolve());
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise(resolve => server.close(resolve));
});

beforeEach(() => {
  jest.clearAllMocks();
  (admin.auth as unknown as jest.Mock).mockReturnValue({
    verifyIdToken: mockVerifyIdToken,
  });
});

/**
 * The mobile client's consumption pattern, reduced to what Requests.ts
 * actually does with these responses: parse JSON unconditionally and read
 * fields off the resulting object.
 */
const mobileRequest = async (path: string, token?: string) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token !== undefined) {
    headers.Authorization = ['Bearer', token].join(' ');
  }
  const response = await fetch(`${baseUrl}${path}`, { headers });
  const body = await response.json();
  return { status: response.status, body };
};

const expectMessageOnlyBody = (body: unknown, message: string) => {
  expect(typeof body).toBe('object');
  expect(Object.keys(body as Record<string, unknown>)).toEqual(['message']);
  expect((body as { message: unknown }).message).toBe(message);
};

describe('user-token routes (/api)', () => {
  it('success path is unchanged: 200 with the data body', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'firebase-uid-1', user_id: 'firebase-uid-1' });
    mockGetUserByUid.mockResolvedValue(dbUser);
    const { status, body } = await mobileRequest('/api/ping', 'good-token');
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  it('missing token: same {message} body as before, status 200 -> 401', async () => {
    const { status, body } = await mobileRequest('/api/ping');
    expect(status).toBe(401);
    expectMessageOnlyBody(body, 'Unauthorized');
  });

  it('invalid token: {message} shape preserved, status 200 -> 401', async () => {
    mockVerifyIdToken.mockRejectedValue(
      Object.assign(new Error('bad token'), { code: 'auth/argument-error' }),
    );
    const { status, body } = await mobileRequest('/api/ping', 'garbage');
    expect(status).toBe(401);
    expectMessageOnlyBody(body, 'Unauthorized');
  });

  it('expired token: {message} shape preserved, status 200 -> 401', async () => {
    mockVerifyIdToken.mockRejectedValue(
      Object.assign(new Error('expired'), { code: 'auth/id-token-expired' }),
    );
    const { status, body } = await mobileRequest('/api/ping', 'expired');
    expect(status).toBe(401);
    expectMessageOnlyBody(body, 'Unauthorized');
  });
});

describe('admin routes (/admin)', () => {
  it('valid non-admin token: same {message} body as before, status 200 -> 403', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'firebase-uid-1', user_id: 'firebase-uid-1' });
    const { status, body } = await mobileRequest('/admin/ping', 'good-token');
    expect(status).toBe(403);
    expectMessageOnlyBody(body, 'Unauthorized Admin');
  });

  it('valid admin token still succeeds with the unchanged body', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'firebase-uid-1',
      user_id: 'firebase-uid-1',
      admin: true,
    });
    mockGetUserByUid.mockResolvedValue(dbUser);
    const { status, body } = await mobileRequest('/admin/ping', 'admin-token');
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  it('no token on an admin route: {message} shape preserved, status 200 -> 401', async () => {
    const { status, body } = await mobileRequest('/admin/ping');
    expect(status).toBe(401);
    expectMessageOnlyBody(body, 'Unauthorized');
  });
});

describe('API-key routes (/secure)', () => {
  const storedKey = () => {
    const salt = 'compat-salt';
    const hash = scryptSync('the-key', salt, 64).toString('hex');
    return { key: `${hash}.${salt}`, lastMod: new Date(), revoked: false };
  };

  it('valid key still succeeds with the unchanged body', async () => {
    mockGetApiKeys.mockResolvedValue([storedKey()]);
    const { status, body } = await mobileRequest('/secure/ping', 'the-key');
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  it('wrong key: same {message} body as before, status 200 -> 401', async () => {
    mockGetApiKeys.mockResolvedValue([storedKey()]);
    const { status, body } = await mobileRequest('/secure/ping', 'wrong-key');
    expect(status).toBe(401);
    expectMessageOnlyBody(body, 'Unauthorized');
  });
});
