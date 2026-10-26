import { sendEmailVerificationCode } from "@/lib/api/emailVerificationCode";
import { prisma } from "@linkwarden/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

const emailEnabled =
  process.env.EMAIL_FROM && process.env.EMAIL_SERVER ? true : false;

export default async function requestVerificationEmail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ response: "Method not allowed." });

  if (!emailEnabled || !process.env.NEXTAUTH_SECRET)
    return res.status(400).json({ response: "Email is not configured." });

  // People can log in with their username too, so accept one here as well
  const identifier =
    typeof req.body.email === "string"
      ? req.body.email.toLowerCase().trim()
      : "";

  const user = identifier
    ? (await prisma.user.findUnique({ where: { email: identifier } })) ??
      (await prisma.user.findUnique({ where: { username: identifier } }))
    : null;

  if (!user?.email) return res.status(400).json({ response: "Invalid email." });

  if (user.emailVerified)
    return res.status(400).json({ response: "Email is already verified." });

  // The code is only accepted together with the account's password
  const result = await sendEmailVerificationCode(user.email);

  return res.status(result.status).json({ response: result.response });
}
