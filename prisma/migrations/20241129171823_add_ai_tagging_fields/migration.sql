-- CreateEnum
CREATE TYPE "AiTaggingMethod" AS ENUM ('DISABLED', 'GENERATE', 'PREDEFINED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiPredefinedTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "aiTaggingMethod" "AiTaggingMethod" NOT NULL DEFAULT 'DISABLED';
