// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import getCollection from "@/lib/api/controllers/public/getCollection";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const collectionId = Number(req.query.collectionId);

  if (!collectionId) {
    return res
      .status(401)
      .json({ response: "Please choose a valid collection." });
  }

  if (req.method === "GET") {
    const collection = await getCollection(collectionId);
    return res
      .status(collection.status)
      .json({ response: collection.response });
  }
}
