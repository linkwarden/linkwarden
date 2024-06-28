import { prisma } from "@/lib/api/db";
import { Link, UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";
import { removeFiles } from "@/lib/api/manageLinkFiles";

export default async function deleteLink(userId: number, linkId: number) {
  if (!linkId) return { response: "Please choose a valid link.", status: 401 };

  const collectionIsAccessible = await getPermission({ userId, linkId });

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canDelete
  );

  if (
    !collectionIsAccessible ||
    !(collectionIsAccessible?.ownerId === userId || memberHasAccess)
  )
    return { response: "Collection is not accessible.", status: 401 };

  const deleteLink: Link = await prisma.link.delete({
    where: {
      id: linkId,
    },
  });

  removeFiles(linkId, collectionIsAccessible.id);

  return { response: deleteLink, status: 200 };
}
