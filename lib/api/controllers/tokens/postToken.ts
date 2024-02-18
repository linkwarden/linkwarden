import { prisma } from "@/lib/api/db";
import { TokenExpiry } from "@/types/global";
import crypto from "crypto";
import { decode, encode } from "next-auth/jwt";

export default async function postToken(
  body: {
    name: string;
    expires: TokenExpiry;
  },
  userId: number
) {
  console.log(body);

  const checkHasEmptyFields = !body.name || body.expires === undefined;

  if (checkHasEmptyFields)
    return {
      response: "Please fill out all the fields.",
      status: 400,
    };

  const checkIfTokenExists = await prisma.accessToken.findFirst({
    where: {
      name: body.name,
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

  if (body.expires === TokenExpiry.oneMonth) {
    expiryDate.setDate(expiryDate.getDate() + 30);
    expiryDateSecond = 30 * oneDayInSeconds;
  } else if (body.expires === TokenExpiry.twoMonths) {
    expiryDate.setDate(expiryDate.getDate() + 60);
    expiryDateSecond = 60 * oneDayInSeconds;
  } else if (body.expires === TokenExpiry.threeMonths) {
    expiryDate.setDate(expiryDate.getDate() + 90);
    expiryDateSecond = 90 * oneDayInSeconds;
  } else if (body.expires === TokenExpiry.never) {
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
    secret: process.env.NEXTAUTH_SECRET,
  });

  const tokenBody = await decode({
    token,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const createToken = await prisma.accessToken.create({
    data: {
      name: body.name,
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
