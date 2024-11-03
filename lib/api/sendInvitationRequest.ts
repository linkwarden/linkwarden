import { readFileSync } from "fs";
import path from "path";
import Handlebars from "handlebars";
import transporter from "./transporter";

type Params = {
  parentSubscriptionEmail: string;
  identifier: string;
  url: string;
  from: string;
  token: string;
};

export default async function sendInvitationRequest({
  parentSubscriptionEmail,
  identifier,
  url,
  from,
  token,
}: Params) {
  const emailsDir = path.resolve(process.cwd(), "templates");

  const templateFile = readFileSync(
    path.join(emailsDir, "acceptInvitation.html"),
    "utf8"
  );

  const emailTemplate = Handlebars.compile(templateFile);

  const { host } = new URL(url);
  const result = await transporter.sendMail({
    to: identifier,
    from: {
      name: "Linkwarden",
      address: from as string,
    },
    subject: `You have been invited to join Linkwarden`,
    text: text({ url, host }),
    html: emailTemplate({
      parentSubscriptionEmail,
      identifier,
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
