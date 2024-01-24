import { prisma } from "@/lib/api/db";

export default async function deleteToken(userId: number, tokenId: number) {
  if (!tokenId)
    return { response: "Please choose a valid token.", status: 401 };

  const tokenExists = await prisma.accessToken.findFirst({
    where: {
      id: tokenId,
      userId,
    },
  });

  const revokedToken = await prisma.accessToken.update({
    where: {
      id: tokenExists?.id,
    },
    data: {
      revoked: true,
    },
  });

  return { response: revokedToken, status: 200 };
}
