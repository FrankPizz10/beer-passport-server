/**
 * Unit tests for the discovery serializer and the TD-7 image resolver
 * (implementation plan S1). The serializer owns the contract's null
 * conventions; the resolver owns the product / category / initials fallback.
 * Prisma is faked; no database.
 */
import { unknownNumber, emptyToNull, beverageSummary } from '../../src/Discovery/serialize';
import { deriveTier, resolveImage } from '../../src/Discovery/images';

describe('unknownNumber', () => {
  it('serializes stored 0 as null (unknown)', () => {
    expect(unknownNumber(0)).toBeNull();
  });
  it('serializes null and undefined as null', () => {
    expect(unknownNumber(null)).toBeNull();
    expect(unknownNumber(undefined)).toBeNull();
  });
  it('passes real values through', () => {
    expect(unknownNumber(9.0)).toBe(9.0);
    expect(unknownNumber(4.75)).toBe(4.75);
  });
});

describe('emptyToNull', () => {
  it('serializes empty string as null', () => {
    expect(emptyToNull('')).toBeNull();
  });
  it('passes real text through', () => {
    expect(emptyToNull('Milton')).toBe('Milton');
  });
});

describe('beverageSummary', () => {
  it('nulls missing relations and unknown abv, never omits keys', () => {
    const summary = beverageSummary(
      { id: 1, name: 'Orphan', abv: 0, brewery: null, style: null, category: null },
      { image_url: null, image_kind: 'initials', image_provenance: null },
    );
    expect(summary).toEqual({
      id: 1,
      name: 'Orphan',
      brewery: null,
      style: null,
      category: null,
      abv: null,
      image_url: null,
      image_kind: 'initials',
    });
  });
});

describe('deriveTier', () => {
  it('maps open licenses to A', () => {
    expect(deriveTier('CC BY-SA')).toBe('A');
    expect(deriveTier('CC0 1.0')).toBe('A');
    expect(deriveTier('Public Domain')).toBe('A');
  });
  it('maps rights-reserved to C and unclear to B', () => {
    expect(deriveTier('All Rights Reserved')).toBe('C');
    expect(deriveTier('')).toBe('B');
    expect(deriveTier('Brewery website photo')).toBe('B');
  });
});

describe('resolveImage', () => {
  it('falls back to initials when no approved image exists', async () => {
    const prisma = {
      beverage_images: { findMany: jest.fn().mockResolvedValue([]) },
    } as never;
    const result = await resolveImage(prisma, { id: 3951, cat_id: 3 });
    expect(result).toEqual({ image_url: null, image_kind: 'initials', image_provenance: null });
  });

  it('returns the product image with derived provenance when approved', async () => {
    const prisma = {
      beverage_images: {
        findMany: jest.fn().mockResolvedValue([
          {
            beverage_id: 3951,
            source_type: 'open_food_facts',
            source_url: 'https://images.example/3951.jpg',
            storage_key: '',
            license_type: 'CC BY-SA',
            attribution: 'Open Food Facts contributors',
            license_url: 'https://creativecommons.org/licenses/by-sa/3.0/',
          },
        ]),
      },
    } as never;
    const result = await resolveImage(prisma, { id: 3951, cat_id: 3 });
    expect(result.image_kind).toBe('product');
    expect(result.image_url).toBe('https://images.example/3951.jpg');
    expect(result.image_provenance).toEqual({
      tier: 'A',
      source_type: 'open_food_facts',
      license_type: 'CC BY-SA',
      attribution: 'Open Food Facts contributors',
      license_url: 'https://creativecommons.org/licenses/by-sa/3.0/',
    });
  });
});
