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
import { cleanUpIndex, startIndexCleanup } from "./indexCleanup";
import { startIndexing } from "./linkIndexing";

// Runs the cleanup against a real database (DATABASE_URL) with a made-up
// Meilisearch index that filters, pages and deletes like the real one.

const { scope, Stop, index } = vi.hoisted(() => {
  process.env.INDEX_TAKE_COUNT = "500";

  type Doc = { id: number | string; collectionOwnerId: number };

  const docs = new Map<number | string, Doc>();
  const tasks = new Map<number, () => void>();
  let nextTask = 1;

  const index = {
    docs,
    // How the next deletions end
    deletion: {
      status: "succeeded",
      timesOut: false,
      keepsDocuments: false,
    },
    fetchError: null as Error | null,
    // Run in the middle of a fetch, or while a deletion is waited for
    onFetch: null as null | (() => Promise<unknown>),
    onWait: null as null | (() => Promise<unknown>),
    fetches: [] as { filter: string; offset: number; limit: number }[],
    deletions: [] as number[][],
    added: [] as number[],

    // Deletions Meilisearch still has queued
    flush: () => {
      tasks.forEach((run) => run());
      tasks.clear();
    },

    reset: () => {
      docs.clear();
      tasks.clear();
      index.deletion = {
        status: "succeeded",
        timesOut: false,
        keepsDocuments: false,
      };
      index.fetchError = null;
      index.onFetch = null;
      index.onWait = null;
      index.fetches = [];
      index.deletions = [];
      index.added = [];
    },

    getDocuments: async (params: any) => {
      index.fetches.push(params);
      if (index.onFetch) await index.onFetch();
      if (index.fetchError) throw index.fetchError;

      const match = /^collectionOwnerId IN \[([\d, ]+)\]$/.exec(params.filter);
      if (!match) throw new Error(`Unexpected filter: ${params.filter}`);
      if (JSON.stringify(params.fields) !== '["id"]')
        throw new Error(`Unexpected fields: ${params.fields}`);

      const owners = new Set(match[1].split(",").map((id) => Number(id)));
      const matching = Array.from(docs.values()).filter((doc) =>
        owners.has(doc.collectionOwnerId)
      );

      return {
        results: matching
          .slice(params.offset, params.offset + params.limit)
          .map((doc) => ({ id: doc.id })),
        total: matching.length,
        limit: params.limit,
        offset: params.offset,
      };
    },

    deleteDocuments: async (ids: number[]) => {
      const taskUid = nextTask++;
      index.deletions.push(ids);
      tasks.set(taskUid, () => ids.forEach((id) => docs.delete(id)));
      return { taskUid };
    },

    addDocuments: async (batch: Doc[]) => {
      for (const doc of batch) {
        docs.set(doc.id, {
          id: doc.id,
          collectionOwnerId: doc.collectionOwnerId,
        });
        index.added.push(doc.id as number);
      }
      return { taskUid: nextTask++ };
    },

    waitForTask: async (taskUid: number) => {
      const run = tasks.get(taskUid);
      // A settings or indexing task
      if (!run) return { status: "succeeded" };

      if (index.onWait) await index.onWait();

      if (index.deletion.timesOut)
        throw new Error(
          `timeout of 1000000ms has exceeded on process ${taskUid}`
        );

      tasks.delete(taskUid);

      if (index.deletion.status !== "succeeded")
        return {
          status: index.deletion.status,
          error: { message: "the index is read-only" },
        };

      if (!index.deletion.keepsDocuments) run();
      return { status: "succeeded" };
    },

    updateFilterableAttributes: async () => ({ taskUid: nextTask++ }),
    updateSortableAttributes: async () => ({ taskUid: nextTask++ }),
    updateRankingRules: async () => ({ taskUid: nextTask++ }),
  };

  return {
    // Only these users and links are looked at, so other test files' rows
    // stay untouched
    scope: { userIds: [] as number[], linkIds: [] as number[] },
    Stop: class Stop extends Error {},
    index,
  };
});

vi.mock("@linkwarden/lib/meilisearchClient", () => ({
  meiliClient: {
    getIndex: async () => ({}),
    createIndex: async () => ({}),
    index: () => index,
  },
}));

// Both loops wait between runs; stop them there
vi.mock("@linkwarden/lib/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@linkwarden/lib/utils")>()),
  delay: async () => {
    throw new Stop();
  },
}));

vi.mock("../lib/getLinkBatch", async (importOriginal) => {
  const real = (await importOriginal<any>()).default;
  return {
    default: (params: any) =>
      real({
        ...params,
        where: { AND: [params.where ?? {}, { id: { in: scope.linkIds } }] },
      }),
  };
});

vi.mock("@linkwarden/prisma", async (importOriginal) => {
  const real = await importOriginal<typeof import("@linkwarden/prisma")>();

  const scoped = (model: any, method: string, ids: () => number[]) =>
    new Proxy(model, {
      get: (target: any, key) =>
        key === method
          ? (args: any = {}) =>
              target[key]({
                ...args,
                where: { AND: [args.where ?? {}, { id: { in: ids() } }] },
              })
          : target[key],
    });

  const user = scoped(real.prisma.user, "findMany", () => scope.userIds);
  const link = scoped(real.prisma.link, "count", () => scope.linkIds);

  return {
    ...real,
    prisma: new Proxy(real.prisma, {
      get: (target: any, key) =>
        key === "user"
          ? user
          : key === "link"
            ? link
            : typeof target[key] === "function"
              ? target[key].bind(target)
              : target[key],
    }),
  };
});

const DAY = 86400000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);
const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const user = async (
  label: string,
  data: { created?: number; updated?: number; seatOn?: number } = {}
) => {
  const created = await prisma.user.create({
    data: {
      username: `${label}-${unique()}`,
      email: `${label}-${unique()}@lab.test`,
      createdAt: daysAgo(data.created ?? 400),
      updatedAt: daysAgo(data.updated ?? data.created ?? 400),
      parentSubscriptionId: data.seatOn,
    },
  });
  scope.userIds.push(created.id);
  return created.id;
};

// `ended` and `updated` are days ago, so `ended: -20` still has 20 days to run
const subscription = async (
  userId: number,
  data: { active: boolean; ended: number; updated: number }
) =>
  (
    await prisma.subscription.create({
      data: {
        active: data.active,
        provider: "STRIPE",
        stripeSubscriptionId: `sub_${unique()}`,
        currentPeriodStart: daysAgo(data.ended + 30),
        currentPeriodEnd: daysAgo(data.ended),
        updatedAt: daysAgo(data.updated),
        userId,
      },
    })
  ).id;

const ACTIVE = { active: true, ended: -20, updated: 10 };
const CANCELLED = { active: false, ended: 31, updated: 31 };

const subscriber = async (label = "subscriber") => {
  const id = await user(label);
  const subscriptionId = await subscription(id, ACTIVE);
  return { id, subscriptionId };
};

const unsubscribed = async (label = "unsubscribed") => {
  const id = await user(label);
  const subscriptionId = await subscription(id, CANCELLED);
  return { id, subscriptionId };
};

const collection = async (
  ownerId: number,
  data: { isPublic?: boolean; members?: number[] } = {}
) =>
  (
    await prisma.collection.create({
      data: {
        name: "Cleanup test",
        ownerId,
        createdById: ownerId,
        isPublic: data.isPublic ?? false,
        members: {
          create: (data.members ?? []).map((userId) => ({
            userId,
            canCreate: true,
            canUpdate: true,
            canDelete: true,
          })),
        },
      },
    })
  ).id;

// Links that are indexed, unless told otherwise
const links = async (
  count: number,
  collectionId: number,
  createdById: number | null,
  data: { indexVersion?: number | null; inIndex?: boolean } = {}
) => {
  const { ownerId } = await prisma.collection.findUniqueOrThrow({
    where: { id: collectionId },
  });

  const created = await prisma.link.createManyAndReturn({
    data: Array.from({ length: count }, (_, i) => ({
      url: `https://example.com/${unique()}`,
      name: `Link ${i}`,
      collectionId,
      createdById,
      collectionOrder: i + 1,
      indexVersion:
        data.indexVersion === undefined
          ? MEILI_INDEX_VERSION
          : data.indexVersion,
    })),
    select: { id: true },
  });

  const ids = created.map((link) => link.id).sort((a, b) => a - b);
  scope.linkIds.push(...ids);

  if (data.inIndex ?? true)
    for (const id of ids)
      index.docs.set(id, { id, collectionOwnerId: ownerId });

  return ids;
};

// An unsubscribed user with a collection of indexed links
const unsubscribedWithLinks = async (count = 3, isPublic = false) => {
  const owner = await unsubscribed();
  const collectionId = await collection(owner.id, { isPublic });
  const ids = await links(count, collectionId, owner.id);
  return { ...owner, collectionId, ids };
};

const versionsOf = async (ids: number[]) =>
  Array.from(
    new Set(
      (
        await prisma.link.findMany({
          where: { id: { in: ids } },
          select: { indexVersion: true },
        })
      ).map((link) => link.indexVersion)
    )
  );

const inIndex = (ids: number[]) => ids.filter((id) => index.docs.has(id));

const isPublic = async (collectionId: number) =>
  (await prisma.collection.findUniqueOrThrow({ where: { id: collectionId } }))
    .isPublic;

const expectCleared = async (ids: number[]) => {
  expect(inIndex(ids)).toEqual([]);
  expect(await versionsOf(ids)).toEqual([null]);
};

const expectUntouched = async (ids: number[]) => {
  expect(inIndex(ids)).toEqual(ids);
  expect(await versionsOf(ids)).toEqual([MEILI_INDEX_VERSION]);
};

// One pass of the indexing worker over this file's links
const runIndexing = async () => {
  for (let pass = 0; pass < 20; pass++) {
    const before = index.added.length;
    await expect(startIndexing(0)).rejects.toBeInstanceOf(Stop);
    if (index.added.length === before) return;
  }
  throw new Error("Indexing never finished");
};

beforeAll(async () => {
  await import("dotenv/config");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests for indexCleanup."
    );
  }

  await prisma.$connect();
});

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
  vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", "");
  vi.stubEnv("NEXT_PUBLIC_TRIAL_PERIOD_DAYS", "14");
  vi.stubEnv("UNSUBSCRIBED_INDEX_CLEANUP", "");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  index.reset();
  scope.linkIds = [];
  for (const id of scope.userIds.splice(0, scope.userIds.length)) {
    await prisma.user.delete({ where: { id } }).catch(() => {});
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe.sequential("indexCleanup with a real database", () => {
  it("stores the dates the tests rely on as given", async () => {
    const id = await user("dates", { created: 100, updated: 40 });
    const subscriptionId = await subscription(id, CANCELLED);

    const saved = await prisma.user.findUniqueOrThrow({ where: { id } });
    const savedSubscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
    });
    const age = (date: Date) => Math.round((Date.now() - +date) / DAY);

    expect(age(saved.createdAt)).toBe(100);
    expect(age(saved.updatedAt)).toBe(40);
    expect(age(savedSubscription.updatedAt)).toBe(31);
    expect(age(savedSubscription.currentPeriodEnd)).toBe(31);
  });

  describe("whose links get cleared", () => {
    it("clears the links of someone whose subscription ended over 30 days ago", async () => {
      const gone = await unsubscribedWithLinks(3);

      expect(await cleanUpIndex(true)).toEqual({
        users: 1,
        owners: 1,
        links: 3,
        collections: 0,
      });

      await expectCleared(gone.ids);
      expect(index.deletions).toEqual([gone.ids]);
    });

    it("clears the links of someone whose trial ended over 30 days ago", async () => {
      const id = await user("trial", { created: 46 });
      const ids = await links(2, await collection(id), id);

      await cleanUpIndex(true);

      await expectCleared(ids);
    });

    it("clears the links of someone on a subscription that ended over 30 days ago", async () => {
      const admin = await unsubscribed("admin");
      const seat = await user("seat", { seatOn: admin.subscriptionId });
      const ids = await links(2, await collection(seat), seat);

      await cleanUpIndex(true);

      await expectCleared(ids);
    });

    it.each<[string, () => Promise<number>]>([
      ["has an active subscription", async () => (await subscriber()).id],
      [
        "has an active subscription with dates that ran out long ago",
        async () => {
          const id = await user("stale");
          await subscription(id, { active: true, ended: 400, updated: 400 });
          return id;
        },
      ],
      [
        "cancelled less than 30 days ago",
        async () => {
          const id = await user("recent");
          await subscription(id, { active: false, ended: 29, updated: 29 });
          return id;
        },
      ],
      [
        "has a cancelled subscription that changed less than 30 days ago",
        async () => {
          const id = await user("changed");
          await subscription(id, { active: false, ended: 200, updated: 5 });
          return id;
        },
      ],
      [
        "has a cancelled subscription whose paid period is still running",
        async () => {
          const id = await user("paid");
          await subscription(id, { active: false, ended: -200, updated: 60 });
          return id;
        },
      ],
      ["is on a trial", () => user("trial", { created: 3 })],
      [
        "had their trial end less than 30 days ago",
        () => user("expired", { created: 44 }),
      ],
      [
        "had their account change less than 30 days ago",
        () => user("active", { created: 400, updated: 5 }),
      ],
      [
        "is on someone's active subscription",
        async () =>
          user("seat", { seatOn: (await subscriber()).subscriptionId }),
      ],
      [
        "is on someone's active subscription and cancelled their own long ago",
        async () => {
          const id = await user("seat", {
            seatOn: (await subscriber()).subscriptionId,
          });
          await subscription(id, CANCELLED);
          return id;
        },
      ],
      [
        "has an active subscription and a seat on one that ended",
        async () => {
          const id = await user("both", {
            seatOn: (await unsubscribed("admin")).subscriptionId,
          });
          await subscription(id, ACTIVE);
          return id;
        },
      ],
      [
        "is on a subscription that ended less than 30 days ago",
        async () => {
          const admin = await user("admin");
          const seatOn = await subscription(admin, {
            active: false,
            ended: 10,
            updated: 10,
          });
          return user("seat", { seatOn });
        },
      ],
    ])("keeps the links of someone who %s", async (_, create) => {
      const id = await create();
      const collectionId = await collection(id, { isPublic: true });
      const ids = await links(3, collectionId, id);

      const result = await cleanUpIndex(true);

      expect(result.links).toBe(0);
      expect(result.collections).toBe(0);
      await expectUntouched(ids);
      expect(await isPublic(collectionId)).toBe(true);
      expect(index.deletions).toEqual([]);
    });

    it("goes by the same rules when a card is required up front", async () => {
      vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", "true");
      const gone = await unsubscribedWithLinks(2);
      const never = await user("never", { created: 46 });
      const neverIds = await links(2, await collection(never), never);
      const recent = await user("recent", { created: 40 });
      const recentIds = await links(2, await collection(recent), recent);
      const paying = await subscriber();
      const payingIds = await links(2, await collection(paying.id), paying.id);

      await cleanUpIndex(true);

      await expectCleared([...gone.ids, ...neverIds]);
      await expectUntouched([...recentIds, ...payingIds]);
    });

    it("leaves a subscriber next to an unsubscribed user alone", async () => {
      const paying = await subscriber();
      const payingCollection = await collection(paying.id, { isPublic: true });
      const payingIds = await links(4, payingCollection, paying.id);
      const gone = await unsubscribedWithLinks(4);

      await cleanUpIndex(true);

      await expectUntouched(payingIds);
      expect(await isPublic(payingCollection)).toBe(true);
      await expectCleared(gone.ids);
    });
  });

  describe("shared collections", () => {
    it("keeps everything in a collection that has a subscribed member", async () => {
      const owner = await unsubscribed("owner");
      const member = await subscriber("member");
      const shared = await collection(owner.id, {
        isPublic: true,
        members: [member.id],
      });
      const ownerLinks = await links(3, shared, owner.id);
      const memberLinks = await links(2, shared, member.id);
      const own = await links(2, await collection(owner.id), owner.id);

      const result = await cleanUpIndex(true);

      await expectUntouched([...ownerLinks, ...memberLinks]);
      expect(await isPublic(shared)).toBe(true);
      // The owner's other collection has nobody subscribed in it
      await expectCleared(own);
      expect(result).toEqual({ users: 1, owners: 1, links: 2, collections: 0 });
    });

    it("keeps everything in a collection with a member who cancelled less than 30 days ago", async () => {
      const owner = await unsubscribed("owner");
      const member = await user("member");
      await subscription(member, { active: false, ended: 10, updated: 10 });
      const shared = await collection(owner.id, { members: [member] });
      const ids = await links(3, shared, owner.id);

      await cleanUpIndex(true);

      await expectUntouched(ids);
    });

    it("clears a collection whose owner and members are all unsubscribed", async () => {
      const owner = await unsubscribed("owner");
      const member = await unsubscribed("member");
      const expired = await user("expired", { created: 60 });
      const shared = await collection(owner.id, {
        members: [member.id, expired],
      });
      const ids = [
        ...(await links(2, shared, owner.id)),
        ...(await links(2, shared, member.id)),
        ...(await links(2, shared, expired)),
      ];

      const result = await cleanUpIndex(true);

      await expectCleared(ids);
      expect(result).toEqual({ users: 3, owners: 1, links: 6, collections: 0 });
    });

    it("doesn't touch an unsubscribed user's links in a subscriber's collection", async () => {
      const owner = await subscriber("owner");
      const guest = await unsubscribed("guest");
      const shared = await collection(owner.id, { members: [guest.id] });
      const guestLinks = await links(3, shared, guest.id);
      const ownerLinks = await links(1, shared, owner.id);

      await cleanUpIndex(true);

      await expectUntouched([...guestLinks, ...ownerLinks]);
    });

    it("keeps a link saved by a subscriber who has left the collection", async () => {
      const owner = await unsubscribed("owner");
      const former = await subscriber("former");
      const collectionId = await collection(owner.id);
      const ownerLinks = await links(3, collectionId, owner.id);
      const formerLinks = await links(2, collectionId, former.id);

      await cleanUpIndex(true);

      await expectCleared(ownerLinks);
      await expectUntouched(formerLinks);
    });

    it("keeps a link saved by someone who cancelled less than 30 days ago", async () => {
      const owner = await unsubscribed("owner");
      const recent = await user("recent");
      await subscription(recent, { active: false, ended: 3, updated: 3 });
      const collectionId = await collection(owner.id);
      const ownerLinks = await links(2, collectionId, owner.id);
      const recentLinks = await links(2, collectionId, recent);

      await cleanUpIndex(true);

      await expectCleared(ownerLinks);
      await expectUntouched(recentLinks);
    });

    it("keeps a link that was moved to a subscriber's collection after it was indexed", async () => {
      const gone = await unsubscribedWithLinks(3);
      const paying = await subscriber();
      const [moved, ...rest] = gone.ids;
      // Its document still has the old owner
      await prisma.link.update({
        where: { id: moved },
        data: { collectionId: await collection(paying.id) },
      });

      await cleanUpIndex(true);

      await expectUntouched([moved]);
      await expectCleared(rest);
    });

    it("clears links with nobody on record as having saved them", async () => {
      const owner = await unsubscribed("owner");
      const ids = await links(3, await collection(owner.id), null);

      await cleanUpIndex(true);

      await expectCleared(ids);
    });
  });

  describe("public collections", () => {
    it("makes an unsubscribed user's public collection private and clears it", async () => {
      const gone = await unsubscribedWithLinks(3, true);
      const alreadyPrivate = await collection(gone.id);

      expect(await cleanUpIndex(true)).toEqual({
        users: 1,
        owners: 1,
        links: 3,
        collections: 1,
      });

      expect(await isPublic(gone.collectionId)).toBe(false);
      expect(await isPublic(alreadyPrivate)).toBe(false);
      await expectCleared(gone.ids);
    });

    it("makes it private when none of its links were indexed", async () => {
      const owner = await unsubscribed("owner");
      const empty = await collection(owner.id, { isPublic: true });
      const unindexed = await collection(owner.id, { isPublic: true });
      const ids = await links(2, unindexed, owner.id, {
        indexVersion: null,
        inIndex: false,
      });

      const result = await cleanUpIndex(true);

      expect(result.collections).toBe(2);
      expect(await isPublic(empty)).toBe(false);
      expect(await isPublic(unindexed)).toBe(false);
      expect(await versionsOf(ids)).toEqual([null]);
      expect(index.deletions).toEqual([]);
    });

    it("leaves a subscriber's public collection as it is", async () => {
      const paying = await subscriber();
      const collectionId = await collection(paying.id, { isPublic: true });
      const ids = await links(2, collectionId, paying.id);
      await unsubscribedWithLinks(1, true);

      await cleanUpIndex(true);

      expect(await isPublic(collectionId)).toBe(true);
      await expectUntouched(ids);
    });

    it("has a link that stays in the index sent again, now as private", async () => {
      const owner = await unsubscribed("owner");
      const former = await subscriber("former");
      const collectionId = await collection(owner.id, { isPublic: true });
      const ownerLinks = await links(2, collectionId, owner.id);
      const formerLinks = await links(1, collectionId, former.id);

      await cleanUpIndex(true);

      expect(await isPublic(collectionId)).toBe(false);
      await expectCleared(ownerLinks);
      expect(inIndex(formerLinks)).toEqual(formerLinks);
      expect(await versionsOf(formerLinks)).toEqual([null]);

      await runIndexing();

      expect(index.added).toEqual(formerLinks);
      expect(await versionsOf(formerLinks)).toEqual([MEILI_INDEX_VERSION]);
      await expectCleared(ownerLinks);
    });

    it("keeps the links of a collection that turned public again until it's private", async () => {
      const gone = await unsubscribedWithLinks(3, true);
      index.onFetch = () =>
        prisma.collection.update({
          where: { id: gone.collectionId },
          data: { isPublic: true },
        });

      const first = await cleanUpIndex(true);

      expect(first.links).toBe(0);
      expect(inIndex(gone.ids)).toEqual(gone.ids);

      index.onFetch = null;
      const second = await cleanUpIndex(true);

      expect(second).toEqual({ users: 1, owners: 1, links: 3, collections: 1 });
      expect(await isPublic(gone.collectionId)).toBe(false);
      await expectCleared(gone.ids);
    });
  });

  describe("log only", () => {
    it("changes nothing and reports what it would do", async () => {
      const gone = await unsubscribedWithLinks(3, true);
      const more = await links(2, await collection(gone.id), gone.id);
      const owner = await unsubscribed("owner");
      const member = await subscriber("member");
      const shared = await collection(owner.id, {
        isPublic: true,
        members: [member.id],
      });
      const kept = await links(2, shared, owner.id);

      const dryRun = await cleanUpIndex(false);

      expect(dryRun).toEqual({ users: 2, owners: 1, links: 5, collections: 1 });
      await expectUntouched([...gone.ids, ...more, ...kept]);
      expect(await isPublic(gone.collectionId)).toBe(true);
      expect(await isPublic(shared)).toBe(true);
      expect(index.deletions).toEqual([]);

      // And it's what a real run then does
      expect(await cleanUpIndex(true)).toEqual(dryRun);
      await expectCleared([...gone.ids, ...more]);
      await expectUntouched(kept);
      expect(await isPublic(gone.collectionId)).toBe(false);
      expect(await isPublic(shared)).toBe(true);
    });

    it("counts every document once when there are more than fit in a batch", async () => {
      const gone = await unsubscribedWithLinks(2300);

      const result = await cleanUpIndex(false);

      expect(result.links).toBe(2300);
      expect(index.fetches.map((fetch) => fetch.offset)).toEqual([
        0, 1000, 2000,
      ]);
      await expectUntouched(gone.ids);
    });
  });

  describe("going through the index", () => {
    it("gets past the documents that stay to the ones after them", async () => {
      const owner = await unsubscribed("owner");
      const member = await subscriber("member");
      const own = await collection(owner.id);
      const shared = await collection(owner.id, { members: [member.id] });
      const cleared = await links(1300, own, owner.id);
      const kept = await links(1200, shared, owner.id);

      // Mixed together, like in a real index
      const all = Array.from(index.docs.values());
      index.docs.clear();
      for (let i = 0; i < 1300; i++) {
        index.docs.set(all[i].id, all[i]);
        if (i < 1200) index.docs.set(all[1300 + i].id, all[1300 + i]);
      }

      const result = await cleanUpIndex(true);

      expect(result.links).toBe(1300);
      await expectCleared(cleared);
      await expectUntouched(kept);
      expect(index.deletions.flat().sort((a, b) => a - b)).toEqual(cleared);
      expect(index.fetches.length).toBeLessThan(6);
    });

    it("gets to users past the first page of them", async () => {
      await prisma.user
        .createManyAndReturn({
          data: Array.from({ length: 520 }, (_, i) => ({
            username: `page-${i}-${unique()}`,
            email: `page-${i}-${unique()}@lab.test`,
          })),
          select: { id: true },
        })
        .then((created) => scope.userIds.push(...created.map((u) => u.id)));
      // Made last, so it's on the second page
      const last = await unsubscribedWithLinks(2);

      const result = await cleanUpIndex(true);

      expect(result.users).toBe(1);
      await expectCleared(last.ids);
    });

    it("removes a document whose link is already marked as unindexed", async () => {
      const owner = await unsubscribed("owner");
      const ids = await links(2, await collection(owner.id), owner.id, {
        indexVersion: null,
      });

      await cleanUpIndex(true);

      await expectCleared(ids);
    });

    it("leaves a document alone when its link is gone or its id isn't a link's", async () => {
      const gone = await unsubscribedWithLinks(2);
      const [deleted] = await links(1, gone.collectionId, gone.id);
      await prisma.link.delete({ where: { id: deleted } });
      index.docs.set("not-a-link", {
        id: "not-a-link",
        collectionOwnerId: gone.id,
      });

      await cleanUpIndex(true);

      await expectCleared(gone.ids);
      expect(index.docs.has(deleted)).toBe(true);
      expect(index.docs.has("not-a-link")).toBe(true);
    });

    it("keeps the links of someone who subscribes while it's running", async () => {
      const gone = await unsubscribedWithLinks(3, true);
      index.onFetch = () =>
        prisma.subscription.update({
          where: { id: gone.subscriptionId },
          data: { active: true, currentPeriodEnd: daysAgo(-30) },
        });

      const result = await cleanUpIndex(true);

      expect(result.links).toBe(0);
      expect(inIndex(gone.ids)).toEqual(gone.ids);
      expect(index.deletions).toEqual([]);
    });
  });

  describe("when Meilisearch fails", () => {
    it("changes nothing when the documents can't be read", async () => {
      const gone = await unsubscribedWithLinks(3);
      index.fetchError = new Error(
        "Attribute `collectionOwnerId` is not filterable."
      );

      await expect(cleanUpIndex(true)).rejects.toThrow("not filterable");

      await expectUntouched(gone.ids);
    });

    it("clears the links on the next run when a deletion failed", async () => {
      const gone = await unsubscribedWithLinks(3, true);
      index.deletion.status = "failed";

      await expect(cleanUpIndex(true)).rejects.toThrow(
        /Deleting task \d+ failed: the index is read-only/
      );

      // Marked as unindexed, with the documents still there to be found again
      expect(inIndex(gone.ids)).toEqual(gone.ids);
      expect(await versionsOf(gone.ids)).toEqual([null]);

      index.deletion.status = "succeeded";
      const result = await cleanUpIndex(true);

      expect(result.links).toBe(3);
      await expectCleared(gone.ids);
    });

    it("ends up cleared when waiting for a deletion timed out", async () => {
      const gone = await unsubscribedWithLinks(3);
      index.deletion.timesOut = true;

      await expect(cleanUpIndex(true)).rejects.toThrow("timeout");

      expect(await versionsOf(gone.ids)).toEqual([null]);
      // Meilisearch gets to it later
      index.flush();
      await expectCleared(gone.ids);
    });

    it("stops when deleted documents keep coming back", async () => {
      // A full batch, so it looks for more after it
      const gone = await unsubscribedWithLinks(1000);
      index.deletion.keepsDocuments = true;

      await expect(cleanUpIndex(true)).rejects.toThrow(
        "still has documents it reported as deleted"
      );

      expect(index.fetches.length).toBe(2);
      expect(await versionsOf(gone.ids)).toEqual([null]);
    });
  });

  describe("next to the indexing worker", () => {
    it("has a link sent again that got marked as indexed while its document was deleted", async () => {
      const gone = await unsubscribedWithLinks(3);
      index.onWait = () =>
        prisma.link.update({
          where: { id: gone.ids[0] },
          data: { indexVersion: MEILI_INDEX_VERSION },
        });

      await cleanUpIndex(true);

      await expectCleared(gone.ids);
    });

    it("doesn't have its cleared links indexed again, or clear what gets indexed", async () => {
      const gone = await unsubscribedWithLinks(4, true);
      const trial = await user("trial", { created: 60 });
      const trialIds = await links(3, await collection(trial), trial);
      const paying = await subscriber();
      const payingIds = await links(3, await collection(paying.id), paying.id, {
        indexVersion: null,
        inIndex: false,
      });

      await cleanUpIndex(true);
      await runIndexing();

      expect(index.added.sort((a, b) => a - b)).toEqual(payingIds);
      await expectCleared([...gone.ids, ...trialIds]);
      await expectUntouched(payingIds);

      // Nothing left for another run of either
      index.deletions = [];
      index.added = [];
      expect((await cleanUpIndex(true)).links).toBe(0);
      await runIndexing();
      expect(index.deletions).toEqual([]);
      expect(index.added).toEqual([]);
    });

    it("has the links indexed again once the user subscribes again", async () => {
      const gone = await unsubscribedWithLinks(4);
      await cleanUpIndex(true);
      await expectCleared(gone.ids);

      await prisma.subscription.update({
        where: { id: gone.subscriptionId },
        data: { active: true, currentPeriodEnd: daysAgo(-30) },
      });
      await runIndexing();

      await expectUntouched(gone.ids);
      expect((await cleanUpIndex(true)).links).toBe(0);
      await expectUntouched(gone.ids);
    });
  });

  describe("the loop", () => {
    const logged = () =>
      vi
        .mocked(console.log)
        .mock.calls.map((call) => call[1])
        .filter((line) => typeof line === "string");

    it("only logs until UNSUBSCRIBED_INDEX_CLEANUP is true", async () => {
      const gone = await unsubscribedWithLinks(3, true);

      for (const value of ["", "false", "1", "TRUE", "yes", " true"]) {
        vi.stubEnv("UNSUBSCRIBED_INDEX_CLEANUP", value);
        await expect(startIndexCleanup()).rejects.toBeInstanceOf(Stop);
      }

      await expectUntouched(gone.ids);
      expect(await isPublic(gone.collectionId)).toBe(true);
      expect(index.deletions).toEqual([]);
      expect(logged()).toContain(
        "Index cleanup (log only): 1 user unsubscribed for over 30 days, 3 links of 1 of them would be removed from the index, 1 public collection would be made private. Set UNSUBSCRIBED_INDEX_CLEANUP=true to do it."
      );
    });

    it("clears and says what it did when it's true", async () => {
      const gone = await unsubscribedWithLinks(3, true);
      vi.stubEnv("UNSUBSCRIBED_INDEX_CLEANUP", "true");

      await expect(startIndexCleanup()).rejects.toBeInstanceOf(Stop);

      await expectCleared(gone.ids);
      expect(await isPublic(gone.collectionId)).toBe(false);
      expect(logged()).toEqual([
        "Starting index cleanup...",
        `Made 1 public collection of unsubscribed users private: ${gone.collectionId}`,
        "Removed 3 links of unsubscribed users from the index.",
        "Index cleanup: 1 user unsubscribed for over 30 days, 3 links of 1 of them removed from the index, 1 public collection made private.",
      ]);
    });

    it("does nothing without billing", async () => {
      vi.stubEnv("STRIPE_SECRET_KEY", "");
      vi.stubEnv("UNSUBSCRIBED_INDEX_CLEANUP", "true");
      const gone = await unsubscribedWithLinks(3, true);

      await expect(startIndexCleanup()).resolves.toBeUndefined();

      await expectUntouched(gone.ids);
      expect(await isPublic(gone.collectionId)).toBe(true);
      expect(index.fetches).toEqual([]);
    });

    it("logs a failed run and waits for the next one", async () => {
      vi.stubEnv("UNSUBSCRIBED_INDEX_CLEANUP", "true");
      const gone = await unsubscribedWithLinks(3);
      index.fetchError = new Error("Meilisearch is down");

      await expect(startIndexCleanup()).rejects.toBeInstanceOf(Stop);

      expect(console.error).toHaveBeenCalledWith(
        expect.anything(),
        "Error cleaning up the index:",
        index.fetchError
      );
      await expectUntouched(gone.ids);
    });

    it("doesn't run with a trial length that isn't a number", async () => {
      vi.stubEnv("UNSUBSCRIBED_INDEX_CLEANUP", "true");
      vi.stubEnv("NEXT_PUBLIC_TRIAL_PERIOD_DAYS", "two weeks");
      const gone = await unsubscribedWithLinks(3, true);

      await expect(cleanUpIndex(true)).rejects.toThrow(
        "NEXT_PUBLIC_TRIAL_PERIOD_DAYS isn't a number of days: two weeks"
      );
      await expect(startIndexCleanup()).rejects.toBeInstanceOf(Stop);

      await expectUntouched(gone.ids);
      expect(await isPublic(gone.collectionId)).toBe(true);
    });
  });
});
