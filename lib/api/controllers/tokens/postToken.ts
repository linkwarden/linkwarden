import { prisma } from "@/lib/api/db";
import { KeyExpiry } from "@/types/global";
import crypto from "crypto";
import { decode, encode, getToken } from "next-auth/jwt";

export default async function postToken(
  body: {
    name: string;
    expires: KeyExpiry;
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

  const checkIfTokenExists = await prisma.apiKey.findFirst({
    where: {
      name: body.name,
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

  if (body.expires === KeyExpiry.oneMonth) {
    expiryDate.setDate(expiryDate.getDate() + 30);
    expiryDateSecond = 30 * oneDayInSeconds;
  } else if (body.expires === KeyExpiry.twoMonths) {
    expiryDate.setDate(expiryDate.getDate() + 60);
    expiryDateSecond = 60 * oneDayInSeconds;
  } else if (body.expires === KeyExpiry.threeMonths) {
    expiryDate.setDate(expiryDate.getDate() + 90);
    expiryDateSecond = 90 * oneDayInSeconds;
  } else if (body.expires === KeyExpiry.never) {
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

  const createToken = await prisma.apiKey.create({
    data: {
      name: body.name,
      userId,
      token: tokenBody?.jti as string,
      expires: expiryDate,
    },
  });

  return {
    response: token,
    status: 200,
  };
}
