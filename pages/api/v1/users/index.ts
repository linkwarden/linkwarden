import type { NextApiRequest, NextApiResponse } from "next";
import postUser from "@/lib/api/controllers/users/postUser";
import getUsers from "@/lib/api/controllers/users/getUsers";
import verifyUser from "@/lib/api/verifyUser";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const response = await postUser(req, res);
    return response;
  } else if (req.method === "GET") {
    const user = await verifyUser({ req, res });
    if (!user || process.env.ADMINISTRATOR !== user.username)
      return res.status(401).json({ response: "Unauthorized..." });

    const response = await getUsers();
    return res.status(response.status).json({ response: response.response });
  }
}
