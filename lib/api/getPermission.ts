import { prisma } from "@/lib/api/db";

export default async function getPermission(
  userId: number,
  collectionId: number
) {
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
