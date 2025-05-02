/*
  Warnings:

  - The values [SINGLEFILE] on the enum `LinksRouteTo` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `archiveAsSinglefile` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LinksRouteTo_new" AS ENUM ('ORIGINAL', 'PDF', 'READABLE', 'MONOLITH', 'SCREENSHOT');
ALTER TABLE "User" ALTER COLUMN "linksRouteTo" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "linksRouteTo" TYPE "LinksRouteTo_new" USING ("linksRouteTo"::text::"LinksRouteTo_new");
ALTER TYPE "LinksRouteTo" RENAME TO "LinksRouteTo_old";
ALTER TYPE "LinksRouteTo_new" RENAME TO "LinksRouteTo";
DROP TYPE "LinksRouteTo_old";
ALTER TABLE "User" ALTER COLUMN "linksRouteTo" SET DEFAULT 'ORIGINAL';
COMMIT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "archiveAsSinglefile",
ADD COLUMN     "archiveAsMonolith" BOOLEAN NOT NULL DEFAULT true;
