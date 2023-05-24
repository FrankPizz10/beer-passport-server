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
const gettableinfo_1 = require("../../src/DBclient/gettableinfo");
describe("DBClient.gettableinfo", () => {
    let categories;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        categories = yield (0, gettableinfo_1.getCategories)();
    }));
    describe("getCategories", () => {
        it("should return all categories", () => {
            expect(categories.length).toBe(11);
            expect(categories[0].id).toBe(1);
            expect(categories[0].cat_name).toBe("British Ale");
        });
    });
});
