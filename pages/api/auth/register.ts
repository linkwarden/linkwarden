import { prisma } from "@/lib/api/db";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";

const EmailProvider =
  process.env.EMAIL_FROM && process.env.EMAIL_SERVER ? true : false;

interface Data {
  response: string | object;
}

interface User {
  name: string;
  username: string;
  email?: string;
  password: string;
}

export default async function Index(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const body: User = req.body;

  const checkHasEmptyFields = EmailProvider
    ? !body.username || !body.password || !body.name || !body.email
    : !body.username || !body.password || !body.name;

  if (checkHasEmptyFields)
    return res
      .status(400)
      .json({ response: "Please fill out all the fields." });

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  // Remove user's who aren't verified for more than 10 minutes
  if (EmailProvider)
    await prisma.user.deleteMany({
      where: {
        createdAt: {
          lt: tenMinutesAgo,
        },
        emailVerified: null,
      },
    });

  const checkIfUserExists = await prisma.user.findFirst({
    where: EmailProvider
      ? {
          OR: [
            { username: body.username.toLowerCase() },
            {
              email: body.email?.toLowerCase(),
            },
          ],
          emailVerified: { not: null },
        }
      : {
          username: body.username.toLowerCase(),
        },
  });

  if (!checkIfUserExists) {
    const saltRounds = 10;

    const hashedPassword = bcrypt.hashSync(body.password, saltRounds);

    await prisma.user.create({
      data: {
        name: body.name,
        username: body.username.toLowerCase(),
        email: body.email?.toLowerCase(),
        password: hashedPassword,
      },
    });

    res.status(201).json({ response: "User successfully created." });
  } else if (checkIfUserExists) {
    res.status(400).json({ response: "Username and/or Email already exists." });
  }
}
