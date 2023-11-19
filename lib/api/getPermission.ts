import { prisma } from "@/lib/api/db";

type Props = {
  userId?: number;
  collectionId?: number;
  linkId?: number;
  isPublic?: boolean;
};

export default async function getPermission({
  userId,
  collectionId,
  linkId,
  isPublic,
}: Props) {
  if (linkId) {
    const check = await prisma.collection.findFirst({
      where: {
        [isPublic ? "OR" : "AND"]: [
          {
            id: collectionId,
            OR: [{ ownerId: userId }, { members: { some: { userId } } }],
            links: {
              some: {
                id: linkId,
              },
            },
          },
          {
            isPublic: isPublic ? true : undefined,
          },
        ],
      },
      include: { members: true },
    });

    return check;
  } else if (collectionId) {
    const check = await prisma.collection.findFirst({
      where: {
        [isPublic ? "OR" : "AND"]: [
          {
            id: collectionId,
            OR: [{ ownerId: userId }, { members: { some: { userId } } }],
          },
          {
            isPublic: isPublic ? true : undefined,
          },
        ],
      },
      include: { members: true },
    });

    return check;
  }
}
