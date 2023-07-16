import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import getLinks from "@/lib/api/controllers/links/getLinks";
import postLink from "@/lib/api/controllers/links/postLink";
import deleteLink from "@/lib/api/controllers/links/deleteLink";
import updateLink from "@/lib/api/controllers/links/updateLink";

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.username) {
    return res.status(401).json({ response: "You must be logged in." });
  } else if (session?.user?.isSubscriber === false)
    res.status(401).json({
      response:
        "You are not a subscriber, feel free to reach out to us at hello@linkwarden.app in case of any issues.",
    });

  if (req.method === "GET") {
    const links = await getLinks(session.user.id, req?.query?.body as string);
    return res.status(links.status).json({ response: links.response });
  } else if (req.method === "POST") {
    const newlink = await postLink(req.body, session.user.id);
    return res.status(newlink.status).json({
      response: newlink.response,
    });
  } else if (req.method === "PUT") {
    const updated = await updateLink(req.body, session.user.id);
    return res.status(updated.status).json({
      response: updated.response,
    });
  } else if (req.method === "DELETE") {
    const deleted = await deleteLink(req.body, session.user.id);
    return res.status(deleted.status).json({
      response: deleted.response,
    });
  }
}
