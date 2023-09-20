/*
  Warnings:

  - Added the required column `type` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `type` ENUM('NEW_FRIEND', 'BADGE_EARNED') NOT NULL;
