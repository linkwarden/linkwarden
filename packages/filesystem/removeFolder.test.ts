import { beforeEach, describe, expect, it, vi } from "vitest";

// An in-memory bucket behind a mocked S3 client. Listings match keys the way
// S3 does, as plain string prefixes, and return at most two keys per page
// (S3 returns up to 1,000) so truncated listings are followed too.
const { bucket, send } = vi.hoisted(() => {
  const bucket = new Set<string>();

  const send = vi.fn(async ({ input }: { input: any }) => {
    if ("Prefix" in input) {
      const keys = [...bucket].filter((key) => key.startsWith(input.Prefix));

      return {
        Contents: keys.slice(0, 2).map((Key) => ({ Key })),
        IsTruncated: keys.length > 2,
      };
    }

    for (const { Key } of input.Delete.Objects) bucket.delete(Key);

    return {};
  });

  return { bucket, send };
});

vi.mock("./s3Client", () => ({ default: { send } }));

import { removeFolder } from "./removeFolder";

const keys = [
  "archives/1/7.pdf",
  "archives/1/7_readability.json",
  "archives/1/8.html",
  "archives/10/40.pdf",
  "archives/12/99.jpeg",
  "archives/100/500.html",
  "archives/1234/600.png",
  "archives/2/8.pdf",
  "archives/preview/1/7.jpeg",
  "archives/preview/10/40.jpeg",
  "archives/preview/12/99.jpeg",
];

const removedBy = async (filePath: string) => {
  await removeFolder({ filePath });

  return keys.filter((key) => !bucket.has(key));
};

describe("removeFolder on S3", () => {
  vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(() => {
    bucket.clear();
    keys.forEach((key) => bucket.add(key));
    send.mockClear();
  });

  it("only deletes the objects inside the given collection's folder", async () => {
    expect(await removedBy("archives/1")).toEqual([
      "archives/1/7.pdf",
      "archives/1/7_readability.json",
      "archives/1/8.html",
    ]);
  });

  it("only deletes the objects inside the given preview folder", async () => {
    expect(await removedBy("archives/preview/1")).toEqual([
      "archives/preview/1/7.jpeg",
    ]);
  });

  it("leaves folders whose ids start with the given id", async () => {
    expect(await removedBy("archives/12")).toEqual(["archives/12/99.jpeg"]);
  });

  it("handles a path that already ends in a slash", async () => {
    expect(await removedBy("archives/10/")).toEqual(["archives/10/40.pdf"]);
  });

  it("handles a path that ends in more than one slash", async () => {
    expect(await removedBy("archives/preview/12//")).toEqual([
      "archives/preview/12/99.jpeg",
    ]);
  });

  it("keeps the folder's prefix on every page of a truncated listing", async () => {
    await removeFolder({ filePath: "archives/1" });

    const prefixes = send.mock.calls
      .map(([{ input }]) => input.Prefix)
      .filter((prefix) => prefix !== undefined);

    expect(prefixes).toEqual(["archives/1/", "archives/1/"]);
  });
});
