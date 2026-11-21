/**
 * Phase 0 (P0.4) auth regression suite for src/Middleware/authUsers.ts.
 *
 * Firebase token verification and the database are mocked: no network, no
 * live DB. Covers the status-code contract introduced by Phase 0:
 *   401 missing / malformed / invalid / expired credentials
 *   401 verified identity with no database row (QA F-8; registration exempt)
 *   403 authenticated but insufficient role (non-admin on admin routes)
 *   500 genuine internal errors
 *   revoked and expired API keys rejected (QA F-2)
 */
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

const makeReqRes = (options: {
  authorization?: string;
  method?: string;
  path?: string;
}) => {
  const req: any = {
    headers: {} as Record<string, string>,
    method: options.method ?? 'GET',
    path: options.path ?? '/friends/',
  };
  if (options.authorization !== undefined) {
    req.headers.authorization = options.authorization;
  }
  const res: any = { locals: {}, statusCode: 200, body: undefined as unknown };
  res.json = jest.fn((body: unknown) => {
    res.body = body;
    return res;
  });
  const next = jest.fn();
  return { req, res, next };
};

const authError = (code: string) => Object.assign(new Error(code), { code });

const storedKeyFor = (
  plain: string,
  overrides: { revoked?: boolean; lastMod?: Date } = {},
) => {
  const salt = 'unit-test-salt';
  const hash = scryptSync(plain, salt, 64).toString('hex');
  return {
    key: `${hash}.${salt}`,
    lastMod: overrides.lastMod ?? new Date(),
    revoked: overrides.revoked ?? false,
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  (admin.auth as unknown as jest.Mock).mockReturnValue({
    verifyIdToken: mockVerifyIdToken,
  });
});

describe('decodeUserToken', () => {
  it('returns 401 when there is no Authorization header', async () => {
    const { req, res, next } = makeReqRes({});
    await decodeUserToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a malformed header ("Bearer" with no token)', async () => {
    const { req, res, next } = makeReqRes({ authorization: 'Bearer' });
    await decodeUserToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a header with no scheme', async () => {
    const { req, res, next } = makeReqRes({ authorization: 'abc123' });
    await decodeUserToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for the literal token "undefined" the old client could send', async () => {
    const { req, res, next } = makeReqRes({ authorization: 'Bearer undefined' });
    await decodeUserToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', async () => {
    mockVerifyIdToken.mockRejectedValue(authError('auth/argument-error'));
    const { req, res, next } = makeReqRes({ authorization: 'Bearer garbage' });
    await decodeUserToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an expired token', async () => {
    mockVerifyIdToken.mockRejectedValue(authError('auth/id-token-expired'));
    const { req, res, next } = makeReqRes({ authorization: 'Bearer expired' });
    await decodeUserToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 when token verification fails for a non-auth reason', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('network unreachable'));
    const { req, res, next } = makeReqRes({ authorization: 'Bearer token' });
    await decodeUserToken(req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Auth Internal Error' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets res.locals.user and res.locals.firebaseUid for a valid token', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'firebase-uid-1', user_id: 'firebase-uid-1' });
    mockGetUserByUid.mockResolvedValue(dbUser);
    const { req, res, next } = makeReqRes({ authorization: 'Bearer good' });
    await decodeUserToken(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.locals.user).toEqual(dbUser);
    expect(res.locals.firebaseUid).toBe('firebase-uid-1');
  });

  it('returns 401 (not a null-user pass-through) when the verified user has no database row', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'firebase-uid-9', user_id: 'firebase-uid-9' });
    mockGetUserByUid.mockResolvedValue(null);
    const { req, res, next } = makeReqRes({
      authorization: 'Bearer good',
      method: 'GET',
      path: '/friends/',
    });
    await decodeUserToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('lets an unregistered user through only for POST /api/users (registration)', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'firebase-uid-9', user_id: 'firebase-uid-9' });
    mockGetUserByUid.mockResolvedValue(null);
    // Mounted at '/api' in src/index.ts, so req.path is '/users'.
    const mounted = makeReqRes({ authorization: 'Bearer good', method: 'POST', path: '/users' });
    await decodeUserToken(mounted.req, mounted.res, mounted.next);
    expect(mounted.next).toHaveBeenCalledTimes(1);
    expect(mounted.res.locals.user).toBeNull();
    expect(mounted.res.locals.firebaseUid).toBe('firebase-uid-9');
    // Unmounted form, '/api/users', behaves the same.
    const unmounted = makeReqRes({
      authorization: 'Bearer good',
      method: 'POST',
      path: '/api/users',
    });
    await decodeUserToken(unmounted.req, unmounted.res, unmounted.next);
    expect(unmounted.next).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when the user lookup itself fails (database error)', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'firebase-uid-1', user_id: 'firebase-uid-1' });
    mockGetUserByUid.mockRejectedValue(new Error('Error fetching user'));
    const { req, res, next } = makeReqRes({ authorization: 'Bearer good' });
    await decodeUserToken(req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Auth Internal Error' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('decodeAdminToken', () => {
  it('returns 401 when there is no Authorization header', async () => {
    const { req, res, next } = makeReqRes({});
    await decodeAdminToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 (not a 200/500 internal error) for a malformed header', async () => {
    const { req, res, next } = makeReqRes({ authorization: 'Bearer' });
    await decodeAdminToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', async () => {
    mockVerifyIdToken.mockRejectedValue(authError('auth/argument-error'));
    const { req, res, next } = makeReqRes({ authorization: 'Bearer garbage' });
    await decodeAdminToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an expired token', async () => {
    mockVerifyIdToken.mockRejectedValue(authError('auth/id-token-expired'));
    const { req, res, next } = makeReqRes({ authorization: 'Bearer expired' });
    await decodeAdminToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for a valid token without the admin claim', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'firebase-uid-1', user_id: 'firebase-uid-1' });
    const { req, res, next } = makeReqRes({ authorization: 'Bearer good' });
    await decodeAdminToken(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: 'Unauthorized Admin' });
    expect(next).not.toHaveBeenCalled();
    expect(mockGetUserByUid).not.toHaveBeenCalled();
  });

  it('calls next for a valid admin token with a database row', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'firebase-uid-1',
      user_id: 'firebase-uid-1',
      admin: true,
    });
    mockGetUserByUid.mockResolvedValue(dbUser);
    const { req, res, next } = makeReqRes({ authorization: 'Bearer good' });
    await decodeAdminToken(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.locals.user).toEqual(dbUser);
    expect(res.locals.firebaseUid).toBe('firebase-uid-1');
  });

  it('returns 401 for a valid admin token whose uid has no database row', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'firebase-uid-9',
      user_id: 'firebase-uid-9',
      admin: true,
    });
    mockGetUserByUid.mockResolvedValue(null);
    const { req, res, next } = makeReqRes({ authorization: 'Bearer good' });
    await decodeAdminToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('decodeAPIKey', () => {
  it('returns 401 when there is no Authorization header', async () => {
    const { req, res, next } = makeReqRes({});
    await decodeAPIKey(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a wrong key', async () => {
    mockGetApiKeys.mockResolvedValue([storedKeyFor('the-real-key')]);
    const { req, res, next } = makeReqRes({ authorization: 'Bearer wrong-key' });
    await decodeAPIKey(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for a valid, unrevoked, unexpired key', async () => {
    mockGetApiKeys.mockResolvedValue([storedKeyFor('the-real-key')]);
    const { req, res, next } = makeReqRes({ authorization: 'Bearer the-real-key' });
    await decodeAPIKey(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 401 for a revoked key even when the secret matches (F-2 regression)', async () => {
    mockGetApiKeys.mockResolvedValue([storedKeyFor('the-real-key', { revoked: true })]);
    const { req, res, next } = makeReqRes({ authorization: 'Bearer the-real-key' });
    await decodeAPIKey(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a key older than the 3-month validity window', async () => {
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
    mockGetApiKeys.mockResolvedValue([storedKeyFor('the-real-key', { lastMod: fourMonthsAgo })]);
    const { req, res, next } = makeReqRes({ authorization: 'Bearer the-real-key' });
    await decodeAPIKey(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 when the key lookup itself fails', async () => {
    mockGetApiKeys.mockRejectedValue(new Error('database unreachable'));
    const { req, res, next } = makeReqRes({ authorization: 'Bearer any' });
    await decodeAPIKey(req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Auth Admin Internal Error' });
    expect(next).not.toHaveBeenCalled();
  });
});
