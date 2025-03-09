import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import { PostHighlightSchema } from "@/lib/shared/schemaValidation";
import postHighlight from "@/lib/api/controllers/highlights/postHighlight";

export default async function highlights(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "POST") {
    const dataValidation = PostHighlightSchema.safeParse(req.body);

    if (!dataValidation.success) {
      return res.status(400).json({
        response: `Error: ${
          dataValidation.error.issues[0].message
        } [${dataValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const body = dataValidation.data;

    const highlights = await postHighlight(user.id, body);

    return res.status(200).json({ response: highlights });
  }
}
