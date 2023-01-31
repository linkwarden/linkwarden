import { prisma } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";

interface Data {
  name: string;
}

interface User {
  name: string;
  username: string;
  password: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const data: User = req.body;

  const createUser = await prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      password: data.password,
      collections: {
        create: [
          {
            role: "owner",
            collection: {
              create: {
                name: "First Collection",
              },
            },
          },
        ],
      },
    },
  });

  console.log(createUser);

  res.status(200).json(createUser);
}
