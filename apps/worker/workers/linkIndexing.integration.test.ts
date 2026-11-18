import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { MEILI_INDEX_VERSION } from "@linkwarden/lib/constants";
import { prisma } from "@linkwarden/prisma";
import { startIndexing } from "./linkIndexing";

// Runs the indexing loop against a real database (DATABASE_URL) with a
// made-up Meilisearch, to check which links it indexes and how many it
// reports as left.

const { scope, StopIndexing, linksIndex } = vi.hoisted(() => {
  // Two links per pass, so a handful of links takes several passes
  process.env.INDEX_TAKE_COUNT = "2";

  return {
    // Only these links get indexed and counted, so other test files' rows
    // stay untouched and don't change the numbers
    scope: { ids: [] as number[] },
    StopIndexing: class StopIndexing extends Error {},
    linksIndex: {
      updateFilterableAttributes: vi.fn(),
      updateSortableAttributes: vi.fn(),
      updateRankingRules: vi.fn(),
      addDocuments: vi.fn(),
      waitForTask: vi.fn(),
    },
  };
});

vi.mock("@linkwarden/lib/meilisearchClient", () => ({
  meiliClient: {
    getIndex: vi.fn().mockResolvedValue({}),
    createIndex: vi.fn(),
    index: vi.fn(() => linksIndex),
  },
}));

// The indexing loop waits between batches; stop it there after one pass
vi.mock("@linkwarden/lib/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@linkwarden/lib/utils")>()),
  delay: async () => {
    throw new StopIndexing();
  },
}));

const inScope = (where: any) => ({
  AND: [where ?? {}, { id: { in: scope.ids } }],
});

vi.mock("../lib/getLinkBatch", async (importOriginal) => {
  const real = (await importOriginal<any>()).default;
  return {
    default: (params: any) => real({ ...params, where: inScope(params.where) }),
  };
});

vi.mock("@linkwarden/prisma", async (importOriginal) => {
  const real = await importOriginal<typeof import("@linkwarden/prisma")>();
  const link = new Proxy(real.prisma.link, {
    get: (target: any, key) =>
      key === "count"
        ? (args: any = {}) =>
            target.count({ ...args, where: inScope(args.where) })
        : target[key],
  });

  return {
    ...real,
    prisma: new Proxy(real.prisma, {
      get: (target: any, key) => (key === "link" ? link : target[key]),
    }),
  };
});

const createdUserIds: number[] = [];
const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const DAY = 86400000;

const user = async (
  label: string,
  data: { createdDaysAgo?: number; parentSubscriptionId?: number } = {}
) => {
  const created = await prisma.user.create({
    data: {
      username: `${label}-${unique()}`,
      email: `${label}-${unique()}@lab.test`,
      createdAt: new Date(Date.now() - (data.createdDaysAgo ?? 0) * DAY),
      parentSubscriptionId: data.parentSubscriptionId,
    },
  });
  createdUserIds.push(created.id);
  return created;
};

const subscription = (userId: number, active: boolean) =>
  prisma.subscription.create({
    data: {
      active,
      provider: "STRIPE",
      stripeSubscriptionId: `sub_${unique()}`,
      currentPeriodStart: new Date(Date.now() - DAY),
      currentPeriodEnd: new Date(Date.now() + 30 * DAY),
      userId,
    },
  });

const collection = async (ownerId: number) =>
  (
    await prisma.collection.create({
      data: { name: "Indexing test", ownerId, createdById: ownerId },
    })
  ).id;

const links = async (
  count: number,
  createdById: number,
  collectionId: number,
  indexVersion: number | null = null
) => {
  const ids: number[] = [];
  for (let i = 0; i < count; i++) {
    const created = await prisma.link.create({
      data: {
        url: `https://example.com/${unique()}`,
        name: `Link ${i}`,
        collectionId,
        createdById,
        collectionOrder: i + 1,
        indexVersion,
      },
    });
    ids.push(created.id);
  }
  scope.ids.push(...ids);
  return ids;
};

// A user created 30 days ago, with the given number of unindexed links
const userWithLinks = async (label: string, count: number) => {
  const created = await user(label, { createdDaysAgo: 30 });
  const ids = await links(count, created.id, await collection(created.id));
  return { user: created, ids };
};

// What the worker logged after a batch, e.g. "Indexed 2 links, 3 left."
const runOneBatch = async () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  await expect(startIndexing(0)).rejects.toBeInstanceOf(StopIndexing);
  const lines = log.mock.calls
    .map((call) => call[1])
    .filter((line) => typeof line === "string" && line.includes(" left."));
  log.mockRestore();
  return lines as string[];
};

const versionsOf = async (ids: number[]) =>
  (
    await prisma.link.findMany({
      where: { id: { in: ids } },
      select: { indexVersion: true },
      orderBy: { id: "asc" },
    })
  ).map((link) => link.indexVersion);

const sentIds = () =>
  linksIndex.addDocuments.mock.calls
    .flatMap(([docs]) => docs.map((doc: { id: number }) => doc.id))
    .sort((a, b) => a - b);

beforeAll(async () => {
  await import("dotenv/config");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests for linkIndexing."
    );
  }

  await prisma.$connect();
});

beforeEach(() => {
  linksIndex.updateFilterableAttributes.mockResolvedValue({ taskUid: 1 });
  linksIndex.updateSortableAttributes.mockResolvedValue({ taskUid: 2 });
  linksIndex.updateRankingRules.mockResolvedValue({ taskUid: 4 });
  linksIndex.addDocuments.mockResolvedValue({ taskUid: 3 });
  linksIndex.waitForTask.mockResolvedValue({ status: "succeeded" });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(async () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  scope.ids = [];
  for (const id of createdUserIds.splice(0, createdUserIds.length)) {
    await prisma.user.delete({ where: { id } }).catch(() => {});
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe.sequential("linkIndexing with a real database", () => {
  describe("without billing", () => {
    beforeEach(() => {
      vi.stubEnv("STRIPE_SECRET_KEY", "");
    });

    it("counts down to zero as it indexes everyone's links", async () => {
      const { ids } = await userWithLinks("selfhosted", 5);

      expect(await runOneBatch()).toEqual(["Indexed 2 links, 3 left."]);
      expect(await runOneBatch()).toEqual(["Indexed 2 links, 1 left."]);
      expect(await runOneBatch()).toEqual(["Indexed 1 link, 0 left."]);
      expect(await runOneBatch()).toEqual([]);

      expect(sentIds()).toEqual(ids);
      expect(await versionsOf(ids)).toEqual(ids.map(() => MEILI_INDEX_VERSION));
    });

    it("counts links indexed with another version, and not the ones already on this one", async () => {
      const owner = await user("versions", { createdDaysAgo: 30 });
      const collectionId = await collection(owner.id);
      const older = await links(
        1,
        owner.id,
        collectionId,
        MEILI_INDEX_VERSION - 1
      );
      const newer = await links(
        1,
        owner.id,
        collectionId,
        MEILI_INDEX_VERSION + 1
      );
      const never = await links(1, owner.id, collectionId, null);
      const current = await links(
        1,
        owner.id,
        collectionId,
        MEILI_INDEX_VERSION
      );

      expect(await runOneBatch()).toEqual(["Indexed 2 links, 1 left."]);
      expect(await runOneBatch()).toEqual(["Indexed 1 link, 0 left."]);
      expect(await runOneBatch()).toEqual([]);

      expect(sentIds()).toEqual([...older, ...newer, ...never]);
      expect(sentIds()).not.toContain(current[0]);
    });

    it("keeps counting links Meilisearch rejected", async () => {
      const { ids } = await userWithLinks("rejected", 3);
      linksIndex.waitForTask.mockImplementation(async (taskUid: number) =>
        taskUid === 3
          ? { status: "failed", error: { message: "payload too large" } }
          : { status: "succeeded" }
      );

      expect(await runOneBatch()).toEqual(["Indexed 0 links, 3 left."]);
      expect(await versionsOf(ids)).toEqual([null, null, null]);
    });

    it("counts a link that came in while the batch was being sent", async () => {
      const { user: owner, ids } = await userWithLinks("late", 2);
      const collectionId = (
        await prisma.link.findUniqueOrThrow({ where: { id: ids[0] } })
      ).collectionId;
      linksIndex.addDocuments.mockImplementationOnce(async () => {
        await links(1, owner.id, collectionId);
        return { taskUid: 3 };
      });

      expect(await runOneBatch()).toEqual(["Indexed 2 links, 1 left."]);
    });
  });

  describe("with billing", () => {
    beforeEach(() => {
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
      vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", "");
      vi.stubEnv("NEXT_PUBLIC_TRIAL_PERIOD_DAYS", "14");
    });

    it("doesn't count links it isn't going to index", async () => {
      const subscriber = await userWithLinks("subscriber", 5);
      await subscription(subscriber.user.id, true);
      const lapsed = await userWithLinks("lapsed", 3);
      await subscription(lapsed.user.id, false);
      const never = await userWithLinks("never-subscribed", 2);

      expect(await runOneBatch()).toEqual(["Indexed 2 links, 3 left."]);
      expect(await runOneBatch()).toEqual(["Indexed 2 links, 1 left."]);
      expect(await runOneBatch()).toEqual(["Indexed 1 link, 0 left."]);
      expect(await runOneBatch()).toEqual([]);

      expect(sentIds()).toEqual(subscriber.ids);
      expect(await versionsOf(lapsed.ids)).toEqual([null, null, null]);
      expect(await versionsOf(never.ids)).toEqual([null, null]);
    });

    it("says nothing when the only unindexed links are ones it skips", async () => {
      const lapsed = await userWithLinks("lapsed", 3);
      await subscription(lapsed.user.id, false);

      expect(await runOneBatch()).toEqual([]);
      expect(linksIndex.addDocuments).not.toHaveBeenCalled();
    });

    it("counts links by someone on another user's subscription", async () => {
      const admin = await user("admin", { createdDaysAgo: 30 });
      const seat = await subscription(admin.id, true);
      const member = await user("member", {
        createdDaysAgo: 30,
        parentSubscriptionId: seat.id,
      });
      const ids = await links(3, member.id, await collection(member.id));

      expect(await runOneBatch()).toEqual(["Indexed 2 links, 1 left."]);
      expect(await runOneBatch()).toEqual(["Indexed 1 link, 0 left."]);
      expect(sentIds()).toEqual(ids);
    });

    it("doesn't count links by someone whose seat is on a cancelled subscription", async () => {
      const admin = await user("admin", { createdDaysAgo: 30 });
      const seat = await subscription(admin.id, false);
      const member = await user("member", {
        createdDaysAgo: 30,
        parentSubscriptionId: seat.id,
      });
      await links(3, member.id, await collection(member.id));

      expect(await runOneBatch()).toEqual([]);
    });

    it("counts links by users on trial, and not by ones whose trial is over", async () => {
      const onTrial = await user("trial", { createdDaysAgo: 13 });
      const trialIds = await links(3, onTrial.id, await collection(onTrial.id));
      const expired = await user("expired", { createdDaysAgo: 15 });
      const expiredIds = await links(
        2,
        expired.id,
        await collection(expired.id)
      );

      expect(await runOneBatch()).toEqual(["Indexed 2 links, 1 left."]);
      expect(await runOneBatch()).toEqual(["Indexed 1 link, 0 left."]);

      expect(sentIds()).toEqual(trialIds);
      expect(await versionsOf(expiredIds)).toEqual([null, null]);
    });

    it("doesn't count links by users on trial when a card is required up front", async () => {
      vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", "true");
      const onTrial = await user("trial", { createdDaysAgo: 1 });
      await links(3, onTrial.id, await collection(onTrial.id));
      const subscriber = await userWithLinks("subscriber", 1);
      await subscription(subscriber.user.id, true);

      expect(await runOneBatch()).toEqual(["Indexed 1 link, 0 left."]);
      expect(sentIds()).toEqual(subscriber.ids);
    });

    it("goes by who saved the link, not who owns the collection", async () => {
      const subscriber = await user("subscriber", { createdDaysAgo: 30 });
      await subscription(subscriber.id, true);
      const lapsed = await user("lapsed", { createdDaysAgo: 30 });
      const shared = await collection(subscriber.id);
      const own = await links(1, subscriber.id, shared);
      const guest = await links(2, lapsed.id, shared);

      expect(await runOneBatch()).toEqual(["Indexed 1 link, 0 left."]);
      expect(sentIds()).toEqual(own);
      expect(await versionsOf(guest)).toEqual([null, null]);
    });
  });
});
