import { prisma } from "@/lib/api/db";

export default async function getLinkById(linkId: number) {
  if (!linkId)
    return {
      response: "Please choose a valid link.",
      status: 401,
    };

  const link = await prisma.link.findFirst({
    where: {
      id: linkId,
      collection: {
        isPublic: true,
      },
    },
    include: {
      tags: true,
      collection: true,
    },
  });

  return { response: link, status: 200 };
}
