import { readFileSync } from "fs";
import path from "path";
import Handlebars from "handlebars";
import transporter from "@linkwarden/lib/transporter";

type Params = {
  identifier: string;
  code: string;
};

export default async function sendVerificationRequest({
  identifier,
  code,
}: Params) {
  const emailsDir = path.resolve(process.cwd(), "templates");

  const templateFile = readFileSync(
    path.join(emailsDir, "verifyEmail.html"),
    "utf8"
  );

  const emailTemplate = Handlebars.compile(templateFile);

  const result = await transporter.sendMail({
    to: identifier,
    from: {
      name: "Linkwarden",
      address: process.env.EMAIL_FROM as string,
    },
    subject: `Your Linkwarden verification code: ${code}`,
    text: text({ code }),
    html: emailTemplate({
      code,
    }),
  });
  const failed = result.rejected.concat(result.pending ?? []).filter(Boolean);
  if (failed.length) {
    throw new Error(`Email (${failed.join(", ")}) could not be sent`);
  }
}

/** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
function text({ code }: { code: string }) {
  return `Your Linkwarden verification code is ${code}\n\nLog in to Linkwarden on the web or in the mobile app and enter this code. If the app doesn't ask for a code, update it or use the web.\n\nThis code expires in 20 minutes. If you didn't try to sign up or log in to Linkwarden, you can ignore this email.\n`;
}
