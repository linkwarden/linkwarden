// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { prisma } from "@/lib/api/db";
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

export default async function (
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const body: User = req.body;

  if (!body.email || !body.password || !body.name)
    return res.status(400).json({ message: "Please fill out all the fields." });

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
      },
    });

    res.status(201).json({ message: "User successfully created." });
  } else if (checkIfUserExists) {
    res.status(400).json({ message: "User already exists." });
  }
}
