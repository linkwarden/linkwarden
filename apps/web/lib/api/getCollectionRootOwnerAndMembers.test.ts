import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@linkwarden/prisma";
import getCollectionRootOwnerAndMembers from "./getCollectionRootOwnerAndMembers";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    collection: {
      findUnique: vi.fn(),
    },
  },
}));

type Member = {
  userId: number;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

const full = { canCreate: true, canUpdate: true, canDelete: true };

// Answers lookups from `collections`, and gives up after 50 of them so a walk
// that goes round a parent cycle fails instead of running forever
const withCollections = (
  collections: Record<
    number,
    { parentId: number | null; ownerId: number; members: Member[] }
  >
) => {
  const findUnique = vi.mocked(prisma.collection.findUnique);

  findUnique.mockImplementation((async ({ where }: any) => {
    if (findUnique.mock.calls.length > 50)
      throw new Error("Still walking up after 50 lookups");

    return collections[where.id] ?? null;
  }) as any);

  return findUnique;
};

const byUserId = (members: Member[]) =>
  [...members].sort((a, b) => a.userId - b.userId);

describe("getCollectionRootOwnerAndMembers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the owner at the top and everyone with access on the way up", async () => {
    const findUnique = withCollections({
      1: { parentId: null, ownerId: 10, members: [] },
      2: {
        parentId: 1,
        ownerId: 10,
        members: [
          { userId: 20, canCreate: false, canUpdate: true, canDelete: false },
          { userId: 30, canCreate: false, canUpdate: false, canDelete: false },
        ],
      },
      3: {
        parentId: 2,
        ownerId: 10,
        members: [
          { userId: 20, canCreate: true, canUpdate: false, canDelete: false },
        ],
      },
    });

    const result = await getCollectionRootOwnerAndMembers(3);

    expect(result.rootOwnerId).toBe(10);
    // A member listed on several levels keeps every permission they have
    expect(byUserId(result.members)).toEqual([
      { userId: 10, ...full },
      { userId: 20, canCreate: true, canUpdate: true, canDelete: false },
      { userId: 30, canCreate: false, canUpdate: false, canDelete: false },
    ]);
    expect(findUnique).toHaveBeenCalledTimes(3);
  });

  it("stops at a collection that is its own parent", async () => {
    const findUnique = withCollections({
      7: { parentId: 7, ownerId: 10, members: [] },
    });

    const result = await getCollectionRootOwnerAndMembers(7);

    expect(result).toEqual({
      rootOwnerId: 10,
      members: [{ userId: 10, ...full }],
    });
    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it("stops when the parents loop back round", async () => {
    const findUnique = withCollections({
      7: { parentId: 8, ownerId: 10, members: [{ userId: 20, ...full }] },
      8: { parentId: 9, ownerId: 10, members: [] },
      9: { parentId: 7, ownerId: 10, members: [{ userId: 30, ...full }] },
    });

    const result = await getCollectionRootOwnerAndMembers(7);

    expect(result.rootOwnerId).toBe(10);
    expect(byUserId(result.members).map((m) => m.userId)).toEqual([10, 20, 30]);
    expect(findUnique).toHaveBeenCalledTimes(3);
  });

  it("returns no owner for a collection that doesn't exist", async () => {
    withCollections({});

    expect(await getCollectionRootOwnerAndMembers(404)).toEqual({
      rootOwnerId: null,
      members: [],
    });
  });
});
