/*
  Warnings:

  - The values [DARK,LIGHT,AUTO] on the enum `Theme` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Theme_new" AS ENUM ('dark', 'light', 'auto');
ALTER TABLE "User" ALTER COLUMN "theme" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "theme" TYPE "Theme_new" USING ("theme"::text::"Theme_new");
ALTER TYPE "Theme" RENAME TO "Theme_old";
ALTER TYPE "Theme_new" RENAME TO "Theme";
DROP TYPE "Theme_old";
ALTER TABLE "User" ALTER COLUMN "theme" SET DEFAULT 'dark';
COMMIT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "theme" SET DEFAULT 'dark';
