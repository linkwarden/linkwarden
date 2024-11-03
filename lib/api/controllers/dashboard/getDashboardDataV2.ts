import { prisma } from "@/lib/api/db";
import { LinkRequestQuery, Sort } from "@/types/global";

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
  query: LinkRequestQuery
): Promise<Response<any>> {
  let order: any;
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

  const pinnedLinks = await prisma.link.findMany({
    take: 10,
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

  const recentlyAddedLinks = await prisma.link.findMany({
    take: 10,
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

  const links = [...recentlyAddedLinks, ...pinnedLinks].sort(
    (a, b) => (new Date(b.id) as any) - (new Date(a.id) as any)
  );

  return {
    data: {
      links,
      numberOfPinnedLinks,
    },
    message: "Dashboard data fetched successfully.",
    status: 200,
  };
}
