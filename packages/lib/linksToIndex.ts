import { Prisma } from "@linkwarden/prisma/client";
import { MEILI_INDEX_VERSION } from "./constants";

// The links the indexing worker sends to Meilisearch: ones that aren't in the
// index at its current version and, with billing on, were saved by someone
// with a subscription or trial. Anything else that isn't indexed stays that
// way until its user subscribes, so it isn't waiting to be indexed.
export function linksToIndexWhere(): Prisma.LinkWhereInput {
  const TRIAL_PERIOD_DAYS = process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14;
  const REQUIRE_CC = process.env.NEXT_PUBLIC_REQUIRE_CC === "true";

  return {
    AND: [
      {
        OR: [
          { indexVersion: { not: MEILI_INDEX_VERSION } },
          { indexVersion: null },
        ],
      },
      {
        ...(process.env.STRIPE_SECRET_KEY
          ? {
              createdBy: {
                OR: [
                  { subscriptions: { is: { active: true } } },
                  { parentSubscription: { is: { active: true } } },
                  ...(REQUIRE_CC
                    ? []
                    : [
                        {
                          createdAt: {
                            gte: new Date(
                              new Date().getTime() -
                                Number(TRIAL_PERIOD_DAYS) * 86400000
                            ),
                          },
                        },
                      ]),
                ],
              },
            }
          : {}),
      },
    ],
  };
}
