import { prisma } from "@linkwarden/prisma";
import updateCustomerEmail from "@/lib/api/stripe/updateCustomerEmail";
import { VerifyEmailSchema } from "@linkwarden/lib/schemaValidation";
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

    const dataValidation = VerifyEmailSchema.safeParse(req.query);

    if (!dataValidation.success) {
      return res.status(400).json({
        response: `Error: ${
          dataValidation.error.issues[0].message
        } [${dataValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const { token } = dataValidation.data;

    // Check token in db
    const verifyToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        expires: {
          gt: new Date(),
        },
      },
    });

    const identifier = verifyToken?.identifier;

    if (!identifier) {
      return res.status(400).json({
        response: "Invalid token.",
      });
    }

    // Find user by either email or username
    const findNewEmail = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      select: {
        unverifiedNewEmail: true,
        email: true,
        username: true,
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
          OR: [{ email: identifier }, { username: identifier }],
        },
      },
    });

    // Update email in db
    await prisma.user.updateMany({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      data: {
        email: newEmail.toLowerCase().trim(),
        unverifiedNewEmail: null,
        emailVerified: new Date(),
      },
    });

    // Apply to Stripe
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

    if (STRIPE_SECRET_KEY && findNewEmail.email) {
      await updateCustomerEmail(
        STRIPE_SECRET_KEY,
        findNewEmail.email,
        newEmail
      );
    }

    // Clean up existing tokens
    await prisma.verificationToken.delete({
      where: {
        token,
      },
    });

    await prisma.verificationToken.deleteMany({
      where: {
        identifier: identifier,
      },
    });

    return res.status(200).json({
      response: token,
    });
  }
}
