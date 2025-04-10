-- AlterEnum
ALTER TYPE "LinksRouteTo" ADD VALUE 'SINGLEFILE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "archiveAsSinglefile" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "singlefile" text;
