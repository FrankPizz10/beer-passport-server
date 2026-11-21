/**
 * Registration identity-binding tests (Phase 0, QA finding F-1).
 *
 * Runs the real src/Routes/users.ts router over HTTP with the database
 * mocked. The stub middleware stands in for decodeUserToken and provides
 * the verified token uid as res.locals.firebaseUid, exactly as the updated
 * middleware does for an unregistered caller.
 *
 * Contract: POST /api/users must create the profile for the token's uid.
 * A body uid that differs from the token uid is rejected with 403 and no
 * row is created (uid squatting regression test).
 */
import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import userRoutes from '../../src/Routes/users';
import { prismaCtx } from '../../src/index';

jest.mock('../../src/index', () => ({
  prismaCtx: {
    prisma: {
      users: { create: jest.fn(), findUnique: jest.fn() },
    },
  },
}));
jest.mock('../../src/DBclient/userclient', () => ({
  deleteUser: jest.fn(),
  getAllUserBasicInfo: jest.fn(),
  updateUserEmail: jest.fn(),
}));
jest.mock('../../src/Utils', () => ({
  checkValidUserName: jest.fn(() => true),
}));

const prisma = prismaCtx.prisma as unknown as {
  users: { create: jest.Mock; findUnique: jest.Mock };
};

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  // Stand-in for decodeUserToken on the registration path: verified token
  // for Firebase uid 'caller-uid', no database row yet.
  app.use((req, res, next) => {
    res.locals.firebaseUid = 'caller-uid';
    res.locals.user = null;
    next();
  });
  app.use(userRoutes);
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
});

const postUser = (body: Record<string, unknown>) =>
  fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/users', () => {
  it('creates the profile bound to the token uid when the body uid matches', async () => {
    prisma.users.create.mockResolvedValue({
      id: 11,
      uid: 'caller-uid',
      email: 'new@example.com',
      age: 30,
      user_name: 'newuser',
    });
    const response = await postUser({
      uid: 'caller-uid',
      email: 'new@example.com',
      age: 30,
      user_name: 'newuser',
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.uid).toBe('caller-uid');
    expect(prisma.users.create).toHaveBeenCalledWith({
      data: {
        uid: 'caller-uid',
        email: 'new@example.com',
        age: 30,
        user_name: 'newuser',
      },
    });
  });

  it('rejects registering with another user\'s uid and creates no row (F-1 regression)', async () => {
    const response = await postUser({
      uid: 'victim-uid',
      email: 'attacker@example.com',
      age: 25,
      user_name: 'squatter',
    });
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ Error: 'uid does not match the authenticated user' });
    expect(prisma.users.create).not.toHaveBeenCalled();
  });

  it('keeps the existing 400 for missing fields', async () => {
    const response = await postUser({ uid: 'caller-uid', user_name: 'newuser' });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ Error: 'Missing uid, email, age, or user_name' });
    expect(prisma.users.create).not.toHaveBeenCalled();
  });
});
