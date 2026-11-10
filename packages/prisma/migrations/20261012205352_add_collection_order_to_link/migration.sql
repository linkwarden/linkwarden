-- AlterTable
-- A constant DEFAULT lets Postgres add the column without rewriting the table, so
-- this stays O(1) no matter how many links the instance has. The default is dropped
-- again at the end: every insert is expected to pass an explicit order.
ALTER TABLE "Link" ADD COLUMN "collectionOrder" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Seed each collection independently, oldest link first, 65536 apart.
--
-- Deliberately a loop of small statements rather than one windowed UPDATE over the
-- whole table. The single-statement version builds a hash join the size of "Link",
-- which spills to disk at Postgres' default work_mem of 4MB: measured on 3M links
-- that is 613s at 4MB versus 77s at 256MB. Self-hosters run the default, so the
-- shape below (bounded ~50k-row chunks, so the join stays in memory whatever
-- work_mem is set to) is the one that behaves the same everywhere.
DO $$
DECLARE
  step CONSTANT double precision := 65536;
  chunk_size CONSTANT integer := 50000;
  collection_id integer;
  cursor_id integer;
  ranked_before bigint;
  rows_ranked integer;
  highest_id integer;
  highest_rank bigint;
BEGIN
  FOR collection_id IN SELECT "id" FROM "Collection" ORDER BY "id" LOOP
    -- Ranking by id rather than by a date column keeps the seeded order identical to
    -- the "newest first" list the app already shows, so turning on the custom sort for
    -- the first time doesn't visibly rearrange anything.
    cursor_id := 0;
    ranked_before := 0;

    LOOP
      WITH page AS (
        SELECT "id"
        FROM "Link"
        WHERE "collectionId" = collection_id
          AND "id" > cursor_id
        ORDER BY "id"
        LIMIT chunk_size
      ),
      ranked AS (
        SELECT "id", row_number() OVER (ORDER BY "id") AS rank
        FROM page
      ),
      seeded AS (
        UPDATE "Link" l
        SET "collectionOrder" = (ranked_before + ranked.rank) * step
        FROM ranked
        WHERE l."id" = ranked."id"
        RETURNING ranked."id", ranked.rank
      )
      SELECT count(*), coalesce(max("id"), 0), coalesce(max(rank), 0)
      INTO rows_ranked, highest_id, highest_rank
      FROM seeded;

      EXIT WHEN rows_ranked = 0;

      cursor_id := highest_id;
      ranked_before := ranked_before + highest_rank;

      EXIT WHEN rows_ranked < chunk_size;
    END LOOP;
  END LOOP;
END
$$;

ALTER TABLE "Link" ALTER COLUMN "collectionOrder" DROP DEFAULT;

-- CreateIndex
-- Scanned backwards for the "collectionOrder DESC, id DESC" the list is read in, and
-- forwards to find a link's neighbour when something is dropped next to it.
CREATE INDEX "Link_collectionId_collectionOrder_id_idx" ON "Link"("collectionId", "collectionOrder", "id");
