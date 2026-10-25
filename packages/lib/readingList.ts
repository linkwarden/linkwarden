import { ReadingListState, ReadingListStatus } from "@linkwarden/types/global";

type ReadingListRule = {
  readingListCollections: number[];
  readingListTags: string[];
};

const normalizeTag = (name: string) => name.trim().toLowerCase();

// Decides whether a newly saved link joins its creator's reading list.
export function matchesReadingListRule(
  rule: ReadingListRule,
  link: { collectionId: number; tagNames: string[] }
) {
  if (rule.readingListCollections.includes(link.collectionId)) return true;

  const ruleTags = new Set(rule.readingListTags.map(normalizeTag));
  return link.tagNames.some((name) => ruleTags.has(normalizeTag(name)));
}

// Returns the state after moving linkIds to a status (null removes them).
export function withReadingListStatus(
  state: ReadingListState,
  linkIds: number[],
  status: ReadingListStatus | null
): ReadingListState {
  const ids = new Set(linkIds);
  const unread = state.unread.filter((id) => !ids.has(id));
  const read = state.read.filter((id) => !ids.has(id));

  if (status === "unread") unread.push(...Array.from(ids));
  if (status === "read") read.push(...Array.from(ids));

  return { unread, read };
}
