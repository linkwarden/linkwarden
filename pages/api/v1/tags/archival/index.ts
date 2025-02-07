import { prisma } from "@/lib/api/db";
import verifyUser from "@/lib/api/verifyUser";
import { PostArchivalTagSchema } from "@/lib/shared/schemaValidation";
import { Tag } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export default async function archivalTags(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "POST") {
    const dataValidation = PostArchivalTagSchema.safeParse(req.body);

    if (!dataValidation.success) {
      return res.status(400).json({
        response: `Error: ${
          dataValidation.error.issues[0].message
        } [${dataValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const { tags } = dataValidation.data;
    const updatedTags: Tag[] = [];

    for (const tag of tags) {
      if (tag.newTag) {
        const tagNameIsTaken = await prisma.tag.findFirst({
          where: {
            ownerId: user.id,
            name: tag.label,
          },
        });

        // If the tag name is already taken by the user, skip creating a new tag
        if (tagNameIsTaken) return;

        const newTag = await prisma.tag.create({
          data: {
            name: tag.label,
            ownerId: user.id,
            archiveAsScreenshot: tag.archiveAsScreenshot,
            archiveAsMonolith: tag.archiveAsMonolith,
            archiveAsPDF: tag.archiveAsPDF,
            archiveAsReadable: tag.archiveAsReadable,
            archiveAsWaybackMachine: tag.archiveAsWaybackMachine,
            aiTag: tag.aiTag,
          },
          include: {
            _count: true,
          },
        });
        updatedTags.push(newTag);
      } else {
        const targetTag = await prisma.tag.findUnique({
          where: {
            name_ownerId: {
              name: tag.label,
              ownerId: user.id,
            },
          },
        });

        // If the tag is not found or the ownerId does not match, skip updating
        if (targetTag && targetTag.ownerId !== user.id) return;

        const updatedTag = await prisma.tag.update({
          where: {
            name_ownerId: {
              name: tag.label,
              ownerId: user.id,
            },
          },
          data: {
            archiveAsScreenshot: tag.archiveAsScreenshot,
            archiveAsMonolith: tag.archiveAsMonolith,
            archiveAsPDF: tag.archiveAsPDF,
            archiveAsReadable: tag.archiveAsReadable,
            archiveAsWaybackMachine: tag.archiveAsWaybackMachine,
            aiTag: tag.aiTag,
          },
          include: {
            _count: true,
          },
        });
        updatedTags.push(updatedTag);
      }
    }

    return res.status(200).json({ response: updatedTags });
  }
}
