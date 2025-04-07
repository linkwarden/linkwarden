-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "archiveAsMonolith" BOOLEAN,
ADD COLUMN     "archiveAsPDF" BOOLEAN,
ADD COLUMN     "archiveAsReadable" BOOLEAN,
ADD COLUMN     "archiveAsScreenshot" BOOLEAN,
ADD COLUMN     "archiveAsWaybackMachine" BOOLEAN;
