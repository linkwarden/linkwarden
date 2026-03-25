import { prisma } from "@linkwarden/prisma";
import { UsersAndCollections } from "@linkwarden/prisma/client";

type MemberPerms = Pick<
  UsersAndCollections,
  "userId" | "canCreate" | "canUpdate" | "canDelete"
>;

function mergePerms(a: MemberPerms, b: MemberPerms): MemberPerms {
  return {
    userId: a.userId,
    canCreate: a.canCreate || b.canCreate,
    canUpdate: a.canUpdate || b.canUpdate,
    canDelete: a.canDelete || b.canDelete,
  };
}

export default async function getCollectionRootOwnerAndMembers(
  parentId: number
) {
  const userMap = new Map<number, MemberPerms>();

  const addUser = (u: MemberPerms) => {
    const existing = userMap.get(u.userId);
    userMap.set(u.userId, existing ? mergePerms(existing, u) : u);
  };

  let currentId: number | null = parentId;
  let rootOwnerId: number | null = null;

  while (currentId) {
    const col: {
      parentId: number | null;
      ownerId: number;
      members: MemberPerms[];
    } | null = await prisma.collection.findUnique({
      where: { id: currentId },
      select: {
        parentId: true,
        ownerId: true,
        members: {
          select: {
            userId: true,
            canCreate: true,
            canUpdate: true,
            canDelete: true,
          },
        },
      },
    });

    if (!col) break;

    rootOwnerId = col.ownerId;

    addUser({
      userId: col.ownerId,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    });

    for (const m of col.members) {
      addUser(m);
    }

    currentId = col.parentId ?? null;
  }

  return {
    rootOwnerId,
    members: Array.from(userMap.values()),
  };
}
