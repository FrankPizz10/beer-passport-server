# PR Notes: Mirror discovery hub + image-approval schema into the canonical server schema

Branch: `discovery/schema-mirror` (from `release/2.0` @ abfe159)
Repo: FrankPizz10/beer-passport-server
Companion PR: FrankPizz10/beer-passport-admin PR #24 (production readiness
fixes, branch `discovery/production-readiness-fixes`). The admin repo's
discovery hub work (PRs #16-#23) was built against a Prisma schema copy in
beer-passport-admin that ran ahead of this canonical schema; this PR brings
the canonical schema up to it so the drift gate passes again.

## Summary

`prisma/schema.prisma` now matches the admin repo's schema copy from the
first `generator client` line onward (the server file's own header comments
above that line are unchanged). The change is purely additive for existing
models: no existing field, type, default, index, or relation was altered
(verified field-by-field; the only rewritten lines in existing models are
whitespace realignment inside `beverage_images`).

One new migration, `prisma/migrations/20261123000001_discovery_hub_mirror/`,
carries the matching DDL.

## Exactly what was added

### `beverage_images` (shared catalog schema, admin migration 001)

Six columns:

- `reviewed_by Int?`
- `reviewed_by_uid String? @db.VarChar(128)`
- `reviewed_at DateTime?`
- `source_content_type String? @db.VarChar(100)`
- `source_checked_at DateTime?`
- `source_check_status String? @db.VarChar(20)`

Plus the foreign key `reviewed_by -> users(id)` (constraint
`fk_beverage_images_reviewed_by`) and the `reviewer` / `review_events`
relations.

### New model `image_review_events` (admin migration 001)

Append-only image approve/reject audit: `id`, `beverage_image_id`,
`beverage_id`, `action`, `from_status`, `to_status`, `admin_user_id`,
`admin_uid`, `note`, `created_at`; FKs to `beverage_images`
(`fk_image_review_events_image_id`) and `users`
(`fk_image_review_events_admin_user_id`); index on `beverage_image_id`
(`image_review_events_beverage_image_id_idx`).

### The 8 discovery models (admin migrations 002-005), copied exactly

- `discovery_batches` (002): `slug` unique, `bundle_sha256` unique.
- `discovery_candidates` (002 + 004): unique `(batch_id, candidate_key)`;
  indexes on `batch_id`, `origin_bucket`, `hold_reason`, `review_status`,
  `barcode`, `normalized_name`, `image_status_normalized`, `source`; FKs to
  `discovery_batches`, `beers` (`matched_beer_id`), self
  (`duplicate_of_candidate_id`), and (004) `image_decision`,
  `image_decision_fetch_id`, `image_decision_at` plus the FK to
  `discovery_image_fetches`
  (`fk_discovery_candidates_image_decision_fetch`).
- `discovery_candidate_pairs` (002): indexes on `batch_id`,
  `candidate_id`, `status`; FKs to batches, candidates (both sides),
  users (`decided_by`).
- `discovery_decisions` (003): indexes on `candidate_id`, `pair_id`,
  `created_at`; FKs to candidates, pairs, users.
- `discovery_image_fetches` (004): indexes on `candidate_id` and
  `(fetched_by, fetched_at)`; FKs to candidates, users.
- `discovery_image_decisions` (004): `fetch_id` UNIQUE; indexes on
  `candidate_id`, `decided_at`; FKs to candidates, fetches, users.
- `discovery_import_manifests` (005): `id` is the mf-format string PK;
  `sha256` unique; indexes on `batch_id`, `status`; FKs to batches,
  users (`built_by`, `approved_by`).
- `discovery_manifest_events` (005): indexes on `manifest_id`,
  `created_at`; FKs to manifests, users.

### Prisma-only back-relations (no SQL)

- `beers.discovery_matches`
- On `users`: `beverage_images_reviewed`, `image_review_events`,
  `discovery_pairs_decided`, `discovery_decisions_decided`,
  `discovery_image_fetches`, `discovery_image_decisions`,
  `discovery_manifests_built`, `discovery_manifests_approved`,
  `discovery_manifest_events`.

## The migration

`prisma/migrations/20261123000001_discovery_hub_mirror/migration.sql`
(356 lines) was generated with `prisma migrate diff
--from-schema-datamodel <release/2.0 schema> --to-schema-datamodel <new
schema> --script` using the admin repo's installed Prisma 4.14.0 binary
(the same version this repo pins) with the locally cached engines
(`PRISMA_MIGRATION_ENGINE_BINARY`, `PRISMA_QUERY_ENGINE_LIBRARY`), because
engine downloads are blocked in this environment.

Sanity-checked by hand:

- 9 `CREATE TABLE` statements (the 9 new models above).
- `beverage_images` gains exactly the 6 columns plus the
  `fk_beverage_images_reviewed_by` constraint; it is the only pre-existing
  table altered.
- 28 `CREATE INDEX` / `CREATE UNIQUE INDEX` statements.
- No destructive statements: no `DROP TABLE`, `DROP COLUMN`,
  `DROP CONSTRAINT`, `DROP INDEX`, `DELETE FROM`, or `TRUNCATE` anywhere
  (the only "DELETE" strings are `ON DELETE NO ACTION` FK clauses).

## Migration order

This server migration and the admin repo's migrations 001-005 describe the
SAME database changes from two repos. A production database must receive
that DDL exactly once, through one path:

- The canonical path is this server migration, since production was built
  from the server schema.
- The admin migrations remain the rehearsal/operator path used by the
  disposable harnesses.
- Never apply both to the same database.

## Verification

All run locally in the clone on 2026-11-23 (ET); nothing pushed, merged,
or deployed.

- Drift gate: `PILOT_SCHEMA=~/workspace/server-mirror-work/prisma/schema.prisma
  bash scripts/check-schema-drift.sh` from the admin repo's `server/`
  exits 0 with "Schema copy is in sync with the pilot schema." (Before
  this change it exited 1 with a 330-line diff.)
- `prisma validate --schema prisma/schema.prisma` (admin repo's Prisma
  4.14.0 binary, dummy `DATABASE_URL` set): "The schema ... is valid",
  exit 0.
- Server test suite: `npm ci` (1001 packages), `prisma generate` with
  the cached engines, then `npm test`: 8 suites passed, 3 skipped,
  77 tests passed, 21 skipped, 0 failed. A baseline control run against
  the unmodified `release/2.0` schema in the same environment produced
  identical results (8 passed / 3 skipped suites, 77 passed / 21 skipped
  tests), so the mirror introduces no regression.
  - Note: a first `prisma generate` attempt without the cached-engine
    env vars failed on a blocked engine download (socket hang up to
    binaries.prisma.sh) and left a stale client, which made 4 suites
    fail to compile. That was an environment artifact, not a schema
    problem; with the cached engines the suite is fully green on both
    schemas.
