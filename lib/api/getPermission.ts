import { prisma } from "@/lib/api/db";

type Props = {
  userId: number;
  collectionId?: number;
  collectionName?: string;
  linkId?: number;
};

export default async function getPermission({
  userId,
  collectionId,
  collectionName,
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
  } else if (collectionId || collectionName) {
    const check = await prisma.collection.findFirst({
      where: {
        id: collectionId || undefined,
        name: collectionName || undefined,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: { members: true },
    });

    return check;
  }
}
