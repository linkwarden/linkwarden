import { prisma } from "@/lib/api/db";
import { LinkRequestQuery, Sort } from "@/types/global";

export default async function getDashboardData(
  userId: number,
  query: LinkRequestQuery
) {
  let order: any;
  if (query.sort === Sort.DateNewestFirst) order = { id: "desc" };
  else if (query.sort === Sort.DateOldestFirst) order = { id: "asc" };
  else if (query.sort === Sort.NameAZ) order = { name: "asc" };
  else if (query.sort === Sort.NameZA) order = { name: "desc" };
  else if (query.sort === Sort.DescriptionAZ) order = { description: "asc" };
  else if (query.sort === Sort.DescriptionZA) order = { description: "desc" };

  const pinnedLinks = await prisma.link.findMany({
    take: 8,
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
    take: 8,
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

  return { response: links, status: 200 };
}
