-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('DARK', 'LIGHT', 'AUTO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "readableFontFamily" TEXT,
ADD COLUMN     "readableFontSize" TEXT,
ADD COLUMN     "readableLineHeight" TEXT,
ADD COLUMN     "readableLineWidth" TEXT,
ADD COLUMN     "theme" "Theme" NOT NULL DEFAULT 'AUTO';
