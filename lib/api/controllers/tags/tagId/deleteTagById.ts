import { prisma } from "@/lib/api/db";

export default async function deleteTagById(userId: number, tagId: number) {
  if (!tagId)
    return { response: "Please choose a valid name for the tag.", status: 401 };

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

  const updatedTag = await prisma.tag.delete({
    where: {
      id: tagId,
    },
  });

  return { response: updatedTag, status: 200 };
}
