import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import getData from "@/lib/api/controllers/migration/getData";
import postData from "@/lib/api/controllers/migration/postData";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user.id) {
    return res.status(401).json({ response: "You must be logged in." });
  } else if (session?.user?.isSubscriber === false)
    res.status(401).json({
      response:
        "You are not a subscriber, feel free to reach out to us at support@linkwarden.app in case of any issues.",
    });

  if (req.method === "GET") {
    const data = await getData(session.user.id);

    if (data.status === 200)
      return res
        .setHeader("Content-Type", "application/json")
        .setHeader("Content-Disposition", "attachment; filename=backup.json")
        .status(data.status)
        .json(data.response);
  } else if (req.method === "POST") {
    const data = await postData(session.user.id, req.body);
    return res.status(data.status).json({ response: data.response });
  }
}
