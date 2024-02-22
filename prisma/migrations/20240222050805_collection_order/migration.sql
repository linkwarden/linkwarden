-- AlterTable
ALTER TABLE "User" ADD COLUMN     "collectionOrder" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
