import { prisma } from "@linkwarden/prisma";
import { removeFile } from "@linkwarden/filesystem";
import getPermission from "@/lib/api/getPermission";
import { UsersAndCollections } from "@linkwarden/prisma/client";

export default async function deleteQR(
  userId: number,
  linkId: number
): Promise<{ response: any; status: number }> {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
  });

  if (!link) {
    return { response: "Link not found.", status: 404 };
  }

  if (!link.qrCode) {
    return { response: "Link does not have a QR code.", status: 400 };
  }

  const collectionIsAccessible = await getPermission({ userId, linkId });

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canDelete
  );

  if (
    !collectionIsAccessible ||
    !(collectionIsAccessible?.ownerId === userId || memberHasAccess)
  ) {
    return { response: "Collection is not accessible.", status: 401 };
  }

  try {
    await removeFile({ filePath: link.qrCode });

    const updatedLink = await prisma.link.update({
      where: { id: linkId },
      data: { qrCode: null },
      include: {
        tags: true,
        collection: true,
        pinnedBy: { where: { id: userId }, select: { id: true } },
      },
    });

    return { response: updatedLink, status: 200 };
  } catch (err) {
    console.error("Error deleting QR code:", err);
    return { response: "Failed to delete QR code.", status: 500 };
  }
}