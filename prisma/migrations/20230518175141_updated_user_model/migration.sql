-- AlterTable
ALTER TABLE "User" ADD COLUMN     "collectionProtection" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "profilePhotoPath" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "whitelistedUsers" TEXT[] DEFAULT ARRAY[]::TEXT[];
