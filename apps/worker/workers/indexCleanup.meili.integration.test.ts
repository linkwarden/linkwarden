import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MeiliSearch } from "meilisearch";
import { MEILI_INDEX_VERSION } from "@linkwarden/lib/constants";
import { prisma } from "@linkwarden/prisma";
import { cleanUpIndex } from "./indexCleanup";
import { startIndexing } from "./linkIndexing";

// Runs the cleanup and the indexing worker against a real database
// (DATABASE_URL) and a real Meilisearch (MEILI_TEST_HOST, MEILI_TEST_KEY).
// Both work on an index of their own here, so the other test files that use
// that Meilisearch aren't in the way. Without MEILI_TEST_HOST the suite is
// skipped.

const { scope, Stop, INDEX } = vi.hoisted(() => {
  process.env.INDEX_TAKE_COUNT = "500";

  return {
    // Only these users and links are looked at, so other test files' rows
    // stay untouched
    scope: { userIds: [] as number[], linkIds: [] as number[] },
    Stop: class Stop extends Error {},
    INDEX: `links_cleanup_${Date.now().toString(36)}`,
  };
});

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

describe.skipIf(!process.env.MEILI_TEST_HOST)(
  "indexCleanup with a real Meilisearch",
  () => {
    const meili = new MeiliSearch({
      host: process.env.MEILI_TEST_HOST ?? "http://localhost",
      apiKey: process.env.MEILI_TEST_KEY,
    });
    const index = meili.index(INDEX);

    const subscriber = async (label: string) => {
      const created = await prisma.user.create({
        data: {
          username: `${label}-${unique()}`,
          email: `${label}-${unique()}@lab.test`,
          createdAt: daysAgo(400),
          updatedAt: daysAgo(400),
        },
      });
      scope.userIds.push(created.id);

      const subscription = await prisma.subscription.create({
        data: {
          active: true,
          provider: "STRIPE",
          stripeSubscriptionId: `sub_${unique()}`,
          currentPeriodStart: daysAgo(10),
          currentPeriodEnd: daysAgo(-20),
          updatedAt: daysAgo(10),
          userId: created.id,
        },
      });

      return { id: created.id, subscriptionId: subscription.id };
    };

    const cancel = (subscriptionId: number, days: number) =>
      prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          active: false,
          currentPeriodEnd: daysAgo(days),
          updatedAt: daysAgo(days),
        },
      });

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

    const links = async (
      count: number,
      collectionId: number,
      createdById: number
    ) => {
      const created = await prisma.link.createManyAndReturn({
        data: Array.from({ length: count }, (_, i) => ({
          url: `https://example.com/${unique()}`,
          name: `Cleanup link ${i}`,
          textContent: "Sourdough starter notes",
          collectionId,
          createdById,
          collectionOrder: i + 1,
        })),
        select: { id: true },
      });

      const ids = created.map((link) => link.id).sort((a, b) => a - b);
      scope.linkIds.push(...ids);
      return ids;
    };

    // The indexing worker, until it has nothing left to index
    const runIndexing = async () => {
      for (let pass = 0; pass < 20; pass++) {
        const log = vi.spyOn(console, "log").mockImplementation(() => {});
        await expect(startIndexing(0)).rejects.toBeInstanceOf(Stop);
        const indexed = log.mock.calls.some(
          (call) => typeof call[1] === "string" && call[1].includes(" left.")
        );
        log.mockRestore();
        if (!indexed) return;
      }
      throw new Error("Indexing never finished");
    };

    // Counted through the documents route, as a search stops counting at 1000
    const documentsOf = async (ownerId: number) =>
      (
        await index.getDocuments({
          filter: `collectionOwnerId = ${ownerId}`,
          fields: ["id"],
          limit: 1,
        })
      ).total;

    const found = async (ownerId: number, query: string) =>
      (
        await index.search(query, {
          filter: `collectionOwnerId = ${ownerId}`,
          attributesToRetrieve: ["id"],
          limit: 5,
        })
      ).hits.length;

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

    const isPublic = async (collectionId: number) =>
      (
        await prisma.collection.findUniqueOrThrow({
          where: { id: collectionId },
        })
      ).isPublic;

    beforeAll(async () => {
      await import("dotenv/config");

      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL must be set to run integration tests for indexCleanup."
        );
      }

      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
      vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", "");
      vi.stubEnv("NEXT_PUBLIC_TRIAL_PERIOD_DAYS", "14");
      vi.spyOn(console, "error").mockImplementation(() => {});

      await prisma.$connect();
    });

    afterAll(async () => {
      vi.unstubAllEnvs();
      vi.restoreAllMocks();

      const wipe = await meili.deleteIndex(INDEX).catch(() => null);
      if (wipe) await meili.waitForTask(wipe.taskUid);

      for (const id of scope.userIds) {
        await prisma.user.delete({ where: { id } }).catch(() => {});
      }
      await prisma.$disconnect();
    });

    it("clears a cancelled user's documents and has them back once they subscribe again", async () => {
      const paying = await subscriber("paying");
      const payingLinks = await links(
        3,
        await collection(paying.id),
        paying.id
      );

      const leaving = await subscriber("leaving");
      const privateCollection = await collection(leaving.id);
      const publicCollection = await collection(leaving.id, {
        isPublic: true,
      });
      // More than the cleanup reads from Meilisearch at a time
      const leavingLinks = [
        ...(await links(1200, privateCollection, leaving.id)),
        ...(await links(5, publicCollection, leaving.id)),
      ];

      // Shared with someone who stays subscribed
      const member = await subscriber("member");
      const shared = await collection(leaving.id, {
        isPublic: true,
        members: [member.id],
      });
      const sharedLinks = await links(4, shared, leaving.id);

      await runIndexing();

      expect(await documentsOf(leaving.id)).toBe(1209);
      expect(await documentsOf(paying.id)).toBe(3);
      expect(await found(leaving.id, "sourdough")).toBe(5);

      // Still subscribed, so nothing to do
      expect(await cleanUpIndex(true)).toEqual({
        users: 0,
        owners: 0,
        links: 0,
        collections: 0,
      });
      expect(await documentsOf(leaving.id)).toBe(1209);

      // Cancelled, but not for long enough
      await cancel(leaving.subscriptionId, 29);
      expect((await cleanUpIndex(true)).links).toBe(0);
      expect(await documentsOf(leaving.id)).toBe(1209);

      await cancel(leaving.subscriptionId, 31);

      const dryRun = await cleanUpIndex(false);
      expect(dryRun).toEqual({
        users: 1,
        owners: 1,
        links: 1205,
        collections: 1,
      });
      expect(await documentsOf(leaving.id)).toBe(1209);
      expect(await isPublic(publicCollection)).toBe(true);
      expect(await versionsOf(leavingLinks)).toEqual([MEILI_INDEX_VERSION]);

      expect(await cleanUpIndex(true)).toEqual(dryRun);

      // Only what the subscribed member can still search is left
      expect(await documentsOf(leaving.id)).toBe(4);
      expect(await versionsOf(leavingLinks)).toEqual([null]);
      expect(await versionsOf(sharedLinks)).toEqual([MEILI_INDEX_VERSION]);
      expect(await isPublic(publicCollection)).toBe(false);
      expect(await isPublic(shared)).toBe(true);
      await expect(index.getDocument(leavingLinks[0])).rejects.toThrow();
      await expect(index.getDocument(sharedLinks[0])).resolves.toMatchObject({
        id: sharedLinks[0],
      });

      // The subscriber's documents are as they were
      expect(await documentsOf(paying.id)).toBe(3);
      expect(await versionsOf(payingLinks)).toEqual([MEILI_INDEX_VERSION]);
      expect(await found(paying.id, "sourdough")).toBe(3);

      // The indexing worker leaves the cleared links alone
      await runIndexing();
      expect(await documentsOf(leaving.id)).toBe(4);
      expect(await versionsOf(leavingLinks)).toEqual([null]);

      // And a second run has nothing left to clear
      expect((await cleanUpIndex(true)).links).toBe(0);

      await prisma.subscription.update({
        where: { id: leaving.subscriptionId },
        data: { active: true, currentPeriodEnd: daysAgo(-30) },
      });
      await runIndexing();

      expect(await documentsOf(leaving.id)).toBe(1209);
      expect(await versionsOf(leavingLinks)).toEqual([MEILI_INDEX_VERSION]);
      expect(await found(leaving.id, "sourdough")).toBe(5);
      await expect(
        index.getDocument(leavingLinks[1204])
      ).resolves.toMatchObject({
        id: leavingLinks[1204],
        collectionIsPublic: false,
      });

      expect((await cleanUpIndex(true)).links).toBe(0);
      expect(await documentsOf(leaving.id)).toBe(1209);
    }, 120000);
  }
);
