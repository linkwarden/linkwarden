import { prisma } from "@/lib/api/db";
import { User } from "@prisma/client";

export default async function getUsers(user: User) {
  if (user.id === Number(process.env.NEXT_PUBLIC_ADMIN || 1)) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        emailVerified: true,
        subscriptions: {
          select: {
            active: true,
          },
        },
        createdAt: true,
      },
    });

    return {
      response: users.sort((a: any, b: any) => a.id - b.id),
      status: 200,
    };
  } else {
    let subscriptionId = (
      await prisma.subscription.findFirst({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
        },
      })
    )?.id;

    if (!subscriptionId)
      return {
        response: "Subscription not found.",
        status: 404,
      };

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            parentSubscriptionId: subscriptionId,
          },
          {
            subscriptions: {
              id: subscriptionId,
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return {
      response: users.sort((a: any, b: any) => a.id - b.id),
      status: 200,
    };
  }
}
