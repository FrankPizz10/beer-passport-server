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
exports.getBeerById = exports.getBeerByCategory = exports.getAllBeers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllBeers = () => __awaiter(void 0, void 0, void 0, function* () {
    const beers = yield prisma.beers.findMany();
    // const beers = await prisma.$queryRaw(Prisma.sql`SELECT * FROM beers`);
    return beers.splice(0, 10);
});
exports.getAllBeers = getAllBeers;
const getBeerByCategory = (cat) => __awaiter(void 0, void 0, void 0, function* () {
    // Get category that contains cat
    const category = yield prisma.categories.findFirst({
        where: {
            cat_name: {
                contains: cat,
            },
        },
    });
    const id = category === null || category === void 0 ? void 0 : category.id;
    const beers = yield prisma.beers.findMany({
        where: {
            cat_id: {
                equals: id,
            },
        },
    });
    return beers.splice(0, 20);
});
exports.getBeerByCategory = getBeerByCategory;
const getBeerById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const beer = yield prisma.beers.findUnique({
        where: {
            id: id,
        },
        include: {
            category: true,
            style: true,
            brewery: true,
        },
    });
    return beer;
});
exports.getBeerById = getBeerById;
