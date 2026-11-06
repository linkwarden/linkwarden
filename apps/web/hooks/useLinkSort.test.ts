// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Sort } from "@linkwarden/types/global";
import useLinkSort from "./useLinkSort";

// Renders a list's sort the way a page would read it on first paint
function Probe({ allowCustomOrder }: { allowCustomOrder: boolean }) {
  const [sortBy] = useLinkSort(allowCustomOrder);
  return createElement("span", null, String(sortBy));
}

const sortShown = (allowCustomOrder: boolean) =>
  Number(
    renderToString(createElement(Probe, { allowCustomOrder })).replace(
      /<[^>]+>/g,
      ""
    )
  );

describe("useLinkSort", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts on the custom order inside a collection and newest first elsewhere", () => {
    expect(sortShown(true)).toBe(Sort.Custom);
    expect(sortShown(false)).toBe(Sort.DateNewestFirst);
  });

  it("treats the old default (newest first) as never having picked a sort", () => {
    localStorage.setItem("sortBy", String(Sort.DateNewestFirst));

    expect(sortShown(true)).toBe(Sort.Custom);
    expect(sortShown(false)).toBe(Sort.DateNewestFirst);
  });

  it("keeps a sort picked before the upgrade", () => {
    localStorage.setItem("sortBy", String(Sort.NameAZ));

    expect(sortShown(true)).toBe(Sort.NameAZ);
    expect(sortShown(false)).toBe(Sort.NameAZ);
  });

  it("prefers the sort saved by this version over the old key", () => {
    localStorage.setItem("sortBy", String(Sort.NameAZ));
    localStorage.setItem("linkSort", String(Sort.DateOldestFirst));

    expect(sortShown(true)).toBe(Sort.DateOldestFirst);
  });

  it("ignores values that aren't a sort", () => {
    localStorage.setItem("linkSort", "999");
    localStorage.setItem("sortBy", "not a number");

    expect(sortShown(true)).toBe(Sort.Custom);
    expect(sortShown(false)).toBe(Sort.DateNewestFirst);
  });
});
