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
exports.getUserBeersByUserId = exports.updateOrCreateUserBeers = exports.getUser = exports.addUser = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
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
        },
    });
    return newUser;
});
exports.addUser = addUser;
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
