-- Discovery pilot: Postgres-native search support (implementation plan S3).
-- Adds the pg_trgm extension, a migration-populated weighted search vector
-- on beers, and the GIN indexes the ranked search query needs. The catalog
-- is static during the pilot (read-only; imports are explicit operations),
-- so populating the vector once here is sufficient. The Milestone 2 import
-- pipeline owns keeping search_vector current for rows it inserts or
-- updates; see this migration's README note in the server repo docs and the
-- discovery search service, which reads the column.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "beers" ADD COLUMN "search_vector" tsvector;

UPDATE "beers" b
SET "search_vector" =
  setweight(to_tsvector('english', b."name"), 'A') ||
  setweight(
    to_tsvector('english', COALESCE((SELECT "name" FROM "breweries" WHERE "id" = b."brewery_id"), '')),
    'B'
  ) ||
  setweight(
    to_tsvector('english', COALESCE((SELECT "style_name" FROM "styles" WHERE "id" = b."style_id"), '')),
    'C'
  );

CREATE INDEX "beers_search_vector_idx" ON "beers" USING GIN ("search_vector");
CREATE INDEX "beers_name_trgm_idx" ON "beers" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "breweries_name_trgm_idx" ON "breweries" USING GIN ("name" gin_trgm_ops);
