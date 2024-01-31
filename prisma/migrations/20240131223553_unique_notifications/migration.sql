/*
  Warnings:

  - A unique constraint covering the columns `[user_id,message]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `unique_user_id_message` ON `notifications`(`user_id`, `message`);
