import { MEILI_INDEX_VERSION } from "@linkwarden/lib/constants";
import { prisma } from "@linkwarden/prisma";
import { GetUserByIdResponse } from "@linkwarden/types/global";

export default async function getUserById(userId: number) {
  const [user, firstUnIndexedLinks, oauthAccountCount] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        subscriptions: true,
        parentSubscription: {
          include: {
            user: true,
          },
        },
        dashboardSections: true,
      },
    }),
    prisma.link.findFirst({
      where: {
        collection: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
        OR: [
          { indexVersion: null },
          { NOT: { indexVersion: MEILI_INDEX_VERSION } },
        ],
      },
    }),
    prisma.account.count({
      where: {
        userId,
        type: {
          in: ["oauth", "oidc"],
        },
      },
      select: {
        provider: true,
      },
    }),
  ]);

  if (!user) return { response: "User not found.", status: 404 };

  const { password, subscriptions, parentSubscription, ...lessSensitiveInfo } =
    user;

  const data: GetUserByIdResponse = {
    ...lessSensitiveInfo,
    subscription: {
      active: subscriptions?.active ?? false,
      quantity: subscriptions?.quantity ?? 0,
    },
    parentSubscription: {
      active: parentSubscription?.active,
      user: {
        email: parentSubscription?.user.email,
      },
    },
    hasPassword: !!password,
    hasOAuthAccount: oauthAccountCount.provider > 0,
    hasUnIndexedLinks: !!firstUnIndexedLinks,
  };

  return { response: data, status: 200 };
}
