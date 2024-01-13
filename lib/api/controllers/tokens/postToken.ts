import { prisma } from "@/lib/api/db";
import { KeyExpiry } from "@/types/global";
import bcrypt from "bcrypt";
import crypto from "crypto";

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

  let expiryDate = new Date();

  switch (body.expires) {
    case KeyExpiry.sevenDays:
      expiryDate.setDate(expiryDate.getDate() + 7);
      break;
    case KeyExpiry.oneMonth:
      expiryDate.setDate(expiryDate.getDate() + 30);
      break;
    case KeyExpiry.twoMonths:
      expiryDate.setDate(expiryDate.getDate() + 60);
      break;
    case KeyExpiry.threeMonths:
      expiryDate.setDate(expiryDate.getDate() + 90);
      break;
    case KeyExpiry.never:
      expiryDate.setDate(expiryDate.getDate() + 73000); // 200 years (not really never)
      break;
    default:
      expiryDate.setDate(expiryDate.getDate() + 7);
      break;
  }

  const saltRounds = 10;

  const hashedKey = bcrypt.hashSync(crypto.randomUUID(), saltRounds);

  const createToken = await prisma.apiKey.create({
    data: {
      name: body.name,
      userId,
      token: hashedKey,
      expires: expiryDate,
    },
  });

  return {
    response: createToken.token,
    status: 200,
  };
}
