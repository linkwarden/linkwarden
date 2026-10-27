import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import searchLinks from "./searchLinks";
import { prisma } from "@linkwarden/prisma";

const { search } = vi.hoisted(() => ({
  search: vi.fn(),
}));

vi.mock("@linkwarden/lib/meilisearchClient", () => ({
  meiliClient: {
    index: vi.fn(() => ({ search })),
  },
}));

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    link: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/getAccessibleCollectionIds", () => ({
  default: vi.fn().mockResolvedValue({ accessibleCollectionIds: [1] }),
}));

const linkFields = [
  "name",
  "url",
  "description",
  "metaDescription",
  "textContent",
  "tags",
  "collectionName",
];

describe("searchLinks with Meilisearch", () => {
  beforeEach(() => {
    search.mockResolvedValue({ hits: [{ id: 10 }] });
    vi.mocked(prisma.link.findMany).mockResolvedValue([{ id: 10 }] as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("only matches public collection searches against the link's own fields", async () => {
    await searchLinks({
      query: {
        sort: 0,
        collectionId: 1,
        searchQueryString: '\\"alice@example.com\\"',
      } as any,
      publicOnly: true,
    });

    expect(search).toHaveBeenCalledTimes(1);
    const [query, params] = search.mock.calls[0];
    expect(query).toBe('"alice@example.com"');
    expect(params.filter).toEqual(["collectionIsPublic = true"]);
    expect(params.attributesToSearchOn).toEqual(linkFields);
  });

  it("only matches a user's searches against the link's own fields", async () => {
    await searchLinks({
      query: { sort: 0, searchQueryString: "alice tag:news" } as any,
      userId: 2,
    });

    const [query, params] = search.mock.calls[0];
    expect(query).toBe("alice");
    expect(params.attributesToSearchOn).toEqual(linkFields);
  });

  it("never matches against the stored collection object", async () => {
    await searchLinks({
      query: { sort: 0, collectionId: 1, searchQueryString: "alice" } as any,
      publicOnly: true,
    });

    const { attributesToSearchOn } = search.mock.calls[0][1];
    expect(attributesToSearchOn).toBeDefined();
    expect(
      attributesToSearchOn.filter(
        (field: string) => field === "collection" || field.startsWith("collection.")
      )
    ).toEqual([]);
  });

  it("still only reads link ids back from Meilisearch", async () => {
    await searchLinks({
      query: { sort: 0, searchQueryString: "alice" } as any,
      userId: 2,
    });

    expect(search.mock.calls[0][1].attributesToRetrieve).toEqual(["id"]);
  });
});
