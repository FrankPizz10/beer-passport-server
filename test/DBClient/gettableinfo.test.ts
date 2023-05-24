import { getCategories } from "../../src/DBclient/gettableinfo";
import { categories } from "@prisma/client";

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
