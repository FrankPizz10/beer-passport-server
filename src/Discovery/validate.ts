// Shared request validation for the discovery endpoints. Filter IDs are
// validated as integers and checked for existence (one indexed lookup per
// supplied filter) before any search work runs; an unknown filter ID is a
// client bug and returns 400, never an empty 200 (contract decision 5).
import { PrismaClient } from '@prisma/client';
import { invalidParameter } from './errors';

export type Pagination = { page: number; pageSize: number };

export const parsePagination = (query: Record<string, unknown>): Pagination => {
  const pageRaw = query.page;
  const sizeRaw = query.page_size;
  let page = 1;
  let pageSize = 20;
  if (pageRaw !== undefined) {
    page = Number(pageRaw);
    if (!Number.isInteger(page) || page < 1) {
      throw invalidParameter('page must be a positive integer.');
    }
  }
  if (sizeRaw !== undefined) {
    pageSize = Number(sizeRaw);
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
      throw invalidParameter('page_size must be between 1 and 50.');
    }
  }
  return { page, pageSize };
};

export type DiscoveryFilters = {
  styleId: number | null;
  breweryId: number | null;
  categoryId: number | null;
};

// The schema's ID columns are Postgres int4, so an ID above this bound can
// never exist. Rejecting it here keeps an out-of-range value from reaching
// Prisma, which would throw and surface as a 500 instead of the contract's
// 400 (QA finding F1).
export const MAX_INT4 = 2147483647;

const parseFilterId = (raw: unknown, name: string): number | null => {
  if (raw === undefined) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > MAX_INT4) {
    throw invalidParameter(`${name} must be a positive integer.`);
  }
  return value;
};

export const parseFilters = async (
  prisma: PrismaClient,
  query: Record<string, unknown>,
): Promise<DiscoveryFilters> => {
  const styleId = parseFilterId(query.style_id, 'style_id');
  const breweryId = parseFilterId(query.brewery_id, 'brewery_id');
  const categoryId = parseFilterId(query.category_id, 'category_id');
  if (styleId !== null) {
    const style = await prisma.styles.findUnique({
      where: { id: styleId },
      select: { id: true, archived_at: true },
    });
    if (!style || style.archived_at) throw invalidParameter(`style_id ${styleId} does not exist.`);
  }
  if (breweryId !== null) {
    const brewery = await prisma.breweries.findUnique({
      where: { id: breweryId },
      select: { id: true, archived_at: true },
    });
    if (!brewery || brewery.archived_at)
      throw invalidParameter(`brewery_id ${breweryId} does not exist.`);
  }
  if (categoryId !== null) {
    const category = await prisma.categories.findUnique({
      where: { id: categoryId },
      select: { id: true, archived_at: true },
    });
    if (!category || category.archived_at)
      throw invalidParameter(`category_id ${categoryId} does not exist.`);
  }
  return { styleId, breweryId, categoryId };
};
