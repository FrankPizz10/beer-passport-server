// Ranked catalog search (S3).
//
// Why raw SQL lives here (do not "clean this up" into an ORM approximation):
// Prisma cannot express ts_rank_cd, websearch_to_tsquery, or pg_trgm
// similarity(). Ranking combines, in one query:
// 1. Full-text search over beers.search_vector (weighted tsvector populated
//    by the pilot migration: beer name A, brewery name B, style name C),
//    ranked with ts_rank_cd and queried with websearch_to_tsquery so
//    multi-word input behaves sensibly.
// 2. Trigram similarity on beer and brewery names, which is what makes the
//    misspelling case ("siera nevada") return the intended beer; it feeds
//    both a match path for rows with zero FTS rank and the final ordering.
// Final ordering: exact normalized name match, then name prefix, then FTS
// rank, then trigram similarity, then beer id (deterministic, which is what
// makes offset pagination stable). The FTS key is DESC NULLS LAST: a row
// whose search_vector is NULL (the state the migration README's refresh
// obligation exists to prevent) yields a NULL rank, and Postgres would
// otherwise sort NULLs first under DESC, ahead of real FTS matches (QA F3).
// All user input reaches the query only as bound parameters; filter IDs are
// validated integers before this runs.
import { PrismaClient } from '@prisma/client';
import { DiscoveryFilters, Pagination } from './validate';

export const TRIGRAM_FLOOR = 0.1;

export type SearchRow = {
  id: number;
  name: string;
  abv: number | null;
  cat_id: number | null;
  brewery_id: number | null;
  brewery_name: string | null;
  style_id: number | null;
  style_name: string | null;
  category_name: string | null;
};

export const searchBeers = async (
  prisma: PrismaClient,
  q: string,
  filters: DiscoveryFilters,
  pagination: Pagination,
): Promise<{ rows: SearchRow[]; total: number }> => {
  const offset = (pagination.page - 1) * pagination.pageSize;
  const rows = await prisma.$queryRaw<SearchRow[]>`
    SELECT b.id, b.name, b.abv, b.cat_id,
           b.brewery_id, br.name AS brewery_name,
           b.style_id, s.style_name AS style_name,
           c.cat_name AS category_name
    FROM beers b
    LEFT JOIN breweries br ON br.id = b.brewery_id
    LEFT JOIN styles s ON s.id = b.style_id
    LEFT JOIN categories c ON c.id = b.cat_id
    WHERE (${filters.styleId}::int IS NULL OR b.style_id = ${filters.styleId}::int)
      AND (${filters.breweryId}::int IS NULL OR b.brewery_id = ${filters.breweryId}::int)
      AND (${filters.categoryId}::int IS NULL OR b.cat_id = ${filters.categoryId}::int)
      AND (${q}::text = ''
        OR b.search_vector @@ websearch_to_tsquery('english', ${q}::text)
        OR similarity(b.name, ${q}::text) > ${TRIGRAM_FLOOR}
        OR similarity(COALESCE(br.name, ''), ${q}::text) > ${TRIGRAM_FLOOR})
    ORDER BY
      CASE WHEN ${q}::text = '' THEN b.name END ASC,
      (CASE WHEN ${q}::text <> '' AND lower(b.name) = lower(${q}::text) THEN 0 ELSE 1 END) ASC,
      (CASE WHEN ${q}::text <> '' AND lower(b.name) LIKE lower(${q}::text) || '%' THEN 0 ELSE 1 END) ASC,
      ts_rank_cd(b.search_vector, websearch_to_tsquery('english', ${q}::text)) DESC NULLS LAST,
      GREATEST(similarity(b.name, ${q}::text), similarity(COALESCE(br.name, ''), ${q}::text)) DESC,
      b.id ASC
    LIMIT ${pagination.pageSize} OFFSET ${offset}
  `;
  const countRows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM beers b
    LEFT JOIN breweries br ON br.id = b.brewery_id
    WHERE (${filters.styleId}::int IS NULL OR b.style_id = ${filters.styleId}::int)
      AND (${filters.breweryId}::int IS NULL OR b.brewery_id = ${filters.breweryId}::int)
      AND (${filters.categoryId}::int IS NULL OR b.cat_id = ${filters.categoryId}::int)
      AND (${q}::text = ''
        OR b.search_vector @@ websearch_to_tsquery('english', ${q}::text)
        OR similarity(b.name, ${q}::text) > ${TRIGRAM_FLOOR}
        OR similarity(COALESCE(br.name, ''), ${q}::text) > ${TRIGRAM_FLOOR})
  `;
  return { rows, total: Number(countRows[0].count) };
};
