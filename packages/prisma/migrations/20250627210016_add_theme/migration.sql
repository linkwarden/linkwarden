DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
     WHERE t.typname = 'Theme'
       AND n.nspname = current_schema()
  ) THEN
    EXECUTE
      'CREATE TYPE "Theme" AS ENUM (''dark'', ''light'', ''auto'')';
  END IF;
END
$$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "theme" "Theme" NOT NULL DEFAULT 'dark';