import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import searchLinks from "./searchLinks";
import { prisma } from "@linkwarden/prisma";
import { Sort } from "@linkwarden/types/global";

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
    tag: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/getAccessibleCollectionIds", () => ({
  default: vi.fn().mockResolvedValue({
    accessibleCollectionIds: [1, 5],
    memberCollectionIds: [5],
  }),
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
    expect(params.filter).toEqual([
      "collectionIsPublic = true",
      "collectionId = 1",
    ]);
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
        (field: string) =>
          field === "collection" || field.startsWith("collection.")
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

const meiliError = (code: string) =>
  Object.assign(new Error(code), { cause: { code } });

const searchCall = (n = 0) => search.mock.calls[n][1];

describe("searchLinks result order", () => {
  beforeEach(() => {
    process.env.PAGINATION_TAKE_COUNT = "2";
  });

  afterEach(() => {
    delete process.env.PAGINATION_TAKE_COUNT;
    vi.clearAllMocks();
  });

  it("keeps Meilisearch's order for best match", async () => {
    search.mockResolvedValue({
      hits: [{ id: 3 }, { id: 9 }],
      estimatedTotalHits: 5,
    });
    vi.mocked(prisma.link.findMany).mockResolvedValue([
      { id: 9 },
      { id: 3 },
    ] as any);

    const result = await searchLinks({
      query: {
        sort: Sort.BestMatch,
        cursor: 2,
        searchQueryString: "organizer",
      },
      userId: 2,
    });

    expect((result.data as any).links.map((l: any) => l.id)).toEqual([3, 9]);
    expect((result.data as any).nextCursor).toBe(4);
    expect(searchCall()).toMatchObject({
      limit: 2,
      offset: 2,
      matchingStrategy: "all",
    });
    expect(searchCall().sort).toBeUndefined();
  });

  it("sorts every match in the database for a date or name sort", async () => {
    search.mockResolvedValue({
      hits: [{ id: 3 }, { id: 9 }, { id: 4 }],
      estimatedTotalHits: 3,
    });
    vi.mocked(prisma.link.findMany).mockResolvedValue([
      { id: 9 },
      { id: 4 },
    ] as any);

    const result = await searchLinks({
      query: { sort: Sort.NameAZ, cursor: 2, searchQueryString: "organizer" },
      userId: 2,
    });

    expect(searchCall()).toMatchObject({
      limit: 1000,
      offset: 0,
      matchingStrategy: "all",
      sort: ["name:asc"],
    });
    expect(vi.mocked(prisma.link.findMany).mock.calls[0][0]).toMatchObject({
      where: { id: { in: [3, 9, 4] } },
      orderBy: [{ name: "asc" }],
      skip: 2,
      take: 2,
    });
    expect((result.data as any).links.map((l: any) => l.id)).toEqual([9, 4]);
    expect((result.data as any).nextCursor).toBe(4);
  });

  it("has Meilisearch keep the matches that come first in a date or name sort", async () => {
    search.mockResolvedValue({ hits: [{ id: 3 }], estimatedTotalHits: 1 });
    vi.mocked(prisma.link.findMany).mockResolvedValue([{ id: 3 }] as any);

    for (const [sort, meiliSort] of [
      [Sort.DateNewestFirst, "id:desc"],
      [Sort.DateOldestFirst, "id:asc"],
      [Sort.NameAZ, "name:asc"],
      [Sort.NameZA, "name:desc"],
      [Sort.Custom, "id:desc"],
    ] as const) {
      search.mockClear();
      await searchLinks({
        query: { sort, collectionId: 1, searchQueryString: "organizer" },
        userId: 2,
      });

      expect(search).toHaveBeenCalledTimes(1);
      expect(searchCall()).toMatchObject({
        limit: 1000,
        offset: 0,
        sort: [meiliSort],
      });
    }
  });

  it("keeps the sort when it loosens the match", async () => {
    search
      .mockResolvedValueOnce({ hits: [], estimatedTotalHits: 0 })
      .mockResolvedValueOnce({ hits: [{ id: 3 }], estimatedTotalHits: 1 });
    vi.mocked(prisma.link.findMany).mockResolvedValue([{ id: 3 }] as any);

    await searchLinks({
      query: { sort: Sort.DateOldestFirst, searchQueryString: "grid combine" },
      userId: 2,
    });

    expect(searchCall(1)).toMatchObject({
      matchingStrategy: "frequency",
      limit: 1000,
      sort: ["id:asc"],
    });
  });

  it("stops paging when the database runs out of sorted matches", async () => {
    search.mockResolvedValue({
      hits: [{ id: 3 }, { id: 9 }, { id: 4 }],
      estimatedTotalHits: 3,
    });
    vi.mocked(prisma.link.findMany).mockResolvedValue([{ id: 3 }] as any);

    const result = await searchLinks({
      query: {
        sort: Sort.DateNewestFirst,
        cursor: 2,
        searchQueryString: "organizer",
      },
      userId: 2,
    });

    expect((result.data as any).nextCursor).toBeNull();
  });

  it("lets Meilisearch sort and page a search with only operators", async () => {
    search.mockResolvedValue({
      hits: [{ id: 3 }, { id: 9 }],
      estimatedTotalHits: 9,
    });
    vi.mocked(prisma.link.findMany).mockResolvedValue([
      { id: 3 },
      { id: 9 },
    ] as any);

    for (const [sort, meiliSort] of [
      [Sort.BestMatch, "id:desc"],
      [Sort.DateNewestFirst, "id:desc"],
      [Sort.DateOldestFirst, "id:asc"],
      [Sort.NameAZ, "name:asc"],
      [Sort.NameZA, "name:desc"],
    ] as const) {
      search.mockClear();
      const result = await searchLinks({
        query: { sort, searchQueryString: "tag:news" },
        userId: 2,
      });

      expect(searchCall()).toMatchObject({
        limit: 2,
        offset: 0,
        sort: [meiliSort],
      });
      expect(
        vi.mocked(prisma.link.findMany).mock.lastCall![0]
      ).not.toHaveProperty("skip");
      expect((result.data as any).nextCursor).toBe(2);
    }
  });
});

describe("searchLinks matching", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loosens the match when no link has every word", async () => {
    search
      .mockResolvedValueOnce({ hits: [], estimatedTotalHits: 0 })
      .mockResolvedValueOnce({ hits: [{ id: 5 }], estimatedTotalHits: 1 });
    vi.mocked(prisma.link.findMany).mockResolvedValue([{ id: 5 }] as any);

    const result = await searchLinks({
      query: { sort: Sort.BestMatch, searchQueryString: "grid combine" },
      userId: 2,
    });

    expect(search).toHaveBeenCalledTimes(2);
    expect(searchCall(0).matchingStrategy).toBe("all");
    expect(searchCall(1).matchingStrategy).toBe("frequency");
    expect((result.data as any).links).toEqual([{ id: 5 }]);
  });

  it("doesn't loosen a quoted phrase", async () => {
    search.mockResolvedValue({ hits: [], estimatedTotalHits: 0 });

    const result = await searchLinks({
      query: { sort: Sort.BestMatch, searchQueryString: '"file organizer"' },
      userId: 2,
    });

    expect(search).toHaveBeenCalledTimes(1);
    expect(search.mock.calls[0][0]).toBe('"file organizer"');
    expect(result.message).toBe("Nothing found.");
  });

  it("doesn't loosen a search that found something", async () => {
    search.mockResolvedValue({ hits: [], estimatedTotalHits: 4 });

    await searchLinks({
      query: {
        sort: Sort.BestMatch,
        cursor: 50,
        searchQueryString: "two words",
      },
      userId: 2,
    });

    expect(search).toHaveBeenCalledTimes(1);
  });

  it("falls back to no results on a Meilisearch without the looser strategy", async () => {
    search
      .mockResolvedValueOnce({ hits: [], estimatedTotalHits: 0 })
      .mockRejectedValueOnce(meiliError("invalid_search_matching_strategy"));

    const result = await searchLinks({
      query: { sort: Sort.BestMatch, searchQueryString: "grid combine" },
      userId: 2,
    });

    expect(result.message).toBe("Nothing found.");
  });

  it("passes other Meilisearch errors on", async () => {
    search
      .mockResolvedValueOnce({ hits: [], estimatedTotalHits: 0 })
      .mockRejectedValueOnce(meiliError("internal"));

    await expect(
      searchLinks({
        query: { sort: Sort.BestMatch, searchQueryString: "grid combine" },
        userId: 2,
      })
    ).rejects.toThrow("internal");
  });
});

describe("searchLinks inside a list", () => {
  beforeEach(() => {
    search.mockResolvedValue({ hits: [{ id: 10 }], estimatedTotalHits: 1 });
    vi.mocked(prisma.link.findMany).mockResolvedValue([{ id: 10 }] as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("filters by the tag's name in Meilisearch", async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue({
      name: 'say "hi"',
    } as any);

    await searchLinks({
      query: { sort: Sort.BestMatch, tagId: 4, searchQueryString: "x" },
      userId: 2,
    });

    expect(searchCall().filter).toEqual([
      "(collectionOwnerId = 2) OR (collectionMemberIds = 2)",
      '(tags = "say \\"hi\\"")',
    ]);
  });

  it("only looks up a tag the user owns or sees in a collection they're a member of", async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue({ name: "news" } as any);

    await searchLinks({
      query: { sort: Sort.BestMatch, tagId: 4, searchQueryString: "x" },
      userId: 2,
    });

    expect(prisma.tag.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 4,
          OR: [
            { ownerId: 2 },
            { links: { some: { collectionId: { in: [5] } } } },
          ],
        },
      })
    );
  });

  it("finds nothing for a tag that doesn't exist or isn't theirs, without searching", async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue(null);

    const result = await searchLinks({
      query: { sort: Sort.BestMatch, tagId: 4, searchQueryString: "x" },
      userId: 2,
    });

    expect(search).not.toHaveBeenCalled();
    expect(result.message).toBe("Nothing found.");
  });

  it("finds nothing for a tag without a user to check it against", async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue({ name: "news" } as any);

    const result = await searchLinks({
      query: { sort: Sort.BestMatch, tagId: 4, searchQueryString: "x" },
      publicOnly: true,
    });

    expect(prisma.tag.findFirst).not.toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();
    expect(result.message).toBe("Nothing found.");
  });

  it("filters pinned links in Meilisearch, and keeps a tag or a pin like the database does", async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue({ name: "news" } as any);

    await searchLinks({
      query: { sort: Sort.BestMatch, pinnedOnly: true, searchQueryString: "x" },
      userId: 2,
    });
    expect(searchCall(0).filter).toContain("(pinnedBy = 2)");

    await searchLinks({
      query: {
        sort: Sort.BestMatch,
        pinnedOnly: true,
        tagId: 4,
        searchQueryString: "x",
      },
      userId: 2,
    });
    expect(searchCall(1).filter).toContain('(tags = "news") OR (pinnedBy = 2)');
  });

  it("filters by collection in Meilisearch, only for a whole number", async () => {
    await searchLinks({
      query: { sort: Sort.BestMatch, collectionId: 7, searchQueryString: "x" },
      userId: 2,
    });
    expect(searchCall(0).filter).toContain("collectionId = 7");

    for (const collectionId of [NaN, 1.5, Infinity]) {
      search.mockClear();
      await searchLinks({
        query: { sort: Sort.BestMatch, collectionId, searchQueryString: "x" },
        userId: 2,
      });
      expect(searchCall().filter.join(" ")).not.toContain("collectionId");
    }
  });

  it("still searches a collection before the worker has made collectionId filterable", async () => {
    search
      .mockRejectedValueOnce(meiliError("invalid_search_filter"))
      .mockResolvedValueOnce({ hits: [{ id: 10 }], estimatedTotalHits: 1 });

    const result = await searchLinks({
      query: { sort: Sort.BestMatch, collectionId: 7, searchQueryString: "x" },
      userId: 2,
    });

    expect(search).toHaveBeenCalledTimes(2);
    expect(searchCall(1).filter.join(" ")).not.toContain("collectionId");
    expect(vi.mocked(prisma.link.findMany).mock.calls[0][0]).toMatchObject({
      where: { AND: expect.arrayContaining([{ collection: { id: 7 } }]) },
    });
    expect((result.data as any).links).toEqual([{ id: 10 }]);
  });

  it("doesn't retry other errors without the collection", async () => {
    search.mockRejectedValueOnce(meiliError("index_not_found"));

    await expect(
      searchLinks({
        query: {
          sort: Sort.BestMatch,
          collectionId: 7,
          searchQueryString: "x",
        },
        userId: 2,
      })
    ).rejects.toThrow("index_not_found");
    expect(search).toHaveBeenCalledTimes(1);
  });
});

describe("searchLinks with OR", () => {
  // Answers each alternative by its search text, best match first
  const answer = (hits: Record<string, { id: number; score?: number }[]>) =>
    search.mockImplementation(async (q: string) => {
      const found = hits[q] ?? [];
      return {
        hits: found.map(({ id, score }) =>
          score === undefined ? { id } : { id, _rankingScore: score }
        ),
        estimatedTotalHits: found.length,
      };
    });

  const callFor = (q: string) =>
    search.mock.calls.find(([text]) => text === q)![1];

  beforeEach(() => {
    process.env.PAGINATION_TAKE_COUNT = "2";
    vi.mocked(prisma.link.findMany).mockImplementation((async (args: any) =>
      args.where.id.in.map((id: number) => ({ id }))) as any);
  });

  afterEach(() => {
    delete process.env.PAGINATION_TAKE_COUNT;
    vi.clearAllMocks();
  });

  const page = async (sort: Sort, searchQueryString: string, cursor = 0) => {
    const result = await searchLinks({
      query: { sort, cursor, searchQueryString },
      userId: 2,
    });
    return {
      ids: ((result.data as any).links ?? []).map((l: any) => l.id),
      nextCursor: (result.data as any).nextCursor,
    };
  };

  it("searches each alternative and ranks their matches together", async () => {
    answer({
      rust: [
        { id: 2, score: 0.9 },
        { id: 1, score: 0.5 },
      ],
      go: [
        { id: 3, score: 0.7 },
        { id: 2, score: 0.6 },
      ],
    });

    expect(await page(Sort.BestMatch, "rust OR go")).toEqual({
      ids: [2, 3],
      nextCursor: 2,
    });
    expect(await page(Sort.BestMatch, "rust OR go", 2)).toEqual({
      ids: [1],
      nextCursor: null,
    });

    for (const q of ["rust", "go"])
      expect(callFor(q)).toMatchObject({
        limit: 1000,
        offset: 0,
        showRankingScore: true,
        matchingStrategy: "all",
        filter: ["(collectionOwnerId = 2) OR (collectionMemberIds = 2)"],
      });
  });

  it("puts links matched by operators alone after the ranked ones, newest first", async () => {
    search.mockImplementation(async (q: string) =>
      q === "rust"
        ? { hits: [{ id: 1, _rankingScore: 0.4 }], estimatedTotalHits: 1 }
        : { hits: [{ id: 9 }, { id: 5 }, { id: 1 }], estimatedTotalHits: 3 }
    );
    process.env.PAGINATION_TAKE_COUNT = "50";

    expect((await page(Sort.BestMatch, "tag:news OR rust")).ids).toEqual([
      1, 9, 5,
    ]);
    expect(callFor("")).toMatchObject({
      sort: ["id:desc"],
      filter: [
        "(collectionOwnerId = 2) OR (collectionMemberIds = 2)",
        'tags = "news"',
      ],
    });
    expect(callFor("")).not.toHaveProperty("showRankingScore");
  });

  it("sorts every alternative's matches in the database for a date or name sort", async () => {
    answer({
      rust: [
        { id: 2, score: 0.9 },
        { id: 1, score: 0.5 },
      ],
      go: [{ id: 3, score: 0.7 }],
    });

    await page(Sort.NameAZ, "rust OR go", 2);

    expect(vi.mocked(prisma.link.findMany).mock.calls[0][0]).toMatchObject({
      where: { id: { in: [2, 3, 1] } },
      orderBy: [{ name: "asc" }],
      skip: 2,
      take: 2,
    });
    for (const q of ["rust", "go"])
      expect(callFor(q)).toMatchObject({
        limit: 1000,
        showRankingScore: true,
        sort: ["name:asc"],
      });
  });

  it("keeps the newest or oldest of equally good matches when the alternatives find more than 1000", async () => {
    const hits = (from: number, to: number) =>
      Array.from({ length: to - from + 1 }, (_, i) => ({
        id: from + i,
        score: 0.5,
      }));
    answer({ rust: hits(1, 1000), go: hits(1001, 1500) });

    const kept = async (sort: Sort) => {
      vi.mocked(prisma.link.findMany).mockClear();
      await page(sort, "rust OR go");
      return (vi.mocked(prisma.link.findMany).mock.calls[0][0] as any).where.id
        .in as number[];
    };

    expect(await kept(Sort.DateNewestFirst)).toEqual(
      hits(501, 1500)
        .map((hit) => hit.id)
        .reverse()
    );
    expect(await kept(Sort.DateOldestFirst)).toEqual(
      hits(1, 1000).map((hit) => hit.id)
    );
  });

  it("sorts links matched by operators alone in the chosen order", async () => {
    answer({ rust: [{ id: 1, score: 0.4 }], "": [{ id: 5 }, { id: 9 }] });

    await page(Sort.DateOldestFirst, "tag:news OR rust");

    expect(callFor("")).toMatchObject({ sort: ["id:asc"] });
    expect(callFor("rust")).toMatchObject({ sort: ["id:asc"] });
  });

  it("passes the list and collection filters to every alternative", async () => {
    answer({});
    vi.mocked(prisma.tag.findFirst).mockResolvedValue({ name: "news" } as any);

    await searchLinks({
      query: {
        sort: Sort.BestMatch,
        tagId: 4,
        collectionId: 7,
        searchQueryString: "(rust OR go) tag:x",
      },
      userId: 2,
    });

    for (const q of ["rust", "go"])
      expect(callFor(q).filter).toEqual([
        "(collectionOwnerId = 2) OR (collectionMemberIds = 2)",
        'tags = "x"',
        '(tags = "news")',
        "collectionId = 7",
      ]);
  });

  it("only loosens the match when no alternative finds anything", async () => {
    answer({ rust: [{ id: 1, score: 0.5 }] });
    await page(Sort.BestMatch, "rust OR go");
    expect(search).toHaveBeenCalledTimes(2);

    search.mockClear();
    answer({});
    await page(Sort.BestMatch, 'rust OR "go fast"');
    expect(search).toHaveBeenCalledTimes(4);
    expect(search.mock.calls[2][1].matchingStrategy).toBe("frequency");
    expect(search.mock.calls[3][1].matchingStrategy).toBe("all");
  });

  it("keeps the strict results on a Meilisearch without the looser strategy", async () => {
    search
      .mockResolvedValueOnce({ hits: [], estimatedTotalHits: 0 })
      .mockResolvedValueOnce({ hits: [], estimatedTotalHits: 0 })
      .mockRejectedValueOnce(meiliError("invalid_search_matching_strategy"));

    const result = await searchLinks({
      query: { sort: Sort.BestMatch, searchQueryString: "rust OR go" },
      userId: 2,
    });

    expect(result.message).toBe("Nothing found.");
  });

  it("turns down a search with too many alternatives without searching", async () => {
    const result = await searchLinks({
      query: {
        sort: Sort.BestMatch,
        searchQueryString: "(a OR b) (c OR d) (e OR f) (g OR h) (i OR j)",
      },
      userId: 2,
    });

    expect(search).not.toHaveBeenCalled();
    expect(result).toMatchObject({ statusCode: 400, success: false, data: [] });
    expect(result.message).toContain("too many OR combinations");
  });
});

describe("searchLinks leaving words out", () => {
  beforeEach(() => {
    process.env.PAGINATION_TAKE_COUNT = "2";
    vi.mocked(prisma.link.findMany).mockImplementation((async (args: any) =>
      args.where.id.in.map((id: number) => ({ id }))) as any);
  });

  afterEach(() => {
    delete process.env.PAGINATION_TAKE_COUNT;
    vi.clearAllMocks();
  });

  it("lets Meilisearch sort and page a search that only leaves words out", async () => {
    search.mockResolvedValue({
      hits: [{ id: 3 }, { id: 9 }],
      estimatedTotalHits: 9,
    });

    for (const [sort, meiliSort] of [
      [Sort.BestMatch, "id:desc"],
      [Sort.DateOldestFirst, "id:asc"],
      [Sort.NameZA, "name:desc"],
    ] as const) {
      search.mockClear();
      const result = await searchLinks({
        query: { sort, cursor: 2, searchQueryString: "!book tag:news" },
        userId: 2,
      });

      expect(search).toHaveBeenCalledTimes(1);
      expect(search.mock.calls[0][0]).toBe('-"book"');
      expect(searchCall()).toMatchObject({
        limit: 2,
        offset: 2,
        sort: [meiliSort],
        filter: [
          "(collectionOwnerId = 2) OR (collectionMemberIds = 2)",
          'tags = "news"',
        ],
      });
      expect((result.data as any).nextCursor).toBe(4);
    }
  });

  it("still loosens a search with a word left out", async () => {
    search
      .mockResolvedValueOnce({ hits: [], estimatedTotalHits: 0 })
      .mockResolvedValueOnce({ hits: [{ id: 5 }], estimatedTotalHits: 1 });

    await searchLinks({
      query: { sort: Sort.BestMatch, searchQueryString: "grid combine !book" },
      userId: 2,
    });

    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls[1][0]).toBe('-"book" grid combine');
    expect(searchCall(1).matchingStrategy).toBe("frequency");
  });

  it("puts an alternative that only leaves words out after the ranked ones", async () => {
    search.mockImplementation(async (q: string) =>
      q === "rust"
        ? { hits: [{ id: 1, _rankingScore: 0.4 }], estimatedTotalHits: 1 }
        : { hits: [{ id: 9 }, { id: 5 }], estimatedTotalHits: 2 }
    );
    process.env.PAGINATION_TAKE_COUNT = "50";

    const result = await searchLinks({
      query: { sort: Sort.BestMatch, searchQueryString: "rust OR !book" },
      userId: 2,
    });

    expect((result.data as any).links.map((l: any) => l.id)).toEqual([1, 9, 5]);
    const excluding = search.mock.calls.find(([q]) => q === '-"book"')![1];
    expect(excluding).toMatchObject({ sort: ["id:desc"] });
    expect(excluding).not.toHaveProperty("showRankingScore");
  });
});
