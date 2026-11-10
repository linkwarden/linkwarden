import { afterEach, describe, expect, it, vi } from "vitest";

// Covers what happens when the user presses Enter after the "lw" keyword.

function fakeEvent<Args extends unknown[]>() {
  const listeners: ((...args: Args) => unknown)[] = [];
  return {
    addListener(listener: (...args: Args) => unknown) {
      listeners.push(listener);
    },
    async trigger(...args: Args) {
      await Promise.all(listeners.map((listener) => listener(...args)));
    },
  };
}

const CONFIG = {
  baseUrl: "https://links.example.com",
  apiKey: "secret-token",
  defaultCollection: "Unorganized",
  syncBookmarks: false,
};

// Only the parts of the extension API the background script touches while it
// loads and while it handles omnibox input.
function stubBrowser({
  configured = true,
  activeTabUrl = "https://example.com/start",
} = {}) {
  const tabs = {
    query: vi.fn(async () => [{ id: 1, url: activeTabUrl }]),
    update: vi.fn(),
    create: vi.fn(),
    onUpdated: fakeEvent<[]>(),
  };
  const omnibox = {
    setDefaultSuggestion: vi.fn(),
    onInputStarted: fakeEvent<[]>(),
    onInputChanged:
      fakeEvent<
        [string, (suggestions: chrome.omnibox.SuggestResult[]) => void]
      >(),
    onInputEntered: fakeEvent<[string, string]>(),
  };
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: async () =>
          configured ? { linkwarden_config: JSON.stringify(CONFIG) } : {},
      },
    },
    // webextension-polyfill refuses to load without a runtime id.
    runtime: { id: "linkwarden-test", onInstalled: fakeEvent<[]>() },
    contextMenus: { onClicked: fakeEvent<[]>() },
    tabs,
    omnibox,
  });
  return { tabs, omnibox };
}

// The background script registers its listeners as it loads, so every test
// gets a fresh copy of it.
async function loadBackground(options?: Parameters<typeof stubBrowser>[0]) {
  const browser = stubBrowser(options);
  vi.resetModules();
  await import("./index.ts");
  return browser;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("omnibox input", () => {
  it("opens the chosen link where the user asked", async () => {
    const { tabs, omnibox } = await loadBackground();

    await omnibox.onInputEntered.trigger(
      "https://saved.example/1",
      "currentTab"
    );
    expect(tabs.update).toHaveBeenCalledWith({
      url: "https://saved.example/1",
    });

    await omnibox.onInputEntered.trigger(
      "http://saved.example/2",
      "newForegroundTab"
    );
    expect(tabs.create).toHaveBeenLastCalledWith({
      url: "http://saved.example/2",
    });

    await omnibox.onInputEntered.trigger(
      "https://saved.example/3",
      "newBackgroundTab"
    );
    expect(tabs.create).toHaveBeenLastCalledWith({
      url: "https://saved.example/3",
      active: false,
    });
  });

  it("searches the instance for text that isn't a link", async () => {
    const { tabs, omnibox } = await loadBackground();
    const searchUrl = "https://links.example.com/search?q=docs";

    await omnibox.onInputEntered.trigger("docs", "currentTab");
    expect(tabs.update).toHaveBeenCalledWith({ url: searchUrl });

    await omnibox.onInputEntered.trigger("docs", "newForegroundTab");
    expect(tabs.create).toHaveBeenLastCalledWith({ url: searchUrl });

    await omnibox.onInputEntered.trigger("docs", "newBackgroundTab");
    expect(tabs.create).toHaveBeenLastCalledWith({
      url: searchUrl,
      active: false,
    });
  });

  it("encodes the search text", async () => {
    const { tabs, omnibox } = await loadBackground();

    await omnibox.onInputEntered.trigger(
      "c++ & rust?tag=a#top 日本",
      "newForegroundTab"
    );

    const { url } = tabs.create.mock.lastCall![0];
    expect(url).toBe(
      "https://links.example.com/search?q=c%2B%2B%20%26%20rust%3Ftag%3Da%23top%20%E6%97%A5%E6%9C%AC"
    );
    expect(new URL(url).searchParams.get("q")).toBe(
      "c++ & rust?tag=a#top 日本"
    );
  });

  it("searches for other schemes instead of opening them", async () => {
    const { tabs, omnibox } = await loadBackground();

    for (const text of ["javascript:alert(1)", "file:///etc/passwd"]) {
      await omnibox.onInputEntered.trigger(text, "currentTab");
      expect(tabs.update).toHaveBeenLastCalledWith({
        url: "https://links.example.com/search?q=" + encodeURIComponent(text),
      });
    }
  });

  it("searches in a new tab instead of replacing Edge's new tab page", async () => {
    const { tabs, omnibox } = await loadBackground({
      activeTabUrl: "edge://newtab/",
    });

    await omnibox.onInputEntered.trigger("docs", "currentTab");

    expect(tabs.update).not.toHaveBeenCalled();
    expect(tabs.create).toHaveBeenCalledWith({
      url: "https://links.example.com/search?q=docs",
    });
  });

  it("ignores input until configured", async () => {
    const { tabs, omnibox } = await loadBackground({ configured: false });

    await omnibox.onInputEntered.trigger("docs", "newForegroundTab");
    await omnibox.onInputEntered.trigger(
      "https://saved.example/1",
      "currentTab"
    );

    expect(tabs.create).not.toHaveBeenCalled();
    expect(tabs.update).not.toHaveBeenCalled();
  });
});
