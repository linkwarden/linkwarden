import type { NextApiRequest, NextApiResponse } from "next";
import getTags from "@/lib/api/controllers/tags/getTags";
import verifyUser from "@/lib/api/verifyUser";
import { PostTagSchema } from "@/lib/shared/schemaValidation";
import createOrUpdateTags from "@/lib/api/controllers/tags/createOrUpdateTags";

export default async function tags(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "GET") {
    const tags = await getTags({
      userId: user.id,
    });

    return res.status(tags?.status || 500).json({ response: tags?.response });
  }

  if (req.method === "POST") {
    const dataValidation = PostTagSchema.safeParse(req.body);

    if (!dataValidation.success) {
      return res.status(400).json({
        response: `Error: ${
          dataValidation.error.issues[0].message
        } [${dataValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const { tags } = dataValidation.data;

    const newOrUpdatedTags = await createOrUpdateTags(user.id, tags);

    return res.status(200).json({ response: newOrUpdatedTags });
  }
}
