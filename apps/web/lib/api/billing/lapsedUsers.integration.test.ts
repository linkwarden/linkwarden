import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MEILI_INDEX_VERSION } from "@linkwarden/lib/constants";

// The index cleanup's idea of who has been without a subscription or trial for
// over 30 days, checked against the code that decides who can use Linkwarden
// (verifySubscription) and whose links the workers index and preserve, with
// all of them running for real. Runs against a real database (DATABASE_URL)
// and a real Meilisearch (MEILI_TEST_HOST, MEILI_TEST_KEY), on an index of its
// own. Without MEILI_TEST_HOST the suite is skipped.

const { scope, Stop, INDEX, stripe } = vi.hoisted(() => ({
  scope: { userIds: [] as number[], linkIds: [] as number[] },
  Stop: class Stop extends Error {},
  INDEX: `links_gates_${Date.now().toString(36)}`,
  // What Stripe has for an email. Cancelled subscriptions aren't listed.
  stripe: new Map<string, unknown>(),
}));

vi.mock("@linkwarden/lib/meilisearchClient", async () => {
  if (!process.env.MEILI_TEST_HOST) return { meiliClient: null };

  const { MeiliSearch } = await import("meilisearch");
  const client = new MeiliSearch({
    host: process.env.MEILI_TEST_HOST,
    apiKey: process.env.MEILI_TEST_KEY,
  });

  return {
    meiliClient: {
      getIndex: () => client.getIndex(INDEX),
      createIndex: (_uid: string, options: any) =>
        client.createIndex(INDEX, options),
      index: () => client.index(INDEX),
    },
  };
});

vi.mock("@linkwarden/lib/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@linkwarden/lib/utils")>()),
  delay: async () => {
    throw new Stop();
  },
}));

vi.mock("../../../../worker/lib/getLinkBatch", async (importOriginal) => {
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

vi.mock("./checkStripeSubscriptionByEmail", () => ({
  default: async (email: string) => stripe.get(email.toLowerCase()) ?? null,
}));

vi.mock("./syncStoreSubscription", () => ({
  default: async () => null,
  isStoreBillingConfigured: () => false,
}));

// Deleting an account cancels its Stripe subscription and removes its files
vi.mock("./stripeSDK", () => ({
  default: () => ({ subscriptions: { cancel: async () => ({}) } }),
}));

vi.mock("@linkwarden/filesystem", () => ({
  removeFolder: async () => {},
  removeFile: async () => {},
}));

const DAY = 86400000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);
const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

type Sub = { active: boolean; ended: number; updated: number } | null;

let prisma: typeof import("@linkwarden/prisma").prisma;
let meili: any;

// The modules read their settings when they load, so they're loaded again for
// each one
const load = async (requireCard: boolean) => {
  vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", requireCard ? "true" : "");
  vi.resetModules();
  return {
    verifySubscription: (await import("./verifySubscription")).default,
    getLinkBatchFairly: (
      await import("../../../../worker/lib/getLinkBatchFairly")
    ).default,
    startIndexing: (await import("../../../../worker/workers/linkIndexing"))
      .startIndexing,
    cleanup: await import("../../../../worker/workers/indexCleanup"),
  };
};

const createUser = async (
  label: string,
  data: { created: number; updated?: number; seatOn?: number }
) => {
  const created = await prisma.user.create({
    data: {
      username: `${label}-${unique()}`,
      email: `${label}-${unique()}@lab.test`,
      emailVerified: new Date(),
      createdAt: daysAgo(data.created),
      updatedAt: daysAgo(data.updated ?? data.created),
      parentSubscriptionId: data.seatOn,
    },
  });
  scope.userIds.push(created.id);
  return created;
};

const createSubscription = async (userId: number, sub: NonNullable<Sub>) =>
  (
    await prisma.subscription.create({
      data: {
        active: sub.active,
        provider: "STRIPE",
        stripeSubscriptionId: `sub_${unique()}`,
        currentPeriodStart: daysAgo(sub.ended + 30),
        currentPeriodEnd: daysAgo(sub.ended),
        updatedAt: daysAgo(sub.updated),
        userId,
      },
    })
  ).id;

// A collection of the user's own with links, not in the index yet
const ownLinks = async (ownerId: number, count: number, isPublic = false) => {
  const collection = await prisma.collection.create({
    data: {
      name: `gates ${unique()}`,
      ownerId,
      createdById: ownerId,
      isPublic,
    },
  });
  const links = await prisma.link.createManyAndReturn({
    data: Array.from({ length: count }, (_, i) => ({
      name: `gates ${i}`,
      url: `https://example.test/${unique()}`,
      collectionId: collection.id,
      createdById: ownerId,
      collectionOrder: i,
      indexVersion: MEILI_INDEX_VERSION,
    })),
    select: { id: true },
  });
  const ids = links.map((link) => link.id);
  scope.linkIds.push(...ids);
  return {
    collectionId: collection.id,
    ids,
    docs: ids.map((id) => ({
      id,
      collectionOwnerId: ownerId,
      collectionId: collection.id,
      collectionIsPublic: isPublic,
      collectionMemberIds: [],
    })),
  };
};

const addToIndex = async (docs: object[]) => {
  const task = await meili.index().addDocuments(docs);
  const done = await meili.index().waitForTask(task.taskUid);
  expect(done.status).toBe("succeeded");
};

// Like ownLinks, with the links in the index as if they'd been indexed
const indexedLinks = async (
  ownerId: number,
  count: number,
  isPublic = false
) => {
  const made = await ownLinks(ownerId, count, isPublic);
  await addToIndex(made.docs);
  return made;
};

// How many of these links have a document in the index
const inIndex = async (ids: number[]) => {
  let found = 0;
  for (const id of ids)
    found += await meili
      .index()
      .getDocument(id, { fields: ["id"] })
      .then(() => 1)
      .catch((err: any) => {
        if (err?.cause?.code === "document_not_found") return 0;
        throw err;
      });
  return found;
};

const quietly = async <T>(run: () => Promise<T>) => {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  try {
    return await run();
  } finally {
    log.mockRestore();
  }
};

describe.skipIf(!process.env.MEILI_TEST_HOST)(
  "users the index cleanup treats as gone",
  () => {
    beforeAll(async () => {
      await import("dotenv/config");
      if (!process.env.DATABASE_URL)
        throw new Error("DATABASE_URL must be set to run this suite.");

      process.env.INDEX_TAKE_COUNT = "1000";
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_gates");
      vi.stubEnv("NEXT_PUBLIC_TRIAL_PERIOD_DAYS", "14");
      vi.stubEnv("NEXT_PUBLIC_EMAIL_PROVIDER", "");

      ({ prisma } = await import("@linkwarden/prisma"));
      meili = (await import("@linkwarden/lib/meilisearchClient")).meiliClient;

      const created = await meili.createIndex(INDEX, { primaryKey: "id" });
      await meili.index().waitForTask(created.taskUid);
      const settings = await meili
        .index()
        .updateFilterableAttributes(["id", "collectionOwnerId"]);
      await meili.index().waitForTask(settings.taskUid);
    });

    afterAll(async () => {
      vi.unstubAllEnvs();
      const wipe = await meili
        ?.index()
        .delete()
        .catch(() => null);
      if (wipe) await meili.index().waitForTask(wipe.taskUid);
      for (const id of scope.userIds.splice(0))
        await prisma?.user.delete({ where: { id } }).catch(() => {});
      scope.linkIds = [];
    });

    it("never treats as gone someone Linkwarden lets in, or whose links the workers index or preserve", async () => {
      const subs: Record<string, Sub> = {
        none: null,
        active: { active: true, ended: -20, updated: 10 },
        "active, dates long past": { active: true, ended: 400, updated: 400 },
        "cancelled 31 days ago": { active: false, ended: 31, updated: 31 },
        "ended 29 days ago": { active: false, ended: 29, updated: 60 },
        "changed 5 days ago": { active: false, ended: 200, updated: 5 },
        "paid up for 10 more days": { active: false, ended: -10, updated: 60 },
      };
      const parents: Record<string, number | undefined> = { none: undefined };
      for (const name of [
        "active",
        "cancelled 31 days ago",
        "ended 29 days ago",
      ]) {
        const admin = await createUser("admin", { created: 400 });
        parents[name] = await createSubscription(admin.id, subs[name]!);
      }

      const people: { id: number; label: string }[] = [];
      for (const created of [0, 13, 15, 44, 46, 60, 400])
        for (const updated of [created, 1, 29, 31].filter(
          (days) => days <= created
        ))
          for (const [ownName, own] of Object.entries(subs))
            for (const [parentName, seatOn] of Object.entries(parents)) {
              const person = await createUser("grid", {
                created,
                updated,
                seatOn,
              });
              if (own) await createSubscription(person.id, own);
              people.push({
                id: person.id,
                label: `created ${created}, changed ${updated} days ago, own: ${ownName}, seat: ${parentName}`,
              });
            }

      // One unpreserved link each, in the index from when they all paid
      const linkOf = new Map<number, number>();
      const docs: object[] = [];
      for (const person of people) {
        const made = await ownLinks(person.id, 1);
        linkOf.set(person.id, made.ids[0]);
        docs.push(...made.docs);
      }
      await addToIndex(docs);
      await prisma.link.updateMany({
        where: { id: { in: Array.from(linkOf.values()) } },
        data: { indexVersion: null },
      });

      const now = Date.now();
      const { cleanup } = await load(false);
      // Everyone, the team admins too
      const billing = await prisma.user.findMany({
        where: { id: { in: scope.userIds } },
        include: { subscriptions: true, parentSubscription: true },
      });
      const gone = new Set(
        billing
          .filter((user) => cleanup.isUnsubscribed(user, now, 14))
          .map((user) => user.id)
      );

      // Both kinds have to be there for this to mean anything
      expect(gone.size).toBeGreaterThan(20);
      expect(gone.size).toBeLessThan(people.length - 100);

      const problems: string[] = [];
      for (const requireCard of [false, true]) {
        const app = await load(requireCard);

        for (const user of billing)
          if (gone.has(user.id) && (await app.verifySubscription(user)))
            problems.push(
              `lets in (card ${requireCard}): ${
                people.find((p) => p.id === user.id)?.label ??
                `admin ${user.id}`
              }`
            );

        const picked = await quietly(() =>
          app.getLinkBatchFairly({ maxBatchLinks: 5000, mode: "links" })
        );
        for (const link of picked)
          if (gone.has(link.createdById!))
            problems.push(
              `preserves (card ${requireCard}): ${
                people.find((p) => p.id === link.createdById)!.label
              }`
            );
        expect(picked.length).toBeGreaterThan(50);

        await quietly(async () => {
          for (let pass = 0; pass < 5; pass++)
            await expect(app.startIndexing(0)).rejects.toBeInstanceOf(Stop);
        });
        const indexed = await prisma.link.findMany({
          where: {
            id: { in: Array.from(linkOf.values()) },
            indexVersion: MEILI_INDEX_VERSION,
          },
          select: { createdById: true },
        });
        for (const link of indexed)
          if (gone.has(link.createdById!))
            problems.push(
              `indexes (card ${requireCard}): ${
                people.find((p) => p.id === link.createdById)!.label
              }`
            );
        expect(indexed.length).toBeGreaterThan(50);

        await prisma.link.updateMany({
          where: { id: { in: Array.from(linkOf.values()) } },
          data: { indexVersion: null },
        });
      }

      expect(problems).toEqual([]);

      // And the cleanup takes out exactly their links, which the indexing
      // worker then leaves alone
      const app = await load(false);
      const result = await quietly(() => app.cleanup.cleanUpIndex(true));
      expect(result.users).toBe(gone.size);
      for (const person of people)
        expect({
          person: person.label,
          inIndex: await inIndex([linkOf.get(person.id)!]),
        }).toEqual({
          person: person.label,
          inIndex: gone.has(person.id) ? 0 : 1,
        });

      await quietly(async () => {
        for (let pass = 0; pass < 3; pass++)
          await expect(app.startIndexing(0)).rejects.toBeInstanceOf(Stop);
      });
      expect(
        await inIndex(
          people
            .filter((person) => gone.has(person.id))
            .map((person) => linkOf.get(person.id)!)
        )
      ).toBe(0);
    }, 300000);

    it("only takes that admin's own seat users off when the server admin deletes a team admin", async () => {
      const team = async (label: string) => {
        const admin = await createUser(`${label}-admin`, { created: 400 });
        const subscription = await createSubscription(admin.id, {
          active: true,
          ended: -20,
          updated: 10,
        });
        const seat = await createUser(`${label}-seat`, {
          created: 400,
          seatOn: subscription,
        });
        return { admin, subscription, seat };
      };
      const deletedTeam = await team("deleted");
      const otherTeam = await team("other");
      const serverAdmin = await createUser("server-admin", { created: 400 });

      const deleteUserById = (
        await import("../controllers/users/userId/deleteUserById")
      ).default;
      const deleted = await deleteUserById(
        serverAdmin.id,
        { password: "" },
        true,
        deletedTeam.admin.id
      );
      expect(deleted.status).toBe(200);

      const seatOf = (id: number) =>
        prisma.user.findUniqueOrThrow({ where: { id } });
      const deletedSeat = await seatOf(deletedTeam.seat.id);
      expect(deletedSeat.parentSubscriptionId).toBeNull();
      expect(deletedSeat.updatedAt.getTime()).toBeGreaterThan(
        Date.now() - 60000
      );

      const otherSeat = await seatOf(otherTeam.seat.id);
      expect(otherSeat.parentSubscriptionId).toBe(otherTeam.subscription);
      expect(otherSeat.updatedAt).toEqual(otherTeam.seat.updatedAt);
      expect(
        await prisma.user.findUnique({ where: { id: serverAdmin.id } })
      ).not.toBeNull();
    });

    // Deleting the admin's account deletes their subscription. The seat users
    // lose their seat right then, so that's when their 30 days start.
    it("waits 30 days after a seat user's team admin deletes their account", async () => {
      const admin = await createUser("team-admin", { created: 400 });
      const team = await createSubscription(admin.id, {
        active: true,
        ended: -20,
        updated: 10,
      });
      const seat = await createUser("team-seat", {
        created: 400,
        seatOn: team,
      });
      const { collectionId, ids } = await indexedLinks(seat.id, 3, true);
      const isPublic = async () =>
        (
          await prisma.collection.findUniqueOrThrow({
            where: { id: collectionId },
          })
        ).isPublic;

      const app = await load(false);
      const deleteUserById = (
        await import("../controllers/users/userId/deleteUserById")
      ).default;
      const deleted = await deleteUserById(
        admin.id,
        { password: "" },
        false,
        admin.id,
        true
      );
      expect(deleted.status).toBe(200);
      expect(
        await prisma.user.findUnique({ where: { id: admin.id } })
      ).toBeNull();

      const after = await prisma.user.findUniqueOrThrow({
        where: { id: seat.id },
        include: { subscriptions: true, parentSubscription: true },
      });
      expect(after.parentSubscriptionId).toBeNull();
      expect(after.updatedAt.getTime()).toBeGreaterThan(Date.now() - 60000);
      // They can't use Linkwarden from now on
      expect(await app.verifySubscription(after)).toBeNull();

      await quietly(() => app.cleanup.cleanUpIndex(true));

      expect(await inIndex(ids)).toBe(3);
      expect(await isPublic()).toBe(true);

      // 31 days on
      await prisma.user.update({
        where: { id: seat.id },
        data: { updatedAt: daysAgo(31) },
      });
      await quietly(() => app.cleanup.cleanUpIndex(true));

      expect(await inIndex(ids)).toBe(0);
      expect(await isPublic()).toBe(false);
    });

    // Fails on purpose. Linkwarden asks Stripe when the stored subscription
    // looks over, so a stored row a webhook never updated doesn't lock out
    // someone who pays. The cleanup only reads the stored row, so after 30
    // quiet days it clears that person's links and makes their public
    // collections private. Their next request fixes the row and the links get
    // indexed again, but the collections stay private.
    it.fails("leaves alone someone Stripe still has as paying", async () => {
      const payer = await createUser("stale-row", { created: 400 });
      await createSubscription(payer.id, {
        active: false,
        ended: 60,
        updated: 60,
      });
      const { collectionId, ids } = await indexedLinks(payer.id, 2, true);
      stripe.set(payer.email!.toLowerCase(), {
        active: true,
        stripeSubscriptionId: `sub_${unique()}`,
        currentPeriodStart: Date.now() - 10 * DAY,
        currentPeriodEnd: Date.now() + 20 * DAY,
        quantity: 1,
      });

      const app = await load(false);
      await quietly(() => app.cleanup.cleanUpIndex(true));

      // What they find when they come back
      const withBilling = () =>
        prisma.user.findUniqueOrThrow({
          where: { id: payer.id },
          include: { subscriptions: true, parentSubscription: true },
        });
      expect(await app.verifySubscription(await withBilling())).not.toBeNull();
      expect((await withBilling()).subscriptions?.active).toBe(true);
      await quietly(async () => {
        for (let pass = 0; pass < 3; pass++)
          await expect(app.startIndexing(0)).rejects.toBeInstanceOf(Stop);
      });
      expect(await inIndex(ids)).toBe(2);

      expect(
        (
          await prisma.collection.findUniqueOrThrow({
            where: { id: collectionId },
          })
        ).isPublic
      ).toBe(true);
    });
  }
);
