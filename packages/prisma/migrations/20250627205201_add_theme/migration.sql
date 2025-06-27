CREATE TYPE IF NOT EXISTS "Theme" AS ENUM ('dark', 'light', 'auto');

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "theme" "Theme" NOT NULL DEFAULT 'dark';