/*
  Warnings:

  - Made the column `createdById` on table `Collection` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdById` on table `Link` required. This step will fail if there are existing NULL values in that column.

*/

-- Update the Link table to set the createdBy based on the Collection's ownerId.
UPDATE "Link"
SET "createdById" = (
  SELECT "ownerId"
  FROM "Collection"
  WHERE "Collection"."id" = "Link"."collectionId"
);

-- Set createdBy to ownerId for existing records
UPDATE "Collection"
SET "createdById" = "ownerId";

-- DropForeignKey
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Link" DROP CONSTRAINT "Link_createdById_fkey";

-- AlterTable
ALTER TABLE "Collection" ALTER COLUMN "createdById" SET NOT NULL;

-- AlterTable
ALTER TABLE "Link" ALTER COLUMN "createdById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
