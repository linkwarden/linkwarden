import { prisma } from "@linkwarden/prisma";

export default async function getReadingProgress({
  userId,
  linkId,
}: {
  userId: number;
  linkId: number;
}) {
  const readingProgress = await prisma.readingProgress.findUnique({
    where: {
      linkId_userId: {
        linkId,
        userId,
      },
    },
  });

  return { response: readingProgress?.progress ?? null, status: 200 };
}
