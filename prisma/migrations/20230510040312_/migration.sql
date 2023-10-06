-- CreateTable
CREATE TABLE `beers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brewery_id` INTEGER NOT NULL DEFAULT 0,
    `name` VARCHAR(255) NOT NULL DEFAULT '',
    `cat_id` INTEGER NOT NULL DEFAULT 0,
    `style_id` INTEGER NOT NULL DEFAULT 0,
    `abv` FLOAT NOT NULL DEFAULT 0,
    `ibu` FLOAT NOT NULL DEFAULT 0,
    `srm` FLOAT NOT NULL DEFAULT 0,
    `upc` INTEGER NOT NULL DEFAULT 0,
    `filepath` VARCHAR(255) NOT NULL DEFAULT '',
    `descript` TEXT NOT NULL,
    `add_user` INTEGER NOT NULL DEFAULT 0,
    `last_mod` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_beers_brewery_id`(`brewery_id`),
    INDEX `fk_beers_cat_id`(`cat_id`),
    INDEX `fk_beers_style_id`(`style_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `breweries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL DEFAULT '',
    `address1` VARCHAR(255) NOT NULL DEFAULT '',
    `address2` VARCHAR(255) NOT NULL DEFAULT '',
    `city` VARCHAR(255) NOT NULL DEFAULT '',
    `state` VARCHAR(255) NOT NULL DEFAULT '',
    `code` VARCHAR(25) NOT NULL DEFAULT '',
    `country` VARCHAR(255) NOT NULL DEFAULT '',
    `phone` VARCHAR(50) NOT NULL DEFAULT '',
    `website` VARCHAR(255) NOT NULL DEFAULT '',
    `filepath` VARCHAR(255) NOT NULL DEFAULT '',
    `descript` TEXT NOT NULL,
    `add_user` INTEGER NOT NULL DEFAULT 0,
    `last_mod` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `breweries_geocode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brewery_id` INTEGER NOT NULL DEFAULT 0,
    `latitude` FLOAT NOT NULL DEFAULT 0,
    `longitude` FLOAT NOT NULL DEFAULT 0,
    `accuracy` VARCHAR(255) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cat_name` VARCHAR(255) NOT NULL DEFAULT '',
    `last_mod` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `styles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cat_id` INTEGER NOT NULL DEFAULT 0,
    `style_name` VARCHAR(255) NOT NULL DEFAULT '',
    `last_mod` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_beers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `beer_id` INTEGER NOT NULL,
    `tried` BOOLEAN NULL DEFAULT false,
    `liked` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_user_beers_beer_id`(`beer_id`),
    INDEX `fk_user_beers_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `id`(`id`),
    UNIQUE INDEX `uid`(`uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `beers` ADD CONSTRAINT `fk_beers_brewery_id` FOREIGN KEY (`brewery_id`) REFERENCES `breweries`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `beers` ADD CONSTRAINT `fk_beers_cat_id` FOREIGN KEY (`cat_id`) REFERENCES `categories`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `beers` ADD CONSTRAINT `fk_beers_style_id` FOREIGN KEY (`style_id`) REFERENCES `styles`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_beers` ADD CONSTRAINT `fk_user_beers_beer_id` FOREIGN KEY (`beer_id`) REFERENCES `beers`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_beers` ADD CONSTRAINT `fk_user_beers_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
