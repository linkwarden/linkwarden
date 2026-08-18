DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_collation WHERE collname = 'und-x-icu') THEN
    ALTER TABLE "Link" ALTER COLUMN "name" TYPE TEXT COLLATE "und-x-icu";
    ALTER TABLE "Collection" ALTER COLUMN "name" TYPE TEXT COLLATE "und-x-icu";
    ALTER TABLE "Tag" ALTER COLUMN "name" TYPE TEXT COLLATE "und-x-icu";
  END IF;
END
$$;
