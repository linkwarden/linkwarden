// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { prisma } from "@/lib/api/db";
import getPermission from "@/lib/api/getPermission";
import fs from "fs";

export default async function (collection: { id: number }, userId: number) {
  console.log(collection.id);

  if (!collection.id)
    return { response: "Please choose a valid collection.", status: 401 };

  const collectionIsAccessible = await getPermission(userId, collection.id);

  if (!(collectionIsAccessible?.ownerId === userId))
    return { response: "Collection is not accessible.", status: 401 };

  const deletedCollection = await prisma.$transaction(async () => {
    await prisma.usersAndCollections.deleteMany({
      where: {
        collection: {
          id: collection.id,
        },
      },
    });

    await prisma.link.deleteMany({
      where: {
        collection: {
          id: collection.id,
        },
      },
    });

    fs.rmdirSync(`data/archives/${collection.id}`, { recursive: true });

    return await prisma.collection.delete({
      where: {
        id: collection.id,
      },
    });
  });

  return { response: deletedCollection, status: 200 };
}
