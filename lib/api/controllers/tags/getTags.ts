import { prisma } from "@/lib/api/db";

export default async function (userId: number) {
  // tag cleanup
  await prisma.tag.deleteMany({
    where: {
      links: {
        none: {},
      },
    },
  });

  const tags = await prisma.tag.findMany({
    where: {
      ownerId: userId,
      owner: {
        OR: [
          {
            id: userId,
          },
          {
            collections: {
              some: {
                members: {
                  some: {
                    user: {
                      id: userId,
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  });

  return { response: tags, status: 200 };
}
