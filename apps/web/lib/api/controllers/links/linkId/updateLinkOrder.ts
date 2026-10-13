import { prisma } from "@linkwarden/prisma";
import { UsersAndCollections } from "@linkwarden/prisma/client";
import getPermission from "@/lib/api/getPermission";
import {
  COLLECTION_ORDER_STEP,
  seedCollectionOrderForLinks,
} from "@linkwarden/lib/linkOrder";
import {
  UpdateLinkOrderSchema,
  UpdateLinkOrderSchemaType,
} from "@linkwarden/lib/schemaValidation";

/**
 * Moves one link within its own collection.
 *
 * A collection is read highest "collectionOrder" first, and `beforeId` names the link
 * the moved one should end up directly below -- the link that comes before it in the
 * list. The moved link takes the midpoint between that link's order and the order of
 * whatever currently sits below it, so only the moved row is ever written. No
 * `beforeId` means the top of the list.
 */
export default async function updateLinkOrder(
  userId: number,
  linkId: number,
  body: UpdateLinkOrderSchemaType
) {
  const dataValidation = UpdateLinkOrderSchema.safeParse(body);

  if (!dataValidation.success) {
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  const beforeId = dataValidation.data.beforeId;

  if (beforeId === linkId) {
    return {
      response: "A link can't be ordered against itself.",
      status: 400,
    };
  }

  const movedLink = await prisma.link.findUnique({
    where: { id: linkId },
    select: { id: true, collectionId: true },
  });

  if (!movedLink) {
    return { response: "Link not found.", status: 404 };
  }

  // Both links live in the same collection, so one permission check covers the pair:
  // the collection's owner, or a member with the admin role on it.
  const collection = await getPermission({
    userId,
    collectionId: movedLink.collectionId,
  });

  const memberHasAccess = collection?.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canUpdate
  );

  if (!collection || (collection.ownerId !== userId && !memberHasAccess)) {
    return { response: "Collection is not accessible.", status: 401 };
  }

  let newOrder: number | null = null;

  // Two passes at most: if the gap the link is being dropped into has been halved so
  // often that no double is left between its neighbours, the collection is spread
  // back out and the midpoint is worked out again against the new numbers.
  for (let attempt = 0; attempt < 2 && newOrder === null; attempt++) {
    if (beforeId === undefined) {
      // Reading the top row rather than asking for MAX(), which Prisma can't answer
      // from the index. See nextCollectionOrder.
      const topmost = await prisma.link.findFirst({
        where: { collectionId: movedLink.collectionId, id: { not: linkId } },
        orderBy: [{ collectionOrder: "desc" }, { id: "desc" }],
        select: { collectionOrder: true },
      });

      newOrder = (topmost?.collectionOrder ?? 0) + COLLECTION_ORDER_STEP;
      break;
    }

    const above = await prisma.link.findUnique({
      where: { id: beforeId },
      select: { id: true, collectionId: true, collectionOrder: true },
    });

    if (!above || above.collectionId !== movedLink.collectionId) {
      return {
        response: "Both links have to be in the same collection.",
        status: 400,
      };
    }

    // The link sitting directly below `above`, which is the other side of the gap the
    // moved link drops into. A row comparison rather than Prisma's OR of two
    // conditions, because only the row form becomes an index condition: the OR makes
    // Postgres start at the top of the collection and filter its way down, which for
    // a link halfway through a million-link collection measured 26ms against 0.005ms.
    const neighbours = await prisma.$queryRaw<{ collectionOrder: number }[]>`
      SELECT "collectionOrder"
      FROM "Link"
      WHERE "collectionId" = ${movedLink.collectionId}::integer
        AND "id" <> ${linkId}::integer
        AND ("collectionOrder", "id")
            < (${above.collectionOrder}::double precision, ${above.id}::integer)
      ORDER BY "collectionOrder" DESC, "id" DESC
      LIMIT 1
    `;

    const below = neighbours[0];

    if (!below) {
      // Dropped at the bottom of the list, so there is nothing to split.
      newOrder = above.collectionOrder - COLLECTION_ORDER_STEP;
      break;
    }

    const midpoint = (above.collectionOrder + below.collectionOrder) / 2;

    // Prisma rounds a double to about 16 significant figures both on the way out of
    // Postgres and on the way back in, so a midpoint any closer than that to one of
    // its neighbours would be stored as that neighbour and the two links would tie.
    // Asking for a little more room than that is what keeps every order distinct.
    const roomNeeded =
      Math.max(
        Math.abs(above.collectionOrder),
        Math.abs(below.collectionOrder)
      ) * 1e-15;

    if (
      midpoint - below.collectionOrder > roomNeeded &&
      above.collectionOrder - midpoint > roomNeeded
    ) {
      newOrder = midpoint;
      break;
    }

    await seedCollectionOrderForLinks(movedLink.collectionId);
  }

  if (newOrder === null) {
    return {
      response: "Couldn't work out where to put this link.",
      status: 500,
    };
  }

  const updatedLink = await prisma.link.update({
    where: { id: linkId },
    data: { collectionOrder: newOrder },
    include: {
      tags: true,
      collection: true,
      pinnedBy: {
        where: { id: userId },
        select: { id: true },
      },
    },
  });

  return { response: updatedLink, status: 200 };
}
