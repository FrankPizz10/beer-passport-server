-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_FRIEND', 'BADGE_EARNED');

-- CreateTable
CREATE TABLE "beers" (
    "id" SERIAL NOT NULL,
    "brewery_id" INTEGER,
    "name" VARCHAR(255) NOT NULL DEFAULT '',
    "cat_id" INTEGER,
    "style_id" INTEGER,
    "abv" DOUBLE PRECISION,
    "ibu" DOUBLE PRECISION,
    "srm" DOUBLE PRECISION,
    "upc" VARCHAR(255),
    "descript" TEXT,
    "discontinued" BOOLEAN NOT NULL DEFAULT false,
    "last_mod" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beverage_images" (
    "id" SERIAL NOT NULL,
    "beverage_id" INTEGER NOT NULL,
    "source_type" VARCHAR(50) NOT NULL DEFAULT '',
    "source_url" VARCHAR(1024) NOT NULL DEFAULT '',
    "storage_key" VARCHAR(512) NOT NULL DEFAULT '',
    "license_type" VARCHAR(100) NOT NULL DEFAULT '',
    "attribution" VARCHAR(512) NOT NULL DEFAULT '',
    "license_url" VARCHAR(1024) NOT NULL DEFAULT '',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "verified_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beverage_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breweries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL DEFAULT '',
    "address1" VARCHAR(255) NOT NULL DEFAULT '',
    "address2" VARCHAR(255) NOT NULL DEFAULT '',
    "city" VARCHAR(255) NOT NULL DEFAULT '',
    "state" VARCHAR(255) NOT NULL DEFAULT '',
    "code" VARCHAR(25) NOT NULL DEFAULT '',
    "country" VARCHAR(255) NOT NULL DEFAULT '',
    "phone" VARCHAR(50) NOT NULL DEFAULT '',
    "website" VARCHAR(255) NOT NULL DEFAULT '',
    "descript" TEXT NOT NULL,
    "add_user" INTEGER,
    "last_mod" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breweries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breweries_geocode" (
    "id" SERIAL NOT NULL,
    "brewery_id" INTEGER NOT NULL DEFAULT 0,
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracy" VARCHAR(255) NOT NULL DEFAULT '',

    CONSTRAINT "breweries_geocode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "cat_name" VARCHAR(255) NOT NULL DEFAULT '',
    "last_mod" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "styles" (
    "id" SERIAL NOT NULL,
    "cat_id" INTEGER,
    "style_name" VARCHAR(255) NOT NULL DEFAULT '',
    "last_mod" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_beers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "beer_id" INTEGER NOT NULL,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_beers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "uid" VARCHAR(255) NOT NULL,
    "notification_token" VARCHAR(255),
    "age" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "user_name" VARCHAR(255) NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "collection_id" INTEGER NOT NULL,
    "earned" BOOLEAN NOT NULL DEFAULT false,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_beers" (
    "id" SERIAL NOT NULL,
    "collection_id" INTEGER NOT NULL,
    "beer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_beers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friends" (
    "id" SERIAL NOT NULL,
    "user_1" INTEGER NOT NULL,
    "user_2" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL DEFAULT '',
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(0),
    "last_mod" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fk_beers_brewery_id_idx" ON "beers"("brewery_id");

-- CreateIndex
CREATE INDEX "fk_beers_cat_id_idx" ON "beers"("cat_id");

-- CreateIndex
CREATE INDEX "fk_beers_style_id_idx" ON "beers"("style_id");

-- CreateIndex
CREATE UNIQUE INDEX "beers_brewery_id_name_key" ON "beers"("brewery_id", "name");

-- CreateIndex
CREATE INDEX "fk_beverage_images_beer_id_idx" ON "beverage_images"("beverage_id");

-- CreateIndex
CREATE INDEX "beverage_images_status" ON "beverage_images"("status");

-- CreateIndex
CREATE UNIQUE INDEX "breweries_name" ON "breweries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cat_name" ON "categories"("cat_name");

-- CreateIndex
CREATE INDEX "fk_styles_cat_id_idx" ON "styles"("cat_id");

-- CreateIndex
CREATE UNIQUE INDEX "style_name" ON "styles"("style_name");

-- CreateIndex
CREATE INDEX "fk_user_beers_beer_id_idx" ON "user_beers"("beer_id");

-- CreateIndex
CREATE INDEX "fk_user_beers_user_id_idx" ON "user_beers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_beers_user_id_beer_id_key" ON "user_beers"("user_id", "beer_id");

-- CreateIndex
CREATE UNIQUE INDEX "uid" ON "users"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_notification_token_key" ON "users"("notification_token");

-- CreateIndex
CREATE UNIQUE INDEX "email" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_name" ON "users"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "collections_name" ON "collections"("name");

-- CreateIndex
CREATE INDEX "collection_id" ON "user_badges"("collection_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_id_collection_id" ON "user_badges"("user_id", "collection_id");

-- CreateIndex
CREATE INDEX "beer_id" ON "collection_beers"("beer_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_id_beer_id" ON "collection_beers"("collection_id", "beer_id");

-- CreateIndex
CREATE INDEX "user_2" ON "friends"("user_2");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_combination" ON "friends"("user_1", "user_2");

-- CreateIndex
CREATE INDEX "fk_notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_id_message" ON "notifications"("user_id", "message");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- AddForeignKey
ALTER TABLE "beers" ADD CONSTRAINT "fk_beers_brewery_id" FOREIGN KEY ("brewery_id") REFERENCES "breweries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "beers" ADD CONSTRAINT "fk_beers_cat_id" FOREIGN KEY ("cat_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "beers" ADD CONSTRAINT "fk_beers_style_id" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "beverage_images" ADD CONSTRAINT "fk_beverage_images_beer_id" FOREIGN KEY ("beverage_id") REFERENCES "beers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "styles" ADD CONSTRAINT "fk_styles_cat_id" FOREIGN KEY ("cat_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_beers" ADD CONSTRAINT "fk_user_beers_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_beers" ADD CONSTRAINT "fk_user_beers_beer_id" FOREIGN KEY ("beer_id") REFERENCES "beers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "fk_user_badges_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "fk_user_badges_collection_id" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collection_beers" ADD CONSTRAINT "fk_collection_id" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collection_beers" ADD CONSTRAINT "fk_beer_id" FOREIGN KEY ("beer_id") REFERENCES "beers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_ibfk_1" FOREIGN KEY ("user_1") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_ibfk_2" FOREIGN KEY ("user_2") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;


-- Manual addition (not modeled by Prisma): schema audit F-1.
-- Friendships are mutual and stored once, in canonical order, so a pair
-- (A, B) can never also exist as (B, A), and self-friending is impossible.
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_order_check" CHECK ("user_1" < "user_2");
