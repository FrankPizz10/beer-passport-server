import { prismaMock } from '../../singleton';
import * as userClient from '../../src/DBclient/userclient';
import * as userBadgeClient from '../../src/DBclient/userBadgeClient';
import * as getTableInfo from '../../src/DBclient/gettableinfo';

describe('UserBadgeClient Tests', () => {
    test('getCollectionsAndUserBeers', async () => {
        const userId = 1;
        const collections = [{
            id: 1,
            name: 'Test',
            difficulty: 3,
            description: 'Test Collection',
            created_at: new Date(),
            updated_at: new Date()
        }]
        const user_beers = [{
            id: 1,
            user_id: userId,
            beer_id: 1,
            liked: false,
            created_at: new Date(),
            updated_at: new Date()
        }]
        prismaMock.collections.findMany.mockResolvedValue(collections);
        prismaMock.user_beers.findMany.mockResolvedValue(user_beers)
        const result = await userBadgeClient.getCollectionsAndUserBeers(userId)
        expect(result).toEqual([collections, user_beers]);
    });
});