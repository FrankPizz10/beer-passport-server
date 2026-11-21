/**
 * DBClient tests for the Phase 0 friends fixes in src/DBclient/userclient.ts.
 *
 *   - addFriend ordering normalization (QA F-6): the friends table carries
 *     the check constraint friends_user_order_check (user_1 < user_2), so
 *     the smaller id must be inserted as user_1 regardless of who called.
 *   - getFriendsByUserId projection (QA F-3): the nested friend user object
 *     must be limited to the approved fields { id, user_name, private },
 *     the exact field set of the mobile client's User type
 *     (beer-passport, Models/SQLData.ts). Email, Firebase uid, age, and the
 *     Expo notification_token must never be selected.
 *
 * Prisma is mocked through the src/index prismaCtx, as the existing test
 * setup intended. No live database.
 */
import { addFriend, getFriendsByUserId } from '../../src/DBclient/userclient';
import { prismaCtx } from '../../src/index';

jest.mock('../../src/index', () => ({
  prismaCtx: {
    prisma: {
      friends: { create: jest.fn(), findMany: jest.fn() },
    },
  },
}));
jest.mock('../../src/DBclient/gettableinfo', () => ({
  getCollectionSize: jest.fn(),
}));
jest.mock('../../src/DBclient/userBadgeClient', () => ({
  calcCollectionProgressionForUserBeer: jest.fn(),
}));

const prisma = prismaCtx.prisma as unknown as {
  friends: { create: jest.Mock; findMany: jest.Mock };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('addFriend ordering normalization (F-6)', () => {
  it('stores (caller, target) unchanged when the caller id is smaller', async () => {
    prisma.friends.create.mockResolvedValue({ id: 1, user_1: 3, user_2: 9 });
    await addFriend(3, 9);
    expect(prisma.friends.create).toHaveBeenCalledWith({
      data: { user_1: 3, user_2: 9 },
    });
  });

  it('swaps the pair when the caller id is larger, satisfying user_1 < user_2', async () => {
    prisma.friends.create.mockResolvedValue({ id: 2, user_1: 3, user_2: 9 });
    const friend = await addFriend(9, 3);
    expect(prisma.friends.create).toHaveBeenCalledWith({
      data: { user_1: 3, user_2: 9 },
    });
    expect(friend).toEqual({ id: 2, user_1: 3, user_2: 9 });
  });
});

describe('getFriendsByUserId projection (F-3)', () => {
  it('selects only id, user_name, private for the friend user object', async () => {
    prisma.friends.findMany.mockResolvedValue([]);
    await getFriendsByUserId(7);
    expect(prisma.friends.findMany).toHaveBeenCalledTimes(1);
    const args = prisma.friends.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ user_1: 7 });
    const select = args.include.users_friends_user_2Tousers.select;
    expect(Object.keys(select).sort()).toEqual(['id', 'private', 'user_name']);
    expect(select).toEqual({ id: true, user_name: true, private: true });
    // Sensitive fields must never be part of the projection.
    for (const field of ['email', 'uid', 'age', 'notification_token']) {
      expect(select).not.toHaveProperty(field);
    }
  });
});
