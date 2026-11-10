import { prisma } from "@linkwarden/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import { ResetPasswordSchema } from "@linkwarden/lib/schemaValidation";
import revokeUserSessions from "@/lib/api/revokeUserSessions";

export default async function resetPassword(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const dataValidation = ResetPasswordSchema.safeParse(req.body);

    if (!dataValidation.success) {
      return res.status(400).json({
        response: `Error: ${
          dataValidation.error.issues[0].message
        } [${dataValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const { token, password } = dataValidation.data;

    // Hashed password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check token in db
    const verifyToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expires: {
          gt: new Date(),
        },
      },
    });

    if (!verifyToken) {
      return res.status(400).json({
        response: "Invalid token.",
      });
    }

    const email = verifyToken.identifier;

    // The account may have been deleted, or its email changed, since
    const account = await prisma.user.findUnique({
      where: {
        email,
      },
      select: { id: true },
    });

    if (!account) {
      return res.status(400).json({
        response: "Invalid token.",
      });
    }

    // Update password
    const user = await prisma.user.update({
      where: {
        id: account.id,
      },
      data: {
        password: hashedPassword,
        // A new password starts with no wrong attempts
        passwordRetries: 0,
        passwordRetryAt: null,
      },
    });

    await revokeUserSessions(user.id);

    // The reset proves the inbox is theirs, so drop any wrong verification codes
    // entered with the old password, which would keep new codes from being sent
    await prisma.emailVerificationCode.deleteMany({
      where: { identifier: email.toLowerCase() },
    });

    await prisma.passwordResetToken.update({
      where: {
        token,
      },
      data: {
        expires: new Date(),
      },
    });

    // Delete tokens older than 5 minutes
    await prisma.passwordResetToken.deleteMany({
      where: {
        identifier: email,
        createdAt: {
          lt: new Date(new Date().getTime() - 1000 * 60 * 5), // 5 minutes
        },
      },
    });

    return res.status(200).json({
      response: "Password has been reset successfully.",
    });
  }
}
