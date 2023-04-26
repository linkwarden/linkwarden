// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { prisma } from "@/lib/api/db";
import { ExtendedLink } from "@/types/global";
import fs from "fs";
import { Link, UsersAndCollections } from "@prisma/client";
import getPermission from "@/lib/api/getPermission";

export default async function (link: ExtendedLink, userId: number) {
  if (!link) return { response: "Please choose a valid link.", status: 401 };

  const collectionIsAccessible = await getPermission(userId, link.collectionId);

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canDelete
  );

  if (!(collectionIsAccessible?.ownerId === userId || memberHasAccess))
    return { response: "Collection is not accessible.", status: 401 };

  const deleteLink: Link = await prisma.link.delete({
    where: {
      id: link.id,
    },
  });

  fs.unlink(`data/archives/${link.collectionId}/${link.id}.pdf`, (err) => {
    if (err) console.log(err);
  });

  fs.unlink(`data/archives/${link.collectionId}/${link.id}.png`, (err) => {
    if (err) console.log(err);
  });

  return { response: deleteLink, status: 200 };
}
