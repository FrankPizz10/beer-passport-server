/*
  Warnings:

  - You are about to drop the column `add_user` on the `beers` table. All the data in the column will be lost.
  - You are about to drop the column `filepath` on the `beers` table. All the data in the column will be lost.
  - You are about to drop the column `filepath` on the `breweries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `beers` DROP COLUMN `add_user`,
    DROP COLUMN `filepath`;

-- AlterTable
ALTER TABLE `breweries` DROP COLUMN `filepath`;
