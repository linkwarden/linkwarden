import { prisma } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";

interface Data {
  message: string | object;
}

interface User {
  name: string;
  email: string;
  password: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const body: User = req.body;

  const checkIfUserExists = await prisma.user.findFirst({
    where: {
      email: body.email,
    },
  });

  if (!checkIfUserExists) {
    const saltRounds = 10;

    const hashedPassword = bcrypt.hashSync(body.password, saltRounds);

    await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
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

    res.status(201).json({ message: "User successfully created." });
  } else {
    res.status(400).json({ message: "User already exists." });
  }
}
