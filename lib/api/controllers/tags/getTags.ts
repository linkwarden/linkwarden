import { prisma } from "@/lib/api/db";

export default async function getTags(userId: number) {
  // Remove empty tags
  await prisma.tag.deleteMany({
    where: {
      ownerId: userId,
      links: {
        none: {},
      },
    },
  });

  const tags = await prisma.tag.findMany({
    where: {
      OR: [
        { ownerId: userId }, // Tags owned by the user
        {
          links: {
            some: {
              collection: {
                members: {
                  some: {
                    userId, // Tags from collections where the user is a member
                  },
                },
              },
            },
          },
        },
      ],
    },
    include: {
      _count: {
        select: { links: true },
      },
    },
    // orderBy: {
    //   links: {
    //     _count: "desc",
    //   },
    // },
  });

  return { response: tags, status: 200 };
}
