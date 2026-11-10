import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@linkwarden/prisma";
import importFromHTMLFile from "./importFromHTMLFile";

vi.mock("@linkwarden/filesystem", () => ({ createFolder: vi.fn() }));
vi.mock("@linkwarden/lib/verifyCapacity", () => ({
  hasPassedLimit: vi.fn().mockResolvedValue(false),
}));

let userId: number;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { username: `hierarchy_${Date.now()}` },
  });
  userId = user.id;
});

afterAll(async () => {
  if (userId) await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("HTML import folder identity", () => {
  it("keeps a root folder separate from an earlier nested folder with the same name", async () => {
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
      <DL><p>
        <DT><H3>Parent</H3>
        <DL><p>
          <DT><H3>Shared</H3>
          <DL><p><DT><A HREF="https://example.com/nested">Nested</A></DL><p>
        </DL><p>
        <DT><H3>Shared</H3>
        <DL><p><DT><A HREF="https://example.com/root">Root</A></DL><p>
      </DL><p>`;

    await expect(importFromHTMLFile(userId, html)).resolves.toMatchObject({
      status: 200,
    });
    const folders = await prisma.collection.findMany({
      where: { ownerId: userId },
    });
    const parent = folders.find((folder) => folder.name === "Parent");
    const root = folders.find(
      (folder) => folder.name === "Shared" && folder.parentId === null
    );
    const nested = folders.find(
      (folder) => folder.name === "Shared" && folder.parentId === parent?.id
    );

    expect(root).toBeDefined();
    expect(nested).toBeDefined();
    expect(root?.id).not.toBe(nested?.id);
    const links = await prisma.link.findMany({
      where: { createdById: userId },
    });
    expect(
      links.find((link) => link.url === "https://example.com/root")
        ?.collectionId
    ).toBe(root?.id);
    expect(
      links.find((link) => link.url === "https://example.com/nested")
        ?.collectionId
    ).toBe(nested?.id);

    await importFromHTMLFile(userId, html);
    expect(await prisma.collection.count({ where: { ownerId: userId } })).toBe(
      3
    );
  });

  it("does not reuse a nested Imports folder for unfiled bookmarks", async () => {
    const parent = await prisma.collection.create({
      data: { name: "Another parent", ownerId: userId },
    });
    const nested = await prisma.collection.create({
      data: { name: "Imports", ownerId: userId, parentId: parent.id },
    });

    await importFromHTMLFile(
      userId,
      '<DL><p><DT><A HREF="https://example.com/unfiled">Unfiled</A></DL><p>'
    );
    const link = await prisma.link.findFirst({
      where: { url: "https://example.com/unfiled", createdById: userId },
      include: { collection: true },
    });
    expect(link?.collection.name).toBe("Imports");
    expect(link?.collection.parentId).toBeNull();
    expect(link?.collectionId).not.toBe(nested.id);
  });
});
