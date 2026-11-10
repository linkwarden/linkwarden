import { prisma } from "@linkwarden/prisma";
import sendPasswordResetRequest from "@/lib/api/sendPasswordResetRequest";
import { ForgotPasswordSchema } from "@linkwarden/lib/schemaValidation";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function forgotPassword(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const dataValidation = ForgotPasswordSchema.safeParse(req.body);

    if (!dataValidation.success) {
      return res.status(400).json({
        response: `Error: ${
          dataValidation.error.issues[0].message
        } [${dataValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const { email } = dataValidation.data;
    const lowercaseEmail = email.toLowerCase();

    // Reset tokens are stored under the account's email, which is lowercase
    // unless an SSO provider created the account with capitals
    const recentPasswordRequestsCount = await prisma.passwordResetToken.count({
      where: {
        identifier: { in: Array.from(new Set([email, lowercaseEmail])) },
        createdAt: {
          gt: new Date(new Date().getTime() - 1000 * 60 * 5), // 5 minutes
        },
      },
    });

    // Rate limit password reset requests
    if (recentPasswordRequestsCount >= 3) {
      return res.status(400).json({
        response: "Too many requests. Please try again later.",
      });
    }

    // Emails are stored lowercase, so the email is found however it's
    // capitalized. One stored with capitals is found when typed exactly that
    // way, which also wins if two accounts' emails only differ in case.
    const user =
      (await prisma.user.findFirst({ where: { email } })) ??
      (email !== lowercaseEmail
        ? await prisma.user.findFirst({ where: { email: lowercaseEmail } })
        : null);

    if (user && user.email) {
      sendPasswordResetRequest(user.email, user.name || "Linkwarden User");
    }

    return res.status(200).json({
      response:
        "If an account exists for that email, a reset link has been sent.",
    });
  }
}
