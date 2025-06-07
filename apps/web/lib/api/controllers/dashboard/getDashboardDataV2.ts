import { prisma } from "@linkwarden/prisma";
import { DashboardSection } from "@linkwarden/prisma/client";
import { LinkRequestQuery, Order, Sort } from "@linkwarden/types";

export default async function getDashboardData(
  userId: number,
  query: LinkRequestQuery,
  viewRecent: boolean,
  viewPinned: boolean,
  collectionSections: DashboardSection[]
) {
  let pinnedTake = 0;
  let recentTake = 0;

  if (viewPinned && viewRecent) {
    pinnedTake = 16;
    recentTake = 16;
  } else if (viewPinned && !viewRecent) {
    pinnedTake = 32;
  } else if (!viewPinned && viewRecent) {
    recentTake = 32;
  }

  let order: Order = { id: "desc" };
  if (query.sort === Sort.DateNewestFirst) order = { id: "desc" };
  else if (query.sort === Sort.DateOldestFirst) order = { id: "asc" };
  else if (query.sort === Sort.NameAZ) order = { name: "asc" };
  else if (query.sort === Sort.NameZA) order = { name: "desc" };

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
      take: pinnedTake,
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
      take: recentTake,
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

  let collectionLinks: any[] = [];

  if (collectionSections.length > 0) {
    const collectionIds = collectionSections
      .filter((section) => section.collectionId !== null)
      .map((section) => section.collectionId!);

    if (collectionIds.length > 0) {
      collectionLinks = await prisma.link.findMany({
        where: {
          AND: [
            {
              collection: {
                id: { in: collectionIds },
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
  }

  const links = [
    ...recentlyAddedLinks,
    ...pinnedLinks,
    ...collectionLinks,
  ].sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());

  // Make sure links are unique
  const uniqueLinks = links.filter(
    (link, index, self) => index === self.findIndex((t) => t.id === link.id)
  );

  return {
    data: {
      links: uniqueLinks,
      numberOfPinnedLinks,
    },
    message: "Dashboard data fetched successfully.",
    statusCode: 200,
    success: true,
  };
}
