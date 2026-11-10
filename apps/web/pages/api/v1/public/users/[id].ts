import type { NextApiRequest, NextApiResponse } from "next";
import getPublicUser from "@/lib/api/controllers/public/users/getPublicUser";
import verifyToken from "@/lib/api/verifyToken";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const lookupId = req.query.id as string;

  // Check if "lookupId" is the user "id" or their "username"
  const isId = lookupId.split("").every((e) => Number.isInteger(parseInt(e)));

  if (req.method === "GET") {
    const token = await verifyToken({ req });
    const isAuthenticated = typeof token !== "string" && Boolean(token?.id);

    const users = await getPublicUser(lookupId, isId, isAuthenticated);
    return res.status(users.status).json({ response: users.response });
  }
}
