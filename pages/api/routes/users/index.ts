// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import getUsers from "@/lib/api/controllers/users/getUsers";
import updateUser from "@/lib/api/controllers/users/updateUser";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ response: "You must be logged in." });
  }

  const lookupEmail = req.query.email as string;
  const isSelf = session.user.email === lookupEmail ? true : false;

  if (req.method === "GET") {
    const users = await getUsers(lookupEmail, isSelf, session.user.email);
    return res.status(users.status).json({ response: users.response });
  } else if (req.method === "PUT" && !req.body.password) {
    const updated = await updateUser(req.body, session.user.id);
    return res.status(updated.status).json({ response: updated.response });
  }
}
