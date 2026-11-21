# Migration note: discovery search vector

`beers.search_vector` is populated by this migration only. It is a weighted
tsvector: beer name (A), brewery name (B), style name (C).

Obligation for the Milestone 2 import pipeline: any import that inserts or
updates beers, breweries, or styles must refresh `search_vector` for the
affected beers (same expression as in migration.sql), or search results
will silently miss the new rows on the full-text path (the trigram path on
names still finds them). The pilot catalog is static, so nothing refreshes
the column during the pilot.

Load-order note: the documented catalog load sequence applies migrations
before importing, and this migration's UPDATE only populates rows that
exist when it runs. After loading the catalog into a fresh database, run
`scripts/refresh-search-vector.sql` once (idempotent, same expression).

Index note: the three GIN indexes are created without CONCURRENTLY, which
takes a brief write lock on `beers` and `breweries`. That is harmless at
this catalog size on the static pilot database. For a production run
against a live database, create the indexes CONCURRENTLY outside the
migration transaction instead.

## Rollback

This migration is additive only: one extension, one nullable column, and
three indexes. It alters no existing column and deletes no data (the
one-time UPDATE only fills the new column). Prisma migrations have no
down step, so rollback is manual SQL, run in this order:

```sql
DROP INDEX IF EXISTS "beers_search_vector_idx";
DROP INDEX IF EXISTS "beers_name_trgm_idx";
DROP INDEX IF EXISTS "breweries_name_trgm_idx";
ALTER TABLE "beers" DROP COLUMN "search_vector";
```

Then remove the `search_vector` field from `prisma/schema.prisma` and mark
the migration as rolled back so the recorded history matches the database:

```sh
npx prisma migrate resolve --rolled-back 20261121000001_discovery_search
```

Drop the extension only if nothing else in the database uses it; check
before removing it, because other features may rely on pg_trgm:

```sql
DROP EXTENSION IF EXISTS pg_trgm;
```
