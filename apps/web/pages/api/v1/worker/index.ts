import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import getWorkerStats from "@/lib/api/controllers/worker/getWorkerStats";

export default async function worker(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (user.id !== Number(process.env.NEXT_PUBLIC_ADMIN || 1)) {
    return res.status(403).json({ response: "Forbidden." });
  }

  if (req.method === "GET") {
    const { status, ...data } = await getWorkerStats(user.id);
    return res.status(status).json(data);
  }
}
