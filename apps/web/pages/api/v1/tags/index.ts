import type { NextApiRequest, NextApiResponse } from "next";
import getTags from "@/lib/api/controllers/tags/getTags";
import verifyUser from "@/lib/api/verifyUser";
import { PostTagSchema } from "@linkwarden/lib/schemaValidation";
import createOrUpdateTags from "@/lib/api/controllers/tags/createOrUpdateTags";
import bulkTagDelete from "@/lib/api/controllers/tags/bulkTagDelete";
import { TagPaginationParams } from "@/lib/api/utils/types";

export default async function tags(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "GET") {
    // Parse pagination parameters from query
    const params: TagPaginationParams = {
      userId: user.id,
      cursor: req.query.cursor ? Number(req.query.cursor as string) : undefined,
      limit: req.query.limit ? Number(req.query.limit as string) : undefined,
      sort: req.query.sort as string,
      dir: req.query.dir as string,
      search: req.query.search as string,
      collectionId: req.query.collectionId
        ? Number(req.query.collectionId as string)
        : undefined,
    };

    const tags = await getTags(params);

    return res.status(tags?.status || 500).json({
      success: true,
      response: tags?.response,
    });
  }

  if (req.method === "POST") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

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

  if (req.method === "DELETE") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const tags = await bulkTagDelete(user.id, req.body);
    return res.status(tags.status).json({ response: tags.response });
  }
}
