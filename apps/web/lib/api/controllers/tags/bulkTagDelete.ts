import {
  TagBulkDeletionSchema,
  TagBulkDeletionSchemaType,
} from "@linkwarden/lib/schemaValidation";
import { prisma } from "@linkwarden/prisma";

export default async function bulkTagDelete(
  userId: number,
  body: TagBulkDeletionSchemaType
) {
  const dataValidation = TagBulkDeletionSchema.safeParse(body);

  if (!dataValidation.success) {
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  const { tagIds } = dataValidation.data;

  let deletedTag: number;
  let affectedLinks: number[];

  affectedLinks = (
    await prisma.link.findMany({
      where: {
        tags: {
          some: {
            ownerId: userId,
          },
        },
      },
      select: {
        id: true,
      },
    })
  ).map((link) => link.id);

  deletedTag = (
    await prisma.tag.deleteMany({
      where: {
        ownerId: userId,
        id: {
          in: tagIds,
        },
      },
    })
  ).count;

  await prisma.link.updateMany({
    where: {
      id: {
        in: affectedLinks,
      },
    },
    data: {
      indexVersion: null,
    },
  });

  return { response: deletedTag, status: 200 };
}
