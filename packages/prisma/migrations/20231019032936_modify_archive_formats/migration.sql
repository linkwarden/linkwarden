-- AlterTable
ALTER TABLE "User" ADD COLUMN     "archiveAsPDF" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "archiveAsScreenshot" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "archiveAsWaybackMachine" BOOLEAN NOT NULL DEFAULT false;
