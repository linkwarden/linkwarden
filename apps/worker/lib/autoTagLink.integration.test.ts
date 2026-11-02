import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { AiTaggingMethod } from "@linkwarden/prisma/client";
import { prisma } from "@linkwarden/prisma";
import autoTagLink from "./autoTagLink";

// The model's answer is made up here, so nothing is sent anywhere
const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock("ai", () => ({ generateText }));

const createdUserIds: number[] = [];

const ensureTestEnv = async () => {
  await import("dotenv/config");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests for autoTagLink."
    );
  }

  vi.stubEnv("NODE_ENV", "test");
  // Picks a provider, which is never called
  vi.stubEnv("OPENAI_API_KEY", "test");
  vi.stubEnv("OPENAI_MODEL", "test");
};

beforeAll(async () => {
  await ensureTestEnv();
  await prisma.$connect();
});

afterEach(async () => {
  for (const id of createdUserIds.splice(0, createdUserIds.length)) {
    await prisma.user.delete({ where: { id } }).catch(() => {});
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe.sequential("autoTagLink integration", () => {
  it("saves a generated tag whose 50-character cut lands in an emoji", async () => {
    const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const user = await prisma.user.create({
      data: {
        username: `auto_tag_test_${suffix}`,
        email: `auto_tag_test_${suffix}@example.com`,
        aiTaggingMethod: AiTaggingMethod.GENERATE,
      },
    });
    createdUserIds.push(user.id);

    const collection = await prisma.collection.create({
      data: { name: "Tagging test", ownerId: user.id, createdById: user.id },
    });
    const link = await prisma.link.create({
      data: {
        url: "https://example.com/article",
        name: "Article",
        metaDescription: "An article",
        collectionId: collection.id,
        createdById: user.id,
        collectionOrder: 1,
      },
    });

    // An emoji is two UTF-16 units, so a plain cut at 50 keeps half of it,
    // which the database refuses
    generateText.mockResolvedValue({
      text: JSON.stringify(["a".repeat(49) + "😀", "Plain"]),
    });

    await autoTagLink(user, link.id);

    const saved = await prisma.link.findUniqueOrThrow({
      where: { id: link.id },
      include: { tags: { orderBy: { name: "asc" } } },
    });
    expect(saved.tags.map((tag) => [tag.name, tag.aiGenerated])).toEqual([
      ["A" + "a".repeat(48), true],
      ["Plain", true],
    ]);
    expect(saved.aiTagged).toBe(true);
  });
});
