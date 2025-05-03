import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import deleteToken from "@/lib/api/controllers/tokens/tokenId/deleteTokenById";

export default async function token(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "DELETE") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const deleted = await deleteToken(user.id, Number(req.query.id) as number);
    return res.status(deleted.status).json({ response: deleted.response });
  }
}
