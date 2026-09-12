-- CreateEnum
CREATE TYPE "Layout" AS ENUM ('V1', 'V2');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "layoutPreference" "Layout"[];
