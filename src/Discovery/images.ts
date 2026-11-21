// TD-7 image fallback resolver, shared by all discovery endpoints.
// Resolution order:
// 1. An approved beverage_images row for the beer: image_kind "product",
//    with the provenance object derived from the row's columns.
// 2. A category illustration from the static map below: image_kind
//    "category". The illustration assets are a design deliverable that does
//    not exist yet, so the map is intentionally empty for the pilot and the
//    resolver falls through, which is the correct pilot behavior.
// 3. image_url null, image_kind "initials", image_provenance null; the
//    client renders the initials treatment.
// During the pilot beverage_images is unpopulated, so nearly every response
// exercises step 3; the resolver is built in full so Milestone 2 images
// upgrade responses in place with no client change.
import { PrismaClient } from '@prisma/client';
import { ImageFields } from './serialize';

const CATEGORY_ILLUSTRATIONS: Record<number, string> = {};

type ImageRow = {
  beverage_id: number;
  source_type: string;
  source_url: string;
  storage_key: string;
  license_type: string;
  attribution: string;
  license_url: string;
};

// Provenance tier derived server-side from the license (contract decision 3,
// work proceeded on the contract default): openly licensed or public domain
// is A; a license string that reserves rights is C; anything else (a real
// image whose rights are not clearly open) is B.
export const deriveTier = (licenseType: string): 'A' | 'B' | 'C' => {
  const license = (licenseType || '').toUpperCase();
  if (
    license.includes('CC0') ||
    license.includes('PUBLIC DOMAIN') ||
    license.startsWith('CC BY')
  ) {
    return 'A';
  }
  if (license.includes('ALL RIGHTS RESERVED') || license.includes('PROPRIETARY')) {
    return 'C';
  }
  return 'B';
};

const toImageFields = (row: ImageRow): ImageFields => ({
  image_url: row.storage_key.startsWith('http')
    ? row.storage_key
    : row.source_url || row.storage_key || null,
  image_kind: 'product',
  image_provenance: {
    tier: deriveTier(row.license_type),
    source_type: row.source_type,
    license_type: row.license_type,
    attribution: row.attribution,
    license_url: row.license_url,
  },
});

const fallbackFields = (categoryId: number | null | undefined): ImageFields => {
  const illustration =
    categoryId !== null && categoryId !== undefined
      ? CATEGORY_ILLUSTRATIONS[categoryId]
      : undefined;
  if (illustration) {
    return { image_url: illustration, image_kind: 'category', image_provenance: null };
  }
  return { image_url: null, image_kind: 'initials', image_provenance: null };
};

// Batch resolver: one beverage_images query for a whole page of beers.
export const resolveImages = async (
  prisma: PrismaClient,
  beers: { id: number; cat_id?: number | null }[],
): Promise<Map<number, ImageFields>> => {
  const result = new Map<number, ImageFields>();
  if (beers.length === 0) return result;
  const rows = await prisma.beverage_images.findMany({
    where: { beverage_id: { in: beers.map(b => b.id) }, status: 'approved' },
    orderBy: { id: 'asc' },
  });
  const byBeer = new Map<number, ImageRow>();
  for (const row of rows) {
    // Lowest id wins: the earliest approved image is the primary one.
    if (!byBeer.has(row.beverage_id)) byBeer.set(row.beverage_id, row);
  }
  for (const beer of beers) {
    const row = byBeer.get(beer.id);
    result.set(beer.id, row ? toImageFields(row) : fallbackFields(beer.cat_id));
  }
  return result;
};

export const resolveImage = async (
  prisma: PrismaClient,
  beer: { id: number; cat_id?: number | null },
): Promise<ImageFields> => {
  const map = await resolveImages(prisma, [beer]);
  return map.get(beer.id) as ImageFields;
};
