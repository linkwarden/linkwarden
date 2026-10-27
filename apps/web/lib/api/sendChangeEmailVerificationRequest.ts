import { randomBytes } from "crypto";
import { prisma } from "@linkwarden/prisma";
import transporter from "@linkwarden/lib/transporter";
import Handlebars from "handlebars";
import { readFileSync } from "fs";
import path from "path";

export default async function sendChangeEmailVerificationRequest(
  oldEmail: string,
  newEmail: string,
  user: string
) {
  const token = randomBytes(32).toString("hex");

  await prisma.$transaction(async (tx) => {
    // Updating the user first locks the row, so concurrent requests run one
    // after another and each one sees the tokens the previous one created.
    await tx.user.update({
      where: {
        email: oldEmail?.toLowerCase(),
      },
      data: {
        unverifiedNewEmail: newEmail?.toLowerCase(),
      },
    });
    // Tokens from earlier requests were sent to a different address, so they
    // must not be able to verify the new one.
    await tx.verificationToken.deleteMany({
      where: {
        identifier: oldEmail?.toLowerCase(),
      },
    });
    await tx.verificationToken.create({
      data: {
        identifier: oldEmail?.toLowerCase(),
        token,
        expires: new Date(Date.now() + 24 * 3600 * 1000), // 1 day
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
      url: `${process.env.BASE_URL}/auth/verify-email?token=${token}`,
    }),
  });
}
