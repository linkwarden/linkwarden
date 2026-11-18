import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@linkwarden/prisma";
import { isUnsubscribed, startIndexCleanup } from "./indexCleanup";

vi.mock("@linkwarden/lib/meilisearchClient", () => ({ meiliClient: null }));
vi.mock("@linkwarden/prisma", () => ({
  prisma: { user: { findMany: vi.fn() } },
}));

const DAY = 86400000;
const NOW = Date.UTC(2026, 10, 17, 12);
const TRIAL = 14;

const ago = (days: number, extraMs = 0) => new Date(NOW - days * DAY + extraMs);

type Sub = { active: boolean; ended: number; updated: number };

// Days ago, so `ended: 31` is a subscription whose period ran out 31 days ago
const sub = (data: Sub | null) =>
  data && {
    active: data.active,
    currentPeriodEnd: ago(data.ended),
    updatedAt: ago(data.updated),
  };

const user = (data: {
  created?: number;
  updated?: number;
  own?: Sub | null;
  parent?: Sub | null;
}) => ({
  id: 1,
  createdAt: ago(data.created ?? 400),
  updatedAt: ago(data.updated ?? data.created ?? 400),
  subscriptions: sub(data.own ?? null),
  parentSubscription: sub(data.parent ?? null),
});

const cancelled = { active: false, ended: 31, updated: 31 };
const subscribed = { active: true, ended: -20, updated: 10 };

const check = (data: Parameters<typeof user>[0], trialDays = TRIAL) =>
  isUnsubscribed(user(data), NOW, trialDays);

describe("isUnsubscribed", () => {
  describe("someone who never subscribed", () => {
    it("is unsubscribed 30 days after the trial and its extra day ended", () => {
      expect(check({ created: 46 })).toBe(true);
      expect(check({ created: 45 })).toBe(true);
    });

    it("isn't a millisecond before that", () => {
      expect(
        isUnsubscribed(
          { ...user({}), createdAt: ago(45, 1), updatedAt: ago(45, 1) },
          NOW,
          TRIAL
        )
      ).toBe(false);
      expect(check({ created: 44 })).toBe(false);
      expect(check({ created: 15 })).toBe(false);
      expect(check({ created: 0 })).toBe(false);
    });

    it("follows the length of the trial", () => {
      expect(check({ created: 31 }, 0)).toBe(true);
      expect(check({ created: 30 }, 0)).toBe(false);
      expect(check({ created: 61 }, 30)).toBe(true);
      expect(check({ created: 60 }, 30)).toBe(false);
    });

    it("isn't when the account changed in the last 30 days", () => {
      expect(check({ created: 400, updated: 29 })).toBe(false);
      expect(check({ created: 400, updated: 0 })).toBe(false);
      expect(check({ created: 400, updated: 30 })).toBe(true);
    });
  });

  describe("someone with their own subscription", () => {
    it("is never unsubscribed while it's active", () => {
      expect(check({ own: subscribed })).toBe(false);
      // Even when its dates are long out of date
      expect(check({ own: { active: true, ended: 400, updated: 400 } })).toBe(
        false
      );
    });

    it("is unsubscribed once it ended and hasn't changed for 30 days", () => {
      expect(check({ own: cancelled })).toBe(true);
      expect(check({ own: { active: false, ended: 30, updated: 30 } })).toBe(
        true
      );
    });

    it("isn't when it ended less than 30 days ago", () => {
      expect(check({ own: { active: false, ended: 29, updated: 60 } })).toBe(
        false
      );
      expect(check({ own: { active: false, ended: 0, updated: 60 } })).toBe(
        false
      );
    });

    it("isn't when its paid period is still running", () => {
      expect(check({ own: { active: false, ended: -300, updated: 60 } })).toBe(
        false
      );
    });

    it("isn't when the subscription changed in the last 30 days", () => {
      expect(check({ own: { active: false, ended: 200, updated: 29 } })).toBe(
        false
      );
      expect(check({ own: { active: false, ended: 200, updated: 0 } })).toBe(
        false
      );
    });

    it("isn't while still inside the trial", () => {
      expect(check({ created: 20, own: cancelled })).toBe(false);
    });

    it("isn't a millisecond before the 30 days", () => {
      const almost = {
        active: false,
        currentPeriodEnd: ago(30, 1),
        updatedAt: ago(400),
      };
      expect(
        isUnsubscribed({ ...user({}), subscriptions: almost }, NOW, TRIAL)
      ).toBe(false);

      const changed = {
        active: false,
        currentPeriodEnd: ago(400),
        updatedAt: ago(30, 1),
      };
      expect(
        isUnsubscribed({ ...user({}), subscriptions: changed }, NOW, TRIAL)
      ).toBe(false);
    });
  });

  describe("someone on another user's subscription", () => {
    it("is never unsubscribed while that one is active", () => {
      expect(check({ parent: subscribed })).toBe(false);
      expect(check({ own: cancelled, parent: subscribed })).toBe(false);
    });

    it("is unsubscribed once that one ended over 30 days ago", () => {
      expect(check({ parent: cancelled })).toBe(true);
      expect(check({ own: cancelled, parent: cancelled })).toBe(true);
    });

    it("isn't when either subscription is active or ended recently", () => {
      expect(check({ own: subscribed, parent: cancelled })).toBe(false);
      expect(
        check({
          own: cancelled,
          parent: { active: false, ended: 10, updated: 10 },
        })
      ).toBe(false);
      expect(
        check({
          own: { active: false, ended: 10, updated: 10 },
          parent: cancelled,
        })
      ).toBe(false);
    });
  });

  it("is never unsubscribed when the trial length isn't a number", () => {
    expect(check({ created: 4000, own: cancelled }, NaN)).toBe(false);
    expect(check({ created: 4000 }, Infinity)).toBe(false);
  });

  // The indexing worker's own rule for whose links it indexes
  // (apps/worker/workers/linkIndexing.ts)
  const indexedByTheWorker = (
    candidate: ReturnType<typeof user>,
    requireCard: boolean
  ) =>
    Boolean(candidate.subscriptions?.active) ||
    Boolean(candidate.parentSubscription?.active) ||
    (!requireCard && candidate.createdAt.getTime() >= NOW - TRIAL * DAY);

  it("never holds for someone the indexing worker still indexes", () => {
    const days = [0, 1, 13, 14, 15, 16, 29, 30, 31, 44, 45, 46, 60, 400];
    const subs: (Sub | null)[] = [
      null,
      subscribed,
      cancelled,
      { active: true, ended: 400, updated: 400 },
      { active: false, ended: 29, updated: 29 },
      { active: false, ended: 400, updated: 1 },
      { active: false, ended: -100, updated: 100 },
    ];

    let unsubscribed = 0;
    let checked = 0;

    for (const created of days)
      for (const updated of days.filter((day) => day <= created))
        for (const own of subs)
          for (const parent of subs) {
            const candidate = user({ created, updated, own, parent });
            checked++;

            if (!isUnsubscribed(candidate, NOW, TRIAL)) continue;
            unsubscribed++;

            expect(indexedByTheWorker(candidate, false)).toBe(false);
            expect(indexedByTheWorker(candidate, true)).toBe(false);
          }

    // Both kinds have to be in there for the check to mean anything
    expect(unsubscribed).toBeGreaterThan(0);
    expect(unsubscribed).toBeLessThan(checked);
  });
});

describe("startIndexCleanup", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does nothing without Meilisearch", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("UNSUBSCRIBED_INDEX_CLEANUP", "true");

    await expect(startIndexCleanup()).resolves.toBeUndefined();

    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
