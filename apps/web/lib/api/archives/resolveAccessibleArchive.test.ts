import { afterEach, describe, expect, it, vi } from "vitest";
import { ArchivedFormat } from "@linkwarden/types/global";
import resolveAccessibleArchive from "./resolveAccessibleArchive";
import { prisma } from "@linkwarden/prisma";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    collection: {
      findFirst: vi.fn(),
    },
  },
}));

describe("resolveAccessibleArchive", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a resolved file path for an accessible owner archive", async () => {
    vi.mocked(prisma.collection.findFirst).mockResolvedValue({
      id: 12,
    } as any);

    const result = await resolveAccessibleArchive({
      linkId: 55,
      format: ArchivedFormat.monolith,
      userId: 7,
    });

    expect(prisma.collection.findFirst).toHaveBeenCalledWith({
      where: {
        links: {
          some: {
            id: 55,
          },
        },
        OR: [
          { ownerId: 7 },
          { members: { some: { userId: 7 } } },
          { isPublic: true },
        ],
      },
    });
    expect(result).toEqual({
      status: 200,
      response: {
        collectionId: 12,
        filePath: "archives/12/55.html",
        format: ArchivedFormat.monolith,
        isPreview: false,
        linkId: 55,
      },
    });
  });

  it("supports public access without a logged-in user", async () => {
    vi.mocked(prisma.collection.findFirst).mockResolvedValue({
      id: 9,
    } as any);

    const result = await resolveAccessibleArchive({
      linkId: 3,
      format: ArchivedFormat.pdf,
      userId: undefined,
    });

    expect(prisma.collection.findFirst).toHaveBeenCalledWith({
      where: {
        links: {
          some: {
            id: 3,
          },
        },
        OR: [
          { ownerId: -1 },
          { members: { some: { userId: -1 } } },
          { isPublic: true },
        ],
      },
    });
    expect(result).toEqual({
      status: 200,
      response: {
        collectionId: 9,
        filePath: "archives/9/3.pdf",
        format: ArchivedFormat.pdf,
        isPreview: false,
        linkId: 3,
      },
    });
  });

  it("returns an authorization error when the collection is inaccessible", async () => {
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);

    const result = await resolveAccessibleArchive({
      linkId: 11,
      format: ArchivedFormat.jpeg,
      userId: 7,
    });

    expect(result).toEqual({
      status: 401,
      response: "You don't have access to this collection.",
    });
  });

  it("returns an invalid-parameters error for unsupported formats", async () => {
    const result = await resolveAccessibleArchive({
      linkId: 11,
      format: 999,
      userId: 7,
    });

    expect(result).toEqual({
      status: 401,
      response: "Invalid parameters.",
    });
    expect(prisma.collection.findFirst).not.toHaveBeenCalled();
  });
});
