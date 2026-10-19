import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import getReadingListState from "@/lib/api/controllers/readingList/getReadingListState";
import updateReadingList from "@/lib/api/controllers/readingList/updateReadingList";
import removeFromReadingList from "@/lib/api/controllers/readingList/removeFromReadingList";

export default async function readingList(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "GET") {
    const state = await getReadingListState(user.id);
    return res.status(state.status).json({ response: state.response });
  }

  if (req.method !== "PUT" && req.method !== "DELETE") {
    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).json({ response: "Method not allowed." });
  }

  if (process.env.NEXT_PUBLIC_DEMO === "true")
    return res.status(400).json({
      response:
        "This action is disabled because this is a read-only demo of Linkwarden.",
    });

  const result =
    req.method === "PUT"
      ? await updateReadingList(user.id, req.body)
      : await removeFromReadingList(user.id, req.body);

  return res.status(result.status).json({ response: result.response });
}
