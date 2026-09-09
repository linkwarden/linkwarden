import { prisma } from "@linkwarden/prisma";
import { Order } from "@linkwarden/types/global";
import getAccessibleCollectionIds from "@/lib/api/getAccessibleCollectionIds";

export default async function getDashboardData(userId: number) {
  const order: Order = { id: "desc" };
  const { accessibleCollectionIds, memberCollectionIds } =
    await getAccessibleCollectionIds(userId);
  const accessibleCollectionIdSet = new Set(accessibleCollectionIds);
  const accessibleTagsWhere = {
    OR: [
      { ownerId: userId },
      {
        links: {
          some: {
            collectionId: { in: memberCollectionIds },
          },
        },
      },
    ],
  };

  const [dashboardSections, numberOfPinnedLinks, numberOfTags] =
    await Promise.all([
      prisma.dashboardSection.findMany({ where: { userId } }),
      prisma.link.count({
        where: {
          AND: [
            { collectionId: { in: accessibleCollectionIds } },
            { pinnedBy: { some: { id: userId } } },
          ],
        },
      }),
      prisma.tag.count({
        where: accessibleTagsWhere,
      }),
    ]);

  const viewPinned = dashboardSections.some(
    (section) => section.type === "PINNED_LINKS"
  );
  const viewRecent = dashboardSections.some(
    (section) => section.type === "RECENT_LINKS"
  );
  const collectionSections = dashboardSections.filter(
    (section) => section.type === "COLLECTION"
  );

  if (!viewRecent && !viewPinned && collectionSections.length === 0) {
    return {
      data: { links: [], numberOfPinnedLinks, numberOfTags },
      message: "Dashboard data fetched successfully.",
      statusCode: 200,
      success: true,
    };
  }

  // Prepare promises for pinned and recent links
  const pinnedLinksPromise = viewPinned
    ? prisma.link.findMany({
        take: 16,
        where: {
          AND: [
            { collectionId: { in: accessibleCollectionIds } },
            { pinnedBy: { some: { id: userId } } },
          ],
        },
        omit: { textContent: true },
        include: {
          tags: true,
          collection: true,
          pinnedBy: {
            where: { id: userId },
            select: { id: true },
          },
        },
        orderBy: order,
      })
    : Promise.resolve([] as any[]);

  const recentLinksPromise = viewRecent
    ? prisma.link.findMany({
        take: 16,
        where: {
          collectionId: { in: accessibleCollectionIds },
        },
        omit: { textContent: true },
        include: {
          tags: true,
          collection: true,
          pinnedBy: {
            where: { id: userId },
            select: { id: true },
          },
        },
        orderBy: order,
      })
    : Promise.resolve([] as any[]);

  const collectionIds = collectionSections
    .map((section) => section.collectionId)
    .filter((id): id is number => id != null);

  const collectionPromises = collectionIds.map((colId) =>
    (accessibleCollectionIdSet.has(colId)
      ? prisma.link.findMany({
          where: { collectionId: colId },
          take: 16,
          omit: { textContent: true },
          include: {
            tags: true,
            collection: true,
            pinnedBy: {
              where: { id: userId },
              select: { id: true },
            },
          },
          orderBy: order,
        })
      : Promise.resolve([] as any[])
    ).then((links) => ({ colId, links }))
  );

  const [pinnedLinks, recentlyAddedLinks, ...collectionsResult] =
    await Promise.all([
      pinnedLinksPromise,
      recentLinksPromise,
      ...collectionPromises,
    ]);

  const collectionLinks: Record<number, any[]> = {};
  collectionsResult.forEach(({ colId, links }) => {
    collectionLinks[colId] = links;
  });

  const merged = [...recentlyAddedLinks, ...pinnedLinks].sort(
    (a, b) => new Date(b.id).getTime() - new Date(a.id).getTime()
  );
  const uniqueLinks = merged.filter(
    (link, idx, arr) => idx === arr.findIndex((l) => l.id === link.id)
  );

  return {
    data: {
      links: uniqueLinks,
      collectionLinks,
      numberOfPinnedLinks,
      numberOfTags,
    },
    message: "Dashboard data fetched successfully.",
    statusCode: 200,
    success: true,
  };
}
