import type { NextApiRequest, NextApiResponse } from "next";
import verifyByCredentials from "@/lib/api/verifyByCredentials";
import createSession from "@/lib/api/controllers/session/createSession";
import { PostSessionSchema } from "@linkwarden/lib/schemaValidation";

export default async function session(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const dataValidation = PostSessionSchema.safeParse(req.body);

  if (!dataValidation.success) {
    return res.status(400).json({
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
    });
  }

  const { username, password, sessionName } = dataValidation.data;

  const result = await verifyByCredentials({ username, password });

  if (result.status === "email_not_verified")
    return res.status(401).json({
      response: "Please verify your email address before logging in.",
      code: "EMAIL_NOT_VERIFIED",
      email: result.user.email,
    });

  if (result.status !== "success")
    return res.status(400).json({
      response:
        "Invalid credentials. You might need to reset your password if you're sure you already signed up with the current username/email.",
    });

  if (req.method === "POST") {
    const token = await createSession(result.user.id, sessionName);
    return res.status(token.status).json({ response: token.response });
  }
}
