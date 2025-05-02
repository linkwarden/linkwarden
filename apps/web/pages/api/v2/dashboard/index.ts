import type { NextApiRequest, NextApiResponse } from "next";
import { LinkRequestQuery } from "@linkwarden/types";
import getDashboardDataV2 from "@/lib/api/controllers/dashboard/getDashboardDataV2";
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

    const { statusCode, ...data } = await getDashboardDataV2(
      user.id,
      convertedData,
      user.dashboardRecentLinks,
      user.dashboardPinnedLinks
    );

    return res.status(statusCode).json(data);
  }
}
