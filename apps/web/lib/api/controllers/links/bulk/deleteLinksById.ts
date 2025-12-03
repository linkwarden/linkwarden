import getPermission from "@/lib/api/getPermission";
import { removeFiles } from "@linkwarden/filesystem";
import { meiliClient } from "@linkwarden/lib";
import { prisma } from "@linkwarden/prisma";
import { UsersAndCollections } from "@linkwarden/prisma/client";

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

  // Get AI-generated tags BEFORE deleting the links
  const linksWithTags = await prisma.link.findMany({
    where: { id: { in: linkIds } },
    select: {
      createdById: true,
      tags: {
        where: { aiGenerated: true },
        select: { id: true }
      }
    }
  });

  const aiTagIds = linksWithTags.flatMap(l => l.tags.map(t => t.id));
  const ownerIds = Array.from(new Set(linksWithTags.map(l => l.createdById).filter((id): id is number => id !== null)));

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

  await meiliClient?.index("links").deleteDocuments(linkIds);

  // Clean up orphan AI-generated tags (tags with no remaining links)
  if (aiTagIds.length > 0 && ownerIds.length > 0) {
    try {
      const { count } = await prisma.tag.deleteMany({
        where: {
          id: { in: aiTagIds },
          ownerId: { in: ownerIds },
          aiGenerated: true,
          links: { none: {} }
        }
      });
      if (count > 0) {
        console.log(`Removed ${count} AI-generated orphan tags`);
      }
    } catch (error) {
      console.error("Failed to remove AI-generated orphan tags", { linkIds, error });
    }
  }

  return { response: deletedLinks, status: 200 };
}
