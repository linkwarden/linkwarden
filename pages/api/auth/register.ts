import { prisma } from "@/lib/api/db";
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";

const emailEnabled =
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

  const checkHasEmptyFields = emailEnabled
    ? !body.username || !body.password || !body.name || !body.email
    : !body.username || !body.password || !body.name;

  if (checkHasEmptyFields)
    return res
      .status(400)
      .json({ response: "Please fill out all the fields." });

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  // Remove user's who aren't verified for more than 10 minutes
  if (emailEnabled)
    await prisma.user.deleteMany({
      where: {
        OR: [
          {
            email: body.email,
          },
          {
            username: body.username,
          },
        ],
        createdAt: {
          lt: tenMinutesAgo,
        },
        emailVerified: null,
      },
    });

  const checkUsername = RegExp("^[a-z0-9_-]{3,31}$");

  if (!checkUsername.test(body.username))
    return res.status(400).json({
      response:
        "Username has to be between 3-30 characters, no spaces and special characters are allowed.",
    });

  const checkIfUserExists = await prisma.user.findFirst({
    where: emailEnabled
      ? {
          OR: [
            {
              username: body.username.toLowerCase(),
            },
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

    return res.status(201).json({ response: "User successfully created." });
  } else if (checkIfUserExists) {
    return res
      .status(400)
      .json({ response: "Username and/or Email already exists." });
  }
}
