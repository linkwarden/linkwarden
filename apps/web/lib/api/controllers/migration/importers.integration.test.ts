import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { LinkRequestQuery, Sort } from "@linkwarden/types/global";

let prisma: typeof import("@linkwarden/prisma").prisma;
let removeFolder: typeof import("@linkwarden/filesystem").removeFolder;
let importFromLinkwarden: typeof import("./importFromLinkwarden").default;
let importFromWallabag: typeof import("./importFromWallabag").default;
let importFromOmnivore: typeof import("./importFromOmnivore").default;
let importFromPocket: typeof import("./importFromPocket").default;
let searchLinks: typeof import("../search/searchLinks").default;

const COLLECTION_ORDER_STEP = 65536;

const createdUserIds: number[] = [];

const ensureTestEnv = async () => {
  await import("dotenv/config");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests for the importers."
    );
  }

  vi.stubEnv("NODE_ENV", "test");
  process.env.STRIPE_SECRET_KEY = "";
  process.env.NEXT_PUBLIC_STRIPE = "false";
  process.env.NEXT_PUBLIC_REQUIRE_CC = "false";
  process.env.STORAGE_FOLDER = process.env.STORAGE_FOLDER || "data-test";

  delete process.env.MEILI_HOST;
  delete process.env.SPACES_ENDPOINT;
  delete process.env.SPACES_REGION;
  delete process.env.SPACES_KEY;
  delete process.env.SPACES_SECRET;
};

const createTestUser = async () => {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      username: `importers_test_${suffix}`,
      email: `importers_test_${suffix}@example.com`,
    },
  });

  createdUserIds.push(user.id);
  return user;
};

const cleanupUser = async (userId: number) => {
  const collections = await prisma.collection.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    return;
  }

  for (const { id } of collections) {
    await removeFolder({ filePath: `archives/${id}` });
  }
};

const linksById = (userId: number) =>
  prisma.link.findMany({
    where: { createdById: userId },
    orderBy: { id: "asc" },
    include: {
      tags: { orderBy: { name: "asc" } },
      collection: true,
      pinnedBy: { select: { id: true } },
    },
  });

// The date a link shows: the one from its file, or the moment it was added
const shownTime = (link: { importDate: Date | null; createdAt: Date }) =>
  (link.importDate ?? link.createdAt).getTime();

const daysAgo = (days: number) => new Date(Date.now() - days * 86400000);

// The urls a list of links shows, top to bottom
const listedUrls = async (userId: number, query: LinkRequestQuery) => {
  const { data } = await searchLinks({ query, userId });

  // Only a Meilisearch search answers with a bare array
  if (!("links" in data)) throw new Error("Expected a list of links");

  return data.links.map((link) => link.url);
};

beforeAll(async () => {
  await ensureTestEnv();

  const prismaModule = await import("@linkwarden/prisma");
  prisma = prismaModule.prisma;

  const filesystemModule = await import("@linkwarden/filesystem");
  removeFolder = filesystemModule.removeFolder;

  importFromLinkwarden = (await import("./importFromLinkwarden")).default;
  importFromWallabag = (await import("./importFromWallabag")).default;
  importFromOmnivore = (await import("./importFromOmnivore")).default;
  importFromPocket = (await import("./importFromPocket")).default;
  searchLinks = (await import("../search/searchLinks")).default;

  await prisma.$connect();
});

afterEach(async () => {
  const users = createdUserIds.splice(0, createdUserIds.length);
  for (const userId of users) {
    await cleanupUser(userId);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

type Entry = { url: string; date?: Date };

// Wallabag writes dates in its server's time zone, with the offset after the
// seconds and no colon in it: 2016-08-18T19:16:42+0200
const wallabagDate = (date: Date) =>
  new Date(date.getTime() + 2 * 3600000).toISOString().slice(0, 19) + "+0200";

// Each importer, fed a file that lists `entries` in the given order. Linkwarden
// backups always carry a date, so they only get dated entries.
const importers = [
  {
    format: "Linkwarden",
    datesOptional: false,
    run: (userId: number, entries: Entry[]) =>
      importFromLinkwarden(
        userId,
        JSON.stringify({
          collections: [
            {
              name: "Backup",
              links: entries.map((entry) => ({
                url: entry.url,
                name: entry.url,
                importDate: null,
                createdAt: entry.date?.toISOString(),
                tags: [],
              })),
            },
          ],
          pinnedLinks: [],
        })
      ),
  },
  {
    format: "Wallabag",
    datesOptional: true,
    run: (userId: number, entries: Entry[]) =>
      importFromWallabag(
        userId,
        JSON.stringify(
          entries.map((entry, i) => ({
            id: i + 1,
            url: entry.url,
            title: entry.url,
            created_at: entry.date && wallabagDate(entry.date),
            tags: [],
          }))
        )
      ),
  },
  {
    format: "Omnivore",
    datesOptional: true,
    run: (userId: number, entries: Entry[]) =>
      importFromOmnivore(
        userId,
        JSON.stringify(
          entries.map((entry) => ({
            url: entry.url,
            title: entry.url,
            savedAt: entry.date?.toISOString(),
            labels: [],
          }))
        )
      ),
  },
  {
    format: "Pocket",
    datesOptional: true,
    run: (userId: number, entries: Entry[]) =>
      importFromPocket(
        userId,
        [
          "title,url,time_added,cursor,tags,status",
          ...entries.map(
            (entry) =>
              `${entry.url},${entry.url},${
                entry.date ? entry.date.getTime() / 1000 : ""
              },,,unread`
          ),
        ].join("\n")
      ),
  },
];

// Whole seconds, since Pocket and Wallabag only have those
const at = (iso: string) => new Date(iso);

describe.sequential("importers integration", () => {
  describe.each(importers)("$format", ({ run, datesOptional }) => {
    it("adds links oldest first when the file lists the newest first", async () => {
      const user = await createTestUser();

      const result = await run(user.id, [
        { url: "https://example.com/2024", date: at("2024-04-01T10:00:00Z") },
        { url: "https://example.com/2023", date: at("2023-03-01T10:00:00Z") },
        { url: "https://example.com/2021", date: at("2021-01-01T10:00:00Z") },
        { url: "https://example.com/2022", date: at("2022-02-01T10:00:00Z") },
      ]);
      expect(result).toEqual({ response: "Success.", status: 200 });

      const links = await linksById(user.id);

      expect(links.map((link) => link.url)).toEqual([
        "https://example.com/2021",
        "https://example.com/2022",
        "https://example.com/2023",
        "https://example.com/2024",
      ]);
    });

    it("keeps the file's order for links with the same date", async () => {
      const user = await createTestUser();
      const date = at("2022-06-01T10:00:00Z");

      await run(user.id, [
        { url: "https://example.com/c", date },
        { url: "https://example.com/older", date: at("2020-06-01T10:00:00Z") },
        { url: "https://example.com/a", date },
        { url: "https://example.com/b", date },
      ]);

      const links = await linksById(user.id);

      expect(links.map((link) => link.url)).toEqual([
        "https://example.com/older",
        "https://example.com/c",
        "https://example.com/a",
        "https://example.com/b",
      ]);
    });

    it("lists the import by the dates it shows", async () => {
      const user = await createTestUser();

      await run(user.id, [
        { url: "https://example.com/new", date: daysAgo(1) },
        { url: "https://example.com/old", date: daysAgo(30) },
        { url: "https://example.com/mid", date: daysAgo(7) },
      ]);

      const [{ collectionId }] = await linksById(user.id);

      const list = (sort: Sort) => listedUrls(user.id, { sort, collectionId });

      const newestFirst = [
        "https://example.com/new",
        "https://example.com/mid",
        "https://example.com/old",
      ];

      expect(await list(Sort.DateNewestFirst)).toEqual(newestFirst);
      expect(await list(Sort.DateOldestFirst)).toEqual(
        [...newestFirst].reverse()
      );
      // A fresh import's custom order starts out the same as newest first
      expect(await list(Sort.Custom)).toEqual(newestFirst);
    });

    it.runIf(datesOptional)(
      "adds undated links as of the import, after past dates and before future ones",
      async () => {
        const user = await createTestUser();

        await run(user.id, [
          { url: "https://example.com/future", date: daysAgo(-1) },
          { url: "https://example.com/undated-1" },
          { url: "https://example.com/past", date: daysAgo(1) },
          { url: "https://example.com/undated-2" },
        ]);

        const links = await linksById(user.id);

        expect(links.map((link) => link.url)).toEqual([
          "https://example.com/past",
          "https://example.com/undated-1",
          "https://example.com/undated-2",
          "https://example.com/future",
        ]);
        expect(links.map((link) => link.id)).toEqual(
          [...links]
            .sort((a, b) => shownTime(a) - shownTime(b))
            .map((link) => link.id)
        );
      }
    );
  });

  describe("Linkwarden", () => {
    const backup = {
      collections: [
        {
          name: " Reading ",
          description: "Long reads",
          color: "#123456",
          links: [
            {
              url: "https://example.com/reading-newest",
              name: "Reading newest",
              description: "The newest one",
              importDate: null,
              createdAt: "2023-03-01T10:00:00.000Z",
              tags: [{ name: "news" }],
            },
            {
              url: "https://example.com/reading-mid",
              name: "Reading mid",
              description: "",
              // An import date wins over the date it was added
              importDate: "2022-06-01T10:00:00.000Z",
              createdAt: "2024-01-01T10:00:00.000Z",
              tags: [],
            },
            {
              url: "not a url",
              name: "Broken",
              importDate: null,
              createdAt: "2019-01-01T10:00:00.000Z",
              tags: [],
            },
            {
              url: "https://example.com/reading-oldest",
              name: "Reading oldest",
              importDate: null,
              createdAt: "2020-01-01T10:00:00.000Z",
              tags: [{ name: "news" }, { name: "tech" }],
            },
          ],
        },
        {
          name: "Recipes",
          description: "",
          color: "#654321",
          links: [
            {
              url: "https://example.com/recipes-newest",
              name: "Recipes newest",
              importDate: null,
              createdAt: "2023-06-01T10:00:00.000Z",
              tags: [{ name: "food" }],
            },
            {
              url: "https://example.com/recipes-oldest",
              name: "Recipes oldest",
              importDate: null,
              createdAt: "2021-01-01T10:00:00.000Z",
              tags: [],
            },
          ],
        },
      ],
      pinnedLinks: [{ url: "https://example.com/reading-mid" }],
    };

    it("imports every collection and link with its details", async () => {
      const user = await createTestUser();

      const result = await importFromLinkwarden(
        user.id,
        JSON.stringify(backup)
      );
      expect(result).toEqual({ response: "Success.", status: 200 });

      const collections = await prisma.collection.findMany({
        where: { ownerId: user.id },
        orderBy: { id: "asc" },
      });

      // Collections are still created in the order the backup lists them
      expect(
        collections.map(({ name, description, color, parentId }) => ({
          name,
          description,
          color,
          parentId,
        }))
      ).toEqual([
        {
          name: "Reading",
          description: "Long reads",
          color: "#123456",
          parentId: null,
        },
        { name: "Recipes", description: "", color: "#654321", parentId: null },
      ]);

      const links = await linksById(user.id);

      expect(
        links
          .map((link) => ({
            url: link.url,
            name: link.name,
            description: link.description,
            importDate: link.importDate?.toISOString(),
            collection: link.collection.name,
            tags: link.tags.map((tag) => tag.name),
          }))
          .sort((a, b) => a.url!.localeCompare(b.url!))
      ).toEqual([
        {
          url: "https://example.com/reading-mid",
          name: "Reading mid",
          description: "",
          importDate: "2022-06-01T10:00:00.000Z",
          collection: "Reading",
          tags: [],
        },
        {
          url: "https://example.com/reading-newest",
          name: "Reading newest",
          description: "The newest one",
          importDate: "2023-03-01T10:00:00.000Z",
          collection: "Reading",
          tags: ["news"],
        },
        {
          url: "https://example.com/reading-oldest",
          name: "Reading oldest",
          description: "",
          importDate: "2020-01-01T10:00:00.000Z",
          collection: "Reading",
          tags: ["news", "tech"],
        },
        {
          url: "https://example.com/recipes-newest",
          name: "Recipes newest",
          description: "",
          importDate: "2023-06-01T10:00:00.000Z",
          collection: "Recipes",
          tags: ["food"],
        },
        {
          url: "https://example.com/recipes-oldest",
          name: "Recipes oldest",
          description: "",
          importDate: "2021-01-01T10:00:00.000Z",
          collection: "Recipes",
          tags: [],
        },
      ]);

      // Each collection numbers its own links one step apart
      for (const collection of collections) {
        expect(
          links
            .filter((link) => link.collectionId === collection.id)
            .map((link) => link.collectionOrder)
            .sort((a, b) => a - b)
        ).toEqual(
          links
            .filter((link) => link.collectionId === collection.id)
            .map((_, i) => (i + 1) * COLLECTION_ORDER_STEP)
        );
      }

      const pinned = await prisma.link.findMany({
        where: { pinnedBy: { some: { id: user.id } } },
        select: { url: true },
      });
      expect(pinned.map((link) => link.url)).toEqual([
        "https://example.com/reading-mid",
      ]);
    });

    it("adds the links of every collection oldest first, so ids follow the dates across the backup", async () => {
      const user = await createTestUser();

      await importFromLinkwarden(user.id, JSON.stringify(backup));

      const links = await linksById(user.id);

      expect(links.map((link) => link.url)).toEqual([
        "https://example.com/reading-oldest",
        "https://example.com/recipes-oldest",
        "https://example.com/reading-mid",
        "https://example.com/reading-newest",
        "https://example.com/recipes-newest",
      ]);

      // And each collection's custom order puts its newest link on top
      for (const name of ["Reading", "Recipes"]) {
        const inCollection = links.filter(
          (link) => link.collection.name === name
        );
        expect(inCollection.map((link) => link.collectionOrder)).toEqual(
          inCollection.map((_, i) => (i + 1) * COLLECTION_ORDER_STEP)
        );
      }

      // All links, across both collections
      expect(await listedUrls(user.id, { sort: Sort.DateNewestFirst })).toEqual(
        [
          "https://example.com/recipes-newest",
          "https://example.com/reading-newest",
          "https://example.com/reading-mid",
          "https://example.com/recipes-oldest",
          "https://example.com/reading-oldest",
        ]
      );
    });
  });

  describe("Wallabag", () => {
    it("imports every entry with its details", async () => {
      const user = await createTestUser();

      const result = await importFromWallabag(
        user.id,
        JSON.stringify([
          {
            id: 2,
            url: "https://example.com/starred",
            title: "Starred",
            content: "<p>Starred content</p>",
            created_at: "2023-05-10T08:26:39+02:00",
            is_starred: 1,
            tags: ["news", "tech"],
          },
          {
            id: 3,
            url: "https://example.com/undated",
            title: "Undated",
            content: "",
            is_starred: 0,
            tags: [],
          },
          { id: 4, url: "", title: "No url", tags: [] },
          { id: 5, url: "not a url", title: "Broken", tags: [] },
          {
            id: 1,
            url: "https://example.com/plain",
            title: "Plain",
            content: "Plain content",
            created_at: "2021-05-10T08:26:39+02:00",
            is_starred: 0,
            tags: ["news"],
          },
        ])
      );
      expect(result).toEqual({ response: "Success.", status: 200 });

      const collections = await prisma.collection.findMany({
        where: { ownerId: user.id },
      });
      expect(collections.map((collection) => collection.name)).toEqual([
        "Imports",
      ]);

      const links = await linksById(user.id);

      expect(
        links
          .map((link) => ({
            url: link.url,
            name: link.name,
            textContent: link.textContent,
            importDate: link.importDate?.toISOString() ?? null,
            pinned: link.pinnedBy.length > 0,
            tags: link.tags.map((tag) => tag.name),
          }))
          .sort((a, b) => a.url!.localeCompare(b.url!))
      ).toEqual([
        {
          url: "https://example.com/plain",
          name: "Plain",
          textContent: "Plain content",
          importDate: "2021-05-10T06:26:39.000Z",
          pinned: false,
          tags: ["news"],
        },
        {
          url: "https://example.com/starred",
          name: "Starred",
          textContent: "<p>Starred content</p>",
          importDate: "2023-05-10T06:26:39.000Z",
          pinned: true,
          tags: ["news", "tech"],
        },
        {
          url: "https://example.com/undated",
          name: "Undated",
          textContent: "",
          importDate: null,
          pinned: false,
          tags: [],
        },
      ]);
    });

    it("reads dates the way a Wallabag export writes them", async () => {
      const user = await createTestUser();

      // Shaped like the entries of a real export, newest first
      const entry = (id: number, createdAt: string, isStarred: number) => ({
        is_archived: 0,
        is_starred: isStarred,
        tags: [],
        is_public: false,
        id,
        title: `Entry ${id}`,
        url: `https://example.com/entry-${id}`,
        content: `<p>Entry ${id}</p>`,
        created_at: createdAt,
        updated_at: createdAt,
        published_by: [],
        annotations: [],
        mimetype: "text/html; charset=utf-8",
        language: "en",
        reading_time: 1,
        domain_name: "example.com",
        preview_picture: null,
        http_status: "200",
        headers: {},
      });

      const result = await importFromWallabag(
        user.id,
        JSON.stringify([
          entry(3, "2023-05-10T08:26:39+0200", 1),
          entry(2, "2022-01-01T20:00:00-0530", 0),
          entry(1, "2021-05-10T08:26:39+0000", 0),
        ])
      );
      expect(result).toEqual({ response: "Success.", status: 200 });

      const links = await linksById(user.id);

      expect(
        links.map((link) => ({
          url: link.url,
          importDate: link.importDate?.toISOString(),
          pinned: link.pinnedBy.length > 0,
        }))
      ).toEqual([
        {
          url: "https://example.com/entry-1",
          importDate: "2021-05-10T08:26:39.000Z",
          pinned: false,
        },
        {
          url: "https://example.com/entry-2",
          importDate: "2022-01-02T01:30:00.000Z",
          pinned: false,
        },
        {
          url: "https://example.com/entry-3",
          importDate: "2023-05-10T06:26:39.000Z",
          pinned: true,
        },
      ]);
    });

    it("stores dates with a colon in the offset the same as when they were passed on as text", async () => {
      const user = await createTestUser();

      // Shapes of RFC 3339 the database client took as text, which is how
      // created_at was stored before it went through new Date()
      const dates: Record<string, string> = {
        "2016-08-18T19:16:42Z": "2016-08-18T19:16:42.000Z",
        "2016-08-18T19:16:42+02:00": "2016-08-18T17:16:42.000Z",
        "2016-08-18T19:16:42-00:00": "2016-08-18T19:16:42.000Z",
        "2016-08-18T19:16:42.123+05:30": "2016-08-18T13:46:42.123Z",
        "2016-08-18T19:16:42.123456Z": "2016-08-18T19:16:42.123Z",
        "2016-08-18 19:16:42-01:00": "2016-08-18T20:16:42.000Z",
        "2016-08-18t19:16:42z": "2016-08-18T19:16:42.000Z",
      };
      const createdAts = Object.keys(dates);

      const result = await importFromWallabag(
        user.id,
        JSON.stringify(
          createdAts.map((createdAt, i) => ({
            id: i + 1,
            url: `https://example.com/entry-${i + 1}`,
            title: createdAt,
            created_at: createdAt,
            tags: [],
          }))
        )
      );
      expect(result).toEqual({ response: "Success.", status: 200 });

      const links = await linksById(user.id);

      expect(
        Object.fromEntries(
          links.map((link) => [link.name, link.importDate?.toISOString()])
        )
      ).toEqual(dates);
    });
  });

  describe("Omnivore", () => {
    it("imports every item with its details", async () => {
      const user = await createTestUser();

      const result = await importFromOmnivore(
        user.id,
        JSON.stringify([
          {
            url: "https://example.com/labelled",
            title: "Labelled",
            description: "With labels",
            thumbnail: "https://example.com/thumb.png",
            labels: ["news", "tech"],
            savedAt: "2024-02-01T10:00:00.000Z",
          },
          { url: "", title: "No url" },
          {
            url: "https://example.com/undated",
            title: "Undated",
          },
          {
            url: "https://example.com/plain",
            title: "Plain",
            description: "",
            labels: [],
            savedAt: "2022-02-01T10:00:00.000Z",
          },
        ])
      );
      expect(result).toEqual({ response: "Success.", status: 200 });

      const collections = await prisma.collection.findMany({
        where: { ownerId: user.id },
      });
      expect(collections.map((collection) => collection.name)).toEqual([
        "Omnivore Imports",
      ]);

      const links = await linksById(user.id);

      expect(
        links
          .map((link) => ({
            url: link.url,
            name: link.name,
            description: link.description,
            image: link.image,
            importDate: link.importDate?.toISOString() ?? null,
            tags: link.tags.map((tag) => tag.name),
          }))
          .sort((a, b) => a.url!.localeCompare(b.url!))
      ).toEqual([
        {
          url: "https://example.com/labelled",
          name: "Labelled",
          description: "With labels",
          image: "https://example.com/thumb.png",
          importDate: "2024-02-01T10:00:00.000Z",
          tags: ["news", "tech"],
        },
        {
          url: "https://example.com/plain",
          name: "Plain",
          description: "",
          image: "",
          importDate: "2022-02-01T10:00:00.000Z",
          tags: [],
        },
        {
          url: "https://example.com/undated",
          name: "Undated",
          description: "",
          image: "",
          importDate: null,
          tags: [],
        },
      ]);
    });
  });

  describe("Pocket", () => {
    it("imports every row with its details", async () => {
      const user = await createTestUser();

      const result = await importFromPocket(
        user.id,
        [
          "title,url,time_added,cursor,tags,status",
          "Tagged,https://example.com/tagged,1700000000,,news|tech,unread",
          "No url,,1600000000,,,unread",
          "Undated,https://example.com/undated,,,,archive",
          "Plain,https://example.com/plain,1500000000,,,unread",
        ].join("\n")
      );
      expect(result).toEqual({ response: "Success.", status: 200 });

      const collections = await prisma.collection.findMany({
        where: { ownerId: user.id },
      });
      expect(collections.map((collection) => collection.name)).toEqual([
        "Imports",
      ]);

      const links = await linksById(user.id);

      expect(
        links
          .map((link) => ({
            url: link.url,
            name: link.name,
            importDate: link.importDate?.toISOString() ?? null,
            tags: link.tags.map((tag) => tag.name),
          }))
          .sort((a, b) => a.url!.localeCompare(b.url!))
      ).toEqual([
        {
          url: "https://example.com/plain",
          name: "Plain",
          importDate: new Date(1500000000 * 1000).toISOString(),
          tags: [],
        },
        {
          url: "https://example.com/tagged",
          name: "Tagged",
          importDate: new Date(1700000000 * 1000).toISOString(),
          tags: ["news", "tech"],
        },
        {
          url: "https://example.com/undated",
          name: "Undated",
          importDate: null,
          tags: [],
        },
      ]);
    });
  });
});
