import { prisma } from "@linkwarden/prisma";
import {
  UpdateTagSchema,
  UpdateTagSchemaType,
} from "@/lib/shared/schemaValidation";

export default async function updateTagById(
  userId: number,
  tagId: number,
  body: UpdateTagSchemaType
) {
  const dataValidation = UpdateTagSchema.safeParse(body);

  if (!dataValidation.success) {
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  const { name } = dataValidation.data;

  const tagNameIsTaken = await prisma.tag.findFirst({
    where: {
      ownerId: userId,
      name: name,
    },
  });

  if (tagNameIsTaken)
    return {
      response: "Tag names should be unique.",
      status: 400,
    };

  const targetTag = await prisma.tag.findUnique({
    where: {
      id: tagId,
    },
  });

  if (targetTag?.ownerId !== userId)
    return {
      response: "Permission denied.",
      status: 401,
    };

  const updatedTag = await prisma.tag.update({
    where: {
      id: tagId,
    },
    data: {
      name: name,
    },
    include: {
      links: {
        select: {
          id: true,
        },
      },
    },
  });

  const { links, ...data } = updatedTag;

  const linkIds = links.map((link) => link.id);

  await prisma.link.updateMany({
    where: {
      id: {
        in: linkIds,
      },
    },
    data: {
      indexVersion: null,
    },
  });

  return { response: data, status: 200 };
}
