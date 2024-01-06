/*
  Warnings:

  - Made the column `liked` on table `user_beers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `styles` MODIFY `cat_id` INTEGER NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `user_beers` MODIFY `liked` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `fk_styles_cat_id` ON `styles`(`cat_id`);

-- AddForeignKey
ALTER TABLE `styles` ADD CONSTRAINT `fk_styles_cat_id` FOREIGN KEY (`cat_id`) REFERENCES `categories`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
