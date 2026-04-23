import { prisma } from "@linkwarden/prisma";
import { createFile } from "@linkwarden/filesystem";
import QRCode from "qrcode";
import getPermission from "@/lib/api/getPermission";
import { UsersAndCollections } from "@linkwarden/prisma/client";

export default async function generateQR(
  userId: number,
  linkId: number
): Promise<{ response: any; status: number }> {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: { collection: true },
  });

  if (!link) {
    return { response: "Link not found.", status: 404 };
  }

  if (!link.url) {
    return { response: "Link does not have a URL to encode.", status: 400 };
  }

  const collectionIsAccessible = await getPermission({ userId, linkId });

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canUpdate
  );

  if (
    !collectionIsAccessible ||
    !(collectionIsAccessible?.ownerId === userId || memberHasAccess)
  ) {
    return { response: "Collection is not accessible.", status: 401 };
  }

  const collectionId = collectionIsAccessible.id;
  const qrCodePath = `archives/${collectionId}/${linkId}-qrcode.png`;

  try {
    const qrBuffer = await QRCode.toBuffer(link.url, {
      type: "png",
      width: 300,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    await createFile({ filePath: qrCodePath, data: qrBuffer });

    const updatedLink = await prisma.link.update({
      where: { id: linkId },
      data: { qrCode: qrCodePath },
      include: {
        tags: true,
        collection: true,
        pinnedBy: { where: { id: userId }, select: { id: true } },
      },
    });

    return { response: updatedLink, status: 200 };
  } catch (err) {
    console.error("Error generating QR code:", err);
    return { response: "Failed to generate QR code.", status: 500 };
  }
}