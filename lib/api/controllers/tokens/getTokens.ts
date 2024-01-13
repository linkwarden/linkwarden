import { prisma } from "@/lib/api/db";
import { KeyExpiry } from "@/types/global";
import bcrypt from "bcrypt";
import crypto from "crypto";

export default async function getToken(userId: number) {
  const getTokens = await prisma.apiKey.findMany({
    where: {
      userId,
    },
    select: {
      name: true,
      expires: true,
      createdAt: true,
    },
  });

  return {
    response: getTokens,
    status: 200,
  };
}
