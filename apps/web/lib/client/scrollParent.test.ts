// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { getScrollParent } from "./scrollParent";

const build = (html: string) => {
  document.body.innerHTML = html;
  return document.getElementById("list") as HTMLElement;
};

describe("getScrollParent", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is the nearest container that scrolls vertically", () => {
    const list = build(`
      <div id="outer" style="overflow-y: auto">
        <div id="inner" style="overflow-y: scroll">
          <div><div id="list"></div></div>
        </div>
      </div>`);

    expect(getScrollParent(list)).toBe(document.getElementById("inner"));
  });

  it("skips containers that clip or show their overflow", () => {
    const list = build(`
      <div id="scroller" style="overflow-y: auto">
        <div style="overflow-y: hidden">
          <div style="overflow: visible"><div id="list"></div></div>
        </div>
      </div>`);

    expect(getScrollParent(list)).toBe(document.getElementById("scroller"));
  });

  it("doesn't count the list itself", () => {
    const list = build(`
      <div id="scroller" style="overflow-y: auto">
        <div id="list" style="overflow-y: auto"></div>
      </div>`);

    expect(getScrollParent(list)).toBe(document.getElementById("scroller"));
  });

  // A page outside the dashboard layout, like a public collection, scrolls
  // the window, which is what gets the scroll events
  it("is the window when nothing around the list scrolls", () => {
    const list = build(
      `<div><div style="overflow-x: auto"><div id="list"></div></div></div>`
    );

    expect(getScrollParent(list)).toBe(window);
  });
});
