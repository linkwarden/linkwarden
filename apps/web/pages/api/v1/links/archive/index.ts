import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import { prisma } from "@linkwarden/prisma";
import { LinkArchiveActionSchema } from "@linkwarden/lib/schemaValidation";
import { removeFiles, removePreservationFiles } from "@linkwarden/filesystem";
import { ArchivalSettings } from "@linkwarden/types";
import { isArchivalTag } from "@linkwarden/lib";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const isServerAdmin = user.id === Number(process.env.NEXT_PUBLIC_ADMIN || 1);

  if (req.method === "DELETE") {
    const dataValidation = LinkArchiveActionSchema.safeParse(req.body);
    if (!dataValidation.success) {
      return res.status(400).json({
        response: `Error: ${
          dataValidation.error.issues[0].message
        } [${dataValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const { action, linkIds } = dataValidation.data;

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

    if (action === "allAndIgnore") {
      if (!isServerAdmin) {
        return res.status(401).json({ response: "Permission denied." });
      }

      const allLinks = await prisma.link.findMany({
        where: {
          type: "url",
          url: {
            not: null,
          },
        },
      });

      for (const link of allLinks) {
        await removePreservationFiles(link.id, link.collectionId);
        await prisma.link.update({
          where: { id: link.id },
          data: {
            preview: link.preview ? link.preview : undefined,
            image: "unavailable",
            pdf: "unavailable",
            readable: "unavailable",
            monolith: "unavailable",
          },
        });

        console.log("Deleted preservation link:", link.id);
      }

      return res.status(200).json({ response: "Success." });
    } else if (action === "allAndRePreserve") {
      if (!isServerAdmin) {
        return res.status(401).json({ response: "Permission denied." });
      }

      const allLinks = await prisma.link.findMany({
        where: {
          type: "url",
          url: {
            not: null,
          },
        },
      });
      for (const link of allLinks) {
        await removeFiles(link.id, link.collectionId);
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

      return res.status(200).json({ response: "Success." });
    } else if (action === "allBroken") {
      if (!isServerAdmin) {
        return res.status(401).json({ response: "Permission denied." });
      }

      const brokenArchives = await prisma.link.findMany({
        where: {
          type: "url",
          url: {
            not: null,
          },
          OR: [
            { image: "unavailable" },
            { pdf: "unavailable" },
            { readable: "unavailable" },
            { monolith: "unavailable" },
            { preview: "unavailable" },
          ],
        },
        include: {
          createdBy: {
            select: {
              archiveAsScreenshot: true,
              archiveAsMonolith: true,
              archiveAsPDF: true,
              archiveAsReadable: true,
              archiveAsWaybackMachine: true,
            },
          },
          tags: true,
        },
      });

      for (const link of brokenArchives) {
        const archivalTags = link.tags.filter(isArchivalTag);

        const shouldArchive: Omit<
          ArchivalSettings,
          "aiTag" | "archiveAsWaybackMachine"
        > =
          archivalTags.length > 0
            ? {
                archiveAsScreenshot: archivalTags.some(
                  (tag) => tag.archiveAsScreenshot
                ),
                archiveAsMonolith: archivalTags.some(
                  (tag) => tag.archiveAsMonolith
                ),
                archiveAsPDF: archivalTags.some((tag) => tag.archiveAsPDF),
                archiveAsReadable: archivalTags.some(
                  (tag) => tag.archiveAsReadable
                ),
              }
            : {
                archiveAsScreenshot:
                  link.createdBy?.archiveAsScreenshot || false,
                archiveAsMonolith: link.createdBy?.archiveAsMonolith || false,
                archiveAsPDF: link.createdBy?.archiveAsPDF || false,
                archiveAsReadable: link.createdBy?.archiveAsReadable || false,
              };

        const needsReprocessing =
          (link.image === "unavailable" && shouldArchive.archiveAsScreenshot) ||
          (link.monolith === "unavailable" &&
            shouldArchive.archiveAsMonolith) ||
          (link.pdf === "unavailable" && shouldArchive.archiveAsPDF) ||
          (link.readable === "unavailable" && shouldArchive.archiveAsReadable);

        if (needsReprocessing) {
          await prisma.link.update({
            where: { id: link.id },
            data: {
              image:
                shouldArchive.archiveAsScreenshot &&
                link.image === "unavailable"
                  ? null
                  : link.image,
              pdf:
                shouldArchive.archiveAsPDF && link.pdf === "unavailable"
                  ? null
                  : link.pdf,
              readable:
                shouldArchive.archiveAsReadable &&
                link.readable === "unavailable"
                  ? null
                  : link.readable,
              monolith:
                shouldArchive.archiveAsMonolith &&
                link.monolith === "unavailable"
                  ? null
                  : link.monolith,
              lastPreserved: null,
              indexVersion: null,
            },
          });
        }
      }

      return res.status(200).json({ response: "Success." });
    }
  }
}
