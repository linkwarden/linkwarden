-- CreateEnum
CREATE TYPE "LinksRouteTo" AS ENUM ('ORIGINAL', 'PDF', 'READABLE', 'SCREENSHOT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "linksRouteTo" "LinksRouteTo" NOT NULL DEFAULT 'ORIGINAL';
