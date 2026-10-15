import { prisma } from "@linkwarden/prisma";
import { ReadingListState } from "@linkwarden/types/global";
import getAccessibleCollectionIds from "@/lib/api/getAccessibleCollectionIds";

export default async function getReadingListState(userId: number) {
  const { accessibleCollectionIds } = await getAccessibleCollectionIds(userId);

  const items = await prisma.readingListItem.findMany({
    where: {
      userId,
      link: { collectionId: { in: accessibleCollectionIds } },
    },
    select: { linkId: true, readAt: true },
  });

  const response: ReadingListState = { unread: [], read: [] };
  for (const item of items) {
    (item.readAt ? response.read : response.unread).push(item.linkId);
  }

  return { response, status: 200 };
}
