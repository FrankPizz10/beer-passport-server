/*
  Warnings:

  - A unique constraint covering the columns `[user_id,beer_id]` on the table `user_beers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `user_beers_user_id_beer_id_key` ON `user_beers`(`user_id`, `beer_id`);
