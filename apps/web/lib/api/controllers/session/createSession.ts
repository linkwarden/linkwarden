import { prisma } from "@linkwarden/prisma";
import { PostTokenSchema } from "@linkwarden/lib/schemaValidation";
import crypto from "crypto";
import { decode, encode } from "next-auth/jwt";

export default async function createSession(
  userId: number,
  sessionName?: string
) {
  const dataValidation = PostTokenSchema.shape.name
    .optional()
    .safeParse(sessionName);

  if (!dataValidation.success) {
    return {
      response: `Error: ${dataValidation.error.issues[0].message} [sessionName]`,
      status: 400,
    };
  }

  const name = dataValidation.data || "Unknown Device";

  const now = Date.now();
  const expiryDate = new Date();
  const oneDayInSeconds = 86400;

  expiryDate.setDate(expiryDate.getDate() + 73000); // 200 years (not really never)
  const expiryDateSecond = 73050 * oneDayInSeconds;

  const token = await encode({
    token: {
      id: userId,
      iat: now / 1000,
      exp: (expiryDate as any) / 1000,
      jti: crypto.randomUUID(),
    },
    maxAge: expiryDateSecond || 604800,
    secret: process.env.NEXTAUTH_SECRET as string,
  });

  const tokenBody = await decode({
    token,
    secret: process.env.NEXTAUTH_SECRET as string,
  });

  await prisma.accessToken.create({
    data: {
      name,
      userId,
      token: tokenBody?.jti as string,
      isSession: true,
      expires: expiryDate,
    },
  });

  return {
    response: {
      token,
    },
    status: 200,
  };
}
