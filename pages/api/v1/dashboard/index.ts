import type { NextApiRequest, NextApiResponse } from "next";
import { LinkRequestQuery } from "@/types/global";
import getDashboardData from "@/lib/api/controllers/dashboard/getDashboardData";
import verifyUser from "@/lib/api/verifyUser";

export default async function dashboard(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "GET") {
    const convertedData: LinkRequestQuery = {
      sort: Number(req.query.sort as string),
      cursor: req.query.cursor ? Number(req.query.cursor as string) : undefined,
    };

    const links = await getDashboardData(user.id, convertedData);
    return res.status(links.status).json({ response: links.response });
  }
}
