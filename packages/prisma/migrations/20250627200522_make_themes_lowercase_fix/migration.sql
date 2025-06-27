BEGIN;

CREATE TYPE "Theme_new" AS ENUM ('dark', 'light', 'auto');

ALTER TABLE "User" ALTER COLUMN "theme" DROP DEFAULT;

UPDATE "User"
SET "theme" = lower("theme"::text);

ALTER TABLE "User"
ALTER COLUMN "theme" TYPE "Theme_new"
USING ("theme"::text::"Theme_new");

DROP TYPE "Theme";

ALTER TYPE "Theme_new" RENAME TO "Theme";

ALTER TABLE "User" ALTER COLUMN "theme" SET DEFAULT 'dark';

COMMIT;