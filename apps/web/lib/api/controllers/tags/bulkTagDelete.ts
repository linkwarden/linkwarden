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

  const { numberOfLinks, allTags } = dataValidation.data;

  let deletedTag: number;
  let affectedLinks: number[];

  if (allTags) {
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
        },
      })
    ).count;
  } else {
    const tags = await prisma.tag.findMany({
      where: {
        ownerId: userId,
      },
      select: {
        id: true,
        links: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            links: true,
          },
        },
      },
    });

    const tagsToDelete = tags
      .filter((tag) => tag._count.links === (numberOfLinks ?? 0))
      .map((tag) => tag.id);

    const links = tags
      .filter((tag) => tag._count.links === (numberOfLinks ?? 0))
      .map((tag) => tag.links);

    affectedLinks = links.flat().map((link) => link.id);

    deletedTag = (
      await prisma.tag.deleteMany({
        where: {
          id: {
            in: tagsToDelete,
          },
        },
      })
    ).count;
  }

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
