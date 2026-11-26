import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

let prisma: typeof import("@linkwarden/prisma").prisma;
let mergeTags: typeof import("./mergeTags").default;

const createdUserIds: number[] = [];

const ensureTestEnv = async () => {
  await import("dotenv/config");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests for mergeTags."
    );
  }
};

const createTestUser = async () => {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      username: `merge_tags_test_${suffix}`,
      email: `merge_tags_test_${suffix}@example.com`,
    },
  });

  createdUserIds.push(user.id);
  return user;
};

const createCollection = async (userId: number) =>
  prisma.collection.create({
    data: {
      name: "Merge Tags Test",
      owner: { connect: { id: userId } },
      createdBy: { connect: { id: userId } },
    },
  });

const createTag = async (
  userId: number,
  name: string,
  data: { archiveAsPDF?: boolean; aiTag?: boolean } = {}
) =>
  prisma.tag.create({
    data: { name, ownerId: userId, ...data },
  });

const createLinkWithTags = async (
  userId: number,
  collectionId: number,
  tagIds: number[]
) =>
  prisma.link.create({
    data: {
      name: "Tagged link",
      url: "https://example.com/tagged",
      collectionId,
      createdById: userId,
      tags: { connect: tagIds.map((id) => ({ id })) },
    },
  });

const linkTagIds = async (linkId: number) => {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { tags: { select: { id: true } } },
  });
  return (link?.tags ?? []).map((tag) => tag.id).sort((a, b) => a - b);
};

beforeAll(async () => {
  await ensureTestEnv();

  const prismaModule = await import("@linkwarden/prisma");
  prisma = prismaModule.prisma;

  mergeTags = (await import("./mergeTags")).default;

  await prisma.$connect();
});

afterEach(async () => {
  const users = createdUserIds.splice(0, createdUserIds.length);

  for (const userId of users) {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe.sequential("mergeTags integration", () => {
  it("merges into an existing tag with that name instead of crashing", async () => {
    const user = await createTestUser();
    const collection = await createCollection(user.id);
    const target = await createTag(user.id, "react", { archiveAsPDF: true });
    const source = await createTag(user.id, "reactjs");
    const sourceLink = await createLinkWithTags(user.id, collection.id, [
      source.id,
    ]);
    const targetLink = await createLinkWithTags(user.id, collection.id, [
      target.id,
    ]);

    const result = await mergeTags(user.id, {
      tagIds: [source.id],
      newTagName: "react",
    });

    expect(result.status).toBe(200);
    expect(result.response).toMatchObject({ id: target.id, name: "react" });
    await expect(
      prisma.tag.findUnique({ where: { id: source.id } })
    ).resolves.toBeNull();
    await expect(linkTagIds(sourceLink.id)).resolves.toEqual([target.id]);
    await expect(linkTagIds(targetLink.id)).resolves.toEqual([target.id]);
  });

  it("preserves the destination tag's settings when it is among the merged tags", async () => {
    const user = await createTestUser();
    const collection = await createCollection(user.id);
    const target = await createTag(user.id, "react", {
      archiveAsPDF: true,
      aiTag: true,
    });
    const source = await createTag(user.id, "reactjs");
    const link = await createLinkWithTags(user.id, collection.id, [
      target.id,
      source.id,
    ]);

    const result = await mergeTags(user.id, {
      tagIds: [target.id, source.id],
      newTagName: "react",
    });

    expect(result.status).toBe(200);
    expect(result.response).toMatchObject({ id: target.id });
    const kept = await prisma.tag.findUnique({ where: { id: target.id } });
    expect(kept?.archiveAsPDF).toBe(true);
    expect(kept?.aiTag).toBe(true);
    await expect(linkTagIds(link.id)).resolves.toEqual([target.id]);
  });

  it("creates a new tag when the name does not exist yet", async () => {
    const user = await createTestUser();
    const collection = await createCollection(user.id);
    const source = await createTag(user.id, "reactjs");
    const link = await createLinkWithTags(user.id, collection.id, [source.id]);

    const result = await mergeTags(user.id, {
      tagIds: [source.id],
      newTagName: "frontend",
    });

    expect(result.status).toBe(200);
    expect(result.response).toMatchObject({ name: "frontend" });
    const newTagId = (result.response as { id: number }).id;
    await expect(linkTagIds(link.id)).resolves.toEqual([newTagId]);
  });
});
