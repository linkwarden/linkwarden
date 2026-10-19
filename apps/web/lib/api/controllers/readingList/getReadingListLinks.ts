import { prisma } from "@linkwarden/prisma";
import type { Prisma } from "@linkwarden/prisma/client";
import {
  LinkRequestQuery,
  ReadingListStatus,
  Sort,
} from "@linkwarden/types/global";
import getAccessibleCollectionIds from "@/lib/api/getAccessibleCollectionIds";

export default async function getReadingListLinks(
  userId: number,
  status: ReadingListStatus,
  query: LinkRequestQuery
) {
  const take = Number(process.env.PAGINATION_TAKE_COUNT) || 50;
  const dateField = status === "read" ? "readAt" : "addedAt";

  let orderBy: Prisma.ReadingListItemOrderByWithRelationInput[];
  if (query.sort === Sort.NameAZ)
    orderBy = [{ link: { name: "asc" } }, { linkId: "asc" }];
  else if (query.sort === Sort.NameZA)
    orderBy = [{ link: { name: "desc" } }, { linkId: "desc" }];
  else if (query.sort === Sort.DateOldestFirst)
    orderBy = [{ [dateField]: "asc" }, { linkId: "asc" }];
  else orderBy = [{ [dateField]: "desc" }, { linkId: "desc" }];

  const { accessibleCollectionIds } = await getAccessibleCollectionIds(userId);

  const items = await prisma.readingListItem.findMany({
    take,
    skip: query.cursor ? 1 : undefined,
    cursor: query.cursor
      ? { userId_linkId: { userId, linkId: query.cursor } }
      : undefined,
    where: {
      userId,
      readAt: status === "read" ? { not: null } : null,
      link: { collectionId: { in: accessibleCollectionIds } },
    },
    orderBy,
    include: {
      link: {
        omit: { textContent: true },
        include: {
          tags: true,
          collection: true,
          pinnedBy: { where: { id: userId }, select: { id: true } },
        },
      },
    },
  });

  return {
    data: {
      links: items.map((item) => item.link),
      nextCursor: items.length === take ? items[items.length - 1].linkId : null,
    },
    statusCode: 200,
    success: true,
    message: "Success",
  };
}
