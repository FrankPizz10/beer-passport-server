import { Hash, createHash } from 'crypto';
import { prismaCtx } from '..';

interface UserBadge {
    id: string;
    user_id: number;
    earned: boolean;
    progress: number;
    updated_at: Date;
    collection: {
        id: number;
        name: string;
        difficulty: number;
        description: string;
    };
}

export const calculateCollectionProgress = async (userId: number): Promise<UserBadge[]> => {
    const [collections, userBeers] = await Promise.all([
        prismaCtx.prisma.collections.findMany({
            include: {
            collection_beers: true,
            },
        }),
        prismaCtx.prisma.user_beers.findMany({
            where: {
            user_id: userId,
            },
        }),
    ]);

    const collectionProgress: UserBadge[] = collections.map((collection) => {
        const collectionBeers = collection.collection_beers;
        const userBeersInCollection = userBeers.filter((userBeer) =>
            collectionBeers.some((collectionBeer) => collectionBeer.beer_id === userBeer.beer_id)
        );
        const progress = userBeersInCollection.length / collectionBeers.length;
        if (progress > 0) {
            return {
                id: createHash('sha256').update(`${userId}-${collection.id}`).digest('hex'),
                user_id: userId,
                earned: progress === 1,
                progress,
                updated_at: new Date(),
                collection: {
                    id: collection.id,
                    name: collection.name,
                    difficulty: collection.difficulty,
                    description: collection.description,
                },
            };
        }
        return null;
    }).filter(Boolean) as UserBadge[];

    return collectionProgress;
};

export const calcCollectionProgressionForUserBeer = async (user_id: number, beer_id: number): Promise<UserBadge[]> => {
    const collections = await prismaCtx.prisma.collections.findMany({
        include: {
        collection_beers: true,
        },
    });
    const userBeer = await prismaCtx.prisma.user_beers.findUnique({
        where: {
            user_id_beer_id: {
                beer_id,
                user_id,
            },
        },
    });
    const collectionProgress: UserBadge[] = collections.map((collection) => {
        const collectionBeers = collection.collection_beers;
        const userBeerInCollection = userBeer && collectionBeers.some((collectionBeer) => collectionBeer.beer_id === userBeer.beer_id);
        const progress = userBeerInCollection ? 1 : 0;
        if (progress > 0) {
            return {
                id: createHash('sha256').update(`${user_id}-${collection.id}`).digest('hex'),
                user_id,
                earned: true,
                progress,
                updated_at: new Date(),
                collection: {
                    id: collection.id,
                    name: collection.name,
                    difficulty: collection.difficulty,
                    description: collection.description,
                },
            };
        }
        return null;
    }).filter(Boolean) as UserBadge[];
    return collectionProgress;
}
