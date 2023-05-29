// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { prisma } from "@/lib/api/db";

export default async function (collectionId: number) {
  let data;

  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      isPublic: true,
    },
    include: {
      links: {
        select: {
          id: true,
          name: true,
          url: true,
          title: true,
          collectionId: true,
          createdAt: true,
        },
      },
    },
  });

  if (collection) {
    const user = await prisma.user.findUnique({
      where: {
        id: collection.ownerId,
      },
    });

    data = { ownerName: user?.name, ...collection };

    return { response: data, status: 200 };
  } else {
    return { response: "Collection not found...", status: 400 };
  }
}
