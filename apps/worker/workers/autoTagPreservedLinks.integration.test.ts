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

// Runs the AI tagging loop against a real database (DATABASE_URL) with a
// made-up tagger, to check which links it tags, which it marks done and what
// it logs.

const { scope, faults, StopTagging, autoTagLink } = vi.hoisted(() => {
  // Two links per pass, so a handful of links takes several passes
  process.env.ARCHIVE_TAKE_COUNT = "2";

  return {
    // Only these users and links get picked and counted, so other test files'
    // rows stay untouched and don't change the numbers
    scope: { userIds: [] as number[], linkIds: [] as number[] },
    // Set to make the next count of links fail
    faults: { linkCount: null as Error | null },
    StopTagging: class StopTagging extends Error {},
    autoTagLink: vi.fn(),
  };
});

vi.mock("../lib/autoTagLink", () => ({ default: autoTagLink }));

// The loop waits between batches; stop it there after one pass
vi.mock("@linkwarden/lib/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@linkwarden/lib/utils")>()),
  delay: async () => {
    throw new StopTagging();
  },
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
  const scopedLink = scoped(real.prisma.link, "count", () => scope.linkIds);
  const link = new Proxy(scopedLink, {
    get: (target: any, key) =>
      key === "count" && faults.linkCount
        ? async () => {
            const error = faults.linkCount;
            faults.linkCount = null;
            throw error;
          }
        : target[key],
  });

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
const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const PROVIDER_VARS = [
  "NEXT_PUBLIC_OLLAMA_ENDPOINT_URL",
  "OPENAI_API_KEY",
  "AZURE_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENROUTER_API_KEY",
  "PERPLEXITY_API_KEY",
];

// The modules read some settings when they load, so they're loaded again each
// time
const load = async () => {
  vi.resetModules();
  return (await import("./autoTagPreservedLinks.js")).autoTagPreservedLinks;
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
      data: { name: "Tagging test", ownerId, createdById: ownerId },
    })
  ).id;

let order = 0;

const link = async (
  createdById: number | null,
  collectionId: number,
  data: {
    type?: string;
    lastPreserved?: Date | null;
    aiTagged?: boolean;
  } = {}
) => {
  const created = await prisma.link.create({
    data: {
      url: `https://example.com/${unique()}`,
      type: data.type ?? "url",
      name: "Tagging test link",
      collectionId,
      createdById,
      collectionOrder: ++order,
      lastPreserved:
        data.lastPreserved === undefined ? new Date() : data.lastPreserved,
      aiTagged: data.aiTagged ?? false,
    },
  });
  scope.linkIds.push(created.id);
  return created.id;
};

const links = async (
  count: number,
  createdById: number,
  collectionId: number
) => {
  const ids: number[] = [];
  for (let i = 0; i < count; i++)
    ids.push(await link(createdById, collectionId));
  return ids;
};

const userWithLinks = async (
  label: string,
  count: number,
  data: Parameters<typeof user>[1] = {}
) => {
  const created = await user(label, data);
  const ids = await links(count, created.id, await collection(created.id));
  return { user: created, ids };
};

// Runs the loop until it waits, and returns what it logged
const runOnePass = async () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  const autoTagPreservedLinks = await load();
  await expect(autoTagPreservedLinks(0)).rejects.toBeInstanceOf(StopTagging);
  const lines = log.mock.calls.map((call) => call[1] ?? call[0]);
  log.mockRestore();
  return lines as string[];
};

const taggedIds = () =>
  autoTagLink.mock.calls
    .map(([, linkId]) => linkId as number)
    .sort((a, b) => a - b);

const aiTagged = async (ids: number[]) =>
  (
    await prisma.link.findMany({
      where: { id: { in: ids } },
      select: { aiTagged: true },
      orderBy: { id: "asc" },
    })
  ).map((l) => l.aiTagged);

beforeAll(async () => {
  await import("dotenv/config");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests for autoTagPreservedLinks."
    );
  }

  await prisma.$connect();
});

beforeEach(() => {
  for (const name of PROVIDER_VARS) vi.stubEnv(name, "");
  vi.stubEnv("OPENAI_API_KEY", "test");
  vi.stubEnv("STRIPE_SECRET_KEY", "");
  vi.stubEnv("NEXT_PUBLIC_EMAIL_PROVIDER", "");
  vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", "");
  vi.stubEnv("NEXT_PUBLIC_TRIAL_PERIOD_DAYS", "14");
  autoTagLink.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(async () => {
  faults.linkCount = null;
  vi.clearAllMocks();
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

describe.sequential("autoTagPreservedLinks with a real database", () => {
  it("does nothing without an AI provider", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const { ids } = await userWithLinks("owner", 2);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await expect((await load())(0)).resolves.toBeUndefined();

    expect(log).not.toHaveBeenCalled();
    expect(autoTagLink).not.toHaveBeenCalled();
    expect(await aiTagged(ids)).toEqual([false, false]);
  });

  it.each(PROVIDER_VARS)("runs with only %s set", async (name) => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv(name, "test");
    const { ids } = await userWithLinks("owner", 1);

    await runOnePass();

    expect(taggedIds()).toEqual(ids);
  });

  it("tags links in batches and marks each one done", async () => {
    const { user: owner, ids } = await userWithLinks("owner", 3);

    await runOnePass();
    expect(autoTagLink).toHaveBeenCalledTimes(2);
    for (const [passedUser] of autoTagLink.mock.calls)
      expect(passedUser).toMatchObject({ id: owner.id });

    await runOnePass();
    expect(taggedIds()).toEqual(ids);

    await runOnePass();
    expect(autoTagLink).toHaveBeenCalledTimes(3);
    expect(await aiTagged(ids)).toEqual([true, true, true]);
  });

  it("hands the collection owner to the tagger, not who saved the link", async () => {
    const owner = await user("owner");
    const guest = await user("guest", {
      aiTaggingMethod: AiTaggingMethod.DISABLED,
    });
    const id = await link(guest.id, await collection(owner.id));

    await runOnePass();

    expect(autoTagLink).toHaveBeenCalledTimes(1);
    expect(autoTagLink.mock.calls[0][0]).toMatchObject({ id: owner.id });
    expect(autoTagLink.mock.calls[0][1]).toBe(id);
  });

  it("marks a link done even when tagging it fails", async () => {
    const { ids } = await userWithLinks("owner", 2);
    autoTagLink.mockImplementation(async (_user, linkId) => {
      if (linkId === ids[0]) throw new Error("model unavailable");
    });

    const lines = await runOnePass();

    expect(await aiTagged(ids)).toEqual([true, true]);
    expect(
      lines.some(
        (line) => line.includes(`Succeeded`) && line.includes(`${ids[0]}`)
      )
    ).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("Error auto-tagging link"),
      expect.any(Error)
    );
  });

  it("keeps going when a link can't be marked done", async () => {
    const { ids } = await userWithLinks("owner", 3);
    // The link is deleted while it's being tagged
    autoTagLink.mockImplementationOnce(async (_user, linkId) => {
      await prisma.link.delete({ where: { id: linkId } });
    });

    await runOnePass();
    expect(console.error).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("as auto-tagged"),
      expect.anything()
    );

    await runOnePass();
    expect(taggedIds()).toEqual(ids);
  });

  it("leaves links it isn't going to tag alone", async () => {
    const owner = await user("owner");
    const off = await user("off", {
      aiTaggingMethod: AiTaggingMethod.DISABLED,
    });
    const collectionId = await collection(owner.id);
    const toTag = await link(owner.id, collectionId);
    const skipped = [
      await link(owner.id, collectionId, { lastPreserved: null }),
      await link(owner.id, collectionId, { type: "pdf" }),
      await link(null, collectionId),
      await link(off.id, await collection(off.id)),
    ];

    await runOnePass();
    await runOnePass();

    expect(taggedIds()).toEqual([toTag]);
    expect(await aiTagged(skipped)).toEqual([false, false, false, false]);
  });

  describe("logging how many are left", () => {
    // What the worker logged after a batch, e.g. "Auto-tagged 2 links, 1 left."
    const report = async () =>
      (await runOnePass()).filter(
        (line) => typeof line === "string" && line.endsWith(" left.")
      );

    it("counts down to zero as it tags", async () => {
      await userWithLinks("owner", 3);

      expect(await report()).toEqual(["Auto-tagged 2 links, 1 left."]);
      expect(await report()).toEqual(["Auto-tagged 1 link, 0 left."]);
      expect(await report()).toEqual([]);
    });

    it("logs after the links of the batch and their results", async () => {
      const { ids } = await userWithLinks("owner", 1);

      const lines = await runOnePass();

      expect(lines.at(-1)).toBe("Auto-tagged 1 link, 0 left.");
      expect(
        lines.findIndex((line) => line.startsWith("Succeeded auto-tagging"))
      ).toBeLessThan(lines.length - 1);
      expect(await aiTagged(ids)).toEqual([true]);
    });

    it("doesn't count links it failed to tag as tagged, or as left", async () => {
      const { ids } = await userWithLinks("owner", 3);
      autoTagLink.mockImplementation(async (_user, linkId) => {
        if (linkId === ids[2] || linkId === ids[1])
          throw new Error("model unavailable");
      });

      expect(await report()).toEqual(["Auto-tagged 0 links, 1 left."]);
      autoTagLink.mockResolvedValue(undefined);
      expect(await report()).toEqual(["Auto-tagged 1 link, 0 left."]);
    });

    it("doesn't count links it isn't going to tag", async () => {
      const owner = await user("owner");
      const off = await user("off", {
        aiTaggingMethod: AiTaggingMethod.DISABLED,
      });
      const collectionId = await collection(owner.id);
      await links(3, owner.id, collectionId);
      await link(owner.id, collectionId, { lastPreserved: null });
      await link(owner.id, collectionId, { type: "pdf" });
      await link(owner.id, collectionId, { type: "image" });
      await link(owner.id, collectionId, { aiTagged: true });
      await link(null, collectionId);
      await link(off.id, await collection(off.id));
      // Saved by someone with tagging off, into a collection that has it on
      await link(off.id, collectionId);

      expect(await report()).toEqual(["Auto-tagged 2 links, 2 left."]);
      expect(await report()).toEqual(["Auto-tagged 2 links, 0 left."]);
      expect(await report()).toEqual([]);
    });

    it("says nothing when the only untagged links are ones it skips", async () => {
      const off = await user("off", {
        aiTaggingMethod: AiTaggingMethod.DISABLED,
      });
      await links(2, off.id, await collection(off.id));

      expect(await report()).toEqual([]);
    });

    it("counts a link preserved while the batch was being tagged", async () => {
      const { user: owner, ids } = await userWithLinks("owner", 2);
      const { collectionId } = await prisma.link.findUniqueOrThrow({
        where: { id: ids[0] },
      });
      autoTagLink.mockImplementationOnce(async () => {
        await link(owner.id, collectionId);
      });

      expect(await report()).toEqual(["Auto-tagged 2 links, 1 left."]);
    });

    it("still reports when a link can't be marked done", async () => {
      await userWithLinks("owner", 3);
      autoTagLink.mockImplementationOnce(async (_user, linkId) => {
        await prisma.link.delete({ where: { id: linkId } });
      });

      expect(await report()).toEqual(["Auto-tagged 2 links, 1 left."]);
      expect(await report()).toEqual(["Auto-tagged 1 link, 0 left."]);
    });

    it("stops the loop when the count fails, like a failed batch pick does", async () => {
      const { ids } = await userWithLinks("owner", 1);
      faults.linkCount = new Error("connection lost");

      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      await expect((await load())(0)).rejects.toThrow("connection lost");
      log.mockRestore();

      // The batch itself was done before the count
      expect(await aiTagged(ids)).toEqual([true]);
      expect(faults.linkCount).toBeNull();
    });

    describe("with billing", () => {
      beforeEach(() => {
        vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
      });

      it("doesn't count links by users without a subscription or trial", async () => {
        const subscriber = await userWithLinks("subscriber", 3);
        await subscription(subscriber.user.id, true);
        const lapsed = await userWithLinks("lapsed", 2);
        await subscription(lapsed.user.id, false);
        await userWithLinks("never", 2);
        await userWithLinks("trial", 1, { createdDaysAgo: 13 });
        await userWithLinks("expired", 2, { createdDaysAgo: 15 });

        expect(await report()).toEqual(["Auto-tagged 2 links, 2 left."]);
        expect(await report()).toEqual(["Auto-tagged 2 links, 0 left."]);
        expect(await report()).toEqual([]);
      });

      it("counts links by someone on an active seat only", async () => {
        const admin = await user("admin");
        const seat = await subscription(admin.id, true);
        const member = await user("member", { parentSubscriptionId: seat.id });
        await links(3, member.id, await collection(member.id));
        const gone = await user("gone-admin");
        const cancelled = await subscription(gone.id, false);
        const leftOver = await user("left-over", {
          parentSubscriptionId: cancelled.id,
        });
        await links(2, leftOver.id, await collection(leftOver.id));

        expect(await report()).toEqual(["Auto-tagged 2 links, 1 left."]);
        expect(await report()).toEqual(["Auto-tagged 1 link, 0 left."]);
      });

      it("doesn't count links by users on trial when a card is required up front", async () => {
        vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", "true");
        await userWithLinks("trial", 3, { createdDaysAgo: 1 });
        const subscriber = await userWithLinks("subscriber", 1);
        await subscription(subscriber.user.id, true);

        expect(await report()).toEqual(["Auto-tagged 1 link, 0 left."]);
        expect(await report()).toEqual([]);
      });

      it("goes by who saved the link, not who owns the collection", async () => {
        const subscriber = await user("subscriber");
        await subscription(subscriber.id, true);
        const lapsed = await user("lapsed");
        const shared = await collection(subscriber.id);
        await links(1, subscriber.id, shared);
        await links(2, lapsed.id, shared);

        expect(await report()).toEqual(["Auto-tagged 1 link, 0 left."]);
      });
    });

    describe("with email verification", () => {
      beforeEach(() => {
        vi.stubEnv("NEXT_PUBLIC_EMAIL_PROVIDER", "true");
      });

      it("doesn't count links by users who haven't verified their email", async () => {
        await userWithLinks("verified", 1);
        await userWithLinks("unverified", 3, { emailVerified: null });

        expect(await report()).toEqual(["Auto-tagged 1 link, 0 left."]);
        expect(await report()).toEqual([]);
      });
    });
  });

  describe("with billing", () => {
    beforeEach(() => {
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    });

    it("tags links by subscribers and users on trial only", async () => {
      const subscriber = await userWithLinks("subscriber", 1);
      await subscription(subscriber.user.id, true);
      const lapsed = await userWithLinks("lapsed", 1);
      await subscription(lapsed.user.id, false);
      const onTrial = await userWithLinks("trial", 1, { createdDaysAgo: 13 });
      await userWithLinks("expired", 1, { createdDaysAgo: 15 });

      await runOnePass();
      await runOnePass();

      expect(taggedIds()).toEqual(
        [...subscriber.ids, ...onTrial.ids].sort((a, b) => a - b)
      );
    });
  });
});
