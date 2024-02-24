-- AlterEnum
ALTER TYPE "LinksRouteTo" ADD VALUE 'EPUB';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "archiveAsEpub" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "epub" text;
