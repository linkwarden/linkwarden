import { verifyAppleIdentityToken } from "@/lib/api/apple";
import createSession from "@/lib/api/controllers/session/createSession";
import { isNewSsoUsersDisabled } from "@/lib/api/registration";
import { prisma } from "@linkwarden/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

const appleBundleId = process.env.APPLE_BUNDLE_ID || "app.linkwarden";

export default async function appleMobileAuth(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ response: "Method not allowed." });

  if (process.env.NEXT_PUBLIC_APPLE_ENABLED !== "true")
    return res
      .status(400)
      .json({ response: "Apple sign-in is not enabled on this instance." });

  const { identityToken, name, sessionName } = req.body ?? {};

  if (typeof identityToken !== "string" || !identityToken)
    return res.status(400).json({ response: "Missing identity token." });

  let claims;
  try {
    claims = await verifyAppleIdentityToken(identityToken, appleBundleId);
  } catch {
    return res.status(401).json({ response: "Invalid Apple identity token." });
  }

  const emailVerified =
    claims.email_verified === true || claims.email_verified === "true";
  const email = emailVerified ? claims.email?.toLowerCase() : undefined;

  let account = await prisma.account.findFirst({
    where: { provider: "apple", providerAccountId: claims.sub },
    include: { user: true },
  });

  let user = account?.user;

  if (!user && email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (existingUser && existingUser.accounts.length > 0)
      return res.status(409).json({
        response:
          "An account with this email is already linked to another sign-in method.",
      });

    if (existingUser) {
      user = existingUser;
      await prisma.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "apple",
          providerAccountId: claims.sub,
        },
      });
    }
  }

  if (!user) {
    if (isNewSsoUsersDisabled())
      return res.status(403).json({ response: "Sign ups are disabled." });

    const fullName = typeof name === "string" && name.trim() ? name.trim() : "";

    user = await prisma.user.create({
      data: {
        name: fullName,
        email,
        emailVerified: new Date(),
        username: "user" + Math.round(Math.random() * 1000000000),
        accounts: {
          create: {
            type: "oauth",
            provider: "apple",
            providerAccountId: claims.sub,
          },
        },
        dashboardSections: {
          createMany: {
            data: [
              { order: 0, type: "STATS" },
              { order: 1, type: "RECENT_LINKS" },
              { order: 2, type: "PINNED_LINKS" },
            ],
          },
        },
      },
    });
  }

  const token = await createSession(user.id, sessionName);
  return res.status(token.status).json({ response: token.response });
}
