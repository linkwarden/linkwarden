// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { prisma } from "@/lib/api/db";
import { existsSync, mkdirSync } from "fs";

export default async function (collectionName: string, userId: number) {
  if (!collectionName)
    return {
      response: "Please enter a valid name for the collection.",
      status: 400,
    };

  const findCollection = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      collections: {
        where: {
          name: collectionName,
        },
      },
    },
  });

  const checkIfCollectionExists = findCollection?.collections[0];

  if (checkIfCollectionExists)
    return { response: "Collection already exists.", status: 400 };

  const newCollection = await prisma.collection.create({
    data: {
      owner: {
        connect: {
          id: userId,
        },
      },
      name: collectionName,
    },
  });

  const collectionPath = `data/archives/${newCollection.id}`;
  if (!existsSync(collectionPath))
    mkdirSync(collectionPath, { recursive: true });

  return { response: newCollection, status: 200 };
}
