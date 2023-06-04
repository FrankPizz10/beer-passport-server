import { getCategories } from '../../src/DBclient/gettableinfo';
import { categories } from '@prisma/client';
import { getAllBeers, getBeerByCategory, getBeerById } from '../../src/DBclient/beerclient';
import { MockContext, Context, createMockContext } from '../../context';
import {
  addUser,
  getLikedBeersByUserId,
  getTriedBeersByUserId,
  getUser,
  getUserBeerByUserIdAndBeerId,
  getUserBeersByUserId,
} from '../../src/DBclient/userclient';
import { server } from '../../src';

describe('DBClient', () => {
  let mockCtx: MockContext;
  let ctx: Context;
  beforeEach(() => {
    mockCtx = createMockContext();
    ctx = mockCtx as unknown as Context;
  });
  afterAll(done => {
    // Close the server and call `done` when it's closed
    server.close(done);
  });
  describe('DBClient.gettableinfo', () => {
    let categories: categories[];
    beforeAll(async () => {
      categories = await getCategories();
    });
    describe('getCategories', () => {
      it('should return all categories', () => {
        expect(categories.length).toBe(11);
        expect(categories[0].id).toBe(1);
        expect(categories[0].cat_name).toBe('British Ale');
      });
    });
  });
  describe('DBClient.beerclient', () => {
    describe('getAllBeers', () => {
      it('should return all beers', async () => {
        const beers = await getAllBeers();
        expect(beers.length).toBeGreaterThan(20);
        expect(beers[0].id).toBe(1);
      });
    });
    describe('getBeerByCategory', () => {
      it('should return all beers by category', async () => {
        const beers = await getBeerByCategory('Irish Ale');
        beers.sort((a, b) => a.id - b.id);
        expect(beers.length).toBe(20);
        expect(beers[0].id).toBe(30);
      });
    });
    describe('getBeerById', () => {
      it('should return a beer by id', async () => {
        const beer = await getBeerById(6);
        if (beer) {
          expect(beer.name).toBe('Winter Warmer');
        } else {
          throw new Error('beer is null');
        }
      });
    });
  });
  describe('DBClient.userclient', () => {
    describe('addUser', () => {
      it('should add a user', async () => {
        const user = {
          id: 1,
          uid: '123',
          email: 'mock1@gmail.com',
          age: 21,
          user_name: 'mock1',
        };
        mockCtx.prisma.users.create.mockResolvedValue(user);
        await expect(addUser(user, ctx)).resolves.toEqual(user);
        await expect(mockCtx.prisma.users.create).toBeCalledWith({
          data: {
            uid: user.uid,
            email: user.email,
            age: user.age,
            user_name: user.user_name,
          },
        });
      });
    });
    describe('getUser', () => {
      it('should get a user', async () => {
        const user = await getUser('xtCCTvpArfP4ZRzrjmzAyrVmO5A2');
        if (user) {
          expect(user.uid).toBe('xtCCTvpArfP4ZRzrjmzAyrVmO5A2');
          expect(user.email).toBe('f1@gmail.com');
          expect(user.age).toBe(23);
          expect(user.user_name).toBe('Frank_Pizz10');
        } else {
          throw new Error('user is null');
        }
      });
    });
    describe('getUserBeersByUserId', () => {
      it('should get all beers for a user', async () => {
        const userBeers = await getUserBeersByUserId(3);
        expect(userBeers.length).toBeGreaterThan(7);
        const targetBeer = userBeers.find(b => b.id === 16);
        if (targetBeer) {
          expect(targetBeer.beer_id).toBe(1);
          expect(targetBeer.user_id).toBe(3);
          expect(targetBeer.liked).toBe(false);
          expect(targetBeer.tried).toBe(false);
        } else {
          throw new Error('targetBeer is null');
        }
      });
    });
    describe('getUserBeerByUserIdAndBeerId', () => {
      it('should get all beers for a user', async () => {
        const user = await getUser('I8PXIyg7RwYE0HQmVBejgf7sHtd2');
        if (user) {
          const userBeer = await getUserBeerByUserIdAndBeerId(user.id, 1);
          if (userBeer) {
            expect(userBeer.id).toBe(3);
            expect(userBeer.beer_id).toBe(1);
            expect(userBeer.user_id).toBe(2);
            expect(userBeer.liked).toBe(false);
            expect(userBeer.tried).toBe(false);
          } else {
            throw new Error('userBeer is null');
          }
        } else {
          throw new Error('user is null');
        }
      });
    });
    describe('getTriedBeersByUserId', () => {
      it('should get all tried beers for a user', async () => {
        const userBeers = await getTriedBeersByUserId(3);
        const targetBeer = userBeers.find(b => b.id === 19);
        if (targetBeer) {
          expect(targetBeer.beer_id).toBe(4);
          expect(targetBeer.user_id).toBe(3);
          expect(targetBeer.liked).toBe(false);
          expect(targetBeer.tried).toBe(true);
        } else {
          throw new Error('targetBeer is null');
        }
      });
    });
    describe('getLikedBeersByUserId', () => {
      it('should get all liked beers for a user', async () => {
        const userBeers = await getLikedBeersByUserId(3);
        const targetBeer = userBeers.find(b => b.id === 25);
        if (targetBeer) {
          expect(targetBeer.beer_id).toBe(6);
          expect(targetBeer.user_id).toBe(3);
          expect(targetBeer.liked).toBe(true);
          expect(targetBeer.tried).toBe(true);
        } else {
          throw new Error('targetBeer is null');
        }
      });
    });
  });
});
