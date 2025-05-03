/*
  Warnings:

  - You are about to drop the column `xPath` on the `Highlight` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Highlight" DROP COLUMN "xPath",
ADD COLUMN     "endXPath" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "startXPath" TEXT NOT NULL DEFAULT '';
