/**
 * Unit tests for discovery request validation (implementation plan S1):
 * pagination bounds per the contract, and filter IDs validated as integers
 * and checked for existence (unknown filter ID is 400, never an empty 200).
 */
import { parsePagination, parseFilters } from '../../src/Discovery/validate';
import { ApiError } from '../../src/Discovery/errors';

const fakePrisma = (existing: { styles?: number; breweries?: number; categories?: number }) =>
  ({
    styles: {
      findUnique: jest.fn().mockResolvedValue(
        existing.styles !== undefined ? { id: existing.styles } : null,
      ),
    },
    breweries: {
      findUnique: jest.fn().mockResolvedValue(
        existing.breweries !== undefined ? { id: existing.breweries } : null,
      ),
    },
    categories: {
      findUnique: jest.fn().mockResolvedValue(
        existing.categories !== undefined ? { id: existing.categories } : null,
      ),
    },
  }) as never;

describe('parsePagination', () => {
  it('defaults to page 1, page_size 20', () => {
    expect(parsePagination({})).toEqual({ page: 1, pageSize: 20 });
  });
  it('accepts page_size 50', () => {
    expect(parsePagination({ page_size: '50' })).toEqual({ page: 1, pageSize: 50 });
  });
  it('rejects page_size above 50 with invalid_parameter', () => {
    try {
      parsePagination({ page_size: '51' });
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).code).toBe('invalid_parameter');
      expect((err as ApiError).message).toBe('page_size must be between 1 and 50.');
    }
  });
  it('rejects page 0 and non-integer page', () => {
    expect(() => parsePagination({ page: '0' })).toThrow(ApiError);
    expect(() => parsePagination({ page: '1.5' })).toThrow(ApiError);
  });
});

describe('parseFilters', () => {
  it('returns nulls when no filters are supplied', async () => {
    await expect(parseFilters(fakePrisma({}), {})).resolves.toEqual({
      styleId: null,
      breweryId: null,
      categoryId: null,
    });
  });
  it('accepts existing filter IDs', async () => {
    const prisma = fakePrisma({ styles: 32, breweries: 157, categories: 3 });
    await expect(
      parseFilters(prisma, { style_id: '32', brewery_id: '157', category_id: '3' }),
    ).resolves.toEqual({ styleId: 32, breweryId: 157, categoryId: 3 });
  });
  it('rejects an unknown style_id with 400', async () => {
    await expect(parseFilters(fakePrisma({}), { style_id: '99999' })).rejects.toMatchObject({
      status: 400,
      code: 'invalid_parameter',
    });
  });
  it('rejects a non-integer brewery_id with 400', async () => {
    await expect(parseFilters(fakePrisma({}), { brewery_id: 'abc' })).rejects.toMatchObject({
      status: 400,
      code: 'invalid_parameter',
    });
  });
  it('rejects a style_id above the Postgres int4 range with 400, before any lookup (QA F1)', async () => {
    const prisma = fakePrisma({});
    await expect(
      parseFilters(prisma, { style_id: '99999999999999999999' }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'invalid_parameter',
    });
    const stylesFindUnique = (
      prisma as unknown as { styles: { findUnique: jest.Mock } }
    ).styles.findUnique;
    expect(stylesFindUnique).not.toHaveBeenCalled();
  });
  it('rejects a category_id just above the int4 max with 400, before any lookup (QA F1)', async () => {
    const prisma = fakePrisma({});
    await expect(parseFilters(prisma, { category_id: '2147483648' })).rejects.toMatchObject({
      status: 400,
      code: 'invalid_parameter',
    });
    const categoriesFindUnique = (
      prisma as unknown as { categories: { findUnique: jest.Mock } }
    ).categories.findUnique;
    expect(categoriesFindUnique).not.toHaveBeenCalled();
  });
  it('accepts the int4 max as a filter ID when it exists (QA F1 boundary)', async () => {
    const prisma = fakePrisma({ styles: 2147483647 });
    await expect(parseFilters(prisma, { style_id: '2147483647' })).resolves.toEqual({
      styleId: 2147483647,
      breweryId: null,
      categoryId: null,
    });
  });
});
