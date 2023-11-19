import { prisma } from "@/lib/api/db";

type Props = {
  userId: number;
  collectionId?: number;
  linkId?: number;
};

export default async function getPermission({
  userId,
  collectionId,
  linkId,
}: Props) {
  if (linkId) {
    const check = await prisma.collection.findFirst({
      where: {
        links: {
          some: {
            id: linkId,
          },
        },
      },
      include: { members: true },
    });

    return check;
  } else if (collectionId) {
    const check = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: { members: true },
    });

    return check;
  }
}
