-- DropForeignKey
ALTER TABLE "WhitelistedUser" DROP CONSTRAINT "WhitelistedUser_userId_fkey";

-- AddForeignKey
ALTER TABLE "WhitelistedUser" ADD CONSTRAINT "WhitelistedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
