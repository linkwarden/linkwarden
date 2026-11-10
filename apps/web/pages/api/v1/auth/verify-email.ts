import { prisma } from "@linkwarden/prisma";
import updateCustomerEmail from "@/lib/api/billing/updateStripeCustomerEmail";
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

    if (emailInUse) {
      return res.status(400).json({
        response: "Email is already in use.",
      });
    }

    // Use up the token now that the pending email has been read. A newer email
    // change request deletes this token, so if one landed in the meantime,
    // newEmail may not be the address this token was sent to.
    const consumedToken = await prisma.verificationToken.deleteMany({
      where: {
        token,
        identifier: oldEmail,
      },
    });

    if (consumedToken.count === 0) {
      return res.status(400).json({
        response: "Invalid token.",
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
    const user = await prisma.user.update({
      where: {
        email: oldEmail,
      },
      data: {
        email: newEmail.toLowerCase().trim(),
        unverifiedNewEmail: null,
      },
      include: {
        subscriptions: true,
      },
    });

    if (process.env.STRIPE_SECRET_KEY) {
      await updateCustomerEmail(oldEmail, newEmail);
    }

    // Clean up existing tokens
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
