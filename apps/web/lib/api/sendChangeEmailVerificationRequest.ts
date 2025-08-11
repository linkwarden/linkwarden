import { randomBytes } from "crypto";
import { prisma } from "@linkwarden/prisma";
import transporter from "./transporter";
import Handlebars from "handlebars";
import { readFileSync } from "fs";
import path from "path";

export default async function sendChangeEmailVerificationRequest({
  oldEmail,
  newEmail,
  username,
  user,
}: {
  oldEmail?: string | null;
  newEmail: string;
  username?: string | null;
  user: string;
}) {
  const token = randomBytes(32).toString("hex");

  await prisma.$transaction(async () => {
    await prisma.verificationToken.create({
      data: {
        // either old email or username must exist
        identifier: oldEmail?.toLowerCase() ?? username!.toLowerCase(),
        token,
        expires: new Date(Date.now() + 24 * 3600 * 1000), // 1 day
      },
    });
    await prisma.user.update({
      where: {
        email: oldEmail?.toLowerCase(),
        username: username ? username.toLowerCase() : undefined,
      },
      data: {
        unverifiedNewEmail: newEmail?.toLowerCase(),
      },
    });
  });

  const emailsDir = path.resolve(process.cwd(), "templates");

  const templateFile = readFileSync(
    path.join(emailsDir, "verifyEmailChange.html"),
    "utf8"
  );

  const emailTemplate = Handlebars.compile(templateFile);

  transporter.sendMail({
    from: {
      name: "Linkwarden",
      address: process.env.EMAIL_FROM as string,
    },
    to: newEmail,
    subject: "Verify your new Linkwarden email address",
    html: emailTemplate({
      user,
      baseUrl: process.env.BASE_URL,
      oldEmail,
      newEmail,
      verifyUrl: `${process.env.BASE_URL}/auth/verify-email?token=${token}`,
    }),
  });
}
