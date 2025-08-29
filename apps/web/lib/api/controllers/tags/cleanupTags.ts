import { PrismaClient } from "@linkwarden/prisma/client";

export default async function cleanupTags(minLinksPerTag: number) {
  const prisma = new PrismaClient();

  const deletedCount = await prisma.$executeRawUnsafe(
    `
    DELETE FROM "Tag"
    WHERE id IN (
      SELECT T.id
      FROM "Tag" T
      LEFT JOIN "_LinkToTag" LTT ON T.id = LTT."B"
      GROUP BY T.id
      HAVING COUNT(LTT."A") <= $1
    );
  `,
    minLinksPerTag
  );

  return deletedCount;
}
