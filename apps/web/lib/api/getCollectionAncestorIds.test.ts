import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@linkwarden/prisma";
import getCollectionAncestorIds from "./getCollectionAncestorIds";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    collection: {
      findUnique: vi.fn(),
    },
  },
}));

// Answers lookups from `parentIds`, and gives up after 50 of them so a walk
// that goes round a parent cycle fails instead of running forever
const withParents = (parentIds: Record<number, number | null>) => {
  const findUnique = vi.mocked(prisma.collection.findUnique);

  findUnique.mockImplementation((async ({ where }: any) => {
    if (findUnique.mock.calls.length > 50)
      throw new Error("Still walking up after 50 lookups");

    return where.id in parentIds ? { parentId: parentIds[where.id] } : null;
  }) as any);

  return findUnique;
};

describe("getCollectionAncestorIds", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the collection and every collection above it", async () => {
    const findUnique = withParents({ 1: null, 2: 1, 3: 2 });

    expect(Array.from(await getCollectionAncestorIds(3))).toEqual([3, 2, 1]);
    expect(findUnique).toHaveBeenCalledTimes(3);
  });

  it("stops at a collection that is its own parent", async () => {
    const findUnique = withParents({ 7: 7 });

    expect(Array.from(await getCollectionAncestorIds(7))).toEqual([7]);
    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it("stops when the parents loop back round", async () => {
    const findUnique = withParents({ 7: 8, 8: 9, 9: 7, 10: 7 });

    expect(Array.from(await getCollectionAncestorIds(10))).toEqual([
      10, 7, 8, 9,
    ]);
    expect(findUnique).toHaveBeenCalledTimes(4);
  });

  it("returns only the id it was given when that collection doesn't exist", async () => {
    withParents({});

    expect(Array.from(await getCollectionAncestorIds(404))).toEqual([404]);
  });
});
