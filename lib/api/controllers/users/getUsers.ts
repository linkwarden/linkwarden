import { prisma } from "@/lib/api/db";

export default async function getUsers() {
  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
      subscriptions: {
        select: {
          active: true,
        },
      },
      createdAt: true,
    },
  });

  return { response: users, status: 200 };
}
