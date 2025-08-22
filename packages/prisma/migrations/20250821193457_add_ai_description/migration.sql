-- CreateEnum
CREATE TYPE "AiDescriptionMethod" AS ENUM ('DISABLED', 'GENERATE');

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "aiDescribed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiCharacterCount" INTEGER NOT NULL DEFAULT 75,
ADD COLUMN     "aiDescriptionMethod" "AiDescriptionMethod" NOT NULL DEFAULT 'DISABLED';
