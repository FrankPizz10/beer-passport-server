/*
  Warnings:

  - A unique constraint covering the columns `[notification_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `notification_token` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_notification_token_key` ON `users`(`notification_token`);
