import { describe, expect, it } from "vitest";
import { matchesReadingListRule, withReadingListStatus } from "./readingList";

describe("matchesReadingListRule", () => {
  const emptyRule = { readingListCollections: [], readingListTags: [] };

  it("never matches an empty rule", () => {
    expect(
      matchesReadingListRule(emptyRule, { collectionId: 1, tagNames: ["a"] })
    ).toBe(false);
  });

  it("matches a link saved to a rule collection", () => {
    expect(
      matchesReadingListRule(
        { ...emptyRule, readingListCollections: [4, 9] },
        { collectionId: 9, tagNames: [] }
      )
    ).toBe(true);
  });

  it("matches rule tags ignoring case and surrounding spaces", () => {
    expect(
      matchesReadingListRule(
        { ...emptyRule, readingListTags: ["To Read"] },
        { collectionId: 1, tagNames: ["news", "  to read "] }
      )
    ).toBe(true);
  });

  it("does not match when neither the collection nor a tag is in the rule", () => {
    expect(
      matchesReadingListRule(
        { readingListCollections: [4], readingListTags: ["later"] },
        { collectionId: 5, tagNames: ["news"] }
      )
    ).toBe(false);
  });
});

describe("withReadingListStatus", () => {
  it("adds new links as unread", () => {
    expect(
      withReadingListStatus({ unread: [1], read: [] }, [2, 3], "unread")
    ).toEqual({ unread: [1, 2, 3], read: [] });
  });

  it("moves unread links to read", () => {
    expect(
      withReadingListStatus({ unread: [1, 2], read: [5] }, [2], "read")
    ).toEqual({ unread: [1], read: [5, 2] });
  });

  it("moves read links back to unread", () => {
    expect(
      withReadingListStatus({ unread: [], read: [5, 6] }, [5], "unread")
    ).toEqual({ unread: [5], read: [6] });
  });

  it("removes links from both lists when the status is null", () => {
    expect(
      withReadingListStatus({ unread: [1, 2], read: [3] }, [2, 3], null)
    ).toEqual({ unread: [1], read: [] });
  });

  it("does not duplicate links already in the target list", () => {
    expect(
      withReadingListStatus({ unread: [1], read: [] }, [1], "unread")
    ).toEqual({ unread: [1], read: [] });
  });
});
