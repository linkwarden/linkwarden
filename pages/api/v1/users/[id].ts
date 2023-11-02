import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/v1/auth/[...nextauth]";
import getUserById from "@/lib/api/controllers/users/userId/getUserById";
import getPublicUserById from "@/lib/api/controllers/users/userId/getPublicUserById";
import updateUserById from "@/lib/api/controllers/users/userId/updateUserById";
import deleteUserById from "@/lib/api/controllers/users/userId/deleteUserById";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user.id;
  const username = session?.user.username;

  const lookupId = req.query.id as string;
  const isSelf =
    userId === Number(lookupId) || username === lookupId ? true : false;

  // Check if "lookupId" is the user "id" or their "username"
  const isId = lookupId.split("").every((e) => Number.isInteger(parseInt(e)));

  if (req.method === "GET" && !isSelf) {
    const users = await getPublicUserById(lookupId, isId, username);
    return res.status(users.status).json({ response: users.response });
  }

  if (!userId) {
    return res.status(401).json({ response: "You must be logged in." });
  } else if (session?.user?.isSubscriber === false)
    return res.status(401).json({
      response:
        "You are not a subscriber, feel free to reach out to us at support@linkwarden.app in case of any issues.",
    });

  if (req.method === "GET") {
    const users = await getUserById(session.user.id);
    return res.status(users.status).json({ response: users.response });
  } else if (req.method === "PUT") {
    const updated = await updateUserById(session.user, req.body);
    return res.status(updated.status).json({ response: updated.response });
  } else if (
    req.method === "DELETE" &&
    session.user.id === Number(req.query.id)
  ) {
    console.log(req.body);
    const updated = await deleteUserById(session.user.id, req.body);
    return res.status(updated.status).json({ response: updated.response });
  }
}
