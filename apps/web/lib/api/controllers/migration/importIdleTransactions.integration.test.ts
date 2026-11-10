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

// The importers run on a database that ends any session left idle inside a
// transaction for half a second (idle_in_transaction_session_timeout), as
// managed and pooled databases are often set up. The importers used to open a
// transaction, leave it idle while they wrote with the global client, and
// commit at the end, which such a database had closed by then: the Omnivore
// import then failed after saving every link.
//
// The limit is well above the moment Prisma keeps its own transaction open for
// a nested create, so only a transaction held across the import runs into it.
// Each link waits a little before it's added, so every import runs past it.
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
      "DATABASE_URL must be set to run integration tests for idle transactions."
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
      username: `import_idle_test_${suffix}`,
      email: `import_idle_test_${suffix}@example.com`,
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
  url.searchParams.set(
    "options",
    `-c idle_in_transaction_session_timeout=${IDLE_LIMIT_MS}`
  );

  const { PrismaClient } = await import("@prisma/client");
  prisma = new PrismaClient({ datasourceUrl: url.toString() }).$extends({
    query: {
      link: {
        // Outside any transaction Prisma opens for the create itself
        async create({ args, query }) {
          await new Promise((resolve) => setTimeout(resolve, LINK_DELAY_MS));
          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;
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
  vi.restoreAllMocks();

  const users = createdUserIds.splice(0, createdUserIds.length);
  for (const userId of users) {
    await cleanupUser(userId);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
  vi.doUnmock("@linkwarden/prisma");
});

const IDLE_LIMIT_MS = 500;
const LINK_DELAY_MS = 25;
// Enough links that adding them takes well past the limit
const COUNT = 40;
const day = (i: number) => new Date(Date.UTC(2020, 0, 1 + i));
const indexes = Array.from({ length: COUNT }, (_, i) => i);

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
${indexes
  .map(
    (i) =>
      `<DT><A HREF="https://example.com/${i}" ADD_DATE="${
        day(i).getTime() / 1000
      }">Link ${i}</A>`
  )
  .join("\n")}
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
              links: indexes.map((i) => ({
                url: `https://example.com/${i}`,
                name: `Link ${i}`,
                importDate: null,
                createdAt: day(i).toISOString(),
                tags: [],
              })),
            },
          ],
          pinnedLinks: [],
        })
      ),
  },
  {
    format: "a Wallabag export",
    run: (userId: number) =>
      importFromWallabag(
        userId,
        JSON.stringify(
          indexes.map((i) => ({
            url: `https://example.com/${i}`,
            title: `Link ${i}`,
            created_at: day(i).toISOString(),
            tags: [],
          }))
        )
      ),
  },
  {
    format: "an Omnivore export",
    run: (userId: number) =>
      importFromOmnivore(
        userId,
        JSON.stringify(
          indexes.map((i) => ({
            url: `https://example.com/${i}`,
            title: `Link ${i}`,
            savedAt: day(i).toISOString(),
            labels: [],
          }))
        )
      ),
  },
  {
    format: "a Pocket export",
    run: (userId: number) =>
      importFromPocket(
        userId,
        [
          "title,url,time_added,cursor,tags,status",
          ...indexes.map(
            (i) =>
              `Link ${i},https://example.com/${i},${
                day(i).getTime() / 1000
              },,,unread`
          ),
        ].join("\n")
      ),
  },
];

describe.sequential("imports on a database that ends idle transactions", () => {
  it.each(files)("saves every link of $format", async ({ run }) => {
    // What a failed import would log
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = await createTestUser();

    expect(await run(user.id)).toEqual({ response: "Success.", status: 200 });

    const links = await prisma.link.findMany({
      where: { createdById: user.id },
      orderBy: { id: "asc" },
      select: { name: true },
    });
    expect(links.map((link) => link.name)).toEqual(
      indexes.map((i) => `Link ${i}`)
    );
  });
});
