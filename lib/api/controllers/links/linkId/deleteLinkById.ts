import { prisma } from "@/lib/api/db";
import { Link, UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";
import removeFile from "@/lib/api/storage/removeFile";

export default async function deleteLink(userId: number, linkId: number) {
  if (!linkId) return { response: "Please choose a valid link.", status: 401 };

  const collectionIsAccessible = await getPermission({ userId, linkId });

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canDelete
  );

  if (!(collectionIsAccessible?.ownerId === userId || memberHasAccess))
    return { response: "Collection is not accessible.", status: 401 };

  const deleteLink: Link = await prisma.link.delete({
    where: {
      id: linkId,
    },
  });

  removeFile({
    filePath: `archives/${collectionIsAccessible?.id}/${linkId}.pdf`,
  });
  removeFile({
    filePath: `archives/${collectionIsAccessible?.id}/${linkId}.png`,
  });
  removeFile({
    filePath: `archives/${collectionIsAccessible?.id}/${linkId}_readability.json`,
  });

  return { response: deleteLink, status: 200 };
}
