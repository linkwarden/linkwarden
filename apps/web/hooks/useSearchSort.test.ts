// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Sort } from "@linkwarden/types/global";
import useSearchSort from "./useSearchSort";
import useLinkSort from "./useLinkSort";

function Probe() {
  const [sortBy] = useSearchSort();
  return createElement("span", null, String(sortBy));
}

const sortShown = () =>
  Number(renderToString(createElement(Probe)).replace(/<[^>]+>/g, ""));

describe("useSearchSort", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts on best match", () => {
    expect(sortShown()).toBe(Sort.BestMatch);
  });

  it("doesn't take the sort the other lists use", () => {
    localStorage.setItem("linkSort", String(Sort.NameAZ));
    localStorage.setItem("sortBy", String(Sort.DateOldestFirst));

    expect(sortShown()).toBe(Sort.BestMatch);
  });

  it("keeps a sort picked for search", () => {
    localStorage.setItem("searchSort", String(Sort.DateNewestFirst));

    expect(sortShown()).toBe(Sort.DateNewestFirst);
  });

  it("ignores saved values that aren't a search sort", () => {
    for (const saved of [String(Sort.Custom), "999", "not a number", ""]) {
      localStorage.setItem("searchSort", saved);

      expect(sortShown()).toBe(Sort.BestMatch);
    }
  });

  it("is saved apart from the other lists' sort", () => {
    let setSearchSort: (sort: Sort) => void = () => {};
    function Setter() {
      setSearchSort = useSearchSort()[1];
      return null;
    }
    renderToString(createElement(Setter));

    setSearchSort(Sort.NameZA);

    expect(localStorage.getItem("searchSort")).toBe(String(Sort.NameZA));
    expect(localStorage.getItem("linkSort")).toBeNull();

    function ListProbe() {
      return createElement("span", null, String(useLinkSort(false)[0]));
    }
    expect(
      renderToString(createElement(ListProbe)).replace(/<[^>]+>/g, "")
    ).toBe(String(Sort.DateNewestFirst));
  });
});
