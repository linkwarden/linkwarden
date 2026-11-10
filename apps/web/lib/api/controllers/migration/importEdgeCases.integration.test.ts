import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// Files the importers get that no current export writes: backups from older
// Linkwarden versions, backups written by hand or by other tools, and text the
// database refuses

let prisma: typeof import("@linkwarden/prisma").prisma;
let removeFolder: typeof import("@linkwarden/filesystem").removeFolder;
let importFromLinkwarden: typeof import("./importFromLinkwarden").default;
let importFromWallabag: typeof import("./importFromWallabag").default;
let importFromOmnivore: typeof import("./importFromOmnivore").default;
let exportData: typeof import("./exportData").default;

const createdUserIds: number[] = [];

const ensureTestEnv = async () => {
  await import("dotenv/config");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests for import edge cases."
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
      username: `import_edge_test_${suffix}`,
      email: `import_edge_test_${suffix}@example.com`,
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

// A link the way a backup lists it
const backupLink = (name: string, createdAt: string, extra: object = {}) => ({
  url: `https://example.com/${name}`,
  name,
  description: "",
  importDate: null,
  createdAt,
  tags: [],
  ...extra,
});

beforeAll(async () => {
  await ensureTestEnv();

  const prismaModule = await import("@linkwarden/prisma");
  prisma = prismaModule.prisma;

  const filesystemModule = await import("@linkwarden/filesystem");
  removeFolder = filesystemModule.removeFolder;

  importFromLinkwarden = (await import("./importFromLinkwarden")).default;
  importFromWallabag = (await import("./importFromWallabag")).default;
  importFromOmnivore = (await import("./importFromOmnivore")).default;
  exportData = (await import("./exportData")).default;

  await prisma.$connect();
});

afterEach(async () => {
  vi.restoreAllMocks();

  const users = createdUserIds.splice(0, createdUserIds.length);
  for (const userId of users) {
    await cleanupUser(userId);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe.sequential("import edge cases integration", () => {
  describe("Linkwarden backups from older versions", () => {
    // Before 2.5.0 (February 2024), exportData listed no pins and took every id
    // out, and links had no importDate until March 2024. The importer reads the
    // pins after adding the first link, so a backup without them stops there.
    // It used to answer "Success." with that one link, and now says it stopped
    // after one. Fails until the importer takes a backup without pins.
    it.fails(
      "restores every link of a backup written before 2.5.0, which lists no pins",
      async () => {
        const source = await createTestUser();
        const reading = await prisma.collection.create({
          data: { name: "Reading", ownerId: source.id, createdById: source.id },
        });

        let order = 0;
        for (const [name, createdAt] of [
          ["Reading 2023", "2023-11-01T10:00:00.000Z"],
          ["Reading 2021", "2021-06-01T10:00:00.000Z"],
          ["Reading 2022", "2022-01-01T10:00:00.000Z"],
        ]) {
          await prisma.link.create({
            data: {
              url: `https://example.com/${name.replace(" ", "-")}`,
              name,
              collectionId: reading.id,
              createdById: source.id,
              collectionOrder: (order += 65536),
              createdAt: new Date(createdAt),
            },
          });
        }

        const backup = (await exportData(source.id)).response as any;

        // What exportData wrote before 2.5.0
        delete backup.pinnedLinks;
        delete backup.whitelistedUsers;
        const redact = (value: unknown) => {
          if (Array.isArray(value)) value.forEach(redact);
          else if (value && typeof value === "object") {
            delete (value as Record<string, unknown>).id;
            delete (value as Record<string, unknown>).importDate;
            Object.values(value).forEach(redact);
          }
        };
        redact(backup);
        expect(JSON.stringify(backup)).not.toMatch(
          /"(id|importDate|pinnedLinks)"/
        );

        const target = await createTestUser();
        const result = await importFromLinkwarden(
          target.id,
          JSON.stringify(backup)
        );

        expect(result).toEqual({ response: "Success.", status: 200 });
        expect((await linksById(target.id)).map((link) => link.name)).toEqual([
          "Reading 2021",
          "Reading 2022",
          "Reading 2023",
        ]);
      }
    );
  });

  describe("backups written by hand or by other tools", () => {
    // The importer creates every collection before adding any link, so a
    // collection it can't read stops the import before a single link is added.
    // It used to add links collection by collection, keeping the links of the
    // ones listed before it (and answering "Success."). exportData never writes
    // these. Fails while such an import adds no links.
    it.fails.each([
      { field: "a name that's empty", collection: { name: null } },
      {
        field: "a description that's a number",
        collection: { name: "Bad", description: 5 },
      },
      {
        field: "a color that's a number",
        collection: { name: "Bad", color: 7 },
      },
    ])(
      "keeps the links of the collections listed before one with $field",
      async ({ collection }) => {
        const user = await createTestUser();

        await importFromLinkwarden(
          user.id,
          JSON.stringify({
            collections: [
              {
                name: "First",
                links: [backupLink("first-2021", "2021-03-01T10:00:00.000Z")],
              },
              {
                ...collection,
                links: [backupLink("bad-2022", "2022-03-01T10:00:00.000Z")],
              },
              {
                name: "Third",
                links: [backupLink("third-2020", "2020-03-01T10:00:00.000Z")],
              },
            ],
            pinnedLinks: [],
          })
        );

        const names = (await linksById(user.id)).map((link) => link.name);
        expect(names).toContain("first-2021");
      }
    );

    // The pins are read with .some(pin => pin.url ...), which throws on a null
    // entry after the first link. They used to be read with forEach(async ...),
    // which turned the same error into an unhandled rejection and went on to
    // add every link. exportData never writes a null pin. Fails while such an
    // import stops after one link.
    it.fails(
      "imports every link of a backup with an empty entry among its pins",
      async () => {
        const user = await createTestUser();

        const result = await importFromLinkwarden(
          user.id,
          JSON.stringify({
            collections: [
              {
                name: "Reading",
                links: [
                  backupLink("a-2021", "2021-03-01T10:00:00.000Z"),
                  backupLink("b-2022", "2022-03-01T10:00:00.000Z"),
                  backupLink("c-2020", "2020-03-01T10:00:00.000Z"),
                ],
              },
            ],
            pinnedLinks: [null, { url: "https://example.com/b-2022" }],
          })
        );

        expect(result).toEqual({ response: "Success.", status: 200 });

        const links = await linksById(user.id);
        expect(
          links.map((link) => [link.name, link.pinnedBy.length > 0])
        ).toEqual([
          ["c-2020", false],
          ["a-2021", false],
          ["b-2022", true],
        ]);
      }
    );

    // A link the importer can't read stops the import there, as it always has.
    // Links go in oldest first, so the ones saved are the ones dated before it
    // (they used to be the ones listed before it), and the import says so
    // instead of answering "Success."
    it("stops at a link it can't read, after every link dated before it, and says how many it added", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const user = await createTestUser();

      const result = await importFromLinkwarden(
        user.id,
        JSON.stringify({
          collections: [
            {
              name: "Reading",
              links: [
                backupLink("newest-2022", "2022-03-01T10:00:00.000Z"),
                // No tags list at all, which exportData always writes
                {
                  ...backupLink("no-tags-2021", "2021-03-01T10:00:00.000Z"),
                  tags: undefined,
                },
                backupLink("oldest-2020", "2020-03-01T10:00:00.000Z"),
              ],
            },
          ],
          pinnedLinks: [],
        })
      );

      expect(result).toEqual({
        response: "The import stopped after adding 1 of 3 links.",
        status: 500,
      });
      expect((await linksById(user.id)).map((link) => link.name)).toEqual([
        "oldest-2020",
      ]);
    });
  });

  describe("text the database refuses", () => {
    // Postgres can't store a NUL character in text. A Wallabag instance on
    // MySQL or SQLite can, so its export may carry one in an article's content.
    // The import stops at that entry and says how many entries it added.
    it("stops at a Wallabag entry whose content has a NUL character and says how many it added", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const user = await createTestUser();

      const result = await importFromWallabag(
        user.id,
        JSON.stringify([
          {
            url: "https://example.com/nul-2023",
            title: "Nul 2023",
            content: "<p>before\u0000after</p>",
            created_at: "2023-03-01T10:00:00+0200",
            tags: [],
          },
          {
            url: "https://example.com/fine-2021",
            title: "Fine 2021",
            content: "<p>fine</p>",
            created_at: "2021-03-01T10:00:00+0200",
            tags: [],
          },
          {
            url: "https://example.com/fine-2024",
            title: "Fine 2024",
            created_at: "2024-03-01T10:00:00+0200",
            tags: [],
          },
        ])
      );

      expect(result).toEqual({
        response: "The import stopped after adding 1 of 3 links.",
        status: 500,
      });
      expect((await linksById(user.id)).map((link) => link.name)).toEqual([
        "Fine 2021",
      ]);
    });

    // A title that already ends in half an emoji, as an app that cut its own
    // titles with .slice() could export. shortenText leaves the half out even
    // when nothing needs cutting, so the item saves. Cut with .slice(), it made
    // the database client refuse the write and the Omnivore import fail there.
    it("saves an Omnivore item whose title ends in half an emoji", async () => {
      const user = await createTestUser();

      const result = await importFromOmnivore(
        user.id,
        '[{"url":"https://example.com/half","title":"Half \\ud83d","savedAt":"2021-03-01T10:00:00.000Z","labels":["half \\ud83d"]},' +
          '{"url":"https://example.com/whole","title":"Whole","savedAt":"2022-03-01T10:00:00.000Z","labels":[]}]'
      );

      expect(result).toEqual({ response: "Success.", status: 200 });
      // The text is trimmed before the half is left out, hence the spaces
      expect(
        (await linksById(user.id)).map((link) => [
          link.name,
          link.tags.map((tag) => tag.name),
        ])
      ).toEqual([
        ["Half ", ["half "]],
        ["Whole", []],
      ]);
    });
  });
});
