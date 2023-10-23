import type { NextApiRequest, NextApiResponse } from "next";
import postUser from "@/lib/api/controllers/users/postUser";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const response = await postUser(req, res);
    return response;
  }
}
