import { JWT } from "next-auth/jwt";
import { prisma } from "@linkwarden/prisma";

export default async function isTokenRevoked(token: JWT) {
  // Access tokens and app sessions are stored by their jti, web sessions only once they're signed out
  const accessToken = await prisma.accessToken.findUnique({
    where: {
      token: token.sessionId ?? token.jti,
    },
  });

  if (accessToken) return accessToken.revoked;

  // Web sessions are all revoked at once by bumping the user's session version (e.g. on password change)
  const user = await prisma.user.findUnique({
    where: {
      id: token.id,
    },
    select: {
      sessionVersion: true,
    },
  });

  return !!user && user.sessionVersion !== (token.sessionVersion ?? 0);
}
