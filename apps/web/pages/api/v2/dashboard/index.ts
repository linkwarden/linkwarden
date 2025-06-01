import type { NextApiRequest, NextApiResponse } from "next";
import { LinkRequestQuery } from "@linkwarden/types";
import getDashboardDataV2 from "@/lib/api/controllers/dashboard/getDashboardDataV2";
import verifyUser from "@/lib/api/verifyUser";
import { UpdateDashboardLayoutSchema } from "@linkwarden/lib/schemaValidation";
import updateDashboardLayout from "@/lib/api/controllers/dashboard/updateDashboardLayout";

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

    const showRecentLinks = user.dashboardSections.some(section => section.type === 'RECENT_LINKS');
    const showPinnedLinks = user.dashboardSections.some(section => section.type === 'PINNED_LINKS');

    const { statusCode, ...data } = await getDashboardDataV2(
      user.id,
      convertedData,
      showRecentLinks,
      showPinnedLinks
    );

    return res.status(statusCode).json(data);
  }

  if (req.method === "PUT") {
    const { status, response } = await updateDashboardLayout(user.id, req.body);

    return res.status(status).json(response);
  }
}
