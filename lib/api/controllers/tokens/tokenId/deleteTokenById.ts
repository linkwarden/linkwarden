import { prisma } from "@/lib/api/db";
import { KeyExpiry } from "@/types/global";

export default async function deleteToken(userId: number, tokenId: number) {
  if (!tokenId)
    return { response: "Please choose a valid token.", status: 401 };

  const deletedToken = await prisma.apiKey.delete({
    where: {
      id: tokenId,
      userId,
    },
  });

  return { response: deletedToken, status: 200 };
}
