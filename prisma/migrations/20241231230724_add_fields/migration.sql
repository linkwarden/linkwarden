-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dashboardPinnedLinks" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dashboardRecentLinks" BOOLEAN NOT NULL DEFAULT true;
