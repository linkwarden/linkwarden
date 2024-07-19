import { prisma } from "@/lib/api/db";
import updateCustomerEmail from "@/lib/api/updateCustomerEmail";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function verifyEmail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const token = req.query.token;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        response: "Invalid token.",
      });
    }

    // Check token in db
    const verifyToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        expires: {
          gt: new Date(),
        },
      },
    });

    const oldEmail = verifyToken?.identifier;

    if (!oldEmail) {
      return res.status(400).json({
        response: "Invalid token.",
      });
    }

    // Ensure email isn't in use
    const findNewEmail = await prisma.user.findFirst({
      where: {
        email: oldEmail,
      },
      select: {
        unverifiedNewEmail: true,
      },
    });

    const newEmail = findNewEmail?.unverifiedNewEmail;

    if (!newEmail) {
      return res.status(400).json({
        response: "No unverified emails found.",
      });
    }

    const emailInUse = await prisma.user.findFirst({
      where: {
        email: newEmail,
      },
      select: {
        email: true,
      },
    });

    console.log(emailInUse);

    if (emailInUse) {
      return res.status(400).json({
        response: "Email is already in use.",
      });
    }

    // Remove SSO provider
    await prisma.account.deleteMany({
      where: {
        user: {
          email: oldEmail,
        },
      },
    });

    // Update email in db
    await prisma.user.update({
      where: {
        email: oldEmail,
      },
      data: {
        email: newEmail.toLowerCase().trim(),
        unverifiedNewEmail: null,
      },
    });

    // Apply to Stripe
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

    if (STRIPE_SECRET_KEY)
      await updateCustomerEmail(STRIPE_SECRET_KEY, oldEmail, newEmail);

    // Clean up existing tokens
    await prisma.verificationToken.delete({
      where: {
        token,
      },
    });

    await prisma.verificationToken.deleteMany({
      where: {
        identifier: oldEmail,
      },
    });

    return res.status(200).json({
      response: token,
    });
  }
}
