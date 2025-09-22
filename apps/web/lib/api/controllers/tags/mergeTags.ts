import {
  MergeTagsSchema,
  MergeTagsSchemaType,
} from "@linkwarden/lib/schemaValidation";
import { prisma } from "@linkwarden/prisma";

export default async function mergeTags(
  userId: number,
  body: MergeTagsSchemaType
) {
  const dataValidation = MergeTagsSchema.safeParse(body);

  if (!dataValidation.success) {
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  const { tagIds, newTagName } = dataValidation.data;

  let affectedLinks: number[];

  affectedLinks = (
    await prisma.link.findMany({
      where: {
        tags: {
          some: {
            id: {
              in: tagIds,
            },
            ownerId: userId,
          },
        },
      },
      select: {
        id: true,
      },
    })
  ).map((link) => link.id);

  const { newTag } = await prisma.$transaction(async (tx) => {
    await tx.tag.deleteMany({
      where: {
        ownerId: userId,
        id: {
          in: tagIds,
        },
      },
    });

    const newTag = await tx.tag.create({
      data: {
        name: newTagName,
        ownerId: userId,
        links: {
          connect: affectedLinks.map((id) => ({ id })),
        },
      },
    });

    await tx.link.updateMany({
      where: {
        id: {
          in: affectedLinks,
        },
      },
      data: {
        indexVersion: null,
      },
    });

    return { newTag };
  });

  return { response: newTag, status: 200 };
}
