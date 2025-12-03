import getPermission from "@/lib/api/getPermission";
import { removeFiles } from "@linkwarden/filesystem";
import { meiliClient } from "@linkwarden/lib";
import { prisma } from "@linkwarden/prisma";
import { Link, UsersAndCollections } from "@linkwarden/prisma/client";

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

  // Get AI-generated tags BEFORE deleting the link
  const linkWithTags = await prisma.link.findUnique({
    where: { id: linkId },
    include: {
      tags: {
        where: { aiGenerated: true },
        select: { id: true, ownerId: true }
      }
    }
  });

  const aiTagIds = linkWithTags?.tags.map(t => t.id) ?? [];
  const ownerId = linkWithTags?.createdById;

  const deleteLink: Link = await prisma.link.delete({
    where: {
      id: linkId,
    },
  });

  removeFiles(linkId, collectionIsAccessible.id);

  await meiliClient?.index("links").deleteDocument(deleteLink.id);

  // Clean up orphan AI-generated tags (tags with no remaining links)
  if (aiTagIds.length > 0 && ownerId) {
    try {
      const { count } = await prisma.tag.deleteMany({
        where: {
          id: { in: aiTagIds },
          ownerId: ownerId,
          aiGenerated: true,
          links: { none: {} }
        }
      });
      if (count > 0) {
        console.log(`Removed ${count} AI-generated orphan tags`);
      }
    } catch (error) {
      console.error("Failed to remove AI-generated orphan tags", { linkId, error });
    }
  }

  return { response: deleteLink, status: 200 };
}
