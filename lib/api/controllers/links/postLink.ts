// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { prisma } from "@/lib/api/db";
import { ExtendedLink } from "@/types/global";
import getTitle from "../../getTitle";
import archive from "../../archive";
import { Link, UsersAndCollections } from "@prisma/client";
import AES from "crypto-js/aes";
import hasAccessToCollection from "@/lib/api/hasAccessToCollection";

export default async function (link: ExtendedLink, userId: number) {
  link.collection.name = link.collection.name.trim();

  if (!link.name) {
    return { response: "Please enter a valid name for the link.", status: 401 };
  } else if (!link.collection.name) {
    return { response: "Please enter a valid collection name.", status: 401 };
  }

  if (link.collection.ownerId) {
    const collectionIsAccessible = await hasAccessToCollection(
      userId,
      link.collection.id
    );

    const memberHasAccess = collectionIsAccessible?.members.some(
      (e: UsersAndCollections) => e.userId === userId && e.canCreate
    );

    if (!(collectionIsAccessible?.ownerId === userId || memberHasAccess))
      return { response: "Collection is not accessible.", status: 401 };
  } else {
    link.collection.ownerId = userId;
  }

  const title = await getTitle(link.url);

  const newLink: Link = await prisma.link.create({
    data: {
      name: link.name,
      url: link.url,
      collection: {
        connectOrCreate: {
          where: {
            name_ownerId: {
              ownerId: link.collection.ownerId,
              name: link.collection.name,
            },
          },
          create: {
            name: link.collection.name,
            ownerId: userId,
          },
        },
      },
      tags: {
        connectOrCreate: link.tags.map((tag) => ({
          where: {
            name_ownerId: {
              name: tag.name,
              ownerId: link.collection.ownerId,
            },
          },
          create: {
            name: tag.name,
            owner: {
              connect: {
                id: link.collection.ownerId,
              },
            },
          },
        })),
      },
      title,
      screenshotPath: "",
      pdfPath: "",
    },
  });

  console.log(newLink);

  const AES_SECRET = process.env.AES_SECRET as string;

  const screenshotHashedPath = AES.encrypt(
    `data/archives/${newLink.collectionId}/${newLink.id}.png`,
    AES_SECRET
  ).toString();

  const pdfHashedPath = AES.encrypt(
    `data/archives/${newLink.collectionId}/${newLink.id}.pdf`,
    AES_SECRET
  ).toString();

  const updatedLink: ExtendedLink = await prisma.link.update({
    where: { id: newLink.id },
    data: { screenshotPath: screenshotHashedPath, pdfPath: pdfHashedPath },
    include: { tags: true, collection: true },
  });

  archive(updatedLink.url, updatedLink.collectionId, updatedLink.id);

  return { response: updatedLink, status: 200 };
}
