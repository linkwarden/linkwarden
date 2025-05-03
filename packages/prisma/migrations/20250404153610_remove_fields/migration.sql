/*
  Warnings:

  - You are about to drop the column `endXPath` on the `Highlight` table. All the data in the column will be lost.
  - You are about to drop the column `startXPath` on the `Highlight` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Highlight" DROP COLUMN "endXPath",
DROP COLUMN "startXPath";
