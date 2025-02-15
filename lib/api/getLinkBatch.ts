import { PrismaClient, Prisma, Link } from "@prisma/client";

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

  const oldToNew = await prisma.link.findMany({
    where,
    take,
    orderBy: orderBy ?? { id: "asc" },
    include,
  });

  const newToOld = await prisma.link.findMany({
    where,
    take,
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
