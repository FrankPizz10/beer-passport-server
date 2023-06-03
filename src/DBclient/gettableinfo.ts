import { prismaCtx } from "..";
import { Context } from "../../context";

export const getCategories = async () => {
  const categories = await prismaCtx.prisma.categories.findMany();
  return categories;
};
