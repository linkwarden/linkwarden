import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import cleanupTags from "@/lib/api/controllers/tags/cleanupTags";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const user = await verifyUser({ req, res });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // from what I can find online first use IS the admin
    if (user.id !== 1) {
      return res.status(403).json({ message: "Forbidden: Access is denied." });
    }

    const { threshold } = req.body;
    const deletedCount = await cleanupTags(threshold);

    return res
      .status(200)
      .json({ message: `Successfully deleted ${deletedCount} tags.` });
      
  } catch (error) {
    console.error("Tag cleanup failed:", error);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
}
