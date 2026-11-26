import { prisma } from "@linkwarden/prisma";
import { LinkRequestQuery, Order, Sort } from "@linkwarden/types/global";
import getAccessibleCollectionIds from "@/lib/api/getAccessibleCollectionIds";

const TAKE_COUNT = 10;

type LinkDateFields = {
  importDate?: Date | string | null;
  createdAt?: Date | string | null;
};

/**
 * The date a link is displayed with. Kept in sync with LinkDate.tsx, which
 * renders `importDate || createdAt`: an imported link keeps the date it
 * originally had in the source service, anything created in-app falls back to
 * its own creation time.
 */
const effectiveDate = (link: LinkDateFields) =>
  new Date(link.importDate ?? link.createdAt ?? 0).getTime();

export default async function getDashboardData(
  userId: number,
  query: LinkRequestQuery
) {
  const sort = query.sort ?? Sort.DateNewestFirst;

  // DateNewestFirst -> desc, DateOldestFirst -> asc,
  // NameAZ -> asc, NameZA -> desc.
  const direction: "asc" | "desc" =
    sort === Sort.DateOldestFirst || sort === Sort.NameAZ ? "asc" : "desc";

  const isDateSort =
    sort === Sort.DateNewestFirst || sort === Sort.DateOldestFirst;

  const nameOrder: Order = { name: direction };

  const { accessibleCollectionIds } = await getAccessibleCollectionIds(userId);

  const include = {
    tags: true,
    collection: true,
    pinnedBy: {
      where: { id: userId },
      select: { id: true },
    },
  };

  /**
   * Prisma cannot express COALESCE("importDate", "createdAt") in a single
   * orderBy, so the two halves are fetched separately and merged in memory.
   * Both halves are capped at TAKE_COUNT, which is enough because the merged
   * result is truncated back to TAKE_COUNT.
   */
  const fetchOrdered = async (where: any) => {
    if (!isDateSort) {
      return prisma.link.findMany({
        take: TAKE_COUNT,
        where,
        include,
        orderBy: [nameOrder, { id: direction }],
      });
    }

    const [imported, created] = await Promise.all([
      prisma.link.findMany({
        take: TAKE_COUNT,
        where: { AND: [where, { importDate: { not: null } }] },
        include,
        orderBy: [{ importDate: direction }, { id: direction }],
      }),
      prisma.link.findMany({
        take: TAKE_COUNT,
        where: { AND: [where, { importDate: null }] },
        include,
        orderBy: [{ createdAt: direction }, { id: direction }],
      }),
    ]);

    return [...imported, ...created]
      .sort((a, b) =>
        direction === "desc"
          ? effectiveDate(b) - effectiveDate(a)
          : effectiveDate(a) - effectiveDate(b)
      )
      .slice(0, TAKE_COUNT);
  };

  const [pinnedLinks, recentlyAddedLinks] = await Promise.all([
    fetchOrdered({
      AND: [
        {
          collectionId: { in: accessibleCollectionIds },
        },
        {
          pinnedBy: { some: { id: userId } },
        },
      ],
    }),
    fetchOrdered({
      collectionId: { in: accessibleCollectionIds },
    }),
  ]);

  const combinedLinks = [...recentlyAddedLinks, ...pinnedLinks];

  const uniqueLinks = Array.from(
    combinedLinks
      .reduce((map, item) => map.set(item.id, item), new Map())
      .values()
  );

  // Pinned and recent rows are merged from two queries, so the merged list has
  // to be re-sorted with the same comparator used above.
  const links = uniqueLinks.sort((a, b) => {
    if (isDateSort) {
      return direction === "desc"
        ? effectiveDate(b) - effectiveDate(a)
        : effectiveDate(a) - effectiveDate(b);
    }

    const byName = (a.name ?? "").localeCompare(b.name ?? "");
    return direction === "desc" ? -byName : byName;
  });

  return { response: links, status: 200 };
}
