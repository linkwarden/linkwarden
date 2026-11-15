import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Sort } from "@linkwarden/types/global";
import tagSearch from "@/lib/client/tagSearch";

// Runs against a real database (DATABASE_URL), without Meilisearch, where
// searches look for the typed text in the database instead.

vi.mock("@linkwarden/lib/meilisearchClient", () => ({
  meiliClient: null,
}));

let prisma: typeof import("@linkwarden/prisma").prisma;
let searchLinks: typeof import("./searchLinks").default;

const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

describe("searchLinks without Meilisearch", () => {
  let ownerId: number;
  let collectionId: number;
  const tags = [
    "news",
    "!important",
    "Black AND White",
    'say "hello"',
    "rock 'n' roll",
  ];
  const tagged: number[] = [];
  let untagged: number;

  const search = async (searchQueryString: string) => {
    const result = await searchLinks({
      publicOnly: true,
      query: { sort: Sort.DateNewestFirst, collectionId, searchQueryString },
    });
    return ((result.data as any).links as { id: number }[]).map(
      (link) => link.id
    );
  };

  beforeAll(async () => {
    ({ prisma } = await import("@linkwarden/prisma"));
    searchLinks = (await import("./searchLinks")).default;

    const owner = await prisma.user.create({
      data: {
        username: `fallback-${unique()}`,
        email: `fallback-${unique()}@lab.test`,
      },
    });
    ownerId = owner.id;
    collectionId = (
      await prisma.collection.create({
        data: {
          name: "Public",
          ownerId,
          createdById: ownerId,
          isPublic: true,
        },
      })
    ).id;

    for (let i = 0; i < tags.length; i++)
      tagged.push(
        (
          await prisma.link.create({
            data: {
              name: `Tagged ${i}`,
              url: `https://example.test/tagged-${i}`,
              collectionId,
              createdById: ownerId,
              collectionOrder: i,
              tags: { create: { name: tags[i], ownerId } },
            },
          })
        ).id
      );
    untagged = (
      await prisma.link.create({
        data: {
          name: "Grocery list",
          url: "https://example.test/groceries",
          collectionId,
          createdById: ownerId,
          collectionOrder: tags.length,
        },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: ownerId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("finds a tag button's links like a search for the tag's name", async () => {
    for (let i = 0; i < tags.length; i++) {
      const found = await search(tagSearch(tags[i]));
      expect(found).toEqual(await search(tags[i]));
      expect(found).toContain(tagged[i]);
      expect(found).not.toContain(untagged);
    }
  });

  it("searches text in double quotes for what's inside them", async () => {
    expect(await search('"Grocery"')).toEqual([untagged]);
    expect(await search('"Grocery" list')).toEqual([]);
  });
});
