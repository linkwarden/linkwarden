/*
  Warnings:

  - You are about to drop the column `dashboardPinnedLinks` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `dashboardRecentLinks` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DashboardSectionType" AS ENUM ('STATS', 'RECENT_LINKS', 'PINNED_LINKS', 'COLLECTION');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "dashboardPinnedLinks",
DROP COLUMN "dashboardRecentLinks";

-- CreateTable
CREATE TABLE "DashboardSection" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "DashboardSectionType" NOT NULL,
    "collectionId" INTEGER,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardSection_userId_order_key" ON "DashboardSection"("userId", "order");

-- AddForeignKey
ALTER TABLE "DashboardSection" ADD CONSTRAINT "DashboardSection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
