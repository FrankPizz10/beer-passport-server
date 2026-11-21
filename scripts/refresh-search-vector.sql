-- Refresh beers.search_vector after a catalog load. The discovery search
-- migration (20261121000001_discovery_search) populates the column for rows
-- that exist when it runs, but the documented catalog load sequence applies
-- migrations before importing, so a freshly loaded database needs this
-- idempotent refresh once after the import. Same expression as the
-- migration. From Milestone 2 on, the import pipeline owns this instead.
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
