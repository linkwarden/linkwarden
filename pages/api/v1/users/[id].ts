import type { NextApiRequest, NextApiResponse } from "next";
import getUserById from "@/lib/api/controllers/users/userId/getUserById";
import getPublicUserById from "@/lib/api/controllers/users/userId/getPublicUserById";
import updateUserById from "@/lib/api/controllers/users/userId/updateUserById";
import deleteUserById from "@/lib/api/controllers/users/userId/deleteUserById";
import authenticateUser from "@/lib/api/authenticateUser";
import { prisma } from "@/lib/api/db";
import { getToken } from "next-auth/jwt";

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req });
  const userId = token?.id;

  if (!token?.id)
    return res.status(400).json({ response: "Invalid parameters." });

  const username = (await prisma.user.findUnique({ where: { id: token.id } }))
    ?.username;

  if (!username) return res.status(404).json({ response: "User not found." });

  const lookupId = req.query.id as string;
  const isSelf =
    userId === Number(lookupId) || username === lookupId ? true : false;

  // Check if "lookupId" is the user "id" or their "username"
  const isId = lookupId.split("").every((e) => Number.isInteger(parseInt(e)));

  if (req.method === "GET" && !isSelf) {
    const users = await getPublicUserById(lookupId, isId, username);
    return res.status(users.status).json({ response: users.response });
  }

  const user = await authenticateUser({ req, res });
  if (!user) return res.status(404).json({ response: "User not found." });

  if (req.method === "GET") {
    const users = await getUserById(user.id);
    return res.status(users.status).json({ response: users.response });
  } else if (req.method === "PUT") {
    const updated = await updateUserById(user.id, req.body);
    return res.status(updated.status).json({ response: updated.response });
  } else if (req.method === "DELETE" && user.id === Number(req.query.id)) {
    console.log(req.body);
    const updated = await deleteUserById(user.id, req.body);
    return res.status(updated.status).json({ response: updated.response });
  }
}
