/**
 * Friends route tests (Phase 0).
 *
 * Runs the real src/Routes/friends.ts router over HTTP with the database
 * layer mocked. Covers:
 *   - the self-friend guard regression (QA F-6): the guard compared a
 *     number to a string and never fired; adding yourself must now be a 400
 *     and must not reach addFriend.
 *   - the is-friend check projection (QA F-3): the users.findMany behind
 *     GET /api/friends/:user2 must request only the approved fields
 *     (id, user_name, private), never full user rows.
 */
import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import friendRoutes from '../../src/Routes/friends';
import { addFriend } from '../../src/DBclient/userclient';
import { prismaCtx } from '../../src/index';

jest.mock('../../src/index', () => ({
  prismaCtx: {
    prisma: {
      notifications: { upsert: jest.fn() },
      users: { findUnique: jest.fn(), findMany: jest.fn() },
      friends: { deleteMany: jest.fn() },
    },
  },
}));
jest.mock('../../src/DBclient/userclient', () => ({
  addFriend: jest.fn(),
  getFriendsByUserId: jest.fn(),
}));
jest.mock('../../src/Notifications/sendNotifications', () => ({
  sendNotifications: jest.fn(),
}));

const mockAddFriend = addFriend as unknown as jest.Mock;
const prisma = prismaCtx.prisma as unknown as {
  notifications: { upsert: jest.Mock };
  users: { findUnique: jest.Mock; findMany: jest.Mock };
  friends: { deleteMany: jest.Mock };
};

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  // Stand-in for decodeUserToken: the caller is database user id 7.
  app.use((req, res, next) => {
    res.locals.user = { id: 7, user_name: 'caller' };
    next();
  });
  app.use(friendRoutes);
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
  prisma.notifications.upsert.mockResolvedValue({});
  prisma.users.findUnique.mockResolvedValue(null);
});

describe('POST /api/friends/:user2', () => {
  it('rejects adding yourself as a friend with 400 and never calls addFriend (F-6 regression)', async () => {
    const response = await fetch(`${baseUrl}/api/friends/7`, { method: 'POST' });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ Error: 'Cannot add yourself as a friend' });
    expect(mockAddFriend).not.toHaveBeenCalled();
  });

  it('adds a different user and returns the created friendship', async () => {
    mockAddFriend.mockResolvedValue({ id: 42, user_1: 7, user_2: 8 });
    const response = await fetch(`${baseUrl}/api/friends/8`, { method: 'POST' });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ id: 42, user_1: 7, user_2: 8 });
    expect(mockAddFriend).toHaveBeenCalledWith(7, 8);
  });

  it('still rejects a non-numeric user2 with 400', async () => {
    const response = await fetch(`${baseUrl}/api/friends/abc`, { method: 'POST' });
    expect(response.status).toBe(400);
    expect(mockAddFriend).not.toHaveBeenCalled();
  });
});

describe('GET /api/friends/:user2 (is-friend check)', () => {
  it('queries users with the approved field projection only (F-3)', async () => {
    prisma.users.findMany.mockResolvedValue([{ id: 8, user_name: 'friend', private: false }]);
    const response = await fetch(`${baseUrl}/api/friends/8`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([{ id: 8, user_name: 'friend', private: false }]);
    expect(prisma.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, user_name: true, private: true },
      }),
    );
    for (const row of body) {
      expect(row).not.toHaveProperty('email');
      expect(row).not.toHaveProperty('uid');
      expect(row).not.toHaveProperty('notification_token');
      expect(row).not.toHaveProperty('age');
    }
  });
});
