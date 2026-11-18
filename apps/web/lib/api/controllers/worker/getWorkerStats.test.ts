import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@linkwarden/prisma";
import { linksToIndexWhere } from "@linkwarden/lib/linksToIndex";
import getWorkerStats from "./getWorkerStats";

vi.mock("@linkwarden/prisma", () => ({
  prisma: { link: { count: vi.fn().mockResolvedValue(0) } },
}));

// Which count the search numbers come from: pending is the 4th, done the 5th
const searchCounts = () => {
  const calls = vi.mocked(prisma.link.count).mock.calls;
  return { pending: calls[3][0], done: calls[4][0] };
};

describe("getWorkerStats", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it.each([
    ["without billing", { STRIPE_SECRET_KEY: "" }],
    [
      "with billing",
      { STRIPE_SECRET_KEY: "sk_test_123", NEXT_PUBLIC_REQUIRE_CC: "" },
    ],
    [
      "with billing and a card required up front",
      { STRIPE_SECRET_KEY: "sk_test_123", NEXT_PUBLIC_REQUIRE_CC: "true" },
    ],
  ])(
    "counts as pending the links the indexing worker is going to index, %s",
    async (_, env) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-18T12:00:00Z"));
      for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);

      await getWorkerStats(1);

      expect(searchCounts().pending).toEqual({ where: linksToIndexWhere() });
    }
  );

  it("leaves links by users without a subscription or trial out of pending when there's billing", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", "true");

    await getWorkerStats(1);

    expect((searchCounts().pending as any).where.AND[1]).toEqual({
      createdBy: {
        OR: [
          { subscriptions: { is: { active: true } } },
          { parentSubscription: { is: { active: true } } },
        ],
      },
    });
  });
});
