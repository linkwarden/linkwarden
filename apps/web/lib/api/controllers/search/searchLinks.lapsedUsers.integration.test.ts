import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { Sort } from "@linkwarden/types/global";
import tagSearch from "@/lib/client/tagSearch";

// What people who can use Linkwarden find, and what anyone sees on a public
// page, before and after the worker's index jobs run on an instance with
// billing, where some users stopped paying long ago. Runs against a real
// database (DATABASE_URL) and a real Meilisearch (MEILI_TEST_HOST,
// MEILI_TEST_KEY), on an index of its own. Without MEILI_TEST_HOST the suite
// is skipped.

const { scope, Stop, INDEX, stripe } = vi.hoisted(() => ({
  // Only these users and links are looked at, so other test files' rows stay
  // untouched
  scope: { userIds: [] as number[], linkIds: [] as number[] },
  Stop: class Stop extends Error {},
  INDEX: `links_lapsed_${Date.now().toString(36)}`,
  // What Stripe has for an email, when the stored subscription looks over
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

// The worker's loops wait between runs; stop them there
vi.mock("@linkwarden/lib/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@linkwarden/lib/utils")>()),
  delay: async () => {
    throw new Stop();
  },
}));

vi.mock("../../../../../worker/lib/getLinkBatch", async (importOriginal) => {
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
  // The admin's worker stats count every link in the database
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

vi.mock("../../billing/checkStripeSubscriptionByEmail", () => ({
  default: async (email: string) => stripe.get(email.toLowerCase()) ?? null,
}));

vi.mock("../../billing/syncStoreSubscription", () => ({
  default: async () => null,
}));

const DAY = 86400000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);
const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

type Search = typeof import("./searchLinks").default;

describe.skipIf(!process.env.MEILI_TEST_HOST)(
  "what people find around users who stopped paying",
  () => {
    let prisma: typeof import("@linkwarden/prisma").prisma;
    let searchLinks: Search;
    let verifySubscription: typeof import("../../billing/verifySubscription").default;
    let getPublicCollection: typeof import("../public/collections/getPublicCollection").default;
    let getPublicLink: typeof import("../public/links/linkId/getLinkById").default;
    let getWorkerStats: typeof import("../worker/getWorkerStats").default;
    let startIndexing: typeof import("../../../../../worker/workers/linkIndexing").startIndexing;
    let startIndexCleanup: typeof import("../../../../../worker/workers/indexCleanup").startIndexCleanup;

    const users: Record<string, { id: number; email: string }> = {};
    const collections: Record<string, number> = {};
    const tagIds = new Map<number, number[]>();

    type Snapshot = {
      canUse: Set<number>;
      searches: Map<string, number[]>;
      publicPages: Map<number, unknown>;
      // The admin's Background jobs page
      stats: unknown;
    };
    let before: Snapshot;
    let after: Snapshot;
    // Who can see each collection: its owner and members
    const access = new Map<number, number[]>();
    // Links that have "sourdough" in them, by collection
    const linksIn = new Map<number, number[]>();

    const user = async (
      key: string,
      data: { created?: number; updated?: number; seatOn?: number } = {}
    ) => {
      const email = `${key.toLowerCase()}-${unique()}@lab.test`;
      const created = await prisma.user.create({
        data: {
          username: `${key.toLowerCase()}-${unique()}`,
          email,
          emailVerified: new Date(),
          createdAt: daysAgo(data.created ?? 400),
          updatedAt: daysAgo(data.updated ?? data.created ?? 400),
          parentSubscriptionId: data.seatOn,
        },
      });
      scope.userIds.push(created.id);
      users[key] = { id: created.id, email };
      return created.id;
    };

    // `ended` and `updated` are days ago, so `ended: -20` still has 20 days
    const subscription = async (
      key: string,
      data: {
        active: boolean;
        ended: number;
        updated: number;
        fake?: boolean;
      }
    ) =>
      (
        await prisma.subscription.create({
          data: {
            active: data.active,
            provider: "STRIPE",
            stripeSubscriptionId: `${
              data.fake ? "fake_sub" : "sub"
            }_${unique()}`,
            currentPeriodStart: daysAgo(data.ended + 30),
            currentPeriodEnd: daysAgo(data.ended),
            updatedAt: daysAgo(data.updated),
            userId: users[key].id,
          },
        })
      ).id;

    const collection = async (
      key: string,
      ownerKey: string,
      data: { isPublic?: boolean; members?: string[]; parent?: string } = {}
    ) => {
      const created = await prisma.collection.create({
        data: {
          name: `${key} ${unique()}`,
          ownerId: users[ownerKey].id,
          createdById: users[ownerKey].id,
          isPublic: data.isPublic ?? false,
          parentId: data.parent ? collections[data.parent] : undefined,
          members: {
            create: (data.members ?? []).map((memberKey) => ({
              userId: users[memberKey].id,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            })),
          },
        },
      });
      collections[key] = created.id;
      access.set(created.id, [
        users[ownerKey].id,
        ...(data.members ?? []).map((memberKey) => users[memberKey].id),
      ]);
      linksIn.set(created.id, []);
      return created.id;
    };

    // Every link has "sourdough" in its text, every other one also "rye"
    const links = async (
      count: number,
      collectionKey: string,
      creatorKey: string,
      data: { pinnedBy?: string; tag?: string } = {}
    ) => {
      const collectionId = collections[collectionKey];
      const creatorId = users[creatorKey].id;
      const { ownerId } = await prisma.collection.findUniqueOrThrow({
        where: { id: collectionId },
      });

      for (let i = 0; i < count; i++) {
        const link = await prisma.link.create({
          data: {
            name: `${collectionKey} ${i} ${unique()}`,
            url: `https://example.test/${unique()}`,
            textContent: `Notes on a sourdough starter${
              i % 2 ? " with rye flour" : ""
            }.`,
            collectionId,
            createdById: creatorId,
            collectionOrder: i,
            tags: data.tag
              ? {
                  connectOrCreate: {
                    where: { name_ownerId: { name: data.tag, ownerId } },
                    create: { name: data.tag, ownerId },
                  },
                }
              : undefined,
            pinnedBy: data.pinnedBy
              ? { connect: { id: users[data.pinnedBy].id } }
              : undefined,
          },
          include: { tags: true },
        });
        scope.linkIds.push(link.id);
        linksIn.get(collectionId)!.push(link.id);
        for (const tag of link.tags) {
          const viewers = access.get(collectionId)!;
          for (const viewer of viewers)
            tagIds.set(viewer, [
              ...Array.from(new Set([...(tagIds.get(viewer) ?? []), tag.id])),
            ]);
        }
      }
    };

    // The indexing worker until it has nothing left to index
    const drainIndexing = async () => {
      for (let pass = 0; pass < 30; pass++) {
        const log = vi.spyOn(console, "log").mockImplementation(() => {});
        await expect(startIndexing(0)).rejects.toBeInstanceOf(Stop);
        const indexed = log.mock.calls.some(
          (call) =>
            typeof call[1] === "string" && /^Indexed [1-9]/.test(call[1])
        );
        log.mockRestore();
        if (!indexed) return;
      }
      throw new Error("Indexing never finished");
    };

    // Everything the worker does to the index when it starts: its indexing
    // and cleanup loops, side by side
    const runIndexJobs = async () => {
      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      await Promise.all([
        expect(startIndexing(0)).rejects.toBeInstanceOf(Stop),
        expect(startIndexCleanup()).rejects.toBeInstanceOf(Stop),
      ]);
      const errors = error.mock.calls;
      log.mockRestore();
      error.mockRestore();
      expect(errors).toEqual([]);

      await drainIndexing();
    };

    const ids = (result: Awaited<ReturnType<Search>>) =>
      ((result.data as any)?.links ?? [])
        .map((link: { id: number }) => link.id)
        .sort((a: number, b: number) => a - b);

    // Follows the cursor like the app's infinite scroll
    const searchAll = async (params: Parameters<Search>[0]) => {
      const found: number[] = [];
      let cursor: number | undefined;
      for (let page = 0; page < 50; page++) {
        const result = await searchLinks({
          ...params,
          query: { ...params.query, cursor },
        });
        expect(result.success, result.message).toBe(true);
        found.push(...ids(result));
        const next = (result.data as any)?.nextCursor;
        if (next === null || next === undefined)
          return found.sort((a, b) => a - b);
        cursor = next;
      }
      throw new Error("Search never ran out of pages");
    };

    const snapshot = async (): Promise<Snapshot> => {
      const canUse = new Set<number>();
      const searches = new Map<string, number[]>();
      const publicPages = new Map<number, unknown>();

      for (const { id } of Object.values(users)) {
        const withBilling = await prisma.user.findUniqueOrThrow({
          where: { id },
          include: { subscriptions: true, parentSubscription: true },
        });
        if (!(await verifySubscription(withBilling))) continue;
        canUse.add(id);

        const asUser = async (
          name: string,
          query: Parameters<Search>[0]["query"]
        ) =>
          searches.set(
            `${id} ${name}`,
            await searchAll({
              userId: id,
              query: { sort: Sort.DateNewestFirst, ...query },
            })
          );

        await asUser("word", { searchQueryString: "sourdough" });
        await asUser("best match", {
          searchQueryString: "sourdough starter",
          sort: Sort.BestMatch,
        });
        await asUser("phrase", { searchQueryString: '"rye flour"' });
        await asUser("or", { searchQueryString: "rye OR starter" });
        await asUser("not", { searchQueryString: "sourdough !rye" });
        await asUser("pinned", {
          searchQueryString: "sourdough",
          pinnedOnly: true,
        });
        for (const [collectionId, viewers] of Array.from(access))
          if (viewers.includes(id))
            await asUser(`collection ${collectionId}`, {
              searchQueryString: "sourdough",
              collectionId,
            });
        for (const tagId of tagIds.get(id) ?? []) {
          const tag = await prisma.tag.findUniqueOrThrow({
            where: { id: tagId },
          });
          await asUser(`tag ${tagId}`, {
            searchQueryString: tagSearch(tag.name),
            tagId,
          });
        }
      }

      for (const collectionId of Array.from(access.keys())) {
        const page = await getPublicCollection(collectionId);
        const firstLink = linksIn.get(collectionId)![0];
        publicPages.set(collectionId, {
          page: page.status,
          search: await searchAll({
            query: {
              sort: Sort.DateNewestFirst,
              searchQueryString: "sourdough",
              collectionId,
            },
            publicOnly: true,
          }),
          list: await searchAll({
            query: { sort: Sort.DateNewestFirst, collectionId },
            publicOnly: true,
          }),
          link: firstLink
            ? (
                (await getPublicLink(firstLink)).response as {
                  id: number;
                } | null
              )?.id ?? null
            : null,
        });
      }

      const stats = (await getWorkerStats(0)).data;

      return { canUse, searches, publicPages, stats };
    };

    beforeAll(async () => {
      await import("dotenv/config");
      if (!process.env.DATABASE_URL)
        throw new Error("DATABASE_URL must be set to run this suite.");

      process.env.INDEX_TAKE_COUNT = "500";
      vi.stubEnv("NEXT_PUBLIC_TRIAL_PERIOD_DAYS", "14");
      vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", "");
      vi.stubEnv("UNSUBSCRIBED_INDEX_CLEANUP", "true");
      // Everything gets indexed first, as it was while everyone paid
      vi.stubEnv("STRIPE_SECRET_KEY", "");

      ({ prisma } = await import("@linkwarden/prisma"));
      searchLinks = (await import("./searchLinks")).default;
      verifySubscription = (await import("../../billing/verifySubscription"))
        .default;
      getPublicCollection = (
        await import("../public/collections/getPublicCollection")
      ).default;
      getPublicLink = (await import("../public/links/linkId/getLinkById"))
        .default;
      getWorkerStats = (await import("../worker/getWorkerStats")).default;
      ({ startIndexing } = await import(
        "../../../../../worker/workers/linkIndexing"
      ));
      ({ startIndexCleanup } = await import(
        "../../../../../worker/workers/indexCleanup"
      ));

      // Who's who
      await user("Paying");
      await subscription("Paying", { active: true, ended: -20, updated: 10 });
      await user("Team");
      const team = await subscription("Team", {
        active: true,
        ended: -20,
        updated: 10,
      });
      await user("Seat", { seatOn: team });
      await user("Trial", { created: 5 });
      await user("Fresh", { created: 40, updated: 40 });
      await user("AdminMade");
      await subscription("AdminMade", {
        active: true,
        ended: -365000,
        updated: 300,
        fake: true,
      });
      await user("Lapsed");
      await subscription("Lapsed", { active: false, ended: 60, updated: 60 });
      await user("LapsedToo");
      await subscription("LapsedToo", {
        active: false,
        ended: 90,
        updated: 90,
      });
      await user("RecentlyLapsed");
      await subscription("RecentlyLapsed", {
        active: false,
        ended: 10,
        updated: 10,
      });
      await user("NeverPaid", { created: 100 });
      await user("OldTeam");
      const oldTeam = await subscription("OldTeam", {
        active: false,
        ended: 50,
        updated: 50,
      });
      await user("OldSeat", { seatOn: oldTeam });
      await user("Busy", { created: 200, updated: 2 });

      // What they keep
      await collection("lapsed private", "Lapsed");
      await links(4, "lapsed private", "Lapsed", { tag: "bread" });
      await collection("lapsed public", "Lapsed", { isPublic: true });
      await links(3, "lapsed public", "Lapsed");
      await collection("lapsed shared with paying", "Lapsed", {
        members: ["Paying"],
      });
      await links(3, "lapsed shared with paying", "Lapsed", {
        tag: "bread",
        pinnedBy: "Paying",
      });
      await links(2, "lapsed shared with paying", "Paying", {
        pinnedBy: "Paying",
      });
      await collection("lapsed sub", "Lapsed", {
        parent: "lapsed shared with paying",
        members: ["Paying"],
      });
      await links(2, "lapsed sub", "Paying");
      await links(2, "lapsed sub", "Lapsed");
      await collection("lapsed public shared with trial", "Lapsed", {
        isPublic: true,
        members: ["Trial"],
      });
      await links(3, "lapsed public shared with trial", "Lapsed");
      await collection("lapsed shared with lapsed", "Lapsed", {
        members: ["LapsedToo", "NeverPaid"],
      });
      await links(2, "lapsed shared with lapsed", "LapsedToo");
      await collection("lapsed shared with recently lapsed", "Lapsed", {
        isPublic: true,
        members: ["RecentlyLapsed"],
      });
      await links(2, "lapsed shared with recently lapsed", "Lapsed");
      await collection("lapsed with a former member's links", "Lapsed", {
        isPublic: true,
      });
      await links(2, "lapsed with a former member's links", "Paying");
      await links(2, "lapsed with a former member's links", "Lapsed");
      await collection("lapsed shared with seat", "Lapsed", {
        members: ["Seat"],
      });
      await links(2, "lapsed shared with seat", "Lapsed", {
        pinnedBy: "Seat",
      });
      await collection("lapsed shared with admin made", "Lapsed", {
        members: ["AdminMade"],
      });
      await links(2, "lapsed shared with admin made", "Lapsed");
      await collection("lapsed shared with busy", "Lapsed", {
        isPublic: true,
        members: ["Busy"],
      });
      await links(2, "lapsed shared with busy", "Lapsed");

      await collection("paying public", "Paying", { isPublic: true });
      await links(3, "paying public", "Paying", { tag: "bread" });
      await collection("paying shared with lapsed", "Paying", {
        members: ["Lapsed"],
      });
      await links(3, "paying shared with lapsed", "Lapsed", {
        pinnedBy: "Paying",
      });
      await links(1, "paying shared with lapsed", "Paying");
      await collection("paying private", "Paying");
      await links(2, "paying private", "Paying");

      await collection("never paid public", "NeverPaid", { isPublic: true });
      await links(3, "never paid public", "NeverPaid");
      await collection("old seat public", "OldSeat", { isPublic: true });
      await links(2, "old seat public", "OldSeat");
      await collection("seat public", "Seat", { isPublic: true });
      await links(2, "seat public", "Seat");
      await collection("trial public", "Trial", { isPublic: true });
      await links(2, "trial public", "Trial");
      await collection("fresh public", "Fresh", { isPublic: true });
      await links(2, "fresh public", "Fresh");
      await collection("recently lapsed public", "RecentlyLapsed", {
        isPublic: true,
      });
      await links(2, "recently lapsed public", "RecentlyLapsed");
      await collection("busy public", "Busy", { isPublic: true });
      await links(2, "busy public", "Busy");
      await collection("lapsed too public", "LapsedToo", { isPublic: true });
      await links(2, "lapsed too public", "LapsedToo");

      await drainIndexing();

      // Billing on, as on the hosted instance
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_lapsed");

      before = await snapshot();
      await runIndexJobs();
      after = await snapshot();
    }, 300000);

    afterAll(async () => {
      vi.unstubAllEnvs();
      const meili = (await import("@linkwarden/lib/meilisearchClient"))
        .meiliClient as any;
      const wipe = await meili
        ?.index()
        .delete()
        .catch(() => null);
      if (wipe) await meili.index().waitForTask(wipe.taskUid);
      for (const id of scope.userIds)
        await prisma?.user.delete({ where: { id } }).catch(() => {});
    });

    it("lets in the same people", () => {
      const names = (set: Set<number>) =>
        Object.entries(users)
          .filter(([, { id }]) => set.has(id))
          .map(([key]) => key)
          .sort();

      expect(names(before.canUse)).toEqual([
        "AdminMade",
        "Paying",
        "Seat",
        "Team",
        "Trial",
      ]);
      expect(names(after.canUse)).toEqual(names(before.canUse));
    });

    it("finds everything someone can see for each of them, before and after", () => {
      for (const id of Array.from(before.canUse)) {
        const visible = Array.from(access)
          .filter(([, viewers]) => viewers.includes(id))
          .flatMap(([collectionId]) => linksIn.get(collectionId)!)
          .sort((a, b) => a - b);

        expect(before.searches.get(`${id} word`)).toEqual(visible);
        expect(after.searches.get(`${id} word`)).toEqual(visible);
      }
    });

    it("gives every search of theirs the same results", () => {
      expect(Array.from(after.searches.keys())).toEqual(
        Array.from(before.searches.keys())
      );
      for (const [key, found] of Array.from(before.searches))
        expect({ key, found: after.searches.get(key) }).toEqual({
          key,
          found,
        });
      // The checks above have to cover something
      expect(before.searches.size).toBeGreaterThan(40);
    });

    it("keeps the public pages of collections someone can still use", () => {
      let checked = 0;
      for (const [collectionId, viewers] of Array.from(access)) {
        if (!viewers.some((id) => before.canUse.has(id))) continue;
        expect({
          collectionId,
          ...(after.publicPages.get(collectionId) as object),
        }).toEqual({
          collectionId,
          ...(before.publicPages.get(collectionId) as object),
        });
        checked++;
      }
      expect(checked).toBeGreaterThanOrEqual(10);
    });

    // Meant to change with the cleanup: a public collection that nobody who
    // pays or is on a trial can use, and whose owner and members have all been
    // without one for over 30 days, is made private. Others are left as they
    // are, including ones with someone in those 30 days.
    it("makes only the public collections of users gone for over 30 days private", () => {
      const madePrivate = [
        "lapsed public",
        "lapsed with a former member's links",
        "never paid public",
        "old seat public",
        "lapsed too public",
      ].map((key) => collections[key]);
      const gone = { page: 400, search: [], list: [], link: null };

      const abandoned = Array.from(access).filter(
        ([, viewers]) => !viewers.some((id) => before.canUse.has(id))
      );
      expect(abandoned.length).toBeGreaterThan(madePrivate.length);

      for (const [collectionId] of abandoned)
        expect({
          collectionId,
          ...(after.publicPages.get(collectionId) as object),
        }).toEqual({
          collectionId,
          ...(madePrivate.includes(collectionId)
            ? gone
            : (before.publicPages.get(collectionId) as object)),
        });

      for (const collectionId of madePrivate)
        expect((before.publicPages.get(collectionId) as any).page).toBe(200);
    });

    // The links taken out of the index aren't waiting to be indexed: the
    // indexing worker leaves them alone until their users subscribe again
    it("shows the admin only what the indexing worker is going to index as pending", async () => {
      const stats = (snapshot: Snapshot) => snapshot.stats as any;
      const outOfIndex = await prisma.link.count({
        where: { id: { in: scope.linkIds }, indexVersion: null },
      });
      expect(outOfIndex).toBeGreaterThan(10);

      expect(stats(before).search).toEqual({
        pending: 0,
        done: scope.linkIds.length,
      });
      expect(stats(after).search).toEqual({
        pending: 0,
        done: scope.linkIds.length - outOfIndex,
      });
      expect(stats(after).link).toEqual(stats(before).link);

      // A new link counts as pending when it's by someone who pays, and not
      // when it's by someone who stopped
      const add = async (collectionKey: string, creatorKey: string) => {
        const link = await prisma.link.create({
          data: {
            name: "new",
            url: `https://example.test/${unique()}`,
            collectionId: collections[collectionKey],
            createdById: users[creatorKey].id,
            collectionOrder: 99,
          },
        });
        scope.linkIds.push(link.id);
      };
      await add("paying private", "Paying");
      await add("lapsed private", "Lapsed");

      expect((await getWorkerStats(0)).data.search.pending).toBe(1);
    });
  }
);
