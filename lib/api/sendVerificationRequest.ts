import { readFileSync } from "fs";
import { SendVerificationRequestParams } from "next-auth/providers";
import path from "path";
import Handlebars from "handlebars";
import transporter from "./transporter";

export default async function sendVerificationRequest(
  params: SendVerificationRequestParams
) {
  const emailsDir = path.resolve(process.cwd(), "templates");

  const templateFile = readFileSync(
    path.join(emailsDir, "verifyEmail.html"),
    "utf8"
  );

  const emailTemplate = Handlebars.compile(templateFile);

  const { identifier, url, provider, token } = params;
  const { host } = new URL(url);
  const result = await transporter.sendMail({
    to: identifier,
    from: provider.from,
    subject: `Please verify your email address`,
    text: text({ url, host }),
    html: emailTemplate({
      url: `${
        process.env.NEXTAUTH_URL
      }/callback/email?token=${token}&email=${encodeURIComponent(identifier)}`,
    }),
  });
  const failed = result.rejected.concat(result.pending).filter(Boolean);
  if (failed.length) {
    throw new Error(`Email (${failed.join(", ")}) could not be sent`);
  }
}

/** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
function text({ url, host }: { url: string; host: string }) {
  return `Sign in to ${host}\n${url}\n\n`;
}
