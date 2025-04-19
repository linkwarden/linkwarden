import { PrismaClient, Prisma } from "@linkwarden/prisma/client";

const prisma = new PrismaClient();

/**
 * Fetches the first and last X links from the database based on the provided conditions.
 * @param prisma - Prisma client instance
 * @param params - Prisma query parameters (optional)
 * @returns A list of links
 */
const getLinkBatch = async <T extends Prisma.LinkFindManyArgs>(
  params: T
): Promise<Array<Prisma.LinkGetPayload<T>>> => {
  const { where = {}, take = 10, orderBy, include } = params;

  let oldToNew: any = [];

  const firstTake = Math.floor(take / 2);
  const secondTake = Math.ceil(take / 2);

  if (firstTake > 0)
    oldToNew = await prisma.link.findMany({
      where,
      take: firstTake,
      orderBy: orderBy ?? { id: "asc" },
      include,
    });

  let newToOld: any = [];

  if (secondTake > 0)
    newToOld = await prisma.link.findMany({
      where,
      take: secondTake,
      orderBy: orderBy ?? { id: "desc" },
      include,
    });

  const links = [...oldToNew, ...newToOld]
    // Make sure we don't process the same link twice
    .filter((value, index, self) => {
      return self.findIndex((item) => item.id === value.id) === index;
    });

  return links as Array<Prisma.LinkGetPayload<T>>;
};

export default getLinkBatch;
