"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLikedBeersByUserId = exports.getTriedBeersByUserId = exports.getUserBeerByUserIdAndBeerId = exports.getUserBeersByUserId = exports.updateOrCreateUserBeers = exports.getUser = exports.addUser = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const beerclient_1 = require("./beerclient");
const prisma = new client_1.PrismaClient();
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma.users.findMany();
    return users;
});
exports.getAllUsers = getAllUsers;
const addUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const newUser = yield prisma.users.create({
        data: {
            uid: user.uid,
            email: user.email,
            age: user.age,
            user_name: user.user_name,
        },
    });
    yield addAllNewUserBeers(newUser.id);
    return newUser;
});
exports.addUser = addUser;
const addAllNewUserBeers = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const beers = yield (0, beerclient_1.getAllBeers)();
    yield Promise.all(beers.map((beer) => __awaiter(void 0, void 0, void 0, function* () {
        return (0, exports.updateOrCreateUserBeers)(user_id, beer.id, false, false);
    })));
});
const getUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma.users.findUnique({
        where: {
            uid: id,
        },
    });
    return user;
});
exports.getUser = getUser;
const updateOrCreateUserBeers = (user_id, beer_id, tried, liked) => __awaiter(void 0, void 0, void 0, function* () {
    const triedBeer = yield prisma.user_beers.upsert({
        where: {
            user_id_beer_id: {
                user_id: user_id,
                beer_id: beer_id,
            },
        },
        update: {
            tried: tried,
            liked: liked,
        },
        create: {
            user_id: user_id,
            beer_id: beer_id,
            tried: tried,
            liked: liked,
        },
    });
    return triedBeer;
});
exports.updateOrCreateUserBeers = updateOrCreateUserBeers;
const getUserBeersByUserId = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const userBeers = yield prisma.user_beers.findMany({
        where: {
            user_id: id,
        },
    });
    return userBeers;
});
exports.getUserBeersByUserId = getUserBeersByUserId;
const getUserBeerByUserIdAndBeerId = (user_id, beer_id) => __awaiter(void 0, void 0, void 0, function* () {
    const userBeer = yield prisma.user_beers.findUnique({
        where: {
            user_id_beer_id: {
                user_id: user_id,
                beer_id: beer_id,
            },
        },
    });
    return userBeer;
});
exports.getUserBeerByUserIdAndBeerId = getUserBeerByUserIdAndBeerId;
const getTriedBeersByUserId = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const triedBeers = yield prisma.user_beers.findMany({
        where: {
            user_id: id,
            tried: true,
        },
    });
    return triedBeers;
});
exports.getTriedBeersByUserId = getTriedBeersByUserId;
const getLikedBeersByUserId = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const likedBeers = yield prisma.user_beers.findMany({
        where: {
            user_id: id,
            liked: true,
        },
    });
    return likedBeers;
});
exports.getLikedBeersByUserId = getLikedBeersByUserId;
