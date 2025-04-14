/*
  Warnings:

  - You are about to drop the column `whitelistedUsers` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "whitelistedUsers";

-- CreateTable
CREATE TABLE "WhitelistedUser" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "userId" INTEGER,

    CONSTRAINT "WhitelistedUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WhitelistedUser" ADD CONSTRAINT "WhitelistedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
