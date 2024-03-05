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
    const token = await postToken(JSON.parse(req.body), user.id);
    return res.status(token.status).json({ response: token.response });
  } else if (req.method === "GET") {
    const token = await getTokens(user.id);
    return res.status(token.status).json({ response: token.response });
  }
}
