import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import getUsers from "@/lib/api/controllers/users/getUsers";
import updateUser from "@/lib/api/controllers/users/updateUser";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ response: "You must be logged in." });
  }

  const lookupEmail = req.query.email as string;
  const isSelf = session.user.email === lookupEmail ? true : false;

  if (req.method === "GET") {
    const users = await getUsers(lookupEmail, isSelf, session.user.email);
    return res.status(users.status).json({ response: users.response });
  } else if (req.method === "PUT" && !req.body.password) {
    const updated = await updateUser(req.body, session.user.id);
    return res.status(updated.status).json({ response: updated.response });
  }
}
