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

Schema rollback versus data rollback: this migration is additive only, one
extension, one nullable column, and three indexes. It alters no existing
column and deletes no data (the one-time UPDATE only fills the new
column), so there is no data rollback to perform: no pre-migration data
can be lost by rolling back, and no data restore is needed afterward.
Rolling back removes the `search_vector` column and its computed values
(schema rollback only); every catalog row and every other column is
untouched. The discovery search endpoint depends on the column and the
indexes, so it stops working until the migration is re-applied.

Prerequisites before rolling back:

- Take a database backup or snapshot first, as with any schema change.
- Stop or drain the application so nothing queries `search_vector` or the
  three indexes during the rollback.
- Connect with a role that owns the `beers` and `breweries` tables.
- Run the SQL in a single transaction where possible so a failure leaves
  the schema unchanged.

Prisma migrations have no down step, so rollback is manual SQL, run in
this order:

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

Post-rollback verification:

- `\d "beers"` shows no `search_vector` column, and the three index names
  no longer appear in `pg_indexes` for `beers` or `breweries`.
- Row counts are unchanged (the catalog baseline is 14 categories, 147
  styles, 1,339 breweries, 5,894 beers).
- `prisma migrate status` reports the migration as rolled back, matching
  the resolve step above, and `prisma validate` passes on the schema
  without the field.

Limitations:

- The rollback is manual; there is no automated down migration, and the
  steps above are the supported path.
- Restoring discovery search after a rollback means re-applying the
  migration and then running `scripts/refresh-search-vector.sql` so every
  row's `search_vector` is repopulated; the migration's UPDATE alone only
  covers rows present when it runs.
- Dropping the indexes removes the fast search paths; while rolled back,
  the trigram and full-text queries have no index support.
