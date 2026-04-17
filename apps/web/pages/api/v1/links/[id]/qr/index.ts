import type { NextApiRequest, NextApiResponse } from "next";
import verifyToken from "@/lib/api/verifyToken";
import verifyUser from "@/lib/api/verifyUser";
import { readFile } from "@linkwarden/filesystem";
import { prisma } from "@linkwarden/prisma";
import generateQR from "@/lib/api/controllers/links/linkId/qr/generateQR";
import deleteQR from "@/lib/api/controllers/links/linkId/qr/deleteQR";

export default async function index(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const linkId = Number(req.query.id);
  if (!linkId) {
    return res.status(400).json({ response: "Invalid link ID." });
  }

  try {
    switch (req.method) {
      case "GET": {
        const token = await verifyToken({ req });
        const userId = typeof token === "string" ? undefined : token?.id;

        const link = await prisma.link.findUnique({
          where: { id: linkId },
          include: { collection: { include: { members: true } } },
        });

        if (!link) {
          return res.status(404).json({ response: "Link not found." });
        }

        if (!link.qrCode) {
          return res.status(404).json({ response: "QR code not found." });
        }

        const collection = link.collection;
        const isPublic = collection.isPublic;
        const isOwner = collection.ownerId === userId;
        const isMember = collection.members?.some(
          (m: any) => m.userId === userId
        );

        if (!isPublic && !isOwner && !isMember) {
          if (!userId) {
            return res
              .status(401)
              .json({ response: "You must be logged in to view this QR code." });
          }
          return res
            .status(401)
            .json({ response: "You don't have access to this collection." });
        }

        const { file, contentType, status } = await readFile(link.qrCode);
        res
          .setHeader("Content-Type", contentType)
          .setHeader(
            "Cache-Control",
            "private, max-age=31536000, immutable"
          )
          .status(status as number);
        return res.send(file);
      }

      case "POST": {
        const user = await verifyUser({ req, res });
        if (!user) return;

        const result = await generateQR(user.id, linkId);
        return res.status(result.status).json({ response: result.response });
      }

      case "DELETE": {
        const user = await verifyUser({ req, res });
        if (!user) return;

        const result = await deleteQR(user.id, linkId);
        return res.status(result.status).json({ response: result.response });
      }

      default:
        return res.status(405).json({ response: "Method not allowed" });
    }
  } catch (error: any) {
    return res.status(400).json({ response: error.message });
  }
}