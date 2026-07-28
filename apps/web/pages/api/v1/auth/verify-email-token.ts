import type { NextApiRequest, NextApiResponse } from "next";
import { createHash } from "crypto";
import { prisma } from "@linkwarden/prisma";
import createSession from "@/lib/api/controllers/session/createSession";

const emailEnabled =
  process.env.EMAIL_FROM && process.env.EMAIL_SERVER ? true : false;

export default async function verifyEmailToken(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ response: "Method not allowed." });

  if (!emailEnabled || !process.env.NEXTAUTH_SECRET)
    return res.status(400).json({ response: "Email is not configured." });

  const token = typeof req.body.token === "string" ? req.body.token : "";
  const email =
    typeof req.body.email === "string"
      ? req.body.email.toLowerCase().trim()
      : "";

  if (!token || !email)
    return res.status(400).json({ response: "Invalid request." });

  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token: createHash("sha256")
        .update(`${token}${process.env.NEXTAUTH_SECRET}`)
        .digest("hex"),
      expires: { gt: new Date() },
    },
  });

  if (!verificationToken)
    return res.status(400).json({
      response: "Verification link is invalid or has expired.",
    });

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return res.status(400).json({ response: "Invalid email." });

  await Promise.all([
    user.emailVerified
      ? Promise.resolve()
      : prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        }),
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
  ]);

  const session = await createSession(
    user.id,
    typeof req.body.sessionName === "string" ? req.body.sessionName : undefined
  );
  return res.status(session.status).json({ response: session.response });
}
