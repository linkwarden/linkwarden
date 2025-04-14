/*
  Warnings:

  - You are about to drop the column `blurredFavicons` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `displayLinkIcons` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "blurredFavicons",
DROP COLUMN "displayLinkIcons";
