/*
  Warnings:

  - You are about to drop the column `teamRole` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "teamRole";

-- DropEnum
DROP TYPE "TeamRole";
