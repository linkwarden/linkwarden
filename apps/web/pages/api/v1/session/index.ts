import type { NextApiRequest, NextApiResponse } from "next";
import verifyByCredentials from "@/lib/api/verifyByCredentials";
import createSession from "@/lib/api/controllers/session/createSession";
import deleteSession from "@/lib/api/controllers/session/deleteSession";
import verifyToken from "@/lib/api/verifyToken";
import { PostSessionSchema } from "@linkwarden/lib/schemaValidation";

export default async function session(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Signing out has to work for sessions created through SSO too, so this comes before the credentials check
  if (req.method === "DELETE") {
    const token = await verifyToken({ req });

    if (typeof token === "string")
      return res.status(401).json({ response: token });

    const deleted = await deleteSession(token.id, token.jti);
    return res.status(deleted.status).json({ response: deleted.response });
  }

  if (process.env.NEXT_PUBLIC_CREDENTIALS_ENABLED === "false")
    return res.status(400).json({
      response: "Login with credentials is disabled.",
    });

  const dataValidation = PostSessionSchema.safeParse(req.body);

  if (!dataValidation.success) {
    return res.status(400).json({
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
    });
  }

  const { username, password, code, sessionName } = dataValidation.data;

  const result = await verifyByCredentials({ username, password, code });

  if (result.status === "email_not_verified")
    return res.status(401).json({
      response: "Please verify your email address before logging in.",
      code: "EMAIL_NOT_VERIFIED",
      email: result.user.email,
    });

  if (result.status === "invalid_code")
    return res.status(400).json({
      response: result.response,
      code: "INVALID_VERIFICATION_CODE",
    });

  if (result.status === "too_many_attempts") {
    res.setHeader("Retry-After", String(result.retryAfter));
    return res.status(429).json({
      response: result.response,
      code: "TOO_MANY_ATTEMPTS",
    });
  }

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
