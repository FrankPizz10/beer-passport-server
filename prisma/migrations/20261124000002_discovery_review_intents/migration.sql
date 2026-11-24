-- Prisma-generated additive schema change.
CREATE TABLE "discovery_review_intents" (
    "id" SERIAL NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "intent" JSONB NOT NULL,
    "previous_intent" JSONB,
    "decided_by" INTEGER,
    "decided_by_uid" VARCHAR(255),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "discovery_review_intents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "discovery_review_intents_candidate_id_id_idx" ON "discovery_review_intents"("candidate_id", "id");
ALTER TABLE "discovery_review_intents" ADD CONSTRAINT "fk_discovery_review_intents_candidate_id" FOREIGN KEY ("candidate_id") REFERENCES "discovery_candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "discovery_review_intents" ADD CONSTRAINT "fk_discovery_review_intents_decided_by" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- The roles can be provisioned before or after migrations. The role scripts
-- also reapply these grants when run against an already migrated database.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'beerpassport_admin_viewer') THEN
    GRANT SELECT ON TABLE "discovery_review_intents" TO beerpassport_admin_viewer;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'beerpassport_discovery_reviewer') THEN
    GRANT SELECT, INSERT ON TABLE "discovery_review_intents" TO beerpassport_discovery_reviewer;
    GRANT USAGE ON SEQUENCE "discovery_review_intents_id_seq" TO beerpassport_discovery_reviewer;
  END IF;
END $$;
