-- Prisma schema diffs do not carry SQL CHECK constraints or role grants.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.discovery_decisions'::regclass
      AND conname = 'discovery_decisions_target_present'
  ) THEN
    ALTER TABLE public.discovery_decisions
      ADD CONSTRAINT discovery_decisions_target_present
      CHECK (candidate_id IS NOT NULL OR pair_id IS NOT NULL);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'beerpassport_admin_viewer') THEN
    GRANT SELECT ON public.discovery_batches, public.discovery_candidates,
      public.discovery_candidate_pairs, public.discovery_decisions,
      public.discovery_image_fetches, public.discovery_image_decisions,
      public.discovery_import_manifests, public.discovery_manifest_events
      TO beerpassport_admin_viewer;
  END IF;
END $$;
COMMIT;
