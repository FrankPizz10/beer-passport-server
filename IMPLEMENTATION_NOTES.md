# Phase 0 Server Hardening: Implementation Notes

Branch: `phase0/server-hardening` off `release/2.0` (beer-passport-server).
Implements `~/workspace/workstreams/server-ci-phase0/PHASE0_PLAN.md` as amended by the independent QA authorization matrix (`~/workspace/workstreams/authz-qa/AUTHZ_MATRIX.md`) and two orchestrator updates (2026-11-21). All source files were read from `release/2.0` through the GitHub connector before editing. Nothing was pushed; the orchestrator pushes this file set.

## Required orchestrator actions when creating the branch

1. **Regenerate `package-lock.json`.** `package.json` bumps the Prisma CLI (below) and `npm ci` (CI and the new Dockerfile) fails if the lockfile is out of sync. Run `npm install` once on the branch and commit the resulting lockfile change. No lockfile is included in this file set on purpose: the repo's real lockfile was not regenerated here, and a sandbox-generated one could re-pin unrelated transitive dependencies.
2. **Delete `test/DBClient/gettableinfo.test.ts`.** It is 100 percent commented out, and Jest fails a suite with zero tests, so `npm test` cannot go green while it exists. This follows the Phase 0 plan's recommendation to retire it and file DBClient mocked tests as follow-up work. (Original content preserved in `_reference/gettableinfo.test.ts.original` of the workstream folder, not part of the branch.)
3. The `_reference/` folder in the workstream directory is NOT part of the branch. It holds unchanged files fetched for context (index.ts, admins.ts, tsconfig, jest config, context.ts, the Prisma schema, userBadgeClient.ts, firebase.ts).

## What changed, per file

### package.json
- `prisma` devDependency 4.11.0 -> 4.14.0, matching `@prisma/client` 4.14.0 (plan Item 1). No major Prisma upgrade; that pairs with the M3 Node pin.
- Added `"build": "npx tsc"` (plain compile, no secrets) for the Docker image build. `build:prod` and the Sentry scripts are unchanged.
- No new test dependencies were needed: jest, ts-jest, jest-mock-extended, and express were already in the repo, and the HTTP-level tests use Node's built-in fetch against an ephemeral loopback port instead of adding supertest.

### src/Middleware/authUsers.ts (rewritten, P0.4 + F-1/F-2/F-8)
- All three middlewares now return real status codes with the **same JSON body shapes and message strings** as before:
  - Missing header, missing token, literal `undefined` token, malformed header: **401** `{message: 'Unauthorized'}`.
  - Invalid or expired token (Firebase errors with an `auth/` code, including `auth/id-token-expired`): **401** `{message: 'Unauthorized'}`.
  - Valid token without the `admin` claim on `decodeAdminToken`: **403** `{message: 'Unauthorized Admin'}`.
  - Wrong, revoked, or expired API key on `decodeAPIKey`: **401** `{message: 'Unauthorized'}`.
  - Genuine internal failures (non-auth verification errors, database errors): **500** with the existing `Auth Internal Error` / `Auth Admin Internal Error` messages.
- The verified token uid is exposed as `res.locals.firebaseUid` in both token middlewares (F-1 enabler; handlers previously could only see the database row).
- Unregistered-user contract (F-8, see Deviations): when the verified user has no database row, the middleware returns **401** on every route **except** `POST /api/users`, which is passed through with `res.locals.user = null` and `firebaseUid` set so registration can run. No handler can now receive a null user unknowingly.
- `compareAPIKeys` now skips keys whose `revoked` flag is set (F-2). The 3-month age rule is unchanged.

### src/DBclient/apikeysclient.ts (F-2)
- `getApiKeys` now maps and returns the `revoked` flag from the `api_keys` row (the column added by PR #39 was previously never read anywhere).

### src/Routes/users.ts (F-1)
- `POST /api/users` binds registration to the token: if `res.locals.firebaseUid` is absent the handler returns 401; if `req.body.uid` differs from it the handler returns **403** `{Error: 'uid does not match the authenticated user'}` and creates no row; the row is created with `uid: res.locals.firebaseUid`. Existing 400 validations and the `{Error: ...}` body shape of this router are unchanged.

### src/Routes/friends.ts (F-6 part 1, F-3)
- Self-add guard fixed: `Number(res.locals.user.id) === parseInt(req.params.user2)`. The old `number === string` comparison never fired.
- `GET /api/friends/:user2` (is-friend check) now selects only `id, user_name, private` instead of returning complete user rows (F-3, related endpoint with the same exposure).

### src/DBclient/userclient.ts (F-6 part 2, F-3)
- `addFriend` normalizes pair ordering: the smaller id is always inserted as `user_1`, satisfying the schema's `friends_user_order_check` (user_1 < user_2). Previously, adding a friend whose id was smaller than the caller's violated the check constraint and failed with a generic 400.
- `getFriendsByUserId` projects the nested friend user object to `{id, user_name, private}` instead of including the complete users row (F-3). Field evidence in the F-3 section below.

### Dockerfile (P0.2)
- Removed `COPY .env ./`. The build no longer contains or needs any secrets file.
- Install step is now `npm ci` (was `npm install`); build step is the new secret-free `npm run build` (was `npm run build:prod`).
- A comment block documents the Sentry flow: sourcemap inject/upload is a release-time step run outside the image build with the token supplied by the release environment (example given). `build:prod` still works unchanged for the current manual flow. Whether to keep or replace `build:prod` remains Frank's open decision (plan decision 1); the Dockerfile does not depend on the answer.
- The multi-stage build from the plan (Item 3, step 6, optional) was NOT done, to keep this diff reviewable; it is a clean follow-up.

### .dockerignore (P0.2)
- Added: `.env`, `.env.*`, `.git`, `.gitignore`, `dist`, `coverage`, `test`, `*.md`, `Dockerfile`, `.dockerignore`. Previously it excluded only `node_modules` and `npm-debug.log`, so the build context itself carried secrets even apart from the explicit COPY.

### Tests (all new)
- `test/Middleware/authUsers.test.ts` (24 tests): the full status-code matrix for the three middlewares, including no token, malformed headers (`Bearer` with nothing, no scheme), invalid token, expired token, non-admin 403, admin pass, unregistered-user 401, registration pass-through, database-error 500, wrong/revoked/expired API keys, and key-lookup 500. Firebase and the DB layer are mocked; no network, no live DB.
- `test/Routes/friends.test.ts` (4 tests, real router over loopback HTTP): self-add rejected 400 with `addFriend` never called (F-6 regression), normal add still works, non-numeric id still 400, and the is-friend check passes the approved field projection to Prisma (F-3).
- `test/Routes/users.test.ts` (3 tests, real router over loopback HTTP): registration with the token's own uid succeeds and creates the row for that uid; registration with another user's uid is rejected 403 with no row created (F-1 regression); the existing missing-fields 400 is preserved.
- `test/DBClient/userclient.test.ts` (3 tests): `addFriend(3, 9)` and `addFriend(9, 3)` both insert `{user_1: 3, user_2: 9}` (F-6); `getFriendsByUserId` selects exactly `id, user_name, private` and none of `email, uid, age, notification_token` (F-3).
- `test/ClientCompat/clientCompat.test.ts` (9 tests): the mobile compatibility suite, described in its own section below.
- `test/QA/crossUserChecklist.test.ts` (4 tests, all skipped): the F-4 private-profile items from QA's checklist, written to the recommended behavior and skipped because F-4 is DEFERRED (see below). They document the expected behavior for whoever implements it later.

## Separate commit: admins.ts UPC type fix (pre-existing PR #39 regression)

This fix ships as its own commit in the same pull request, separate from the Phase 0 security changes, at the CTO's direction (2026-11-21). It is not a Phase 0 finding and nothing else in `src/Routes/admins.ts` changes.

- **The defect:** in the beer create (line 101) and beer update (line 132) handlers, `upc` was assigned `parseInt(req.body.upc)`, a number. PR #39 changed `beers.upc` to `String?` (barcodes are identifiers, not quantities), so the assignment fails `tsc --noEmit` and Prisma would reject the number at runtime; the admin beer create and update endpoints are very likely broken on `release/2.0` today. Independent QA verified the two type errors reproduce on pristine `release/2.0` with all branch files reverted, so the regression predates this branch.
- **The fix:** `upc: req.body.upc != null ? String(req.body.upc) : null` in both places. The null guard is unchanged, so a missing upc still stores null; a present upc is now stored as the string the schema expects. Two one-line changes.
- **Why in this PR:** the new server CI runs `tsc --noEmit`; without the fix, this branch's CI goes red for a reason outside its diff, which trains everyone to ignore the gate.

## F-3: fields kept, and the mobile evidence for each

Consumers inspected in the beer-passport (mobile) repo on 2026-11-21:

- `Models/SQLData.ts` defines the client's `User` type as exactly `{ id: number; user_name: string; private: boolean }`, and its `Friend` type as the friends row (`id, user_1, user_2`) plus the two related user objects typed as that same `User`.
- `Models/Requests.ts`: `fetchFriends()` returns `Friend[]` from `GET /api/friends/`; `addFriend` / `removeFriend` return nothing the client reads.
- `screens/FriendScreen.tsx`: maps each friend row to `friend.users_friends_user_2Tousers` and reads only `.id` (card key and navigation target) and `.user_name` (card label).

Approved field set for the nested friend user object, and for the `GET /api/friends/:user2` response rows: **`id`, `user_name`, `private`**.
- `id`: used by FriendScreen for keys and navigation. Kept.
- `user_name`: used by FriendScreen as the display name. Kept.
- `private`: not read by FriendScreen today, but it is part of the client's declared `User` type and is already exposed by the server's other field-limited selects (`GET /api/users`, `GET /api/notfriends`). Kept for type compatibility.
- The friends row's own scalars (`id`, `user_1`, `user_2`) are unchanged: they are in the client's `Friend` type and describe the caller's own relationship, not the friend's private data.

Excluded, previously leaked by `GET /api/friends/` and `GET /api/friends/:user2`: `email`, Firebase `uid`, `age`, and `notification_token` (the Expo push token; the most sensitive, since friending is unilateral and a push token lets anyone send that device notifications). Regression tests assert these fields are never selected (DBClient suite) and that the route passes the projection through (friends route suite).

## F-4: OPEN finding, DEFERRED (not resolved, not implemented)

- **Status: DEFERRED by explicit CTO decision (2026-11-21), pending a separate product/privacy decision. This branch does not change the behavior.**
- Current behavior: `users.private` is settable and is surfaced by some reads, but no read path enforces it. Any authenticated user can read any other user's complete data from `GET /api/userbeers/:id`, `GET /api/triedbeers/:id`, `GET /api/likedbeers/:id` (all in `src/Routes/userbeers.ts`) and `GET /api/userbadges/:id` (`src/Routes/userbadges.ts`, whose own comment says it exists for reading friends' badges, with no friendship check either).
- Recommended future remediation (QA's direction): deny non-friends access to private profiles on all four routes (403, no data), with the exact friend/public rule confirmed by Frank as a product decision before implementation. The skipped tests in `test/QA/crossUserChecklist.test.ts` encode that expected behavior.
- Note the dependency QA flagged: friend-based rules should be built only after the friends storage model is trustworthy; this branch fixes the insert ordering (F-6), and the directional-read item below is the remaining piece.

## Test report

Per the repo testing guideline (what ran, where, result):

- **Where:** locally in the sandbox, in a scratch copy of the repo assembled from the `release/2.0` sources (`npm install` succeeded; Node v24, Jest 29 with the repo's existing ts-jest config and strict tsconfig). Changed source files were type-checked by ts-jest as part of the run.
- **Command:** `npx jest` (the repo's `npm test`).
- **Result: 43 passed, 4 skipped, 0 failed; 5 of 6 suites passed, 1 skipped** (the skipped suite and tests are the deferred F-4 checklist items). Breakdown: Middleware 24, ClientCompat 9, friends routes 4, users routes 3, DBClient 3.
- **Prisma:** `npx prisma validate` passes against the unchanged PR #39 schema (dummy `DATABASE_URL`; no database connection). The schema was not modified, so no migration diff is expected; QA should still run `prisma migrate diff` on the branch per the plan checklist.
- **Sandbox workarounds (not repo changes):** the Prisma CLI's own engine download is blocked by the sandbox egress proxy (socket hang up to binaries.prisma.sh), so the query and migration engines were fetched with curl and supplied via `PRISMA_QUERY_ENGINE_LIBRARY` / `PRISMA_MIGRATION_ENGINE_BINARY` to run `prisma generate` (client 4.14.0 generated cleanly). Four modules outside this branch's changed set (gettableinfo, Utils, sendNotifications stubs) were stubbed in the scratch copy only; the real `userBadgeClient.ts` was used. None of this affects the delivered files.
- **Not run:** the plan's Docker checks (`docker build` with no `.env` present, image layer inspection, container boot against local Postgres) and the live-server curl matrix. There is no Docker daemon in the sandbox. The curl matrix is covered at the middleware/router level by the suites above; QA should still run the Docker and live-server items on the branch per the plan's verification checklist.

## API behavior changes and mobile compatibility implications

Status-code changes (every error body keeps its exact pre-change shape and message strings, `{message: ...}` for middleware, `{Error: ...}` for the friends/users routers, with one exception: the retired `User not in database` string in the database-error row below):

| Case | Before | After |
|---|---|---|
| Missing or malformed token | 200 `Unauthorized` | **401**, same body |
| Invalid or expired token | 200 `Auth Internal Error` | **401** `Unauthorized` (see deviation c) |
| Verified user, no DB row (non-registration) | passed through with `res.locals.user = null`; handlers threw TypeError 500s or hung | **401** `Unauthorized` |
| Valid non-admin token on /admin | 200 `Unauthorized Admin` | **403**, same body |
| Wrong API key on /secure | 200 `Unauthorized` | **401**, same body |
| Revoked or over-3-month API key | **authenticated** (revocation never read) | **401** `Unauthorized` |
| Registration with someone else's uid | created the row (uid squatting) | **403** `{Error: 'uid does not match the authenticated user'}`, no row |
| Self-friend add | guard never fired; attempt reached the DB | **400** `{Error: 'Cannot add yourself as a friend'}` (the response the guard always intended) |
| Friend add where target id < caller id | generic 400 from the check-constraint violation | succeeds; pair stored ordered |
| Internal middleware failure | 200 `Auth Internal Error` | **500**, same body |
| Database error during user lookup | 404 `User not in database` | **500** `Auth Internal Error` / `Auth Admin Internal Error`; the `User not in database` string is retired |

Mobile compatibility:
- The current client (Models/Requests.ts) attaches the token and parses every response as JSON unconditionally (18 `response.json()` calls in that file). It never reads the `message` field (zero `.message` reads anywhere in the file), and its only status branching is four `response.status === 204` early returns and one health check for 200; it does not branch on 401, 403, or 500. The client therefore does not depend on the message strings at all, so the compatibility conclusion holds more strongly than first stated. Because every body shape and message string is preserved anyway, the client keeps working; only statuses changed. This is asserted, not assumed, by `test/ClientCompat/clientCompat.test.ts`, which drives the real middleware mounted the way `src/index.ts` mounts it and consumes responses the way the client does; the suite asserts a stricter contract than the client requires.
- Registration: the real client registers with its own Firebase uid (the normal flow), which now must match the token; that is exactly the value it already sends, so the happy path is unchanged. A client build that sent a stale or mismatched uid would now get a clean 403 instead of silently creating a wrong row.
- Unregistered state: a signed-in user whose profile row does not exist yet now gets 401 from non-registration /api routes instead of 500s. The one flow that must work in that state, registration, is explicitly exempted and tested end to end (middleware pass-through plus handler binding).
- Expected operational side effect (from the plan): real 401s will now appear in logs and Sentry after deploy, including for routine token expiry. That is intended behavior, not a regression spike.
- `GET /api/friends/` and `GET /api/friends/:user2` responses lose the sensitive fields listed under F-3. The client's declared types never included them, and FriendScreen reads only `id` and `user_name`, so no client change is needed.

## Deployment and rollback considerations

- **Deploy order:** the server can deploy independently of the mobile app. The current client tolerates the new statuses (it ignores them), and no client release is required before or after. There is no database migration in this branch: the schema is unchanged, and the only package change is the Prisma CLI version aligning to the already-deployed client version.
- **Before deploying:** regenerate `package-lock.json` (orchestrator action 1), delete the retired test file (action 2), and let CI run the full checklist (npm ci, prisma validate, lint, tsc, jest, Docker build with no `.env`).
- **Docker/secrets:** images built from this branch contain no `.env`. Runtime configuration continues to come from the environment and AWS Secrets Manager via `start:prod`'s existing `environmentVariablesClient` step, unchanged. **Previously built images still contain the baked `.env` and must be treated as exposed**; rotating those credentials remains Frank's open decision (plan decision 2) and is not performed by this branch.
- **Rollback:** the branch is application code, config, and build files only; rollback is redeploying the previous image or reverting the merge on `release/2.0`. Nothing in the branch writes or migrates data, so there is no data rollback. Two behavior changes to be aware of if a rollback is considered: revoked API keys authenticate again on the old code (F-2 returns), and registrations are unbound again (F-1 returns). If a key was revoked in reliance on this fix, keep the fix.
- **Admin access note:** after this branch, an admin-claim token whose uid has no database row gets 401 instead of full admin access (see deviation b). If a break-glass admin account exists that has no profile row, create its row before deploying, or revert that one branch in `decodeAdminToken`.

## Deviations from the Phase 0 plan, and why

a. **The planned 404 behavior does not exist; replaced with a deliberate 401 contract.** The plan described a working 404 for "verified user with no database row" and listed keeping it as Frank decision 3. QA verified in source that `getUserByUid` returns null rather than throwing, so the 404 branch fires only on database errors, and unregistered users actually pass through with `res.locals.user = null`, producing TypeError 500s in handlers (F-8). Per the orchestrator's correction: unresolvable identity returns 401 with the existing body shape, registration excepted as described. **Frank decision 3 from the plan is void, because the behavior it referred to is not real.** A database error during the user lookup returns 500, not 401 and not the phantom 404.
b. **Admin tokens without a database row now get 401.** QA F-10 recorded that admin handlers never read `res.locals.user`, so such tokens previously had full admin access, possibly as intentional break-glass. The orchestrator's unresolvable-identity rule was applied uniformly to `decodeAdminToken`. This is a one-branch change in the middleware if Frank wants break-glass restored; it is flagged here and in the rollback notes rather than decided silently.
c. **Invalid/expired token message.** Today an invalid token lands in the same catch block as genuine internal errors and returns `Auth Internal Error`. There is no distinct pre-existing message for this case. The 401 response uses `Unauthorized`, drawn from the existing auth-failure vocabulary; the body shape (a single string `message` field) is identical, and `Auth Internal Error` is retained for actual 500s. The client-compat suite pins the shape.
d. **API key `last_used_at` is still not updated on use.** QA's F-2 fix direction mentioned it; the orchestrator's F-2 scope was revocation enforcement plus the age rule, which is what is implemented. Recording last use is a small follow-up (a write in the auth path) and is listed so it is not lost.
e. **Friend reads are still one-directional (F-6 part 3).** `getFriendsByUserId` matches only `user_1 = caller` and the is-friend check only the caller-as-user_1 direction, while inserts are now normalized so the caller is not always user_1. Fixing reads means querying both directions in three places and changes what the friends list returns (a superset of today); combined with the deferred F-4 work that will build on friendship checks, it belongs with that pass rather than silently bundled here. Flagged as a follow-up, per the orchestrator's instruction.
f. **F-3 and F-5 scope notes.** F-3 was fixed in this branch per the CTO authorization (see the F-3 section). F-5 (unauthenticated `POST /userexists/` enumeration endpoint) was observed by QA and is not addressed here; it needs a product decision (rate limit, response shaping, or accepted risk) and is recorded so it is tracked.

## Follow-ups filed by this branch (not implemented)

1. DBClient mocked tests to replace the retired `gettableinfo.test.ts` (plan follow-up).
2. Multi-stage Docker build (plan Item 3, step 6).
3. Update `api_keys.last_used_at` on successful use (F-2 remainder).
4. Bidirectional friend reads (F-6 part 3), sequenced with the deferred F-4 privacy work.
5. F-4 private-profile enforcement: DEFERRED, awaiting Frank's product/privacy decision.
6. F-5 `/userexists/` enumeration decision.
7. Rotation of secrets baked into previously built images (Frank's decision).
8. H1 Firestore rules fix (plan Item 4; separate repo, beerpassport-cloud-functions).
