import { prisma } from "@/lib/api/db";
import { PostHighlightSchemaType } from "@/lib/shared/schemaValidation";

export default async function postHighlight(
  userId: number,
  body: PostHighlightSchemaType
) {
  // check if user has access to collection
  const collection = await prisma.collection.findFirst({
    where: {
      links: {
        some: {
          id: body.linkId,
        },
      },
    },
    include: {
      members: true,
    },
  });

  if (
    !collection ||
    (!collection.members.some((m) => m.userId === userId && m.canUpdate) &&
      !(collection.ownerId === userId))
  ) {
    return {
      status: 400,
      response: "Collection not accessible",
    };
  }

  const overlappingHighlight = await prisma.highlight.findFirst({
    where: {
      linkId: body.linkId,
      userId,
      OR: [
        {
          startOffset: {
            lte: body.startOffset,
          },
          endOffset: {
            gte: body.endOffset,
          },
        },
        {
          startOffset: {
            gte: body.startOffset,
            lte: body.endOffset,
          },
        },
        {
          endOffset: {
            gte: body.startOffset,
            lte: body.endOffset,
          },
        },
      ],
    },
  });

  if (overlappingHighlight) {
    return {
      status: 400,
      response: "Highlight overlaps with an existing highlight",
    };
  }

  // create highlight
  const highlight = await prisma.highlight.create({
    data: {
      userId,
      linkId: body.linkId,
      startOffset: body.startOffset,
      endOffset: body.endOffset,
      color: body.color,
      text: body.text,
      comment: body.comment,
    },
  });

  return {
    status: 200,
    response: highlight,
  };
}
