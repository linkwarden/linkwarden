import { prisma } from "@linkwarden/prisma";

export default async function deleteHighlightById(
  userId: number,
  highlightId: number
) {
  if (!highlightId)
    return { response: "Please choose a valid highlight.", status: 401 };

  const targetHighlight = await prisma.highlight.delete({
    where: {
      id: highlightId,
      userId,
    },
  });

  return { response: targetHighlight.id, status: 200 };
}
