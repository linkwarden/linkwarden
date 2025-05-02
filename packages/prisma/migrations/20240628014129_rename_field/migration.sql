/*
  Warnings:

  - You are about to drop the column `singlefile` on the `Link` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Link" DROP COLUMN "singlefile",
ADD COLUMN     "monolith" TEXT;
