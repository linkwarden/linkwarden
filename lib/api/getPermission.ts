import { prisma } from "@/lib/api/db";

export default async function getPermission(
  userId: number,
  collectionId: number,
  linkId?: number
) {
  if (linkId) {
    const link = await prisma.link.findUnique({
      where: {
        id: linkId,
      },
      include: {
        collection: {
          include: { members: true },
        },
      },
    });

    return link;
  } else {
    const check = await prisma.collection.findFirst({
      where: {
        AND: {
          id: collectionId,
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      },
      include: { members: true },
    });

    return check;
  }
}
