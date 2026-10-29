import { prisma } from "@linkwarden/prisma";

// Signs the user out everywhere: web sessions issued before the version bump stop
// working, and every access token (app sessions included) is revoked
export default async function revokeUserSessions(userId: number) {
  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        sessionVersion: {
          increment: 1,
        },
      },
    }),
    prisma.accessToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    }),
  ]);
}
