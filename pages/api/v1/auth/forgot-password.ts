import { prisma } from "@/lib/api/db";
import sendPasswordResetRequest from "@/lib/api/sendPasswordResetRequest";
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

    const email = req.body.email;

    if (!email) {
      return res.status(400).json({
        response: "Invalid email.",
      });
    }

    const recentPasswordRequestsCount = await prisma.passwordResetToken.count({
      where: {
        identifier: email,
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

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user || !user.email) {
      return res.status(400).json({
        response: "Invalid email.",
      });
    }

    sendPasswordResetRequest(user.email, user.name);

    return res.status(200).json({
      response: "Password reset email sent.",
    });
  }
}
