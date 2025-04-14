import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import { prisma } from "@linkwarden/prisma";
import { LinkArchiveActionSchema } from "@/lib/shared/schemaValidation";
import {
  removeFiles,
  removePreservationFiles,
} from "@/lib/api/manageLinkFiles";
import { ArchivalSettings } from "@/lib/api/archiveHandler";
import isArchivalTag from "@/lib/shared/isArchivalTag";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const isServerAdmin = user.id === Number(process.env.NEXT_PUBLIC_ADMIN || 1);

  if (!isServerAdmin) {
    return res.status(401).json({ response: "Permission denied." });
  }

  if (req.method === "DELETE") {
    const dataValidation = LinkArchiveActionSchema.safeParse(req.body);
    if (!dataValidation.success) {
      return res.status(400).json({
        response: `Error: ${
          dataValidation.error.issues[0].message
        } [${dataValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const { action } = dataValidation.data;

    if (action === "allAndIgnore") {
      const allLinks = await prisma.link.findMany({
        where: {
          type: "url",
          url: {
            not: null,
          },
        },
      });

      for (const link of allLinks) {
        console.log("Deleted preservation link:", link.id);

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
      }

      return res.status(200).json({ response: "Success." });
    } else if (action === "allAndRePreserve") {
      const allLinks = await prisma.link.findMany({
        where: {
          type: "url",
          url: {
            not: null,
          },
        },
      });
      for (const link of allLinks) {
        console.log("Deleted preservation link:", link.id);

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
      }

      return res.status(200).json({ response: "Success." });
    } else if (action === "allBroken") {
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
