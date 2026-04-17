import type { NextApiRequest, NextApiResponse } from "next";
import { fileExists } from "@linkwarden/filesystem";
import resolveAccessibleArchive from "@/lib/api/archives/resolveAccessibleArchive";
import createPreservedFormatUrl from "@/lib/api/preserved/createPreservedFormatUrl";
import verifyToken from "@/lib/api/verifyToken";
import { ArchivedFormat } from "@linkwarden/types/global";

const getSingleValue = (value?: string | string[]) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ response: "Method not allowed" });
  }

  if (!process.env.NEXT_PUBLIC_USER_CONTENT_DOMAIN) {
    return res
      .status(400)
      .json({ response: "User content domain is not configured." });
  }

  try {
    const token = await verifyToken({ req });
    const userId = typeof token === "string" ? undefined : token?.id;
    const format = Number(
      getSingleValue(req.query.format) ?? ArchivedFormat.monolith
    );

    const resolvedArchive = await resolveAccessibleArchive({
      linkId: Number(req.query.linkId),
      format,
      userId,
    });

    if (resolvedArchive.status !== 200) {
      return res
        .status(resolvedArchive.status)
        .json({ response: resolvedArchive.response });
    }

    const { filePath, linkId } = resolvedArchive.response;
    if (!(await fileExists(filePath))) {
      return res.status(404).json({ response: "Archived format not found." });
    }

    const url = await createPreservedFormatUrl({
      linkId,
      filePath,
      format: resolvedArchive.response.format,
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ response: { url } });
  } catch (error: any) {
    return res.status(500).json({
      response: error?.message || "Failed to create archived format URL.",
    });
  }
}
