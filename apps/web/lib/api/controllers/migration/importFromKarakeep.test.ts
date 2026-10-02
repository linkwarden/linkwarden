import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

let prisma: typeof import("@linkwarden/prisma").prisma;
let importFromKarakeep: typeof import("./importFromKarakeep").default;
let removeFolder: typeof import("@linkwarden/filesystem").removeFolder;

const createdUserIds: number[] = [];

const ensureTestEnv = async () => {
  await import("dotenv/config");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests for importFromKarakeep."
    );
  }

  vi.stubEnv("NODE_ENV", "test");
  process.env.STRIPE_SECRET_KEY = "";
  process.env.NEXT_PUBLIC_STRIPE = "false";
  process.env.NEXT_PUBLIC_REQUIRE_CC = "false";
  process.env.MAX_LINKS_PER_USER = process.env.MAX_LINKS_PER_USER || "5";
  process.env.STORAGE_FOLDER = process.env.STORAGE_FOLDER || "data-test";

  delete process.env.SPACES_ENDPOINT;
  delete process.env.SPACES_REGION;
  delete process.env.SPACES_KEY;
  delete process.env.SPACES_SECRET;
};

const createTestUser = async () => {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      username: `import_test_${suffix}`,
      email: `import_test_${suffix}@example.com`,
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

  const prismaModule = await import("@linkwarden/prisma");
  prisma = prismaModule.prisma;

  const filesystemModule = await import("@linkwarden/filesystem");
  removeFolder = filesystemModule.removeFolder;

  importFromKarakeep = (await import("./importFromKarakeep")).default;

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

describe.sequential("importFromKarakeep integration", () => {
  it("imports lists as nested collections and links with tags, note and date", async () => {
    const user = await createTestUser();

    const backup = {
      bookmarks: [
        {
          createdAt: 1700000000,
          title: "Soup",
          tags: ["food", " food ", "food"],
          lists: ["desserts-id", "recipes-id"],
          content: { type: "link", url: "https://example.com/soup" },
          note: "Try with bread",
          archived: true,
        },
        {
          createdAt: 1700000100,
          title: null,
          tags: [],
          lists: ["smart-id"],
          content: { type: "link", url: "https://example.com/loose" },
          note: null,
          archived: false,
        },
        {
          createdAt: 1700000200,
          title: "A text note",
          tags: ["food"],
          lists: [],
          content: { type: "text", text: "Just some text" },
          note: null,
          archived: false,
        },
        {
          createdAt: 1700000300,
          title: "Broken",
          tags: [],
          lists: [],
          content: { type: "link", url: "not a url" },
          note: null,
          archived: false,
        },
      ],
      lists: [
        {
          id: "desserts-id",
          name: "Desserts",
          description: null,
          icon: "🍰",
          type: "manual",
          query: null,
          parentId: "recipes-id",
        },
        {
          id: "recipes-id",
          name: "Recipes",
          description: "Things to cook",
          icon: "🍲",
          type: "manual",
          query: null,
          parentId: null,
        },
        {
          id: "smart-id",
          name: "Favourites",
          description: null,
          icon: "⭐",
          type: "smart",
          query: "is:fav",
          parentId: null,
        },
      ],
    };

    const result = await importFromKarakeep(user.id, JSON.stringify(backup));
    expect(result).toEqual({ response: "Success.", status: 200 });

    const collections = await prisma.collection.findMany({
      where: { ownerId: user.id },
    });

    const recipes = collections.find((e) => e.name === "Recipes");
    const desserts = collections.find((e) => e.name === "Desserts");
    const fallback = collections.find((e) => e.name === "Karakeep Imports");

    expect(collections).toHaveLength(3);
    expect(recipes?.parentId).toBeNull();
    expect(recipes?.description).toBe("Things to cook");
    expect(desserts?.parentId).toBe(recipes?.id);

    const links = await prisma.link.findMany({
      where: { createdById: user.id },
      include: { tags: true },
    });

    expect(links).toHaveLength(2);

    const soup = links.find((e) => e.url === "https://example.com/soup");
    expect(soup?.collectionId).toBe(desserts?.id);
    expect(soup?.name).toBe("Soup");
    expect(soup?.description).toBe("Try with bread");
    expect(soup?.importDate?.toISOString()).toBe(
      new Date(1700000000 * 1000).toISOString()
    );
    expect(soup?.tags.map((tag) => tag.name)).toEqual(["food"]);

    const loose = links.find((e) => e.url === "https://example.com/loose");
    expect(loose?.collectionId).toBe(fallback?.id);
    expect(loose?.name).toBe("");
  });

  it("rejects a file that is not a Karakeep export", async () => {
    const user = await createTestUser();

    const result = await importFromKarakeep(user.id, JSON.stringify([]));

    expect(result).toEqual({
      response: "Invalid Karakeep export file.",
      status: 400,
    });
  });
});
