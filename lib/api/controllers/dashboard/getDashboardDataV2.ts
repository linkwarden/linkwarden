import { prisma } from "@/lib/api/db";
import { LinkRequestQuery, Order, Sort } from "@/types/global";

type Response<D> =
  | {
      data: D;
      message: string;
      status: number;
    }
  | {
      data: D;
      message: string;
      status: number;
    };

export default async function getDashboardData(
  userId: number,
  query: LinkRequestQuery,
  viewRecent: boolean,
  viewPinned: boolean
): Promise<Response<any>> {
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
  else if (query.sort === Sort.DescriptionAZ) order = { description: "asc" };
  else if (query.sort === Sort.DescriptionZA) order = { description: "desc" };

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

  if (!viewRecent && !viewPinned) {
    return {
      data: {
        links: [],
        numberOfPinnedLinks,
      },
      message: "Dashboard data fetched successfully.",
      status: 200,
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

  const links = [...recentlyAddedLinks, ...pinnedLinks].sort(
    (a, b) => new Date(b.id).getTime() - new Date(a.id).getTime()
  );

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
    status: 200,
  };
}
