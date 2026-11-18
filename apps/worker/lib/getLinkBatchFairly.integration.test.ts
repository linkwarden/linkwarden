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
import { AiTaggingMethod } from "@linkwarden/prisma/client";
import { prisma } from "@linkwarden/prisma";
import type * as GetLinkBatchFairly from "./getLinkBatchFairly";

// Runs the batch picker against a real database (DATABASE_URL), to check which
// links the preservation ("links") and AI tagging ("tags") workers get to.

const { scope } = vi.hoisted(() => ({
  // Only these users and links get picked and counted, so other test files'
  // rows stay untouched and don't change the numbers
  scope: { userIds: [] as number[], linkIds: [] as number[] },
}));

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

type Mode = "links" | "tags";

const DAY = 86400000;
const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// The module reads some settings when it loads, so it's loaded again each time
const load = async () => {
  vi.resetModules();
  return (await import(
    "./getLinkBatchFairly.js"
  )) as unknown as typeof GetLinkBatchFairly;
};

const user = async (
  label: string,
  data: {
    createdDaysAgo?: number;
    parentSubscriptionId?: number;
    aiTaggingMethod?: AiTaggingMethod;
    emailVerified?: Date | null;
  } = {}
) => {
  const created = await prisma.user.create({
    data: {
      username: `${label}-${unique()}`,
      email: `${label}-${unique()}@lab.test`,
      createdAt: new Date(Date.now() - (data.createdDaysAgo ?? 30) * DAY),
      parentSubscriptionId: data.parentSubscriptionId,
      aiTaggingMethod: data.aiTaggingMethod ?? AiTaggingMethod.GENERATE,
      emailVerified:
        data.emailVerified === undefined ? new Date() : data.emailVerified,
    },
  });
  scope.userIds.push(created.id);
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
      data: { name: "Batch test", ownerId, createdById: ownerId },
    })
  ).id;

let order = 0;

const link = async (
  createdById: number | null,
  collectionId: number,
  data: {
    url?: string | null;
    type?: string;
    lastPreserved?: Date | null;
    aiTagged?: boolean;
  } = {}
) => {
  const created = await prisma.link.create({
    data: {
      url:
        data.url === undefined ? `https://example.com/${unique()}` : data.url,
      type: data.type ?? "url",
      name: "Batch test link",
      collectionId,
      createdById,
      collectionOrder: ++order,
      lastPreserved: data.lastPreserved ?? null,
      aiTagged: data.aiTagged ?? false,
    },
  });
  scope.linkIds.push(created.id);
  return created.id;
};

// Links waiting for the worker running in `mode`
const pending = async (
  mode: Mode,
  count: number,
  createdById: number,
  collectionId: number
) => {
  const ids: number[] = [];
  for (let i = 0; i < count; i++)
    ids.push(
      await link(createdById, collectionId, {
        lastPreserved: mode === "tags" ? new Date() : null,
      })
    );
  return ids;
};

const quietly = async <T>(run: () => Promise<T>) => {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  try {
    return await run();
  } finally {
    log.mockRestore();
  }
};

const pick = async (mode: Mode, maxBatchLinks: number) => {
  const getLinkBatchFairly = (await load()).default;
  return quietly(() => getLinkBatchFairly({ maxBatchLinks, mode }));
};

// Picks batches the way the worker does, marking each batch done, until
// nothing is left. Returns every link it picked.
const pickAll = async (mode: Mode) => {
  const picked: number[] = [];
  for (let pass = 0; pass < 50; pass++) {
    const batch = await pick(mode, 2);
    if (batch.length === 0) return picked.sort((a, b) => a - b);

    picked.push(...batch.map((l) => l.id));
    await prisma.link.updateMany({
      where: { id: { in: batch.map((l) => l.id) } },
      data:
        mode === "tags" ? { aiTagged: true } : { lastPreserved: new Date() },
    });
  }
  throw new Error("The picker never ran out of links");
};

const countLeft = async (mode: Mode) => (await load()).countLinksLeft(mode);

// The picker gets to exactly these links, and the count of links left agrees
// with it before and after
const expectPicks = async (mode: Mode, ids: number[]) => {
  expect(await countLeft(mode)).toBe(ids.length);
  expect(await pickAll(mode)).toEqual([...ids].sort((a, b) => a - b));
  expect(await countLeft(mode)).toBe(0);
};

beforeAll(async () => {
  await import("dotenv/config");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests for getLinkBatchFairly."
    );
  }

  await prisma.$connect();
});

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "");
  vi.stubEnv("NEXT_PUBLIC_EMAIL_PROVIDER", "");
  vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", "");
  vi.stubEnv("NEXT_PUBLIC_TRIAL_PERIOD_DAYS", "14");
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  const linkIds = scope.linkIds.splice(0, scope.linkIds.length);
  await prisma.link.deleteMany({ where: { id: { in: linkIds } } });
  for (const id of scope.userIds.splice(0, scope.userIds.length)) {
    await prisma.user.delete({ where: { id } }).catch(() => {});
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe.sequential("getLinkBatchFairly with a real database", () => {
  describe("without billing", () => {
    it("counts nothing when there's nothing to do", async () => {
      await user("idle");

      expect(await countLeft("links")).toBe(0);
      expect(await countLeft("tags")).toBe(0);
    });

    it("counts each mode's links on their own", async () => {
      const owner = await user("owner");
      const collectionId = await collection(owner.id);
      await pending("links", 3, owner.id, collectionId);
      await pending("tags", 2, owner.id, collectionId);

      expect(await countLeft("links")).toBe(3);
      expect(await countLeft("tags")).toBe(2);
    });

    it("returns nothing for a batch of 0 links", async () => {
      const owner = await user("owner");
      const collectionId = await collection(owner.id);
      await pending("links", 2, owner.id, collectionId);
      await pending("tags", 2, owner.id, collectionId);

      expect(await pick("links", 0)).toEqual([]);
      expect(await pick("tags", 0)).toEqual([]);
    });

    it("picks links that haven't been preserved yet for preservation", async () => {
      const owner = await user("owner");
      const collectionId = await collection(owner.id);
      const unpreserved = await pending("links", 3, owner.id, collectionId);
      const pdf = await link(owner.id, collectionId, { type: "pdf" });
      await link(owner.id, collectionId, { lastPreserved: new Date() });
      await link(owner.id, collectionId, { url: null });
      await link(null, collectionId);

      await expectPicks("links", [...unpreserved, pdf]);
    });

    it("picks preserved web links that haven't been tagged for tagging", async () => {
      const owner = await user("owner");
      const collectionId = await collection(owner.id);
      const toTag = await pending("tags", 3, owner.id, collectionId);
      await link(owner.id, collectionId);
      await link(owner.id, collectionId, {
        type: "pdf",
        lastPreserved: new Date(),
      });
      await link(owner.id, collectionId, {
        type: "image",
        lastPreserved: new Date(),
      });
      await link(owner.id, collectionId, {
        lastPreserved: new Date(),
        aiTagged: true,
      });
      await link(owner.id, collectionId, {
        url: null,
        lastPreserved: new Date(),
      });
      await link(null, collectionId, { lastPreserved: new Date() });

      await expectPicks("tags", toTag);
    });

    it("goes by the collection owner's tagging setting, not who saved the link", async () => {
      const taggingOn = await user("on", {
        aiTaggingMethod: AiTaggingMethod.EXISTING,
      });
      const taggingOff = await user("off", {
        aiTaggingMethod: AiTaggingMethod.DISABLED,
      });
      const onCollection = await collection(taggingOn.id);
      const offCollection = await collection(taggingOff.id);

      const intoOn = await pending("tags", 1, taggingOff.id, onCollection);
      const ownOn = await pending("tags", 1, taggingOn.id, onCollection);
      const intoOff = await pending("tags", 1, taggingOn.id, offCollection);
      const ownOff = await pending("tags", 1, taggingOff.id, offCollection);

      await expectPicks("tags", [...intoOn, ...ownOn]);
      expect(
        await prisma.link.count({
          where: { id: { in: [...intoOff, ...ownOff] }, aiTagged: false },
        })
      ).toBe(2);

      // Preservation doesn't care about tagging
      const unpreserved = await pending(
        "links",
        1,
        taggingOff.id,
        offCollection
      );
      await expectPicks("links", unpreserved);
    });

    it("tags the most recently preserved links first", async () => {
      const owner = await user("owner");
      const collectionId = await collection(owner.id);
      const older = await link(owner.id, collectionId, {
        lastPreserved: new Date(Date.now() - 2 * DAY),
      });
      const newest = await link(owner.id, collectionId, {
        lastPreserved: new Date(),
      });
      const middle = await link(owner.id, collectionId, {
        lastPreserved: new Date(Date.now() - DAY),
      });

      expect((await pick("tags", 1)).map((l) => l.id)).toEqual([newest]);
      expect((await pick("tags", 3)).map((l) => l.id)).toEqual([
        newest,
        middle,
        older,
      ]);
    });

    it.each(["links", "tags"] as const)(
      "spreads a %s batch across users",
      async (mode) => {
        const first = await user("first");
        const second = await user("second");
        const firstIds = await pending(
          mode,
          5,
          first.id,
          await collection(first.id)
        );
        const secondIds = await pending(
          mode,
          5,
          second.id,
          await collection(second.id)
        );

        const batch = await pick(mode, 4);

        expect(batch).toHaveLength(4);
        expect(batch.filter((l) => firstIds.includes(l.id))).toHaveLength(2);
        expect(batch.filter((l) => secondIds.includes(l.id))).toHaveLength(2);
        expect(batch[0].collection.owner.id).toBeDefined();
      }
    );
  });

  describe.each(["links", "tags"] as const)("with billing, %s", (mode) => {
    beforeEach(() => {
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    });

    it("picks links by subscribers and users on trial only", async () => {
      const subscriber = await user("subscriber");
      await subscription(subscriber.id, true);
      const lapsed = await user("lapsed");
      await subscription(lapsed.id, false);
      const never = await user("never");
      const onTrial = await user("trial", { createdDaysAgo: 13 });
      const expired = await user("expired", { createdDaysAgo: 15 });

      const subscriberIds = await pending(
        mode,
        3,
        subscriber.id,
        await collection(subscriber.id)
      );
      await pending(mode, 2, lapsed.id, await collection(lapsed.id));
      await pending(mode, 2, never.id, await collection(never.id));
      const trialIds = await pending(
        mode,
        2,
        onTrial.id,
        await collection(onTrial.id)
      );
      await pending(mode, 2, expired.id, await collection(expired.id));

      await expectPicks(mode, [...subscriberIds, ...trialIds]);
    });

    it("picks links by someone on an active seat only", async () => {
      const admin = await user("admin");
      const seat = await subscription(admin.id, true);
      const member = await user("member", { parentSubscriptionId: seat.id });
      const cancelledAdmin = await user("cancelled-admin");
      const cancelledSeat = await subscription(cancelledAdmin.id, false);
      const leftOver = await user("left-over", {
        parentSubscriptionId: cancelledSeat.id,
      });

      const memberIds = await pending(
        mode,
        2,
        member.id,
        await collection(member.id)
      );
      await pending(mode, 2, leftOver.id, await collection(leftOver.id));

      await expectPicks(mode, memberIds);
    });

    it("skips users on trial when a card is required up front", async () => {
      vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", "true");
      const onTrial = await user("trial", { createdDaysAgo: 1 });
      await pending(mode, 2, onTrial.id, await collection(onTrial.id));
      const subscriber = await user("subscriber");
      await subscription(subscriber.id, true);
      const subscriberIds = await pending(
        mode,
        1,
        subscriber.id,
        await collection(subscriber.id)
      );

      await expectPicks(mode, subscriberIds);
    });

    it("goes by who saved the link, not who owns the collection", async () => {
      const subscriber = await user("subscriber");
      await subscription(subscriber.id, true);
      const lapsed = await user("lapsed");
      const shared = await collection(subscriber.id);
      const own = await pending(mode, 1, subscriber.id, shared);
      await pending(mode, 2, lapsed.id, shared);

      await expectPicks(mode, own);
    });
  });

  describe.each(["links", "tags"] as const)(
    "with email verification, %s",
    (mode) => {
      beforeEach(() => {
        vi.stubEnv("NEXT_PUBLIC_EMAIL_PROVIDER", "true");
      });

      it("skips links by users who haven't verified their email", async () => {
        const verified = await user("verified");
        const unverified = await user("unverified", { emailVerified: null });
        const verifiedIds = await pending(
          mode,
          2,
          verified.id,
          await collection(verified.id)
        );
        await pending(mode, 2, unverified.id, await collection(unverified.id));

        await expectPicks(mode, verifiedIds);
      });
    }
  );
});
