/*
  Warnings:

  - You are about to drop the column `tried` on the `user_beers` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `user_beers` DROP FOREIGN KEY `fk_user_beers_beer_id`;

-- DropForeignKey
ALTER TABLE `user_beers` DROP FOREIGN KEY `fk_user_beers_user_id`;

-- AlterTable
ALTER TABLE `beers` MODIFY `last_mod` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `breweries` MODIFY `last_mod` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `categories` MODIFY `last_mod` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `styles` MODIFY `last_mod` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `user_beers` DROP COLUMN `tried`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `private` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `collections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `difficulty` INTEGER NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_badges` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `collection_id` INTEGER NOT NULL,
    `earned` BOOLEAN NOT NULL DEFAULT false,
    `progress` FLOAT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `collection_id`(`collection_id`),
    UNIQUE INDEX `user_id_collection_id`(`user_id`, `collection_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collection_beers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `collection_id` INTEGER NOT NULL,
    `beer_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `beer_id`(`beer_id`),
    UNIQUE INDEX `collection_id_beer_id`(`collection_id`, `beer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friends` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_1` INTEGER NOT NULL,
    `user_2` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `user_2`(`user_2`),
    UNIQUE INDEX `unique_user_combination`(`user_1`, `user_2`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `message` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `viewed` BOOLEAN NOT NULL DEFAULT false,

    INDEX `fk_notifications_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_beers` ADD CONSTRAINT `fk_user_beers_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_beers` ADD CONSTRAINT `fk_user_beers_beer_id` FOREIGN KEY (`beer_id`) REFERENCES `beers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_badges` ADD CONSTRAINT `fk_user_badges_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_badges` ADD CONSTRAINT `fk_user_badges_collection_id` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `collection_beers` ADD CONSTRAINT `fk_collection_id` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `collection_beers` ADD CONSTRAINT `fk_beer_id` FOREIGN KEY (`beer_id`) REFERENCES `beers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `friends` ADD CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`user_1`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `friends` ADD CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`user_2`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
