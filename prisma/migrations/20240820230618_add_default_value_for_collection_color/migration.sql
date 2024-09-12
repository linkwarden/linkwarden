/*
  Warnings:

  - Made the column `color` on table `Collection` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Collection" ALTER COLUMN "color" SET NOT NULL,
ALTER COLUMN "color" SET DEFAULT '#0ea5e9';
