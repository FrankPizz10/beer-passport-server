-- AlterTable
ALTER TABLE "beverage_images" ADD COLUMN     "reviewed_at" TIMESTAMP(0),
ADD COLUMN     "reviewed_by" INTEGER,
ADD COLUMN     "reviewed_by_uid" VARCHAR(128),
ADD COLUMN     "source_check_status" VARCHAR(20),
ADD COLUMN     "source_checked_at" TIMESTAMP(0),
ADD COLUMN     "source_content_type" VARCHAR(100);

-- CreateTable
CREATE TABLE "image_review_events" (
    "id" SERIAL NOT NULL,
    "beverage_image_id" INTEGER NOT NULL,
    "beverage_id" INTEGER NOT NULL,
    "action" VARCHAR(10) NOT NULL,
    "from_status" VARCHAR(20) NOT NULL,
    "to_status" VARCHAR(20) NOT NULL,
    "admin_user_id" INTEGER,
    "admin_uid" VARCHAR(128),
    "note" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_review_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_batches" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(255),
    "source" VARCHAR(120) NOT NULL,
    "source_summary" TEXT,
    "manifest" JSONB NOT NULL,
    "bundle_sha256" VARCHAR(64) NOT NULL,
    "candidates_sha256" VARCHAR(64) NOT NULL,
    "record_count" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'staged',
    "ingested_by" VARCHAR(120),
    "ingested_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_candidates" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "candidate_key" VARCHAR(320) NOT NULL,
    "payload" JSONB NOT NULL,
    "name" VARCHAR(600) NOT NULL,
    "brewery_name" VARCHAR(600),
    "style" VARCHAR(255),
    "abv" DOUBLE PRECISION,
    "ibu" DOUBLE PRECISION,
    "description" TEXT,
    "barcode" VARCHAR(64),
    "source" VARCHAR(120) NOT NULL,
    "source_record_id" VARCHAR(320) NOT NULL,
    "source_url" TEXT,
    "retrieved_at" TIMESTAMP(0),
    "tier" VARCHAR(20),
    "origin_bucket" VARCHAR(30),
    "origin_evidence" JSONB,
    "image_url" TEXT,
    "image_source" VARCHAR(120),
    "image_tier" VARCHAR(20),
    "image_status" VARCHAR(80),
    "image_status_normalized" VARCHAR(30),
    "image_verified" BOOLEAN,
    "image_flag_reason" TEXT,
    "image_license" VARCHAR(255),
    "image_page_url" TEXT,
    "image_width" INTEGER,
    "image_height" INTEGER,
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "hold_reason" VARCHAR(40),
    "hold_note" TEXT,
    "dedupe_outcome" VARCHAR(30) NOT NULL DEFAULT 'not_checked',
    "matched_beer_id" INTEGER,
    "duplicate_of_candidate_id" INTEGER,
    "normalized_name" VARCHAR(600) NOT NULL,
    "normalized_brewery" VARCHAR(600),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "image_decision" VARCHAR(20),
    "image_decision_fetch_id" INTEGER,
    "image_decision_at" TIMESTAMP(0),

    CONSTRAINT "discovery_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_candidate_pairs" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "candidate_id_b" INTEGER,
    "external_ref" VARCHAR(320),
    "comparison" VARCHAR(120),
    "method" VARCHAR(40),
    "score" DOUBLE PRECISION,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "decided_by" INTEGER,
    "decided_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_candidate_pairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_decisions" (
    "id" SERIAL NOT NULL,
    "candidate_id" INTEGER,
    "pair_id" INTEGER,
    "decision" VARCHAR(40) NOT NULL,
    "from_status" VARCHAR(20),
    "to_status" VARCHAR(20),
    "reason" VARCHAR(40),
    "note" TEXT,
    "decided_by" INTEGER,
    "decided_by_uid" VARCHAR(255),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_image_fetches" (
    "id" SERIAL NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "image_ref" TEXT NOT NULL,
    "sha256" VARCHAR(64),
    "content_type" VARCHAR(120),
    "byte_size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "outcome" VARCHAR(30) NOT NULL,
    "outcome_detail" TEXT,
    "fetched_by" INTEGER,
    "fetched_by_uid" VARCHAR(255),
    "fetched_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_image_fetches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_image_decisions" (
    "id" SERIAL NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "fetch_id" INTEGER NOT NULL,
    "image_ref" TEXT NOT NULL,
    "image_sha256" VARCHAR(64) NOT NULL,
    "image_content_type" VARCHAR(120),
    "image_width" INTEGER,
    "image_height" INTEGER,
    "image_source" VARCHAR(120),
    "image_license" VARCHAR(255),
    "decision" VARCHAR(20) NOT NULL,
    "note" TEXT,
    "decided_by" INTEGER,
    "decided_by_uid" VARCHAR(255),
    "decided_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_image_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_import_manifests" (
    "id" VARCHAR(80) NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "manifest" JSONB NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "record_count" INTEGER NOT NULL,
    "catalog_fingerprint" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "built_by" INTEGER,
    "built_by_uid" VARCHAR(255),
    "approved_by" INTEGER,
    "approved_at" TIMESTAMP(0),
    "approved_sha256" VARCHAR(64),
    "imported_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_import_manifests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_manifest_events" (
    "id" SERIAL NOT NULL,
    "manifest_id" VARCHAR(80) NOT NULL,
    "action" VARCHAR(40) NOT NULL,
    "from_status" VARCHAR(20),
    "to_status" VARCHAR(20),
    "note" TEXT,
    "actor_id" INTEGER,
    "actor_uid" VARCHAR(255),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_manifest_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "image_review_events_beverage_image_id_idx" ON "image_review_events"("beverage_image_id");

-- CreateIndex
CREATE UNIQUE INDEX "discovery_batches_slug_key" ON "discovery_batches"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "discovery_batches_bundle_sha256_key" ON "discovery_batches"("bundle_sha256");

-- CreateIndex
CREATE INDEX "discovery_candidates_batch_id_idx" ON "discovery_candidates"("batch_id");

-- CreateIndex
CREATE INDEX "discovery_candidates_origin_bucket_idx" ON "discovery_candidates"("origin_bucket");

-- CreateIndex
CREATE INDEX "discovery_candidates_hold_reason_idx" ON "discovery_candidates"("hold_reason");

-- CreateIndex
CREATE INDEX "discovery_candidates_review_status_idx" ON "discovery_candidates"("review_status");

-- CreateIndex
CREATE INDEX "discovery_candidates_barcode_idx" ON "discovery_candidates"("barcode");

-- CreateIndex
CREATE INDEX "discovery_candidates_normalized_name_idx" ON "discovery_candidates"("normalized_name");

-- CreateIndex
CREATE INDEX "discovery_candidates_image_status_normalized_idx" ON "discovery_candidates"("image_status_normalized");

-- CreateIndex
CREATE INDEX "discovery_candidates_source_idx" ON "discovery_candidates"("source");

-- CreateIndex
CREATE UNIQUE INDEX "discovery_candidates_batch_key" ON "discovery_candidates"("batch_id", "candidate_key");

-- CreateIndex
CREATE INDEX "discovery_candidate_pairs_batch_id_idx" ON "discovery_candidate_pairs"("batch_id");

-- CreateIndex
CREATE INDEX "discovery_candidate_pairs_candidate_id_idx" ON "discovery_candidate_pairs"("candidate_id");

-- CreateIndex
CREATE INDEX "discovery_candidate_pairs_status_idx" ON "discovery_candidate_pairs"("status");

-- CreateIndex
CREATE INDEX "discovery_decisions_candidate_id_idx" ON "discovery_decisions"("candidate_id");

-- CreateIndex
CREATE INDEX "discovery_decisions_pair_id_idx" ON "discovery_decisions"("pair_id");

-- CreateIndex
CREATE INDEX "discovery_decisions_created_at_idx" ON "discovery_decisions"("created_at");

-- CreateIndex
CREATE INDEX "discovery_image_fetches_candidate_id_idx" ON "discovery_image_fetches"("candidate_id");

-- CreateIndex
CREATE INDEX "discovery_image_fetches_fetched_by_idx" ON "discovery_image_fetches"("fetched_by", "fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "discovery_image_decisions_fetch_id_key" ON "discovery_image_decisions"("fetch_id");

-- CreateIndex
CREATE INDEX "discovery_image_decisions_candidate_id_idx" ON "discovery_image_decisions"("candidate_id");

-- CreateIndex
CREATE INDEX "discovery_image_decisions_decided_at_idx" ON "discovery_image_decisions"("decided_at");

-- CreateIndex
CREATE UNIQUE INDEX "discovery_import_manifests_sha256_key" ON "discovery_import_manifests"("sha256");

-- CreateIndex
CREATE INDEX "discovery_import_manifests_batch_id_idx" ON "discovery_import_manifests"("batch_id");

-- CreateIndex
CREATE INDEX "discovery_import_manifests_status_idx" ON "discovery_import_manifests"("status");

-- CreateIndex
CREATE INDEX "discovery_manifest_events_manifest_id_idx" ON "discovery_manifest_events"("manifest_id");

-- CreateIndex
CREATE INDEX "discovery_manifest_events_created_at_idx" ON "discovery_manifest_events"("created_at");

-- AddForeignKey
ALTER TABLE "beverage_images" ADD CONSTRAINT "fk_beverage_images_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "image_review_events" ADD CONSTRAINT "fk_image_review_events_image_id" FOREIGN KEY ("beverage_image_id") REFERENCES "beverage_images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "image_review_events" ADD CONSTRAINT "fk_image_review_events_admin_user_id" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_candidates" ADD CONSTRAINT "fk_discovery_candidates_batch_id" FOREIGN KEY ("batch_id") REFERENCES "discovery_batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_candidates" ADD CONSTRAINT "fk_discovery_candidates_matched_beer_id" FOREIGN KEY ("matched_beer_id") REFERENCES "beers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_candidates" ADD CONSTRAINT "fk_discovery_candidates_duplicate_of" FOREIGN KEY ("duplicate_of_candidate_id") REFERENCES "discovery_candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_candidates" ADD CONSTRAINT "fk_discovery_candidates_image_decision_fetch" FOREIGN KEY ("image_decision_fetch_id") REFERENCES "discovery_image_fetches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_candidate_pairs" ADD CONSTRAINT "fk_discovery_pairs_batch_id" FOREIGN KEY ("batch_id") REFERENCES "discovery_batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_candidate_pairs" ADD CONSTRAINT "fk_discovery_pairs_candidate_id" FOREIGN KEY ("candidate_id") REFERENCES "discovery_candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_candidate_pairs" ADD CONSTRAINT "fk_discovery_pairs_candidate_id_b" FOREIGN KEY ("candidate_id_b") REFERENCES "discovery_candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_candidate_pairs" ADD CONSTRAINT "fk_discovery_pairs_decided_by" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_decisions" ADD CONSTRAINT "fk_discovery_decisions_candidate_id" FOREIGN KEY ("candidate_id") REFERENCES "discovery_candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_decisions" ADD CONSTRAINT "fk_discovery_decisions_pair_id" FOREIGN KEY ("pair_id") REFERENCES "discovery_candidate_pairs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_decisions" ADD CONSTRAINT "fk_discovery_decisions_decided_by" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_image_fetches" ADD CONSTRAINT "fk_discovery_image_fetches_candidate_id" FOREIGN KEY ("candidate_id") REFERENCES "discovery_candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_image_fetches" ADD CONSTRAINT "fk_discovery_image_fetches_fetched_by" FOREIGN KEY ("fetched_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_image_decisions" ADD CONSTRAINT "fk_discovery_image_decisions_candidate_id" FOREIGN KEY ("candidate_id") REFERENCES "discovery_candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_image_decisions" ADD CONSTRAINT "fk_discovery_image_decisions_fetch_id" FOREIGN KEY ("fetch_id") REFERENCES "discovery_image_fetches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_image_decisions" ADD CONSTRAINT "fk_discovery_image_decisions_decided_by" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_import_manifests" ADD CONSTRAINT "fk_discovery_manifests_batch_id" FOREIGN KEY ("batch_id") REFERENCES "discovery_batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_import_manifests" ADD CONSTRAINT "fk_discovery_manifests_built_by" FOREIGN KEY ("built_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_import_manifests" ADD CONSTRAINT "fk_discovery_manifests_approved_by" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_manifest_events" ADD CONSTRAINT "fk_discovery_manifest_events_manifest_id" FOREIGN KEY ("manifest_id") REFERENCES "discovery_import_manifests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discovery_manifest_events" ADD CONSTRAINT "fk_discovery_manifest_events_actor_id" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

