/*
  Warnings:

  - You are about to drop the column `pdf` on the `Link` table. All the data in the column will be lost.
  - You are about to drop the column `readable` on the `Link` table. All the data in the column will be lost.
  - You are about to drop the column `screenshotPath` on the `Link` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Link" RENAME COLUMN "screenshotPath" TO "image";
ALTER TABLE "Link" RENAME COLUMN "pdfPath" TO "pdf";
ALTER TABLE "Link" RENAME COLUMN "readabilityPath" TO "readable";
ALTER TABLE "Link" ADD COLUMN "preview" TEXT;
