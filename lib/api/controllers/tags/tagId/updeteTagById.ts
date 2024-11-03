import { prisma } from "@/lib/api/db";
import { Tag } from "@prisma/client";

export default async function updeteTagById(
  userId: number,
  tagId: number,
  data: Tag
) {
  if (!tagId || !data.name)
    return { response: "Please choose a valid name for the tag.", status: 401 };

  const tagNameIsTaken = await prisma.tag.findFirst({
    where: {
      ownerId: userId,
      name: data.name,
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
      name: data.name,
    },
  });

  return { response: updatedTag, status: 200 };
}
