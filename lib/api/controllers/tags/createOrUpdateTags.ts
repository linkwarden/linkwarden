import { prisma } from "@/lib/api/db";
import { PostTagSchemaType } from "@/lib/shared/schemaValidation";
import { TagIncludingLinkCount } from "@/types/global";

export default async function createOrUpdateTags(
  userId: number,
  tags: PostTagSchemaType["tags"]
): Promise<TagIncludingLinkCount[]> {
  const updatedTags: TagIncludingLinkCount[] = [];

  for (const tag of tags) {
    const updatedTag = await prisma.tag.upsert({
      where: {
        name_ownerId: {
          name: tag.label,
          ownerId: userId,
        },
      },
      update: {
        archiveAsScreenshot: tag.archiveAsScreenshot,
        archiveAsMonolith: tag.archiveAsMonolith,
        archiveAsPDF: tag.archiveAsPDF,
        archiveAsReadable: tag.archiveAsReadable,
        archiveAsWaybackMachine: tag.archiveAsWaybackMachine,
        aiTag: tag.aiTag,
      },
      create: {
        name: tag.label,
        ownerId: userId,
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

  return updatedTags;
}
