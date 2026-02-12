import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import { prisma } from "@linkwarden/prisma";
import { LinkArchiveActionSchema } from "@linkwarden/lib/schemaValidation";
import { removeFiles } from "@linkwarden/filesystem";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "DELETE") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const dataValidation = LinkArchiveActionSchema.safeParse(req.body);
    if (!dataValidation.success) {
      return res.status(400).json({
        response: `Error: ${
          dataValidation.error.issues[0].message
        } [${dataValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const { linkIds } = dataValidation.data;

    if (linkIds) {
      const authorizedLinks = await prisma.link.findMany({
        where: {
          id: { in: linkIds },
          url: { not: null },
          OR: [
            {
              collection: {
                ownerId: user.id,
              },
            },
            {
              collection: {
                members: {
                  some: {
                    userId: user.id,
                    canDelete: true,
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          collectionId: true,
        },
      });

      if (authorizedLinks.length === 0) {
        return res.status(401).json({ response: "Permission denied." });
      }

      res.status(200).json({ response: "Success." });

      for (const link of authorizedLinks) {
        const collectionId = link.collectionId;

        if (!collectionId) {
          console.error(`Collection ID not found for link ${link.id}`);
          continue;
        }

        await removeFiles(link.id, collectionId);
        await prisma.link.update({
          where: { id: link.id },
          data: {
            image: null,
            pdf: null,
            readable: null,
            monolith: null,
            preview: null,
            lastPreserved: null,
            indexVersion: null,
          },
        });

        console.log("Deleted preservation link:", link.id);
      }

      return;
    }
  }
}
