import { prisma } from "@linkwarden/prisma";
import {
  UpsertReadingProgressSchema,
  UpsertReadingProgressSchemaType,
} from "@linkwarden/lib/schemaValidation";

export default async function upsertReadingProgress(
  userId: number,
  linkId: number,
  body: UpsertReadingProgressSchemaType
) {
  const dataValidation = UpsertReadingProgressSchema.safeParse(body);

  if (!dataValidation.success) {
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  const { progress } = dataValidation.data;

  // check if user has access to the link's collection
  const collection = await prisma.collection.findFirst({
    where: {
      links: {
        some: {
          id: linkId,
        },
      },
    },
    include: {
      members: true,
    },
  });

  if (
    !collection ||
    (!collection.members.some((m) => m.userId === userId) &&
      !(collection.ownerId === userId))
  ) {
    return {
      status: 400,
      response: "Collection not accessible",
    };
  }

  const readingProgress = await prisma.readingProgress.upsert({
    where: {
      linkId_userId: {
        linkId,
        userId,
      },
    },
    update: {
      progress,
    },
    create: {
      userId,
      linkId,
      progress,
    },
  });

  return {
    status: 200,
    response: readingProgress,
  };
}
