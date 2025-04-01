import { prisma } from "@/lib/api/db";
import { PostHighlightSchemaType } from "@/lib/shared/schemaValidation";

export default async function postOrUpdateHighlight(
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

  const existingHighlight = await prisma.highlight.findFirst({
    where: {
      userId,
      linkId: body.linkId,
      startOffset: body.startOffset,
      endOffset: body.endOffset,
    },
  });

  if (existingHighlight) {
    const updatedHighlight = await prisma.highlight.update({
      where: {
        id: existingHighlight.id,
      },
      data: {
        color: body.color,
        comment: body.comment,
      },
    });

    return {
      status: 200,
      response: updatedHighlight,
    };
  }

  // create highlight
  const highlight = await prisma.highlight.create({
    data: {
      userId,
      linkId: body.linkId,
      startOffset: body.startOffset,
      endOffset: body.endOffset,
      startXPath: body.startXPath,
      endXPath: body.endXPath,
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
