import type { NextApiRequest, NextApiResponse } from "next";
import getUserById from "@/lib/api/controllers/users/userId/getUserById";
import verifyToken from "@/lib/api/verifyToken";

export default async function me(req: NextApiRequest, res: NextApiResponse) {
  const token = await verifyToken({ req });

  if (typeof token === "string") {
    res.status(401).json({ response: token });
    return null;
  }

  const userId = token.id;

  if (req.method === "GET") {
    const users = await getUserById(userId);
    return res.status(users.status).json({ response: users.response });
  }
}
