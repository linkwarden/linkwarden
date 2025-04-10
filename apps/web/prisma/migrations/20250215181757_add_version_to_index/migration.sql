/*
  Warnings:

  - You are about to drop the column `indexed` on the `Link` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Link" DROP COLUMN "indexed",
ADD COLUMN     "indexVersion" TEXT;
