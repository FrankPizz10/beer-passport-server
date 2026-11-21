// Null serialization for the discovery contract. One module owns the
// convention so it cannot drift between handlers:
// - stored 0 or absent ABV / IBU / SRM means "unknown" and serializes as null
//   (0 IBU is a false statement about a real beer; see API_CONTRACT.md).
// - empty-string text serializes as null.
// - missing relations serialize as null objects, never omitted keys.

export const unknownNumber = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined || value === 0) return null;
  return value;
};

export const emptyToNull = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined || value === '') return null;
  return value;
};

export type NamedRef = { id: number; name: string };

export const breweryRef = (
  brewery: { id: number; name: string } | null | undefined,
): NamedRef | null => (brewery ? { id: brewery.id, name: brewery.name } : null);

export const styleRef = (
  style: { id: number; style_name: string } | null | undefined,
): NamedRef | null => (style ? { id: style.id, name: style.style_name } : null);

export const categoryRef = (
  category: { id: number; cat_name: string } | null | undefined,
): NamedRef | null => (category ? { id: category.id, name: category.cat_name } : null);

export type ImageFields = {
  image_url: string | null;
  image_kind: 'product' | 'category' | 'initials';
  image_provenance: {
    tier: string;
    source_type: string;
    license_type: string;
    attribution: string;
    license_url: string;
  } | null;
};

export type BeerRelations = {
  brewery?: { id: number; name: string } | null;
  style?: { id: number; style_name: string } | null;
  category?: { id: number; cat_name: string } | null;
};

export type BeerCore = {
  id: number;
  name: string;
  abv: number | null;
} & BeerRelations;

// The beverage summary shape shared by search results and the browse
// endpoint's newest_additions shelf.
export const beverageSummary = (beer: BeerCore, image: ImageFields) => ({
  id: beer.id,
  name: beer.name,
  brewery: breweryRef(beer.brewery),
  style: styleRef(beer.style),
  category: categoryRef(beer.category),
  abv: unknownNumber(beer.abv),
  image_url: image.image_url,
  image_kind: image.image_kind,
});
