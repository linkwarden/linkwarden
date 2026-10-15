import { prisma } from "@linkwarden/prisma";
import getAccessibleCollectionIds from "@/lib/api/getAccessibleCollectionIds";
import {
  ReadingListUpdateSchema,
  ReadingListUpdateSchemaType,
} from "@linkwarden/lib/schemaValidation";

export default async function updateReadingList(
  userId: number,
  body: ReadingListUpdateSchemaType
) {
  const dataValidation = ReadingListUpdateSchema.safeParse(body);

  if (!dataValidation.success) {
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  const { read } = dataValidation.data;
  const linkIds = Array.from(new Set(dataValidation.data.linkIds));

  const { accessibleCollectionIds } = await getAccessibleCollectionIds(userId);

  const accessibleLinkCount = await prisma.link.count({
    where: {
      id: { in: linkIds },
      collectionId: { in: accessibleCollectionIds },
    },
  });

  if (accessibleLinkCount !== linkIds.length)
    return { response: "Link not found or not accessible.", status: 401 };

  const now = new Date();

  await prisma.$transaction([
    prisma.readingListItem.createMany({
      data: linkIds.map((linkId) => ({
        userId,
        linkId,
        addedAt: now,
        readAt: read ? now : null,
      })),
      skipDuplicates: true,
    }),
    // Existing entries only change when their status flips. Going back to
    // unread also resets addedAt, which puts the link at the top of the queue.
    prisma.readingListItem.updateMany({
      where: {
        userId,
        linkId: { in: linkIds },
        readAt: read ? null : { not: null },
      },
      data: read ? { readAt: now } : { readAt: null, addedAt: now },
    }),
  ]);

  return { response: "Reading list updated.", status: 200 };
}
