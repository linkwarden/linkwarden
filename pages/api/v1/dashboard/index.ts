import type { NextApiRequest, NextApiResponse } from "next";
import { LinkRequestQuery } from "@/types/global";
import getDashboardData from "@/lib/api/controllers/dashboard/getDashboardData";
import authenticateUser from "@/lib/api/authenticateUser";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  const user = await authenticateUser({ req, res });
  if (!user) return res.status(404).json({ response: "User not found." });

  if (req.method === "GET") {
    const convertedData: LinkRequestQuery = {
      sort: Number(req.query.sort as string),
      cursor: req.query.cursor ? Number(req.query.cursor as string) : undefined,
    };

    const links = await getDashboardData(user.id, convertedData);
    return res.status(links.status).json({ response: links.response });
  }
}
