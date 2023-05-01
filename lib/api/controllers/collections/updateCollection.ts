// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { prisma } from "@/lib/api/db";
import { ExtendedCollection } from "@/types/global";
import getPermission from "@/lib/api/getPermission";

export default async function (collection: ExtendedCollection, userId: number) {
  if (!collection)
    return { response: "Please choose a valid collection.", status: 401 };

  const collectionIsAccessible = await getPermission(userId, collection.id);

  if (!(collectionIsAccessible?.ownerId === userId))
    return { response: "Collection is not accessible.", status: 401 };

  const updatedCollection = await prisma.$transaction(async () => {
    await prisma.usersAndCollections.deleteMany({
      where: {
        collection: {
          id: collection.id,
        },
      },
    });

    return await prisma.collection.update({
      where: {
        id: collection.id,
      },
      data: {
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
  });

  return { response: updatedCollection, status: 200 };
}
