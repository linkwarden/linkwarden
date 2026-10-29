import type { NextApiRequest, NextApiResponse } from "next";
import getUserById from "@/lib/api/controllers/users/userId/getUserById";
import updateUserById from "@/lib/api/controllers/users/userId/updateUserById";
import deleteUserById from "@/lib/api/controllers/users/userId/deleteUserById";
import { prisma } from "@linkwarden/prisma";
import verifySubscription from "@/lib/api/billing/verifySubscription";
import { isStoreBillingConfigured } from "@/lib/api/billing/syncStoreSubscription";
import verifyToken from "@/lib/api/verifyToken";
import setSessionCookie from "@/lib/api/setSessionCookie";

const BILLING_ENABLED =
  Boolean(process.env.STRIPE_SECRET_KEY) || isStoreBillingConfigured();

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  const token = await verifyToken({ req });

  const queryId = Number(req.query.id);

  if (!queryId) {
    return res.status(400).json({ response: "Invalid request." });
  }

  if (typeof token === "string") {
    res.status(401).json({ response: token });
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: token?.id,
    },
  });

  const isServerAdmin = user?.id === Number(process.env.NEXT_PUBLIC_ADMIN || 1);

  const userId = token.id;

  if (req.method === "GET") {
    if (userId !== queryId && !isServerAdmin)
      return res.status(401).json({ response: "Permission denied." });

    const users = await getUserById(userId);
    return res.status(users.status).json({ response: users.response });
  }

  // Non-subscribers (when billing is enabled) are normally blocked below, but they are still allowed to delete their own account. The password check is only bypassed for accounts that don't have a password (e.g. SSO users).
  let bypassPasswordForDeletion = false;

  if (BILLING_ENABLED) {
    const user = await prisma.user.findUnique({
      where: {
        id: token.id,
      },
      include: {
        subscriptions: true,
        parentSubscription: true,
      },
    });

    if (user) {
      const subscribedUser = await verifySubscription(user);
      if (!subscribedUser) {
        const isSelfDeletion = req.method === "DELETE" && userId === queryId;

        if (!isSelfDeletion) {
          return res.status(401).json({
            response:
              "You are not a subscriber, feel free to reach out to us at support@linkwarden.app if you think this is an issue.",
          });
        }

        bypassPasswordForDeletion = !user.password;
      }
    } else {
      return res.status(404).json({ response: "User not found." });
    }
  }

  if (req.method === "PUT") {
    if (userId !== queryId && !isServerAdmin)
      return res.status(401).json({ response: "Permission denied." });

    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const updated = await updateUserById(userId, req.body);

    // Changing the password revokes this web session too, so give it a new cookie to stay signed in
    if (
      updated.status === 200 &&
      req.body.newPassword &&
      !req.headers.authorization?.startsWith("Bearer ")
    ) {
      const { sessionVersion } = await prisma.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
        select: {
          sessionVersion: true,
        },
      });

      await setSessionCookie(res, { ...token, sessionVersion });
    }

    return res.status(updated.status).json({ response: updated.response });
  } else if (req.method === "DELETE") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const updated = await deleteUserById(
      userId,
      req.body,
      isServerAdmin,
      queryId,
      bypassPasswordForDeletion
    );
    return res.status(updated.status).json({ response: updated.response });
  }
}
