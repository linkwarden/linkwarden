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
  username?: string;
  email?: string;
  password: string;
}

export default async function Index(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (process.env.NEXT_PUBLIC_DISABLE_REGISTRATION === "true") {
    return res.status(400).json({ response: "Registration is disabled." });
  }

  const body: User = req.body;

  const checkHasEmptyFields = emailEnabled
    ? !body.password || !body.name || !body.email
    : !body.username || !body.password || !body.name;

  if (checkHasEmptyFields)
    return res
      .status(400)
      .json({ response: "Please fill out all the fields." });

  const checkUsername = RegExp("^[a-z0-9_-]{3,31}$");

  if (!emailEnabled && !checkUsername.test(body.username?.toLowerCase() || ""))
    return res.status(400).json({
      response:
        "Username has to be between 3-30 characters, no spaces and special characters are allowed.",
    });

  const checkIfUserExists = await prisma.user.findFirst({
    where: emailEnabled
      ? {
          email: body.email?.toLowerCase(),
          emailVerified: { not: null },
        }
      : {
          username: (body.username as string).toLowerCase(),
        },
  });

  if (!checkIfUserExists) {
    const saltRounds = 10;

    const hashedPassword = bcrypt.hashSync(body.password, saltRounds);

    await prisma.user.create({
      data: {
        name: body.name,
        username: emailEnabled
          ? undefined
          : (body.username as string).toLowerCase(),
        email: emailEnabled ? body.email?.toLowerCase() : undefined,
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
