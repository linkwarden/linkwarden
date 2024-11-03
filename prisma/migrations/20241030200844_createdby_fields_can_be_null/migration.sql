-- DropForeignKey
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Link" DROP CONSTRAINT "Link_createdById_fkey";

-- AlterTable
ALTER TABLE "Collection" ALTER COLUMN "createdById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Link" ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
