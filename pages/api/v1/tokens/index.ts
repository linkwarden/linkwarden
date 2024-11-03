import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import postToken from "@/lib/api/controllers/tokens/postToken";
import getTokens from "@/lib/api/controllers/tokens/getTokens";

export default async function tokens(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "POST") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const token = await postToken(req.body, user.id);
    return res.status(token.status).json({ response: token.response });
  } else if (req.method === "GET") {
    const token = await getTokens(user.id);
    return res.status(token.status).json({ response: token.response });
  }
}
