import { prisma } from "@linkwarden/prisma";

export default async function deleteSession(userId: number, jti: string) {
  // Only app sessions, an API key used to sign in somewhere stays valid
  const revokedSession = await prisma.accessToken.updateMany({
    where: {
      token: jti,
      userId,
      isSession: true,
      revoked: false,
    },
    data: {
      revoked: true,
    },
  });

  if (revokedSession.count === 0)
    return { response: "Session not found.", status: 404 };

  return { response: "Session revoked.", status: 200 };
}
