import { prisma } from "@linkwarden/prisma";
import { Order } from "@linkwarden/types";

export default async function getDashboardData(userId: number) {
  const order: Order = { id: "desc" };

  const [dashboardSections, numberOfPinnedLinks] = await Promise.all([
    prisma.dashboardSection.findMany({ where: { userId } }),
    prisma.link.count({
      where: {
        AND: [
          {
            collection: {
              OR: [{ ownerId: userId }, { members: { some: { userId } } }],
            },
          },
          { pinnedBy: { some: { id: userId } } },
        ],
      },
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
      data: { links: [], numberOfPinnedLinks },
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
            {
              collection: {
                OR: [{ ownerId: userId }, { members: { some: { userId } } }],
              },
            },
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
          collection: {
            OR: [{ ownerId: userId }, { members: { some: { userId } } }],
          },
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
    prisma.link
      .findMany({
        where: {
          AND: [
            {
              collection: {
                id: colId,
                OR: [{ ownerId: userId }, { members: { some: { userId } } }],
              },
            },
          ],
        },
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
      .then((links) => ({ colId, links }))
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
    },
    message: "Dashboard data fetched successfully.",
    statusCode: 200,
    success: true,
  };
}
