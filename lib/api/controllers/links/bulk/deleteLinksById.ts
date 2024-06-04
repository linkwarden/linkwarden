import { prisma } from "@/lib/api/db";
import { UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";
import { removeFiles } from "@/lib/api/manageLinkFiles";

export default async function deleteLinksById(
  userId: number,
  linkIds: number[]
) {
  if (!linkIds || linkIds.length === 0) {
    return { response: "Please choose valid links.", status: 401 };
  }

  const collectionIsAccessibleArray = [];

  // Check if the user has access to the collection of each link
  // if any of the links are not accessible, return an error
  // if all links are accessible, continue with the deletion
  // and add the collection to the collectionIsAccessibleArray
  for (const linkId of linkIds) {
    const collectionIsAccessible = await getPermission({ userId, linkId });

    const memberHasAccess = collectionIsAccessible?.members.some(
      (e: UsersAndCollections) => e.userId === userId && e.canDelete
    );

    if (!(collectionIsAccessible?.ownerId === userId || memberHasAccess)) {
      return { response: "Collection is not accessible.", status: 401 };
    }

    collectionIsAccessibleArray.push(collectionIsAccessible);
  }

  const deletedLinks = await prisma.link.deleteMany({
    where: {
      id: { in: linkIds },
    },
  });

  // Loop through each link and delete the associated files
  // if the user has access to the collection
  for (let i = 0; i < linkIds.length; i++) {
    const linkId = linkIds[i];
    const collectionIsAccessible = collectionIsAccessibleArray[i];

    if (collectionIsAccessible) removeFiles(linkId, collectionIsAccessible.id);
  }

  return { response: deletedLinks, status: 200 };
}
