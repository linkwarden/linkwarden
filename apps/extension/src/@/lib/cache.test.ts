import { fakeBrowser } from "@webext-core/fake-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { bookmarkMetadata } from "./cache.ts";

// cache.ts reads the browser global as it loads, so stub it before importing.
vi.stubGlobal("chrome", fakeBrowser);
const {
  clearBookmarksMetadata,
  deleteBookmarkMetadata,
  getBookmarkMetadataByBookmarkId,
  getBookmarkMetadataById,
  getBookmarkMetadataByUrl,
  getBookmarksMetadata,
  saveBookmarkMetadata,
} = await import("./cache.ts");

const link = (id: number, bookmarkId?: string): bookmarkMetadata => ({
  id,
  collectionId: 1,
  url: `https://example.com/${id}`,
  name: `Link ${id}`,
  description: "",
  tags: [],
  bookmarkId,
});

beforeEach(() => {
  fakeBrowser.reset();
  vi.stubGlobal("chrome", fakeBrowser);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("bookmark metadata cache", () => {
  it("starts empty", async () => {
    expect(await getBookmarksMetadata()).toEqual([]);
  });

  it("adds new links and replaces the one with the same id", async () => {
    await saveBookmarkMetadata(link(1));
    await saveBookmarkMetadata(link(2));
    await saveBookmarkMetadata({ ...link(1), name: "Renamed" });

    expect(await getBookmarksMetadata()).toEqual([
      { ...link(1), name: "Renamed" },
      link(2),
    ]);
  });

  it("finds a link by id, URL, or browser bookmark id", async () => {
    await saveBookmarkMetadata(link(1, "b1"));
    await saveBookmarkMetadata(link(2, "b2"));

    expect(await getBookmarkMetadataById(2)).toEqual(link(2, "b2"));
    expect(await getBookmarkMetadataByUrl("https://example.com/1")).toEqual(
      link(1, "b1")
    );
    expect(await getBookmarkMetadataByBookmarkId("b2")).toEqual(link(2, "b2"));
    expect(await getBookmarkMetadataById(3)).toBeUndefined();
  });

  it("deletes by browser bookmark id and keeps the rest", async () => {
    await saveBookmarkMetadata(link(1, "b1"));
    await saveBookmarkMetadata(link(2, "b2"));

    await deleteBookmarkMetadata("b1");
    await deleteBookmarkMetadata("missing");

    expect(await getBookmarksMetadata()).toEqual([link(2, "b2")]);
  });

  it("clears everything", async () => {
    await saveBookmarkMetadata(link(1));
    await clearBookmarksMetadata();

    expect(await getBookmarksMetadata()).toEqual([]);
  });
});
