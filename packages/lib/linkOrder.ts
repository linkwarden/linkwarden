import { prisma } from "@linkwarden/prisma";

export const COLLECTION_ORDER_STEP = 65536;

/**
 * Spreads one collection's links back out onto COLLECTION_ORDER_STEP, in the order
 * they are already in.
 *
 * This is the add_collection_order_to_link migration's numbering applied to a single
 * collection, with one difference that matters: it ranks by "collectionOrder" rather
 * than by id. On a collection nobody has rearranged the two rank identically, because
 * that is exactly what the migration set up -- but once someone has moved a link,
 * ranking by id again would throw away the order they arranged and put the collection
 * back in date order. Ranking by the current order just re-spaces it, which is the
 * whole point of running this: the link being dropped is about to be placed between
 * the same two neighbours, now with room between them again.
 *
 * One statement rather than the migration's chunked loop, for two reasons. The column
 * being written is the one the rows are ranked by, so a chunked walk would page over
 * rows it had already renumbered. And a collection is never left half-renumbered,
 * which would scramble the order it was called to preserve.
 */
export async function seedCollectionOrderForLinks(collectionId: number) {
  await prisma.$executeRaw`
    UPDATE "Link" l
    SET "collectionOrder" = ranked.rank * ${COLLECTION_ORDER_STEP}::double precision
    FROM (
      SELECT "id",
             row_number() OVER (ORDER BY "collectionOrder", "id") AS rank
      FROM "Link"
      WHERE "collectionId" = ${collectionId}::integer
    ) ranked
    WHERE l."id" = ranked."id"
  `;
}

/**
 * The order a link needs to sit at the top of its collection, which is where a newly
 * created link belongs: the list reads highest order first, so the newest link is the
 * highest. Returns COLLECTION_ORDER_STEP for an empty collection, matching the first
 * rank the seed hands out.
 */
export async function nextCollectionOrder(collectionId: number) {
  const topmost = await prisma.link.findFirst({
    where: { collectionId },
    orderBy: { collectionOrder: "desc" },
    select: { collectionOrder: true },
  });

  return (topmost?.collectionOrder ?? 0) + COLLECTION_ORDER_STEP;
}
