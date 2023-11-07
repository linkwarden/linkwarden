/*
  Warnings:

  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "pdfPath" TEXT,
ADD COLUMN     "screenshotPath" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "image",
ADD COLUMN     "imagePath" TEXT;
