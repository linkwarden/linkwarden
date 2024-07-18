import { prisma } from "@/lib/api/db";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";

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

    const token = req.body.token;
    const password = req.body.password;

    if (!password || password.length < 8) {
      return res.status(400).json({
        response: "Password must be at least 8 characters.",
      });
    }

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        response: "Invalid token.",
      });
    }

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

    // Update password
    await prisma.user.update({
      where: {
        email,
      },
      data: {
        password: hashedPassword,
      },
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
