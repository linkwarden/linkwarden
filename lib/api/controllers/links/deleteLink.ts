import { prisma } from "@/lib/api/db";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { Collection, Link, UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";
import removeFile from "@/lib/api/storage/removeFile";

export default async function deleteLink(
  link: LinkIncludingShortenedCollectionAndTags,
  userId: number
) {
  if (!link || !link.collectionId)
    return { response: "Please choose a valid link.", status: 401 };

  const collectionIsAccessible = (await getPermission(
    userId,
    link.collectionId
  )) as
    | (Collection & {
        members: UsersAndCollections[];
      })
    | null;

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canDelete
  );

  if (!(collectionIsAccessible?.ownerId === userId || memberHasAccess))
    return { response: "Collection is not accessible.", status: 401 };

  const deleteLink: Link = await prisma.link.delete({
    where: {
      id: link.id,
    },
  });

  removeFile({ filePath: `archives/${link.collectionId}/${link.id}.pdf` });
  removeFile({ filePath: `archives/${link.collectionId}/${link.id}.png` });

  return { response: deleteLink, status: 200 };
}
