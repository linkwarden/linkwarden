import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { Sort } from "@linkwarden/types/global";
import tagSearch from "@/lib/client/tagSearch";

// Runs against a real database (DATABASE_URL) and a real Meilisearch
// (MEILI_TEST_HOST, MEILI_TEST_KEY), with links indexed by the worker's own
// indexing loop. The Meilisearch instance gets wiped, so it has to be a
// throwaway one. Without MEILI_TEST_HOST the suite is skipped.

const { scope, StopIndexing, aiTags } = vi.hoisted(() => ({
  // Only these links get indexed, so other test files' rows stay untouched
  scope: { ids: [] as number[] },
  StopIndexing: class StopIndexing extends Error {},
  // What the AI tagger answers next
  aiTags: { next: [] as string[] },
}));

// The AI tagger's answer is made up here, so nothing is sent anywhere
vi.mock("ai", () => ({
  generateText: async () => ({ text: JSON.stringify(aiTags.next) }),
}));

vi.mock("@linkwarden/lib/meilisearchClient", async () => {
  const { MeiliSearch } = await import("meilisearch");
  return {
    meiliClient: process.env.MEILI_TEST_HOST
      ? new MeiliSearch({
          host: process.env.MEILI_TEST_HOST,
          apiKey: process.env.MEILI_TEST_KEY,
        })
      : null,
  };
});

// The indexing loop waits between batches; stop it there after one pass
vi.mock("@linkwarden/lib/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@linkwarden/lib/utils")>()),
  delay: async () => {
    throw new StopIndexing();
  },
}));

vi.mock("../../../../../worker/lib/getLinkBatch", async (importOriginal) => {
  const real = (await importOriginal<any>()).default;
  return {
    default: (params: any) =>
      real({
        ...params,
        where: { AND: [params.where ?? {}, { id: { in: scope.ids } }] },
      }),
  };
});

type Search = typeof import("./searchLinks").default;

let prisma: typeof import("@linkwarden/prisma").prisma;
let searchLinks: Search;
let startIndexing: typeof import("../../../../../worker/workers/linkIndexing").startIndexing;
let autoTagLink: typeof import("../../../../../worker/lib/autoTagLink").default;
let updateLinkById: typeof import("../links/linkId/updateLinkById").default;
let meili: NonNullable<
  typeof import("@linkwarden/lib/meilisearchClient").meiliClient
>;

const createdUserIds: number[] = [];
const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// One pass indexes up to INDEX_TAKE_COUNT links, so it keeps going until none
// are left
const index = async () => {
  let pending = 0;
  for (let pass = 0; pass < 10; pass++) {
    await startIndexing(0).catch((err) => {
      if (!(err instanceof StopIndexing)) throw err;
    });
    pending = await prisma.link.count({
      where: { id: { in: scope.ids }, indexVersion: null },
    });
    if (pending === 0) break;
  }
  expect(pending).toBe(0);
};

const linkIds = (result: Awaited<ReturnType<Search>>) =>
  ((result.data as any)?.links ?? []).map((link: { id: number }) => link.id);

// Follows the cursor like the app's infinite scroll does
const searchAll = async (params: Parameters<Search>[0]) => {
  const ids: number[] = [];
  let cursor: number | undefined;
  for (let page = 0; page < 50; page++) {
    const result = await searchLinks({
      ...params,
      query: { ...params.query, cursor },
    });
    ids.push(...linkIds(result));
    const next = (result.data as any)?.nextCursor;
    if (next === null || next === undefined) return ids;
    cursor = next;
  }
  throw new Error("Search never ran out of pages");
};

describe.skipIf(!process.env.MEILI_TEST_HOST)(
  "searchLinks with a real Meilisearch",
  () => {
    let alice: { id: number };
    let bob: { id: number };
    const c: Record<string, number> = {};
    const l: Record<string, number> = {};
    // Bob's links outside the collection he shares with Alice
    const hiddenFromAlice: number[] = [];

    const user = async (label: string) => {
      const created = await prisma.user.create({
        data: {
          username: `${label}-${unique()}`,
          email: `${label}-${unique()}@lab.test`,
        },
      });
      createdUserIds.push(created.id);
      return created;
    };

    const collection = async (
      key: string,
      ownerId: number,
      data: { isPublic?: boolean; memberId?: number } = {}
    ) => {
      const created = await prisma.collection.create({
        data: {
          name: `${key} ${unique()}`,
          ownerId,
          createdById: ownerId,
          isPublic: data.isPublic ?? false,
          ...(data.memberId
            ? {
                members: {
                  create: {
                    userId: data.memberId,
                    canCreate: true,
                    canUpdate: true,
                    canDelete: true,
                  },
                },
              }
            : {}),
        },
      });
      c[key] = created.id;
      return created;
    };

    const link = async (
      key: string,
      collectionKey: string,
      ownerId: number,
      data: {
        name: string;
        url?: string;
        description?: string;
        textContent?: string;
        tags?: string[];
        pinnedBy?: number;
        createdAt?: Date;
      }
    ) => {
      const created = await prisma.link.create({
        data: {
          name: data.name,
          url: data.url ?? `https://example.test/${key}-${unique()}`,
          description: data.description ?? "",
          textContent: data.textContent,
          collectionId: c[collectionKey],
          createdById: ownerId,
          collectionOrder: 0,
          createdAt: data.createdAt,
          tags: data.tags
            ? {
                connectOrCreate: data.tags.map((name) => ({
                  where: { name_ownerId: { name, ownerId } },
                  create: { name, ownerId },
                })),
              }
            : undefined,
          pinnedBy: data.pinnedBy
            ? { connect: { id: data.pinnedBy } }
            : undefined,
        },
      });
      l[key] = created.id;
      scope.ids.push(created.id);
      if (ownerId === bob.id && collectionKey !== "bobShared")
        hiddenFromAlice.push(created.id);
      return created;
    };

    const asAlice = (query: Parameters<Search>[0]["query"]) =>
      searchAll({
        userId: alice.id,
        query: { sort: Sort.DateNewestFirst, ...query },
      });

    beforeAll(async () => {
      process.env.INDEX_TAKE_COUNT = "500";
      ({ prisma } = await import("@linkwarden/prisma"));
      searchLinks = (await import("./searchLinks")).default;
      ({ startIndexing } = await import(
        "../../../../../worker/workers/linkIndexing"
      ));
      autoTagLink = (await import("../../../../../worker/lib/autoTagLink"))
        .default;
      updateLinkById = (await import("../links/linkId/updateLinkById")).default;
      meili = (await import("@linkwarden/lib/meilisearchClient")).meiliClient!;
      // A copied .env can carry a Stripe key, which limits indexing to subscribers
      delete process.env.STRIPE_SECRET_KEY;
      // Picks an AI provider, which is never called
      vi.stubEnv("OPENAI_API_KEY", "test");
      vi.stubEnv("OPENAI_MODEL", "test");

      const wipe = await meili.deleteIndex("links").catch(() => null);
      if (wipe) await meili.waitForTask(wipe.taskUid);

      alice = await user("alice");
      bob = await user("bob");

      await collection("reading", alice.id);
      await collection("small", alice.id);
      await collection("busy", alice.id);
      await collection("alicePublic", alice.id, { isPublic: true });
      await collection("bobSecret", bob.id);
      await collection("bobShared", bob.id, { memberId: alice.id });
      await collection("bobPublic", bob.id, { isPublic: true });

      // Oldest first, so ids (newest first) run against how well they match
      await link("small1", "small", alice.id, {
        name: "Saturday chores",
        textContent: "Sorted the garage with a cheap organizer from the shop.",
        tags: ["home"],
        pinnedBy: alice.id,
      });
      await link("small2", "small", alice.id, {
        name: "Pantry",
        textContent: "The pantry needed an organizer for spices.",
        tags: ["home"],
        pinnedBy: alice.id,
      });
      await link("repo", "reading", alice.id, {
        name: "GitHub - QiuYannnn/Local-File-Organizer: An AI-powered file management tool",
        url: "https://github.com/QiuYannnn/Local-File-Organizer",
        textContent:
          "Local File Organizer sorts your documents with a model that runs on your machine.",
        tags: ["ai"],
        createdAt: new Date("2020-03-01T00:00:00.000Z"),
      });
      await link("weekly", "reading", alice.id, {
        name: "Weekly notes",
        textContent:
          "This week I tried a local file organizer and a calendar app. The file organizer was fine.",
        createdAt: new Date("2022-06-01T00:00:00.000Z"),
      });
      await link("photos", "reading", alice.id, {
        name: "Organizing photos on a NAS",
        description: "folder layout tips",
        textContent: "Keep one folder per year.",
        tags: ["ai", "home"],
      });
      await link("thesis", "reading", alice.id, {
        name: "Thesis, antithesis, synthesis",
        textContent:
          "The triad thesis, antithesis, synthesis describes a dialectic. Synthesis resolves the antithesis.",
      });
      await link("reversed", "reading", alice.id, {
        name: "Synthesis then antithesis",
        textContent:
          "A note where synthesis comes before antithesis and thesis.",
      });
      for (let i = 0; i < 8; i++)
        await link(`busy${i}`, "busy", alice.id, {
          name: `Organizer review ${i}`,
          textContent: "Another organizer worth a look, with tags and folders.",
          tags: ["home"],
          pinnedBy: alice.id,
        });
      await link("public1", "alicePublic", alice.id, {
        name: "Notes",
        textContent: "A public page that mentions an organizer once.",
      });
      await link("public2", "alicePublic", alice.id, {
        name: "More notes",
        textContent: "Another public page about an organizer.",
      });
      await link("secret", "bobSecret", bob.id, {
        name: "Local File Organizer, my copy",
        url: "https://github.com/QiuYannnn/Local-File-Organizer",
        textContent: "file organizer organizer",
        tags: ["ai"],
      });
      await link("shared", "bobShared", bob.id, {
        name: "Shared file organizer notes",
        textContent: "Notes about a file organizer, shared with Alice.",
      });
      for (let i = 0; i < 8; i++)
        await link(`bobPublic${i}`, "bobPublic", bob.id, {
          name: `Organizer roundup ${i}`,
          textContent: "Public organizer list, organizer after organizer.",
        });

      // Title has the words apart, page text has them side by side (and is newer)
      await link("gardenTitle", "reading", alice.id, {
        name: "Garden layout and a seasonal planner",
        textContent: "Plan the beds by season.",
      });
      await link("gardenBody", "reading", alice.id, {
        name: "Weekend links",
        textContent: "I found a garden planner app that sketches beds.",
      });
      await link("aliceResearch", "reading", alice.id, {
        name: "Research notes on composting",
        tags: ["research"],
      });
      await link("bobResearch", "bobShared", bob.id, {
        name: "Research about composting, shared",
        tags: ["research"],
      });

      await index();
    }, 120_000);

    afterEach(() => {
      delete process.env.PAGINATION_TAKE_COUNT;
    });

    afterAll(async () => {
      vi.unstubAllEnvs();
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      await prisma.$disconnect();
    });

    describe("who sees what", () => {
      it("never returns another user's private links, but does return shared ones", async () => {
        for (const q of [
          "organizer",
          "file organizer",
          "Local-File-Organizer",
          "https://github.com/QiuYannnn/Local-File-Organizer",
        ]) {
          const ids = await asAlice({ searchQueryString: q });
          expect(ids.filter((id) => hiddenFromAlice.includes(id))).toEqual([]);
        }

        expect(
          await asAlice({ searchQueryString: "file organizer" })
        ).toContain(l.shared);
      });

      it("doesn't let a crafted filter value widen the search", async () => {
        for (const q of [
          'tag:"ai\\" OR collectionOwnerId != 0 OR tags = \\"x"',
          'collection:"x\\" OR collectionOwnerId > 0 OR collectionName = \\"y" organizer',
          'url:"x\\" OR collectionIsPublic = false OR url = \\"y"',
          'organizer" OR collectionOwnerId > 0',
        ]) {
          const ids = await asAlice({ searchQueryString: q });
          expect(ids.filter((id) => hiddenFromAlice.includes(id))).toEqual([]);
        }
      });

      it("keeps a public collection search inside that collection", async () => {
        const ids = await searchAll({
          publicOnly: true,
          query: {
            sort: Sort.DateNewestFirst,
            collectionId: c.alicePublic,
            searchQueryString: "organizer",
          },
        });

        expect(new Set(ids)).toEqual(new Set([l.public1, l.public2]));
      });

      it("returns nothing from a private collection through public search", async () => {
        const ids = await searchAll({
          publicOnly: true,
          query: {
            sort: Sort.DateNewestFirst,
            collectionId: c.reading,
            searchQueryString: "organizer",
          },
        });

        expect(ids).toEqual([]);
      });

      it("hands back links without their page text, and only the searcher's pin", async () => {
        const result = await searchLinks({
          userId: alice.id,
          query: { sort: Sort.DateNewestFirst, searchQueryString: "organizer" },
        });
        const links = (result.data as any).links as any[];

        expect(links.length).toBeGreaterThan(0);
        for (const found of links) {
          expect(found).not.toHaveProperty("textContent");
          for (const pin of found.pinnedBy) expect(pin.id).toBe(alice.id);
        }
      });
    });

    describe("searching inside a list", () => {
      it("only returns the collection's links, across all pages", async () => {
        process.env.PAGINATION_TAKE_COUNT = "3";

        const ids = await asAlice({
          collectionId: c.small,
          searchQueryString: "organizer",
        });

        expect(new Set(ids)).toEqual(new Set([l.small1, l.small2]));
        expect(ids.length).toBe(new Set(ids).size);
      });

      it("only returns the tag's links", async () => {
        const home = await prisma.tag.findFirstOrThrow({
          where: { name: "home", ownerId: alice.id },
        });

        const ids = await asAlice({
          tagId: home.id,
          searchQueryString: "organizer",
        });

        expect(ids.length).toBeGreaterThan(0);
        const tagged = await prisma.link.count({
          where: { id: { in: ids }, tags: { some: { id: home.id } } },
        });
        expect(tagged).toBe(ids.length);
      });

      it("only returns pinned links", async () => {
        const ids = await asAlice({
          pinnedOnly: true,
          searchQueryString: "organizer",
        });

        expect(ids.length).toBeGreaterThan(0);
        const pinned = await prisma.link.count({
          where: { id: { in: ids }, pinnedBy: { some: { id: alice.id } } },
        });
        expect(pinned).toBe(ids.length);
      });

      it("returns every page's links once", async () => {
        process.env.PAGINATION_TAKE_COUNT = "2";

        const ids = await asAlice({ searchQueryString: "organizer" });

        expect(ids.length).toBe(new Set(ids).size);
        expect(ids).toEqual(
          expect.arrayContaining([l.small1, l.small2, l.busy0, l.busy7])
        );
      });

      it("finds a link a collection member pinned, and drops it once unpinned", async () => {
        const owner = await user("pin-owner");
        const member = await user("pin-member");
        await collection("memberPins", owner.id, { memberId: member.id });
        const saved = await link("pecan", "memberPins", owner.id, {
          name: "Pecan pie",
        });
        await index();

        // What the app sends to pin and unpin
        const pin = (userId: number, id: number | undefined) =>
          updateLinkById(userId, saved.id, {
            id: saved.id,
            name: saved.name,
            url: saved.url,
            description: saved.description,
            collection: { id: c.memberPins, ownerId: owner.id },
            tags: [],
            pinnedBy: [{ id }],
          } as any);
        const pinned = (userId: number) =>
          searchAll({
            userId,
            query: {
              sort: Sort.DateNewestFirst,
              pinnedOnly: true,
              searchQueryString: "pecan",
            },
          });

        expect((await pin(member.id, member.id)).status).toBe(200);
        await index();
        expect(await pinned(member.id)).toEqual([saved.id]);
        expect(await pinned(owner.id)).toEqual([]);

        // Someone outside the collection can't pin it
        const outsider = await user("pin-outsider");
        expect((await pin(outsider.id, outsider.id)).status).toBe(401);
        await index();
        expect(await pinned(outsider.id)).toEqual([]);

        expect((await pin(member.id, undefined)).status).toBe(200);
        await index();
        expect(await pinned(member.id)).toEqual([]);
      });
    });

    describe("operators", () => {
      it("finds a link by its exact address, the way the browser extension checks", async () => {
        const result = await searchLinks({
          userId: alice.id,
          query: {
            sort: Sort.DateNewestFirst,
            searchQueryString:
              "url:https://github.com/QiuYannnn/Local-File-Organizer",
          },
        });

        expect(linkIds(result)).toEqual([l.repo]);
      });

      it("narrows by tag, excluded tag, pinned and date", async () => {
        const ai = await asAlice({ searchQueryString: "tag:ai" });
        expect(new Set(ai)).toEqual(new Set([l.repo, l.photos]));

        const notAi = await asAlice({ searchQueryString: "organizer !tag:ai" });
        expect(notAi).not.toContain(l.repo);
        expect(notAi).toContain(l.small1);

        const pinned = await asAlice({
          searchQueryString: "pinned:true organizer",
        });
        expect(pinned).toContain(l.small1);
        expect(pinned).not.toContain(l.repo);

        const before = await asAlice({
          searchQueryString: "before:2021-01-01",
        });
        expect(before).toEqual([l.repo]);
      });
    });

    describe("searching inside a list fills the page", () => {
      it("puts a collection's matches on the first page", async () => {
        process.env.PAGINATION_TAKE_COUNT = "3";

        const first = await searchLinks({
          userId: alice.id,
          query: {
            sort: Sort.DateNewestFirst,
            collectionId: c.small,
            searchQueryString: "organizer",
          },
        });

        expect(new Set(linkIds(first))).toEqual(new Set([l.small1, l.small2]));
      });

      it("puts a public collection's matches on the first page", async () => {
        process.env.PAGINATION_TAKE_COUNT = "3";

        const first = await searchLinks({
          publicOnly: true,
          query: {
            sort: Sort.DateNewestFirst,
            collectionId: c.alicePublic,
            searchQueryString: "organizer",
          },
        });

        expect(new Set(linkIds(first))).toEqual(
          new Set([l.public1, l.public2])
        );
      });
    });

    describe("index settings", () => {
      it("are applied by the worker", async () => {
        const settings = await meili.index("links").getSettings();

        expect(settings.rankingRules).toEqual([
          "words",
          "typo",
          "attribute",
          "proximity",
          "sort",
          "exactness",
        ]);
        expect(settings.filterableAttributes).toContain("collectionId");
      });
    });

    describe("best match", () => {
      const bestMatch = (searchQueryString: string) =>
        searchAll({
          userId: alice.id,
          query: { sort: Sort.BestMatch, searchQueryString },
        });

      it("puts a pasted address first", async () => {
        const ids = await bestMatch(
          "https://github.com/QiuYannnn/Local-File-Organizer"
        );
        expect(ids[0]).toBe(l.repo);
      });

      it("puts a pasted title first", async () => {
        const ids = await bestMatch(
          "GitHub - QiuYannnn/Local-File-Organizer: An AI-powered file management tool"
        );
        expect(ids[0]).toBe(l.repo);
      });

      it("ranks a title match above page text with the words closer together", async () => {
        const ids = await bestMatch("garden planner");
        expect(ids.slice(0, 2)).toEqual([l.gardenTitle, l.gardenBody]);
      });

      it("keeps the ranking across pages", async () => {
        process.env.PAGINATION_TAKE_COUNT = "2";
        const paged = await bestMatch("organizer");

        process.env.PAGINATION_TAKE_COUNT = "50";
        const whole = await bestMatch("organizer");

        expect(paged).toEqual(whole);
      });
    });

    describe("date and name sorts with search text", () => {
      it("sort every match newest first, not each page", async () => {
        process.env.PAGINATION_TAKE_COUNT = "3";

        const ids = await asAlice({ searchQueryString: "organizer" });

        expect(ids.length).toBeGreaterThan(6);
        expect(ids).toEqual([...ids].sort((a, b) => b - a));
      });

      it("sort every match by name", async () => {
        process.env.PAGINATION_TAKE_COUNT = "3";

        const ids = await asAlice({
          sort: Sort.NameAZ,
          searchQueryString: "organizer",
        });
        const byName = await prisma.link.findMany({
          where: { id: { in: ids } },
          orderBy: { name: "asc" },
          select: { id: true },
        });

        expect(ids).toEqual(byName.map((found) => found.id));
      });

      it("cover the same links as best match", async () => {
        const newest = await asAlice({ searchQueryString: "file organizer" });
        const best = await searchAll({
          userId: alice.id,
          query: { sort: Sort.BestMatch, searchQueryString: "file organizer" },
        });

        expect(new Set(newest)).toEqual(new Set(best));
      });

      // Meilisearch hands back at most 1000 matches
      describe("when more than 1000 links match equally well", () => {
        let owner: { id: number };
        let older: { id: number; name: string }[];
        let newer: { id: number; name: string }[];

        // Created in one go, oldest first, so their ids follow the names' order
        const manyLinks = async (collectionKey: string, names: string[]) => {
          const before = await prisma.link.aggregate({ _max: { id: true } });
          await prisma.link.createMany({
            data: names.map((name, i) => ({
              name,
              url: `https://example.test/bulk-${unique()}-${i}`,
              description: "",
              textContent: "The same page text for every one of them.",
              collectionId: c[collectionKey],
              createdById: owner.id,
              collectionOrder: 0,
            })),
          });
          const created = await prisma.link.findMany({
            where: {
              collectionId: c[collectionKey],
              id: { gt: before._max.id ?? 0 },
            },
            orderBy: { id: "asc" },
            select: { id: true, name: true },
          });
          scope.ids.push(...created.map((found) => found.id));
          return created;
        };

        const names = (prefix: string, count: number) =>
          Array.from(
            { length: count },
            (_, i) => `zebra ${prefix}${String(i).padStart(4, "0")}`
          );

        const firstPage = async (sort: Sort, searchQueryString = "zebra") =>
          (
            (
              await searchLinks({
                userId: owner.id,
                query: { sort, searchQueryString },
              })
            ).data as any
          ).links as { id: number; name: string }[];

        beforeAll(async () => {
          owner = await user("zebras");
          await collection("zebras", owner.id);
          // Indexed before the newer ones, like links saved over time are
          older = await manyLinks("zebras", names("m", 1000));
          await index();
          newer = await manyLinks("zebras", [
            ...names("a", 100),
            ...names("z", 100),
          ]);
          await index();
        }, 180_000);

        it("lists the newest ones first with newest first", async () => {
          const newestFifty = [...newer]
            .reverse()
            .slice(0, 50)
            .map((found) => found.id);

          for (const q of ["zebra", "zebra OR qwxzvk"])
            expect(
              (await firstPage(Sort.DateNewestFirst, q)).map(
                (found) => found.id
              )
            ).toEqual(newestFifty);
        });

        it("lists the oldest ones first with oldest first", async () => {
          expect((await firstPage(Sort.DateOldestFirst))[0].id).toBe(
            older[0].id
          );
        });

        it("lists them from A or from Z with a name sort", async () => {
          for (const q of ["zebra", "zebra OR qwxzvk"]) {
            expect((await firstPage(Sort.NameAZ, q))[0].name).toBe(
              "zebra a0000"
            );
            expect((await firstPage(Sort.NameZA, q))[0].name).toBe(
              "zebra z0099"
            );
          }
        });

        it("pages through 1000 of them without repeating one", async () => {
          for (const sort of [Sort.DateNewestFirst, Sort.BestMatch]) {
            const ids = await searchAll({
              userId: owner.id,
              query: { sort, searchQueryString: "zebra" },
            });

            expect(ids.length).toBe(1000);
            expect(new Set(ids).size).toBe(1000);
          }
        });
      });
    });

    describe("matching", () => {
      it("needs every word, whatever their order", async () => {
        for (const q of ["file organizer", "organizer file"]) {
          const ids = await asAlice({ searchQueryString: q });

          expect(ids).toEqual(
            expect.arrayContaining([l.repo, l.weekly, l.shared])
          );
          expect(ids).not.toContain(l.small1);
          expect(ids).not.toContain(l.busy0);
        }
      });

      it("shows the closest links when none has every word", async () => {
        const ids = await asAlice({ searchQueryString: "organizer qzxvbnm" });

        expect(ids).toEqual(expect.arrayContaining([l.small1, l.repo]));
      });

      it("matches a quoted phrase exactly and in order", async () => {
        expect(
          await asAlice({ searchQueryString: '"synthesis resolves"' })
        ).toEqual([l.thesis]);
        expect(
          await asAlice({ searchQueryString: '"resolves synthesis"' })
        ).toEqual([]);
        expect(
          await asAlice({ searchQueryString: "resolves synthesis" })
        ).toEqual([l.thesis]);
      });
    });

    describe("searching inside a tag", () => {
      it("leaves out another owner's tag with the same name", async () => {
        const research = await prisma.tag.findFirstOrThrow({
          where: { name: "research", ownerId: alice.id },
        });

        expect(await asAlice({ searchQueryString: "composting" })).toEqual(
          expect.arrayContaining([l.aliceResearch, l.bobResearch])
        );
        expect(
          await asAlice({ tagId: research.id, searchQueryString: "composting" })
        ).toEqual([l.aliceResearch]);
      });

      it("finds nothing for a tag id that doesn't exist", async () => {
        expect(
          await asAlice({ tagId: 2147483647, searchQueryString: "organizer" })
        ).toEqual([]);
      });

      it("answers the same for another user's tag, whatever it's called", async () => {
        // Alice has a tag called "ai" too, on a link that matches
        const bobAi = await prisma.tag.findFirstOrThrow({
          where: { name: "ai", ownerId: bob.id },
        });
        const bobOther = await prisma.tag.create({
          data: { name: `plans ${unique()}`, ownerId: bob.id },
        });

        const answers = [];
        for (const tagId of [bobAi.id, bobOther.id, 2147483647])
          answers.push(
            await searchLinks({
              userId: alice.id,
              query: {
                sort: Sort.DateNewestFirst,
                tagId,
                searchQueryString: "organizer",
              },
            })
          );

        expect(answers[2].message).toBe("Nothing found.");
        expect(answers[0]).toEqual(answers[2]);
        expect(answers[1]).toEqual(answers[2]);
      });

      it("lets a member search inside the owner's tag in a shared collection", async () => {
        const bobResearch = await prisma.tag.findFirstOrThrow({
          where: { name: "research", ownerId: bob.id },
        });

        expect(
          await asAlice({
            tagId: bobResearch.id,
            searchQueryString: "composting",
          })
        ).toEqual([l.bobResearch]);
      });

      it("finds a link the AI tagger tagged after it was indexed", async () => {
        const owner = await user("ai-tags");
        await collection("aiTagged", owner.id);
        const saved = await link("compost", "aiTagged", owner.id, {
          name: "Hot compost in winter",
          textContent: "Turn the heap every week so it stays warm.",
        });
        // Tagging comes after preservation, which is also when a link is indexed
        await index();

        aiTags.next = ["Mulching"];
        await autoTagLink({ ...owner, aiTaggingMethod: "GENERATE" }, saved.id);
        await index();

        const tag = await prisma.tag.findFirstOrThrow({
          where: { name: "Mulching", ownerId: owner.id },
        });
        for (const query of [
          { tagId: tag.id, searchQueryString: "compost" },
          { searchQueryString: "tag:Mulching" },
        ])
          expect(
            await searchAll({
              userId: owner.id,
              query: { sort: Sort.DateNewestFirst, ...query },
            })
          ).toEqual([saved.id]);
      });
    });

    describe("public collection tag buttons", () => {
      it("find the tag's links, whatever the tag is called", async () => {
        const owner = await user("tag-buttons");
        await collection("tagButtons", owner.id, { isPublic: true });
        const tags = [
          "!important",
          "!(archived)",
          "Black AND White",
          "tea OR coffee",
          'say "hello"',
          "rock 'n' roll",
          "C:\\temp\\",
        ];
        for (let i = 0; i < tags.length; i++)
          await link(`tagButton${i}`, "tagButtons", owner.id, {
            name: `Tagged ${i}`,
            tags: [tags[i]],
          });
        await link("untagged", "tagButtons", owner.id, {
          name: "Grocery list",
        });
        await index();

        for (let i = 0; i < tags.length; i++)
          expect(
            await searchAll({
              publicOnly: true,
              query: {
                sort: Sort.DateNewestFirst,
                collectionId: c.tagButtons,
                searchQueryString: tagSearch(tags[i]),
              },
            })
          ).toEqual([l[`tagButton${i}`]]);
      });
    });

    describe("AND and OR", () => {
      const asSet = async (searchQueryString: string) =>
        new Set(await asAlice({ searchQueryString }));

      it("finds links matching either side of OR", async () => {
        expect(await asSet("garden OR composting")).toEqual(
          new Set([l.gardenTitle, l.gardenBody, l.aliceResearch, l.bobResearch])
        );
      });

      it("finds exactly what each side finds on its own", async () => {
        for (const sides of [
          ["garden", "composting"],
          ["organizer", "synthesis"],
          ["file organizer", "tag:home"],
          ["tag:research", "tag:ai"],
          ['"synthesis resolves"', "planner"],
        ]) {
          const union = new Set<number>();
          for (const side of sides)
            for (const id of await asAlice({ searchQueryString: side }))
              union.add(id);

          expect(
            await asSet(sides.map((side) => `(${side})`).join(" OR "))
          ).toEqual(union);
        }
      });

      it("binds OR tighter than AND", async () => {
        const pinnedHomeOrAi = [l.small1, l.small2];
        for (let i = 0; i < 8; i++) pinnedHomeOrAi.push(l[`busy${i}`]);

        expect(await asSet("tag:home OR tag:ai pinned:true")).toEqual(
          new Set(pinnedHomeOrAi)
        );
      });

      it("groups with parentheses", async () => {
        expect(await asSet("(garden OR composting) tag:research")).toEqual(
          new Set([l.aliceResearch, l.bobResearch])
        );
        expect(await asSet("tag:research (garden OR composting)")).toEqual(
          new Set([l.aliceResearch, l.bobResearch])
        );
      });

      it("treats AND like a space", async () => {
        expect(
          await asAlice({ searchQueryString: "garden AND planner" })
        ).toEqual(await asAlice({ searchQueryString: "garden planner" }));
      });

      it("ranks by match, then lists links matched by operators alone newest first", async () => {
        const ids = await searchAll({
          userId: alice.id,
          query: {
            sort: Sort.BestMatch,
            searchQueryString: "(garden planner) OR tag:research",
          },
        });

        expect(ids).toEqual([
          l.gardenTitle,
          l.gardenBody,
          l.bobResearch,
          l.aliceResearch,
        ]);
      });

      it("keeps the ranking across pages", async () => {
        const bestMatch = () =>
          searchAll({
            userId: alice.id,
            query: {
              sort: Sort.BestMatch,
              searchQueryString: "organizer OR synthesis OR tag:research",
            },
          });

        process.env.PAGINATION_TAKE_COUNT = "2";
        const paged = await bestMatch();
        process.env.PAGINATION_TAKE_COUNT = "50";
        const whole = await bestMatch();

        expect(paged).toEqual(whole);
        expect(paged.length).toBe(new Set(paged).size);
      });

      it("sorts every match newest first, not each page", async () => {
        process.env.PAGINATION_TAKE_COUNT = "3";

        const ids = await asAlice({
          searchQueryString: "organizer OR synthesis",
        });

        expect(ids).toEqual(expect.arrayContaining([l.thesis, l.small1]));
        expect(ids).toEqual([...ids].sort((a, b) => b - a));
      });

      it("never returns another user's private links", async () => {
        for (const q of [
          "secret OR organizer",
          "copy OR (file organizer)",
          "organizer OR !tag:zzz",
          "public:true OR organizer",
          "(roundup OR organizer) (public:true OR !pinned:true)",
          'tag:"x\\") OR (collectionOwnerId > 0" OR organizer',
          'organizer OR collection:"x\\" OR collectionOwnerId > 0 OR collectionName = \\"y"',
        ]) {
          const ids = await asAlice({ searchQueryString: q });
          expect(ids.length).toBeGreaterThan(0);
          expect(ids.filter((id) => hiddenFromAlice.includes(id))).toEqual([]);
        }
      });

      it("keeps a public collection search inside that collection", async () => {
        const ids = await searchAll({
          publicOnly: true,
          query: {
            sort: Sort.DateNewestFirst,
            collectionId: c.alicePublic,
            searchQueryString: "organizer OR roundup OR !tag:zzz",
          },
        });

        expect(new Set(ids)).toEqual(new Set([l.public1, l.public2]));
      });

      it("searches inside a collection, tag or pinned list", async () => {
        const home = await prisma.tag.findFirstOrThrow({
          where: { name: "home", ownerId: alice.id },
        });

        expect(
          new Set(
            await asAlice({
              collectionId: c.small,
              searchQueryString: "chores OR pantry OR thesis",
            })
          )
        ).toEqual(new Set([l.small1, l.small2]));
        expect(
          new Set(
            await asAlice({
              tagId: home.id,
              searchQueryString: "pantry OR photos OR thesis",
            })
          )
        ).toEqual(new Set([l.small2, l.photos]));
        expect(
          await asAlice({
            pinnedOnly: true,
            searchQueryString: "chores OR photos",
          })
        ).toEqual([l.small1]);
      });

      it("turns down a search with too many combinations", async () => {
        const result = await searchLinks({
          userId: alice.id,
          query: {
            sort: Sort.BestMatch,
            searchQueryString: "(a OR b) (c OR d) (e OR f) (g OR h) (i OR j)",
          },
        });

        expect(result.statusCode).toBe(400);
      });
    });

    describe("leaving out with !", () => {
      const asSet = async (searchQueryString: string) =>
        new Set(await asAlice({ searchQueryString }));

      // Alice's links and the ones shared with her, minus those with "organizer"
      // (exact word: "Organizing photos" stays)
      const withoutOrganizer = () => [
        l.photos,
        l.thesis,
        l.reversed,
        l.gardenTitle,
        l.gardenBody,
        l.aliceResearch,
        l.bobResearch,
      ];

      it("leaves out links with a word", async () => {
        const organizer = await asAlice({ searchQueryString: "organizer" });

        expect(await asSet("organizer !pantry")).toEqual(
          new Set(organizer.filter((id) => id !== l.small2))
        );
      });

      it("leaves out links with a phrase, not ones with the words apart", async () => {
        expect(
          await asAlice({
            searchQueryString: 'synthesis !"synthesis resolves"',
          })
        ).toEqual([l.reversed]);
      });

      it("lists every other link newest first when only leaving words out", async () => {
        process.env.PAGINATION_TAKE_COUNT = "3";

        for (const sort of [Sort.BestMatch, Sort.DateNewestFirst]) {
          const ids = await asAlice({ sort, searchQueryString: "!organizer" });

          expect(ids).toEqual([...withoutOrganizer()].sort((a, b) => b - a));
        }
      });

      it("leaves out a group", async () => {
        expect(await asSet("!(tag:home OR pantry)")).toEqual(
          new Set([
            l.repo,
            l.weekly,
            l.thesis,
            l.reversed,
            l.public1,
            l.public2,
            l.shared,
            l.gardenTitle,
            l.gardenBody,
            l.aliceResearch,
            l.bobResearch,
          ])
        );

        const everything = await asAlice({ searchQueryString: "!qzxvbnmzz" });
        const busy = Array.from({ length: 8 }, (_, i) => l[`busy${i}`]);
        expect(await asSet("!(organizer review)")).toEqual(
          new Set(everything.filter((id) => !busy.includes(id)))
        );
      });

      it("mixes with OR", async () => {
        expect(await asSet("composting OR !organizer")).toEqual(
          new Set(withoutOrganizer())
        );
        expect(await asSet("pantry OR !(organizer OR tag:research)")).toEqual(
          new Set([
            l.small2,
            l.photos,
            l.thesis,
            l.reversed,
            l.gardenTitle,
            l.gardenBody,
          ])
        );
      });

      it("never returns another user's private links", async () => {
        for (const q of [
          "!qzxvbnmzz",
          "!organizer",
          "!(organizer OR secret)",
          "!(!tag:ai)",
          "secret OR !copy",
          '!"x\\" OR collectionOwnerId > 0 OR name = \\"y"',
        ]) {
          const ids = await asAlice({ searchQueryString: q });
          expect(ids.length).toBeGreaterThan(0);
          expect(ids.filter((id) => hiddenFromAlice.includes(id))).toEqual([]);
        }
      });

      it("can't tell anything about a collection's owner", async () => {
        const owner = await prisma.user.findUniqueOrThrow({
          where: { id: bob.id },
        });
        const everything = await asSet("!qzxvbnmzz");

        for (const q of [
          `!${owner.username}`,
          `!"${owner.email}"`,
          `!(${owner.username} OR ${owner.email})`,
        ])
          expect(await asSet(q)).toEqual(everything);
      });

      it("keeps a public collection search inside that collection", async () => {
        const publicSearch = (searchQueryString: string) =>
          searchAll({
            publicOnly: true,
            query: {
              sort: Sort.DateNewestFirst,
              collectionId: c.alicePublic,
              searchQueryString,
            },
          });

        expect(await publicSearch("!more")).toEqual([l.public1]);
        expect(new Set(await publicSearch("!qzxvbnmzz"))).toEqual(
          new Set([l.public1, l.public2])
        );
      });
    });

    // Changes the index settings, so it runs last
    describe("before the worker makes collectionId filterable", () => {
      afterAll(async () => {
        const task = await meili
          .index("links")
          .updateFilterableAttributes([
            "collectionOwnerId",
            "collectionMemberIds",
            "collectionId",
            "collectionName",
            "tags",
            "pinnedBy",
            "url",
            "type",
            "name",
            "description",
            "collectionIsPublic",
            "creationTimestamp",
          ]);
        await meili.waitForTask(task.taskUid);
      });

      it("still searches inside a collection", async () => {
        const task = await meili
          .index("links")
          .updateFilterableAttributes([
            "collectionOwnerId",
            "collectionMemberIds",
            "collectionName",
            "tags",
            "pinnedBy",
            "collectionIsPublic",
            "creationTimestamp",
          ]);
        await meili.waitForTask(task.taskUid);

        const ids = await asAlice({
          collectionId: c.small,
          searchQueryString: "organizer",
        });

        expect(new Set(ids)).toEqual(new Set([l.small1, l.small2]));
        expect(
          new Set(
            await asAlice({
              collectionId: c.small,
              searchQueryString: "chores OR pantry OR thesis",
            })
          )
        ).toEqual(new Set([l.small1, l.small2]));
      });
    });
  }
);
