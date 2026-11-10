-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordRetries" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passwordRetryAt" TIMESTAMP(3);
