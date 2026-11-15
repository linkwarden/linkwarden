import { describe, expect, it } from "vitest";
import tagSearch from "./tagSearch";
import {
  buildMeiliSearches,
  parseSearchQuery,
} from "@/lib/api/searchQueryBuilder";

const searchesFor = (tag: string) =>
  buildMeiliSearches(parseSearchQuery(tagSearch(tag)), 1);

describe("tagSearch", () => {
  it("searches a plain tag as a phrase", () => {
    expect(tagSearch("news")).toBe('"news"');
    expect(searchesFor("web dev")).toEqual([
      { q: '"web dev"', filters: [], ranked: true, exact: true },
    ]);
  });

  it("searches a name that looks like search syntax as written", () => {
    for (const tag of [
      "!important",
      "!(archived)",
      "Black AND White",
      "tea OR coffee",
      "(draft)",
      "a (b OR c)",
      "rock 'n' roll",
      "'90s",
      "what's new",
    ])
      expect(searchesFor(tag)).toEqual([
        { q: `"${tag}"`, filters: [], ranked: true, exact: true },
      ]);
  });

  it("keeps quotes and backslashes in the name", () => {
    expect(tagSearch('say "hello"')).toBe('"say \\"hello\\""');
    expect(searchesFor('say "hello"')).toEqual([
      { q: 'say "hello"', filters: [], ranked: true, exact: true },
    ]);
    expect(searchesFor("C:\\temp\\")).toEqual([
      { q: '"C:\\temp\\"', filters: [], ranked: true, exact: true },
    ]);
  });
});
