import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { PrismaClient } from "@prisma/client";

// The importers run on a database client with a single connection, the way
// small and serverless databases are often set up (connection_limit=1)
let prisma: PrismaClient;
let removeFolder: typeof import("@linkwarden/filesystem").removeFolder;
let importFromHTMLFile: typeof import("./importFromHTMLFile").default;
let importFromLinkwarden: typeof import("./importFromLinkwarden").default;
let importFromWallabag: typeof import("./importFromWallabag").default;
let importFromOmnivore: typeof import("./importFromOmnivore").default;
let importFromPocket: typeof import("./importFromPocket").default;

const createdUserIds: number[] = [];

const ensureTestEnv = async () => {
  await import("dotenv/config");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests for import connections."
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
      username: `import_connections_test_${suffix}`,
      email: `import_connections_test_${suffix}@example.com`,
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

beforeAll(async () => {
  await ensureTestEnv();

  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set("connection_limit", "1");
  // Gives up after 2 seconds instead of 10 when no connection frees up
  url.searchParams.set("pool_timeout", "2");

  const { PrismaClient } = await import("@prisma/client");
  prisma = new PrismaClient({ datasourceUrl: url.toString() });
  vi.doMock("@linkwarden/prisma", () => ({ prisma }));

  const filesystemModule = await import("@linkwarden/filesystem");
  removeFolder = filesystemModule.removeFolder;

  importFromHTMLFile = (await import("./importFromHTMLFile")).default;
  importFromLinkwarden = (await import("./importFromLinkwarden")).default;
  importFromWallabag = (await import("./importFromWallabag")).default;
  importFromOmnivore = (await import("./importFromOmnivore")).default;
  importFromPocket = (await import("./importFromPocket")).default;

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
  vi.doUnmock("@linkwarden/prisma");
});

// Each file lists a link from 2023 tagged "news", then one from 2021
const files = [
  {
    format: "a bookmarks file",
    run: (userId: number) =>
      importFromHTMLFile(
        userId,
        `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
<DT><H3>Bookmarks</H3>
<DL><p>
<DT><A HREF="https://example.com/new" ADD_DATE="1677664800" TAGS="news">New</A>
<DT><A HREF="https://example.com/old" ADD_DATE="1614592800">Old</A>
</DL><p>
</DL><p>`
      ),
  },
  {
    format: "a Linkwarden backup",
    run: (userId: number) =>
      importFromLinkwarden(
        userId,
        JSON.stringify({
          collections: [
            {
              name: "Backup",
              links: [
                {
                  url: "https://example.com/new",
                  name: "New",
                  importDate: null,
                  createdAt: "2023-03-01T10:00:00.000Z",
                  tags: [{ name: "news" }],
                },
                {
                  url: "https://example.com/old",
                  name: "Old",
                  importDate: null,
                  createdAt: "2021-03-01T10:00:00.000Z",
                  tags: [],
                },
              ],
            },
          ],
          pinnedLinks: [{ url: "https://example.com/new" }],
        })
      ),
  },
  {
    format: "a Wallabag export",
    run: (userId: number) =>
      importFromWallabag(
        userId,
        JSON.stringify([
          {
            id: 2,
            url: "https://example.com/new",
            title: "New",
            created_at: "2023-03-01T10:00:00+0200",
            tags: ["news"],
            is_starred: 1,
          },
          {
            id: 1,
            url: "https://example.com/old",
            title: "Old",
            created_at: "2021-03-01T10:00:00+0200",
            tags: [],
          },
        ])
      ),
  },
  {
    format: "an Omnivore export",
    run: (userId: number) =>
      importFromOmnivore(
        userId,
        JSON.stringify([
          {
            url: "https://example.com/new",
            title: "New",
            savedAt: "2023-03-01T10:00:00.000Z",
            labels: ["news"],
          },
          {
            url: "https://example.com/old",
            title: "Old",
            savedAt: "2021-03-01T10:00:00.000Z",
            labels: [],
          },
        ])
      ),
  },
  {
    format: "a Pocket export",
    run: (userId: number) =>
      importFromPocket(
        userId,
        [
          "title,url,time_added,cursor,tags,status",
          "New,https://example.com/new,1677664800,,news,unread",
          "Old,https://example.com/old,1614592800,,,unread",
        ].join("\n")
      ),
  },
];

describe.sequential("imports on a single database connection", () => {
  it.each(files)("saves every link of $format", async ({ run }) => {
    const user = await createTestUser();

    expect(await run(user.id)).toEqual({ response: "Success.", status: 200 });

    const links = await prisma.link.findMany({
      where: { createdById: user.id },
      orderBy: { id: "asc" },
      include: { tags: true },
    });

    expect(
      links.map((link) => [link.name, link.tags.map((tag) => tag.name)])
    ).toEqual([
      ["Old", []],
      ["New", ["news"]],
    ]);
  });

  it.each(files.slice(1, 3))("pins what $format pins", async ({ run }) => {
    const user = await createTestUser();

    await run(user.id);

    const pinned = await prisma.link.findMany({
      where: { pinnedBy: { some: { id: user.id } } },
      select: { name: true },
    });
    expect(pinned).toEqual([{ name: "New" }]);
  });
});
