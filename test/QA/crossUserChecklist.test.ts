/**
 * QA cross-user checklist items that are NOT implemented in Phase 0.
 *
 * Finding F-4 (users.private is enforced nowhere) was DEFERRED by explicit
 * CTO decision on 2026-11-21, pending a separate product/privacy decision.
 * It is an open finding, not a resolved one. These tests are written to the
 * behavior QA recommended (deny non-friends access to a private profile's
 * data) and are skipped until that decision is made and the fix is
 * implemented; un-skip them as part of that work.
 *
 * Affected endpoints (all currently return the target user's data to any
 * authenticated caller, regardless of the private flag or friendship):
 *   GET /api/userbeers/:id   (src/Routes/userbeers.ts)
 *   GET /api/triedbeers/:id  (src/Routes/userbeers.ts)
 *   GET /api/likedbeers/:id  (src/Routes/userbeers.ts)
 *   GET /api/userbadges/:id  (src/Routes/userbadges.ts)
 */
describe('F-4 private-profile enforcement (DEFERRED, awaiting product decision)', () => {
  it.skip('denies user B reading private user A\'s GET /api/userbeers/:id with 403 and no data', () => {
    // Pending the F-4 decision and implementation.
  });

  it.skip('denies user B reading private user A\'s GET /api/triedbeers/:id with 403 and no data', () => {
    // Pending the F-4 decision and implementation.
  });

  it.skip('denies user B reading private user A\'s GET /api/likedbeers/:id with 403 and no data', () => {
    // Pending the F-4 decision and implementation.
  });

  it.skip('denies user B reading private user A\'s GET /api/userbadges/:id with 403 and no data', () => {
    // Pending the F-4 decision and implementation.
  });
});
