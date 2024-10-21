/*
  Warnings:

  - You are about to drop the `_LinkToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('MEMBER', 'ADMIN');

-- DropForeignKey
ALTER TABLE "_LinkToUser" DROP CONSTRAINT "_LinkToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_LinkToUser" DROP CONSTRAINT "_LinkToUser_B_fkey";

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "teamId" INTEGER;

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "createdById" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "parentSubscriptionId" INTEGER,
ADD COLUMN     "teamRole" "TeamRole" NOT NULL DEFAULT 'ADMIN',
ALTER COLUMN "name" DROP NOT NULL;

-- DropTable
DROP TABLE "_LinkToUser";

-- CreateTable
CREATE TABLE "_PinnedLinks" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PinnedLinks_AB_unique" ON "_PinnedLinks"("A", "B");

-- CreateIndex
CREATE INDEX "_PinnedLinks_B_index" ON "_PinnedLinks"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_parentSubscriptionId_fkey" FOREIGN KEY ("parentSubscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PinnedLinks" ADD CONSTRAINT "_PinnedLinks_A_fkey" FOREIGN KEY ("A") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PinnedLinks" ADD CONSTRAINT "_PinnedLinks_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
