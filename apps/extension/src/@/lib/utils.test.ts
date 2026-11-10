import { fakeBrowser } from "@webext-core/fake-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBrowser,
  getCurrentTabInfo,
  hasAPI,
  isSafari,
  updateBadge,
} from "./utils.ts";

beforeEach(() => {
  fakeBrowser.reset();
  vi.stubGlobal("chrome", fakeBrowser);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getBrowser", () => {
  it("prefers Firefox's browser global over chrome", () => {
    const firefox = { runtime: {} };
    vi.stubGlobal("browser", firefox);

    expect(getBrowser()).toBe(firefox);
  });

  it("falls back to chrome", () => {
    expect(getBrowser()).toBe(fakeBrowser);
  });
});

describe("getCurrentTabInfo", () => {
  it("returns the active tab of the current window", async () => {
    // fake-browser has no current window until one is focused.
    await fakeBrowser.windows.create({ focused: true });
    await fakeBrowser.tabs.create({ url: "https://example.com/other" });
    const active = await fakeBrowser.tabs.create({
      url: "https://example.com/article",
      active: true,
    });

    expect(await getCurrentTabInfo()).toMatchObject({
      id: active.id,
      url: "https://example.com/article",
    });
  });
});

describe("hasAPI", () => {
  it("follows a dotted path through the browser global", () => {
    expect(hasAPI("storage.local")).toBe(true);
    expect(hasAPI("tabs.query")).toBe(true);
    expect(hasAPI("storage.missing")).toBe(false);
    expect(hasAPI("missing.query")).toBe(false);
  });

  it("reports an API the browser leaves out, like Safari's omnibox", () => {
    vi.stubGlobal("chrome", { ...fakeBrowser, omnibox: undefined });

    expect(hasAPI("omnibox.onInputStarted")).toBe(false);
  });
});

describe("isSafari", () => {
  it("recognises Safari by its extension URL scheme", () => {
    vi.spyOn(fakeBrowser.runtime, "getURL").mockReturnValue(
      "safari-web-extension://ABCDEF/"
    );

    expect(isSafari()).toBe(true);
  });

  it("is false for Chrome and Firefox URLs", () => {
    expect(isSafari()).toBe(false);

    vi.spyOn(fakeBrowser.runtime, "getURL").mockReturnValue(
      "moz-extension://abcdef/"
    );
    expect(isSafari()).toBe(false);
  });

  it("is false when the runtime is unavailable", () => {
    vi.spyOn(fakeBrowser.runtime, "getURL").mockImplementation(() => {
      throw new Error("Extension context invalidated");
    });

    expect(isSafari()).toBe(false);
  });
});

describe("updateBadge", () => {
  it("marks a saved link with a check and clears it again", async () => {
    await updateBadge(3, true);
    expect(await fakeBrowser.action.getBadgeText({ tabId: 3 })).toBe("✓");

    await updateBadge(3, false);
    expect(await fakeBrowser.action.getBadgeText({ tabId: 3 })).toBe("");
  });

  it("only touches the given tab", async () => {
    await updateBadge(3, true);

    expect(await fakeBrowser.action.getBadgeText({ tabId: 4 })).toBe("");
  });

  it("does nothing without a tab id", async () => {
    const setBadgeText = vi.spyOn(fakeBrowser.action, "setBadgeText");

    await updateBadge(undefined, true);

    expect(setBadgeText).not.toHaveBeenCalled();
  });
});
