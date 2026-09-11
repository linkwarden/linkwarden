-- Add the opt-in publication-date preference.
ALTER TABLE "User"
ADD COLUMN "usePublicationDate" BOOLEAN NOT NULL DEFAULT false;

-- Add the publication date without changing the effective date of existing links.
ALTER TABLE "Link"
ADD COLUMN "publishedAt" TIMESTAMP(3);

UPDATE "Link"
SET "publishedAt" = "createdAt";

ALTER TABLE "Link"
ALTER COLUMN "publishedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Link"
ALTER COLUMN "publishedAt" SET NOT NULL;
