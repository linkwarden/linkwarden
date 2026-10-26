/*
  Warnings:

  - You are about to drop the column `isPrivate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `WhitelistedUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WhitelistedUser" DROP CONSTRAINT "WhitelistedUser_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isPrivate";

-- DropTable
DROP TABLE "WhitelistedUser";
