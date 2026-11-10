import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startIndexing } from "./linkIndexing";
import getLinkBatch from "../lib/getLinkBatch";
import { prisma } from "@linkwarden/prisma";
import { delay } from "@linkwarden/lib/utils";
import { MEILI_INDEX_VERSION } from "@linkwarden/lib/constants";

const { linksIndex } = vi.hoisted(() => ({
  linksIndex: {
    updateFilterableAttributes: vi.fn(),
    updateSortableAttributes: vi.fn(),
    addDocuments: vi.fn(),
    waitForTask: vi.fn(),
  },
}));

vi.mock("@linkwarden/lib/meilisearchClient", () => ({
  meiliClient: {
    getIndex: vi.fn().mockResolvedValue({}),
    createIndex: vi.fn(),
    index: vi.fn(() => linksIndex),
  },
}));

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    link: {
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@linkwarden/lib/utils", () => ({
  delay: vi.fn(),
}));

vi.mock("../lib/getLinkBatch", () => ({
  default: vi.fn(),
}));

const owner = {
  id: 1,
  uuid: "6f1c1f0e-6b0e-4d55-9a57-3f0f3f6b3a10",
  name: "Alice",
  username: "alice",
  email: "alice@example.com",
  emailVerified: new Date("2026-01-01T00:00:00.000Z"),
  unverifiedNewEmail: "alice.new@example.com",
  password: "$2b$10$hLCy7VhcRv5OXc2sDMXe1.1fXYYWOSaHAz5CHsasgtBcVMGyo3BCS",
  image: "uploads/avatar/1.jpg",
};

// Shapes the owner like Prisma would for `true`, `{ select }` or `{ omit }`.
const ownerFromInclude = (ownerInclude: any) => {
  if (ownerInclude === true) return owner;

  if (ownerInclude.select)
    return Object.fromEntries(
      Object.keys(ownerInclude.select).map((key) => [key, (owner as any)[key]])
    );

  return Object.fromEntries(
    Object.entries(owner).filter(([key]) => !ownerInclude.omit?.[key])
  );
};

// Returns what Prisma would for the include the worker asks for, so the
// owner's record only shows up when the query requests it.
const linkBatchFromInclude = async (params: any) => {
  const collectionInclude = params.include?.collection?.include ?? {};
  const ownerInclude = collectionInclude.owner;

  return [
    {
      id: 10,
      name: "Example",
      url: "https://example.com",
      description: "",
      textContent: "Example page text",
      collectionId: 5,
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      collection: {
        id: 5,
        name: "Reading",
        ownerId: owner.id,
        isPublic: true,
        ...(ownerInclude ? { owner: ownerFromInclude(ownerInclude) } : {}),
        members: [{ userId: 2 }],
      },
      tags: [{ name: "news" }],
      pinnedBy: [{ id: 2 }],
    },
  ];
};

class StopIndexing extends Error {}

// startIndexing loops forever, so stop it at the first delay after a batch.
const runOneBatch = () =>
  expect(startIndexing()).rejects.toBeInstanceOf(StopIndexing);

const indexedDocs = () =>
  linksIndex.addDocuments.mock.calls.flatMap(([docs]) => docs);

describe("startIndexing", () => {
  beforeEach(() => {
    linksIndex.updateFilterableAttributes.mockResolvedValue({ taskUid: 1 });
    linksIndex.updateSortableAttributes.mockResolvedValue({ taskUid: 2 });
    linksIndex.addDocuments.mockResolvedValue({ taskUid: 3 });
    linksIndex.waitForTask.mockResolvedValue({ status: "succeeded" });
    vi.mocked(getLinkBatch).mockImplementation(linkBatchFromInclude as any);
    vi.mocked(prisma.link.count).mockResolvedValue(0);
    vi.mocked(delay).mockRejectedValue(new StopIndexing());
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("does not send the collection owner's password hash to Meilisearch", async () => {
    await runOneBatch();

    const docs = indexedDocs();
    expect(docs).toHaveLength(1);
    expect(docs[0].collection.owner?.password).toBeUndefined();
    expect(JSON.stringify(docs)).not.toContain(owner.password);
  });

  it("keeps the rest of the collection owner's record for future deep search", async () => {
    await runOneBatch();

    expect(indexedDocs()[0].collection.owner).toMatchObject({
      id: owner.id,
      name: owner.name,
      username: owner.username,
    });
  });

  it("keeps the fields search filters rely on", async () => {
    await runOneBatch();

    expect(indexedDocs()[0]).toMatchObject({
      id: 10,
      collectionOwnerId: owner.id,
      collectionMemberIds: [2],
      collectionIsPublic: true,
      collectionName: "Reading",
      tags: ["news"],
      pinnedBy: [2],
      creationTimestamp: Date.parse("2026-02-01T00:00:00.000Z") / 1000,
    });
  });

  it("marks indexed links with the current index version", async () => {
    await runOneBatch();

    expect(indexedDocs()[0].indexVersion).toBe(MEILI_INDEX_VERSION);
    expect(prisma.link.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [10] } },
      data: { indexVersion: MEILI_INDEX_VERSION },
    });
  });

  it("picks up links indexed with an older version", async () => {
    await runOneBatch();

    const { where } = vi.mocked(getLinkBatch).mock.calls[0][0] as any;
    expect(where.AND[0].OR).toEqual([
      { indexVersion: { not: MEILI_INDEX_VERSION } },
      { indexVersion: null },
    ]);
  });

  it("does not mark links as indexed when Meilisearch rejects the documents", async () => {
    linksIndex.waitForTask.mockImplementation(async (taskUid: number) =>
      taskUid === 3
        ? { status: "failed", error: { message: "payload too large" } }
        : { status: "succeeded" }
    );

    await runOneBatch();

    expect(linksIndex.addDocuments).toHaveBeenCalledTimes(1);
    expect(prisma.link.updateMany).not.toHaveBeenCalled();
  });
});
