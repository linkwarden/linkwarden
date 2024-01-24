/*
  Warnings:

  - A unique constraint covering the columns `[name,userId]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ApiKey_name_key";

-- DropIndex
DROP INDEX "ApiKey_token_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_name_userId_key" ON "ApiKey"("name", "userId");
