import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import { PostHighlightSchema } from "@linkwarden/lib/schemaValidation";
import postOrUpdateHighlight from "@/lib/api/controllers/highlights/postOrUpdateHighlight";

export default async function highlights(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "POST") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const dataValidation = PostHighlightSchema.safeParse(req.body);

    if (!dataValidation.success) {
      return res.status(400).json({
        response: `Error: ${
          dataValidation.error.issues[0].message
        } [${dataValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const body = dataValidation.data;

    const highlights = await postOrUpdateHighlight(user.id, body);

    return res
      .status(highlights.status)
      .json({ response: highlights.response });
  }
}
