/*
  Warnings:

  - A unique constraint covering the columns `[brewery_id,name]` on the table `beers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `breweries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cat_name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `collections` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[style_name]` on the table `styles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `beers_brewery_id_name_key` ON `beers`(`brewery_id`, `name`);

-- CreateIndex
CREATE UNIQUE INDEX `name` ON `breweries`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `cat_name` ON `categories`(`cat_name`);

-- CreateIndex
CREATE UNIQUE INDEX `name` ON `collections`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `style_name` ON `styles`(`style_name`);
