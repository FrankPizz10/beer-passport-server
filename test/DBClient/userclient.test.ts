import { prismaMock } from '../../singleton';
import * as userClient from '../../src/DBclient/userclient';
import * as userBadgeClient from '../../src/DBclient/userBadgeClient';
import * as getTableInfo from '../../src/DBclient/gettableinfo';
import { UserBadge } from '../../src/DBclient/userBadgeClient';
import { NotificationType } from '@prisma/client';

describe('UserClient Test', () => {
  const generateUsers = (length: number) =>
    Array.from({ length }, (_, i) => ({
      id: i + 1,
      uid: `uid${i + 1}`,
      notification_token: `token${i + 1}`,
      age: 21,
      email: `test${i + 1}@gmail.com`,
      user_name: `Test${i + 1}`,
      private: false,
    }));
  const generateUserBeersForUser = (length: number, userId: number) =>
    Array.from({ length }, (_, i) => ({
      id: i + 1,
      user_id: userId,
      beer_id: i + 1,
      liked: true,
      created_at: new Date(),
      updated_at: new Date(),
    }));
  test('getAllUsers', async () => {
    const users = generateUsers(5);
    prismaMock.users.findMany.mockResolvedValue(users);
    const result = await userClient.getAllUsers();
    expect(result).toEqual(users);
  });

  test('getAllUserBasicInfo', async () => {
    const users = generateUsers(5);
    prismaMock.users.findMany.mockResolvedValue(users);
    await expect(userClient.getAllUserBasicInfo()).resolves.toEqual(users);
    expect(prismaMock.users.findMany).toHaveBeenCalledWith({
      select: {
        user_name: true,
        id: true,
        private: true,
      },
    });
  });

  test('getUserByUid', async () => {
    const user = generateUsers(1)[0];
    prismaMock.users.findUnique.mockResolvedValue(user);
    const result = await userClient.getUserByUid(user.uid);
    expect(result).toEqual(user);
    expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
      where: {
        uid: user.uid,
      },
    });
  });

  test('getUserByUid error', async () => {
    const user = generateUsers(1)[0];
    prismaMock.users.findUnique.mockRejectedValue(new Error('Error fetching user'));
    await expect(userClient.getUserByUid(user.uid)).rejects.toThrow('Error fetching user');
    expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
      where: {
        uid: user.uid,
      },
    });
  });

  test('getUserById', async () => {
    const user = generateUsers(1)[0];
    prismaMock.users.findUnique.mockResolvedValue(user);
    const result = await userClient.getUserById(user.id);
    expect(result).toEqual(user);
    expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
      where: {
        id: user.id,
      },
    });
  });

  test('getUserById error', async () => {
    const user = generateUsers(1)[0];
    prismaMock.users.findUnique.mockRejectedValue(new Error('Error fetching user'));
    await expect(userClient.getUserById(user.id)).rejects.toThrow('Error fetching user');
    expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
      where: {
        id: user.id,
      },
    });
  });

  test('getUserBeersByUserId', async () => {
    const user = generateUsers(1)[0];
    const userBeers = generateUserBeersForUser(5, user.id);
    prismaMock.user_beers.findMany.mockResolvedValue(userBeers);
    const result = await userClient.getUserBeersByUserId(user.id);
    expect(result).toEqual(userBeers);
    expect(prismaMock.user_beers.findMany).toHaveBeenCalledWith({
      where: {
        user_id: user.id,
      },
    });
  });

  test('getUserBeerByUserIdAndBeerId', async () => {
    const user = generateUsers(1)[0];
    const userBeer = generateUserBeersForUser(1, user.id)[0];
    prismaMock.user_beers.findUnique.mockResolvedValue(userBeer);
    const result = await userClient.getUserBeerByUserIdAndBeerId(user.id, userBeer.beer_id);
    expect(result).toEqual(userBeer);
    expect(prismaMock.user_beers.findUnique).toHaveBeenCalledWith({
      where: {
        user_id_beer_id: {
          user_id: user.id,
          beer_id: userBeer.beer_id,
        },
      },
    });
  });

  test('getTriedBeersByUserId', async () => {
    const user = generateUsers(1)[0];
    const userBeers = generateUserBeersForUser(5, user.id);
    prismaMock.user_beers.findMany.mockResolvedValue(userBeers);
    const result = await userClient.getTriedBeersByUserId(user.id);
    expect(result).toEqual(userBeers);
    expect(prismaMock.user_beers.findMany).toHaveBeenCalledWith({
      where: {
        user_id: user.id,
      },
      include: {
        beers: true,
      },
    });
  });

  test('getLikedBeersByUserId', async () => {
    const user = generateUsers(1)[0];
    const userBeers = generateUserBeersForUser(5, user.id);
    prismaMock.user_beers.findMany.mockResolvedValue(userBeers);
    const result = await userClient.getLikedBeersByUserId(user.id);
    expect(result).toEqual(userBeers);
    expect(prismaMock.user_beers.findMany).toHaveBeenCalledWith({
      where: {
        user_id: user.id,
        liked: true,
      },
      include: {
        beers: true,
      },
    });
  });

  test('getLikedBeersByUserId', async () => {
    const user = generateUsers(1)[0];
    const userBeers = generateUserBeersForUser(5, user.id);
    prismaMock.user_beers.findMany.mockResolvedValue(userBeers);
    const result = await userClient.getLikedBeersByUserId(user.id);
    expect(result).toEqual(userBeers);
    expect(prismaMock.user_beers.findMany).toHaveBeenCalledWith({
      where: {
        user_id: user.id,
        liked: true,
      },
      include: {
        beers: true,
      },
    });
  });

  const generateFriends = (length: number, userId = 1) =>
    Array.from({ length }, (_, i) => ({
      id: i + 1,
      user_1: userId,
      user_2: i + 1,
      created_at: new Date(),
      updated_at: new Date(),
    }));

  test('getFriendsByUserId', async () => {
    const user = generateUsers(1)[0];
    const friends = generateFriends(5);
    prismaMock.friends.findMany.mockResolvedValue(friends);
    const result = await userClient.getFriendsByUserId(user.id);
    expect(result).toEqual(friends);
    expect(prismaMock.friends.findMany).toHaveBeenCalledWith({
      where: {
        user_1: user.id,
      },
      include: {
        users_friends_user_2Tousers: true,
      },
    });
  });

  test('deleteUser', async () => {
    const user = generateUsers(1)[0];
    prismaMock.users.delete.mockResolvedValue(user);
    const result = await userClient.deleteUser(user.uid);
    expect(result).toEqual(user);
    expect(prismaMock.users.delete).toHaveBeenCalledWith({
      where: {
        uid: user.uid,
      },
    });
  });

  test('addFriend', async () => {
    const user1Id = 1;
    const user2Id = 2;
    const friend = generateFriends(1, user1Id)[0];
    prismaMock.friends.create.mockResolvedValue(friend);
    const result = await userClient.addFriend(user1Id, user2Id);
    expect(result).toEqual(friend);
    expect(prismaMock.friends.create).toHaveBeenCalledWith({
      data: {
        user_1: user1Id,
        user_2: user2Id,
      },
    });
  });

  test('updateOrCreateUserBeer', async () => {
    const user = generateUsers(1)[0];
    const userBeer = generateUserBeersForUser(1, user.id)[0];
    const currentDate = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);
    const collection = {
      id: 1,
      name: 'name',
      difficulty: 3,
      description: 'description',
      created_at: currentDate,
      updated_at: currentDate,
      collection_beers: [
        {
          beer_id: userBeer.beer_id,
        },
      ],
    };
    const newUserBadges: UserBadge[] = [
      {
        id: 'id1',
        user_id: user.id,
        earned: true,
        progress: 1,
        updated_at: currentDate,
        collection: {
          id: 1,
          name: collection.name,
          difficulty: collection.difficulty,
          description: collection.description,
        },
      },
    ];
    prismaMock.user_beers.upsert.mockResolvedValue(userBeer);
    const calcCollectionProgressionForUserBeerMock = jest.spyOn(
      userBadgeClient,
      'calcCollectionProgressionForUserBeer',
    );
    calcCollectionProgressionForUserBeerMock.mockResolvedValue(newUserBadges);
    const result = await userClient.updateOrCreateUserBeer(
      userBeer.user_id,
      userBeer.beer_id,
      userBeer.liked,
    );
    expect(result).toEqual(userBeer);
    expect(prismaMock.user_beers.upsert).toHaveBeenCalledWith({
      where: {
        user_id_beer_id: {
          user_id: userBeer.user_id,
          beer_id: userBeer.beer_id,
        },
      },
      update: {
        liked: userBeer.liked,
        updated_at: userBeer.updated_at,
      },
      create: {
        user_id: userBeer.user_id,
        beer_id: userBeer.beer_id,
        liked: userBeer.liked,
      },
    });
  });

  test('sendNotifications', async () => {
    const user = generateUsers(1)[0];
    const userBeer = generateUserBeersForUser(1, user.id)[0];
    const currentDate = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);
    const collection = {
      id: 1,
      name: 'name',
      difficulty: 3,
      description: 'description',
      created_at: currentDate,
      updated_at: currentDate,
      collection_beers: [
        {
          beer_id: userBeer.beer_id,
        },
      ],
    };
    const notification = {
      id: 1,
      user_id: user.id,
      type: NotificationType.BADGE_EARNED,
      message: `You earned the ${collection.name} badge!`,
      created_at: currentDate,
      updated_at: currentDate,
      viewed: false,
    };
    const newUserBadges: UserBadge[] = [
      {
        id: 'id1',
        user_id: user.id,
        earned: true,
        progress: 1,
        updated_at: currentDate,
        collection: {
          id: 1,
          name: collection.name,
          difficulty: collection.difficulty,
          description: collection.description,
        },
      },
    ];
    const calcCollectionProgressionForUserBeerMock = jest.spyOn(
      userBadgeClient,
      'calcCollectionProgressionForUserBeer',
    );
    calcCollectionProgressionForUserBeerMock.mockResolvedValue(newUserBadges);
    prismaMock.collections.findUnique.mockResolvedValue(collection);
    prismaMock.notifications.upsert.mockResolvedValue(notification);
    await userClient.sendNotifications(userBeer.user_id, userBeer.beer_id);
    expect(prismaMock.collections.findUnique).toHaveBeenCalledWith({
      where: {
        id: collection.id,
      },
    });
    expect(prismaMock.notifications.upsert).toHaveBeenCalledWith({
      where: {
        user_id_message: {
          user_id: userBeer.user_id,
          message: `You earned the ${collection.name} badge!`,
        },
      },
      update: {
        updated_at: currentDate,
        viewed: false,
      },
      create: {
        user_id: userBeer.user_id,
        type: NotificationType.BADGE_EARNED,
        message: `You earned the ${collection.name} badge!`,
      },
    });
    expect(calcCollectionProgressionForUserBeerMock).toHaveBeenCalledWith(
      userBeer.user_id,
      userBeer.beer_id,
    );
    calcCollectionProgressionForUserBeerMock.mockRestore();
  });

  test('calcUserBadgeProgress', async () => {
    const getCollectionProgressMock = jest.spyOn(userClient, 'getCollectionProgress');
    const getCollectionSizeMock = jest.spyOn(getTableInfo, 'getCollectionSize');
    getCollectionProgressMock.mockResolvedValue(1);
    getCollectionSizeMock.mockResolvedValue(2);
    const result = await userClient.calcUserBadgeProgress(1, 1);
    expect(result).toEqual(0.5);
    expect(getCollectionProgressMock).toHaveBeenCalledWith(1, 1);
    expect(getCollectionSizeMock).toHaveBeenCalledWith(1);

    getCollectionProgressMock.mockRestore();
    getCollectionSizeMock.mockRestore();
  });

  test('calcUserBadgeProgress repeating decimal', async () => {
    const getCollectionProgressMock = jest.spyOn(userClient, 'getCollectionProgress');
    const getCollectionSizeMock = jest.spyOn(getTableInfo, 'getCollectionSize');
    getCollectionProgressMock.mockResolvedValue(1);
    getCollectionSizeMock.mockResolvedValue(3);
    const result = await userClient.calcUserBadgeProgress(1, 1);
    expect(result).toEqual(0.33);
    expect(getCollectionProgressMock).toHaveBeenCalledWith(1, 1);
    expect(getCollectionSizeMock).toHaveBeenCalledWith(1);

    getCollectionProgressMock.mockRestore();
    getCollectionSizeMock.mockRestore();
  });

  test('calcUserBadgeProgress no progress', async () => {
    const getCollectionProgressMock = jest.spyOn(userClient, 'getCollectionProgress');
    const getCollectionSizeMock = jest.spyOn(getTableInfo, 'getCollectionSize');
    getCollectionProgressMock.mockResolvedValue(0);
    getCollectionSizeMock.mockResolvedValue(3);
    const result = await userClient.calcUserBadgeProgress(1, 1);
    expect(result).toEqual(0);
    expect(getCollectionProgressMock).toHaveBeenCalledWith(1, 1);
    expect(getCollectionSizeMock).toHaveBeenCalledWith(1);

    getCollectionProgressMock.mockRestore();
    getCollectionSizeMock.mockRestore();
  });

  test('calcUserBadgeProgress no size', async () => {
    const getCollectionProgressMock = jest.spyOn(userClient, 'getCollectionProgress');
    const getCollectionSizeMock = jest.spyOn(getTableInfo, 'getCollectionSize');
    getCollectionProgressMock.mockResolvedValue(1);
    getCollectionSizeMock.mockResolvedValue(0);
    await expect(userClient.calcUserBadgeProgress(1, 1)).rejects.toThrow('Collection size is 0');
    expect(getCollectionProgressMock).toHaveBeenCalledWith(1, 1);
    expect(getCollectionSizeMock).toHaveBeenCalledWith(1);

    getCollectionProgressMock.mockRestore();
    getCollectionSizeMock.mockRestore();
  });

  test('getUserBadgesByUserId', async () => {
    const user = generateUsers(1)[0];
    const userBadges = [
      {
        id: 1,
        user_id: user.id,
        collection_id: 1,
        earned: true,
        progress: 1,
        updated_at: new Date(),
        created_at: new Date(),
      },
    ];
    prismaMock.user_badges.findMany.mockResolvedValue(userBadges);
    const result = await userClient.getUserBadgesByUserId(user.id);
    expect(result).toEqual(userBadges);
    expect(prismaMock.user_badges.findMany).toHaveBeenCalledWith({
      where: {
        user_id: user.id,
      },
      include: {
        collections: true,
      },
    });
  });

  test('getCollectionProgress', async () => {
    const user = generateUsers(1)[0];
    const userBeers = generateUserBeersForUser(5, user.id);
    const collectionBeers = [
      {
        id: 1,
        collection_id: 1,
        beer_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        collection_id: 1,
        beer_id: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    prismaMock.collection_beers.findMany.mockResolvedValue(collectionBeers);
    prismaMock.user_beers.findMany.mockResolvedValue(userBeers);
    const result = await userClient.getCollectionProgress(user.id, 1);
    expect(result).toEqual(2);
    expect(prismaMock.collection_beers.findMany).toHaveBeenCalledWith({
      where: {
        collection_id: 1,
      },
    });
    expect(prismaMock.user_beers.findMany).toHaveBeenCalledWith({
      where: {
        user_id: user.id,
      },
    });
  });
});
