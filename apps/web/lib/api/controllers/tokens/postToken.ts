import { prisma } from "@/lib/api/db";
import {
  PostTokenSchemaType,
  PostTokenSchema,
} from "@/lib/shared/schemaValidation";
import { TokenExpiry } from "@/types/global";
import crypto from "crypto";
import { decode, encode } from "next-auth/jwt";

export default async function postToken(
  body: PostTokenSchemaType,
  userId: number
) {
  const dataValidation = PostTokenSchema.safeParse(body);

  if (!dataValidation.success) {
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  const { name, expires } = dataValidation.data;

  const checkIfTokenExists = await prisma.accessToken.findFirst({
    where: {
      name: name,
      revoked: false,
      userId,
    },
  });

  if (checkIfTokenExists) {
    return {
      response: "Token with that name already exists.",
      status: 400,
    };
  }

  const now = Date.now();
  let expiryDate = new Date();
  const oneDayInSeconds = 86400;
  let expiryDateSecond = 7 * oneDayInSeconds;

  if (expires === TokenExpiry.oneMonth) {
    expiryDate.setDate(expiryDate.getDate() + 30);
    expiryDateSecond = 30 * oneDayInSeconds;
  } else if (expires === TokenExpiry.twoMonths) {
    expiryDate.setDate(expiryDate.getDate() + 60);
    expiryDateSecond = 60 * oneDayInSeconds;
  } else if (expires === TokenExpiry.threeMonths) {
    expiryDate.setDate(expiryDate.getDate() + 90);
    expiryDateSecond = 90 * oneDayInSeconds;
  } else if (expires === TokenExpiry.never) {
    expiryDate.setDate(expiryDate.getDate() + 73000); // 200 years (not really never)
    expiryDateSecond = 73050 * oneDayInSeconds;
  } else {
    expiryDate.setDate(expiryDate.getDate() + 7);
    expiryDateSecond = 7 * oneDayInSeconds;
  }

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

  const createToken = await prisma.accessToken.create({
    data: {
      name: name,
      userId,
      token: tokenBody?.jti as string,
      expires: expiryDate,
    },
  });

  return {
    response: {
      secretKey: token,
      token: createToken,
    },
    status: 200,
  };
}
