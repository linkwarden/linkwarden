import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import getUsers from "@/lib/api/controllers/users/getUsers";
import updateUser from "@/lib/api/controllers/users/updateUser";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user.username) {
    return res.status(401).json({ response: "You must be logged in." });
  } else if (session?.user?.isSubscriber === false)
    res.status(401).json({
      response:
        "You are not a subscriber, feel free to reach out to us at hello@linkwarden.app in case of any issues.",
    });

  const lookupUsername = (req.query.username as string) || undefined;
  const lookupId = Number(req.query.id) || undefined;
  const isSelf = session.user.username === lookupUsername ? true : false;

  if (req.method === "GET") {
    const users = await getUsers({
      params: {
        lookupUsername,
        lookupId,
      },
      isSelf,
      username: session.user.username,
    });
    return res.status(users.status).json({ response: users.response });
  } else if (req.method === "PUT" && !req.body.password) {
    const updated = await updateUser(req.body, session.user);
    return res.status(updated.status).json({ response: updated.response });
  }
}

// {
//   lookupUsername,
//   lookupId,
// },
// isSelf,
// session.user.username
