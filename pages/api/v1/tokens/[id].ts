import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import deleteToken from "@/lib/api/controllers/tokens/tokenId/deleteTokenById";

export default async function token(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "DELETE") {
    const deleted = await deleteToken(user.id, Number(req.query.id) as number);
    return res.status(deleted.status).json({ response: deleted.response });
  }
}
