// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { prisma } from "@/lib/api/db";
import { CollectionIncludingMembers } from "@/types/global";
import { existsSync, mkdirSync } from "fs";

export default async function (
  collection: CollectionIncludingMembers,
  userId: number
) {
  if (!collection || collection.name.trim() === "")
    return {
      response: "Please enter a valid collection.",
      status: 400,
    };

  const findCollection = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      collections: {
        where: {
          name: collection.name,
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
      name: collection.name,
      description: collection.description,
      members: {
        create: collection.members.map((e) => ({
          user: { connect: { email: e.user.email } },
          canCreate: e.canCreate,
          canUpdate: e.canUpdate,
          canDelete: e.canDelete,
        })),
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const collectionPath = `data/archives/${newCollection.id}`;
  if (!existsSync(collectionPath))
    mkdirSync(collectionPath, { recursive: true });

  return { response: newCollection, status: 200 };
}
