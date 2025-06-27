import { prisma } from "@linkwarden/prisma";
import { Order } from "@linkwarden/types";

export default async function getDashboardData(userId: number) {
  let order: Order = { id: "desc" };

  const dashboardSections = await prisma.dashboardSection.findMany({
    where: {
      userId,
    },
  });

  const viewPinned = dashboardSections.some(
    (section) => section.type === "PINNED_LINKS"
  );

  const viewRecent = dashboardSections.some(
    (section) => section.type === "RECENT_LINKS"
  );

  const collectionSections = dashboardSections.filter(
    (section) => section.type === "COLLECTION"
  );

  const numberOfPinnedLinks = await prisma.link.count({
    where: {
      AND: [
        {
          collection: {
            OR: [
              { ownerId: userId },
              {
                members: {
                  some: { userId },
                },
              },
            ],
          },
        },
        {
          pinnedBy: { some: { id: userId } },
        },
      ],
    },
  });

  if (!viewRecent && !viewPinned && collectionSections.length === 0) {
    return {
      data: {
        links: [],
        numberOfPinnedLinks,
      },
      message: "Dashboard data fetched successfully.",
      statusCode: 200,
      success: true,
    };
  }

  let pinnedLinks: any[] = [];

  if (viewPinned) {
    pinnedLinks = await prisma.link.findMany({
      take: 16,
      where: {
        AND: [
          {
            collection: {
              OR: [
                { ownerId: userId },
                {
                  members: {
                    some: { userId },
                  },
                },
              ],
            },
          },
          {
            pinnedBy: { some: { id: userId } },
          },
        ],
      },
      omit: {
        textContent: true,
      },
      include: {
        tags: true,
        collection: true,
        pinnedBy: {
          where: { id: userId },
          select: { id: true },
        },
      },
      orderBy: order || { id: "desc" },
    });
  }

  let recentlyAddedLinks: any[] = [];

  if (viewRecent) {
    recentlyAddedLinks = await prisma.link.findMany({
      take: 16,
      where: {
        collection: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: { userId },
              },
            },
          ],
        },
      },
      omit: {
        textContent: true,
      },
      include: {
        tags: true,
        collection: true,
        pinnedBy: {
          where: { id: userId },
          select: { id: true },
        },
      },
      orderBy: order || { id: "desc" },
    });
  }

  let collectionLinks: any = {};

  if (collectionSections.length > 0) {
    const collectionIds = collectionSections
      .filter((section) => section.collectionId !== null)
      .map((section) => section.collectionId!);

    if (collectionIds.length > 0) {
      for (const collectionId of collectionIds) {
        const links = await prisma.link.findMany({
          where: {
            AND: [
              {
                collection: {
                  id: collectionId,
                  OR: [
                    { ownerId: userId },
                    {
                      members: {
                        some: { userId },
                      },
                    },
                  ],
                },
              },
            ],
          },
          take: 16,
          omit: {
            textContent: true,
          },
          include: {
            tags: true,
            collection: true,
            pinnedBy: {
              where: { id: userId },
              select: { id: true },
            },
          },
          orderBy: order || { id: "desc" },
        });
        collectionLinks[collectionId] = links;
      }
    }
  }

  const links = [...recentlyAddedLinks, ...pinnedLinks].sort(
    (a, b) => new Date(b.id).getTime() - new Date(a.id).getTime()
  );

  const uniqueLinks = links.filter(
    (link, index, self) => index === self.findIndex((t) => t.id === link.id)
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
