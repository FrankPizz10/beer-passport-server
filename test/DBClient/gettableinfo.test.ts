import { getCategories } from "../../src/DBclient/gettableinfo";
import { categories } from "@prisma/client";
import {
  getAllBeers,
  getBeerByCategory,
  getBeerById,
} from "../../src/DBclient/beerclient";
import { MockContext, Context, createMockContext } from "../../context";
import { addUser } from "../../src/DBclient/userclient";
import { server } from "../../src";

describe("DBClient", () => {
  let mockCtx: MockContext;
  let ctx: Context;
  beforeEach(() => {
    mockCtx = createMockContext();
    ctx = mockCtx as unknown as Context;
  });
  afterAll((done) => {
    // Close the server and call `done` when it's closed
    server.close(done);
  });
  describe("DBClient.gettableinfo", () => {
    let categories: categories[];
    beforeAll(async () => {
      categories = await getCategories();
    });
    describe("getCategories", () => {
      it("should return all categories", () => {
        expect(categories.length).toBe(11);
        expect(categories[0].id).toBe(1);
        expect(categories[0].cat_name).toBe("British Ale");
      });
    });
  });
  describe("DBClient.beerclient", () => {
    describe("getAllBeers", () => {
      it("should return all beers", async () => {
        const beers = await getAllBeers();
        expect(beers.length).toBeGreaterThan(20);
        expect(beers[0].id).toBe(1);
      });
    });
    describe("getBeerByCategory", () => {
      it("should return all beers by category", async () => {
        const beers = await getBeerByCategory("Irish Ale");
        beers.sort((a, b) => a.id - b.id);
        expect(beers.length).toBe(20);
        expect(beers[0].id).toBe(30);
      });
    });
    describe("getBeerById", () => {
      it("should return a beer by id", async () => {
        const beer = await getBeerById(6);
        expect(beer!.name).toBe("Winter Warmer");
      });
    });
  });
  describe("DBClient.userclient", () => {
    describe("addUser", () => {
      it("should add a user", async () => {
        const user = {
          id: 1,
          uid: "123",
          email: "mock1@gmail.com",
          age: 21,
          user_name: "mock1",
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
  });
});
