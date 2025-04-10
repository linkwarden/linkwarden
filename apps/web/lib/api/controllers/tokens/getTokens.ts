import { prisma } from "@/lib/api/db";

export default async function getToken(userId: number) {
  const getTokens = await prisma.accessToken.findMany({
    where: {
      userId,
      revoked: false,
    },
    select: {
      id: true,
      name: true,
      isSession: true,
      expires: true,
      createdAt: true,
    },
  });

  return {
    response: getTokens,
    status: 200,
  };
}
