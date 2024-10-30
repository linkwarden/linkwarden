import { prisma } from "@/lib/api/db";
import {
  UpdateTagSchema,
  UpdateTagSchemaType,
} from "@/lib/shared/schemaValidation";

export default async function updeteTagById(
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
  });

  return { response: updatedTag, status: 200 };
}
