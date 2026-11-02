import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import oldestFirst, { isStorableDate } from "./oldestFirst";

type Item = { name: string; date?: Date | null };

const names = (items: Item[]) => items.map((item) => item.name);
const byDate = (items: Item[]) => oldestFirst(items, (item) => item.date);

const NOW = new Date("2025-06-15T12:00:00.000Z");

describe("oldestFirst", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("puts links in date order, oldest first", () => {
    expect(
      names(
        byDate([
          { name: "2024", date: new Date("2024-01-01") },
          { name: "2020", date: new Date("2020-01-01") },
          { name: "2023", date: new Date("2023-01-01") },
          { name: "1999", date: new Date("1999-12-31T23:59:59.999Z") },
        ])
      )
    ).toEqual(["1999", "2020", "2023", "2024"]);
  });

  it("keeps the given order for links with the same date", () => {
    const date = new Date("2022-01-01");

    expect(
      names(
        byDate([
          { name: "c", date },
          { name: "older", date: new Date("2021-01-01") },
          { name: "a", date: new Date(date) },
          { name: "b", date },
        ])
      )
    ).toEqual(["older", "c", "a", "b"]);
  });

  it("places links without a date as of now: after past dates, before future ones", () => {
    expect(
      names(
        byDate([
          { name: "future", date: new Date(NOW.getTime() + 1) },
          { name: "undefined" },
          { name: "past", date: new Date(NOW.getTime() - 1) },
          { name: "null", date: null },
          { name: "now", date: new Date(NOW) },
        ])
      )
    ).toEqual(["past", "undefined", "null", "now", "future"]);
  });

  it("puts dates that can't be stored last, in the given order, after every link that can be", () => {
    const items: Item[] = [
      { name: "invalid", date: new Date("not a date") },
      { name: "year 10000", date: new Date("+010000-01-01T00:00:00.000Z") },
      { name: "2022", date: new Date("2022-01-01") },
      { name: "undated" },
      { name: "year -1", date: new Date("-000001-12-31T23:59:59.999Z") },
      { name: "2021", date: new Date("2021-01-01") },
      { name: "future", date: new Date("9000-01-01") },
    ];

    expect(names(byDate(items))).toEqual([
      "2021",
      "2022",
      "undated",
      "future",
      "invalid",
      "year 10000",
      "year -1",
    ]);
  });

  it("counts the first and last moments of years 0 and 9999 as dates", () => {
    expect(
      names(
        byDate([
          { name: "end of 9999", date: new Date("9999-12-31T23:59:59.999Z") },
          { name: "undated" },
          { name: "start of 0", date: new Date("0000-01-01T00:00:00.000Z") },
          { name: "epoch", date: new Date(0) },
        ])
      )
    ).toEqual(["start of 0", "epoch", "undated", "end of 9999"]);
  });

  it("reads each link's date once and leaves the given array as it was", () => {
    const items: Item[] = [
      { name: "b", date: new Date("2022-01-01") },
      { name: "a", date: new Date("2021-01-01") },
    ];
    const dateOf = vi.fn((item: Item) => item.date);

    const sorted = oldestFirst(items, dateOf);

    expect(names(sorted)).toEqual(["a", "b"]);
    expect(names(items)).toEqual(["b", "a"]);
    expect(sorted[0]).toBe(items[1]);
    expect(dateOf).toHaveBeenCalledTimes(2);
  });

  it("returns an empty list for no links", () => {
    expect(oldestFirst([], () => new Date())).toEqual([]);
  });
});

describe("isStorableDate", () => {
  it("accepts valid dates in the years 0 to 9999 only", () => {
    expect(isStorableDate(new Date("0000-01-01T00:00:00.000Z"))).toBe(true);
    expect(isStorableDate(new Date("2024-06-15T12:00:00.000Z"))).toBe(true);
    expect(isStorableDate(new Date("9999-12-31T23:59:59.999Z"))).toBe(true);

    expect(isStorableDate(new Date("-000001-12-31T23:59:59.999Z"))).toBe(false);
    expect(isStorableDate(new Date("+010000-01-01T00:00:00.000Z"))).toBe(false);
    expect(isStorableDate(new Date("not a date"))).toBe(false);
  });
});
