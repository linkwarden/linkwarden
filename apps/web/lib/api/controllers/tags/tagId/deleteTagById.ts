import { prisma } from "@linkwarden/prisma";

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

  const deletedTag = await prisma.tag.delete({
    where: {
      id: tagId,
    },
    include: {
      links: {
        select: {
          id: true,
        },
      },
    },
  });

  const { links, ...data } = deletedTag;

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
