import type { NextApiRequest, NextApiResponse } from "next";
import verifyByCredentials from "@/lib/api/verifyByCredentials";
import createSession from "@/lib/api/controllers/session/createSession";

export default async function session(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { username, password, sessionName } = req.body;

  const user = await verifyByCredentials({ username, password });

  if (!user)
    return res.status(400).json({
      response:
        "Invalid credentials. You might need to reset your password if you're sure you already signed up with the current username/email.",
    });

  if (req.method === "POST") {
    const token = await createSession(user.id, sessionName);
    return res.status(token.status).json({ response: token.response });
  }
}
