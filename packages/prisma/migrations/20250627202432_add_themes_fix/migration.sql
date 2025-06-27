-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('dark', 'light', 'auto');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "theme" "Theme" NOT NULL DEFAULT 'dark';
