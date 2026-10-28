import { fakeBrowser } from "@webext-core/fake-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// fake-browser leaves contextMenus and omnibox unimplemented, so the tests
// stand in for them with events they can fire by hand.
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

function stubBrowser() {
  const contextMenus = {
    create: vi.fn(),
    onClicked:
      fakeEvent<
        [chrome.contextMenus.OnClickData, chrome.tabs.Tab | undefined]
      >(),
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
  vi.stubGlobal("chrome", { ...fakeBrowser, contextMenus, omnibox });
  return { contextMenus, omnibox };
}

const CONFIG = {
  baseUrl: "https://links.example.com",
  apiKey: "secret-token",
  defaultCollection: "Unorganized",
  syncBookmarks: false,
};

const SAVED_LINK = {
  id: 42,
  collectionId: 1,
  url: "https://example.com/article",
  name: "An article",
  description: "An article",
  tags: [],
};

const clicked = (menuItemId: string) =>
  ({ menuItemId }) as chrome.contextMenus.OnClickData;

const articleTab = {
  id: 7,
  url: "https://example.com/article",
  title: "An article",
} as chrome.tabs.Tab;

let contextMenus: ReturnType<typeof stubBrowser>["contextMenus"];
let omnibox: ReturnType<typeof stubBrowser>["omnibox"];
const fetchMock = vi.fn<typeof fetch>();

// The background script registers its listeners as it loads, so every test
// gets a fresh copy of it.
async function loadBackground({ configured = true } = {}) {
  if (configured) {
    await fakeBrowser.storage.local.set({
      linkwarden_config: JSON.stringify(CONFIG),
    });
  }
  await import("./index.ts");
}

function postedLinks() {
  return fetchMock.mock.calls.map(([url, init]) => ({
    url,
    body: JSON.parse(init?.body as string),
    headers: init?.headers,
  }));
}

beforeEach(async () => {
  fakeBrowser.reset();
  // fake-browser has no current window until one is focused.
  await fakeBrowser.windows.create({ focused: true });
  vi.resetModules();
  ({ contextMenus, omnibox } = stubBrowser());
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () =>
    Response.json({ response: SAVED_LINK })
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("context menu", () => {
  it("adds an item for every context on install", async () => {
    await loadBackground();
    await fakeBrowser.runtime.onInstalled.trigger({ reason: "install" });

    expect(contextMenus.create.mock.calls.map(([item]) => item.id)).toEqual([
      "page",
      "selection",
      "link",
      "editable",
      "image",
      "video",
      "audio",
      "save-all-tabs",
    ]);
  });

  it("only uses the contexts Safari supports", async () => {
    vi.spyOn(fakeBrowser.runtime, "getURL").mockReturnValue(
      "safari-web-extension://ABCDEF/"
    );
    await loadBackground();
    await fakeBrowser.runtime.onInstalled.trigger({ reason: "install" });

    expect(contextMenus.create.mock.calls.map(([item]) => item.id)).toEqual([
      "page",
      "selection",
      "link",
      "save-all-tabs",
    ]);
  });

  it("saves the page to Unorganized and caches the new link", async () => {
    await loadBackground();
    await contextMenus.onClicked.trigger(clicked("page"), articleTab);

    expect(postedLinks()).toEqual([
      {
        url: "https://links.example.com/api/v1/links",
        body: {
          url: "https://example.com/article",
          collection: { name: "Unorganized" },
          tags: [],
          name: "An article",
          description: "An article",
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer secret-token",
        },
      },
    ]);

    const { getBookmarksMetadata } = await import("../../@/lib/cache.ts");
    expect(await getBookmarksMetadata()).toEqual([
      { ...SAVED_LINK, bookmarkId: "7" },
    ]);
  });

  it("does nothing until the extension is configured", async () => {
    await loadBackground({ configured: false });
    await contextMenus.onClicked.trigger(clicked("page"), articleTab);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores tabs without a URL", async () => {
    await loadBackground();
    await contextMenus.onClicked.trigger(clicked("page"), {
      ...articleTab,
      url: undefined,
    });
    await contextMenus.onClicked.trigger(clicked("page"), undefined);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("saves every web page in the window and skips browser pages", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const url of [
      "https://a.example.com/",
      "chrome://extensions/",
      "about:blank",
      "https://b.example.com/",
    ]) {
      await fakeBrowser.tabs.create({ url });
    }
    // One failed save must not stop the rest.
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await loadBackground();
    await contextMenus.onClicked.trigger(clicked("save-all-tabs"), articleTab);

    expect(postedLinks().map(({ body }) => body.url)).toEqual([
      "https://a.example.com/",
      "https://b.example.com/",
    ]);
    expect(postedLinks()[1].body.collection).toEqual({ name: "Unorganized" });
  });
});

describe("badge", () => {
  it("clears the saved mark when a tab navigates", async () => {
    await loadBackground();
    await fakeBrowser.action.setBadgeText({ tabId: 5, text: "✓" });

    await fakeBrowser.tabs.onUpdated.trigger(
      5,
      { status: "loading" },
      articleTab
    );
    expect(await fakeBrowser.action.getBadgeText({ tabId: 5 })).toBe("✓");

    await fakeBrowser.tabs.onUpdated.trigger(
      5,
      { url: "https://example.com/next" },
      articleTab
    );
    expect(await fakeBrowser.action.getBadgeText({ tabId: 5 })).toBe("");
  });
});

describe("omnibox", () => {
  it("asks to configure the extension first", async () => {
    await loadBackground({ configured: false });
    await omnibox.onInputStarted.trigger();

    expect(omnibox.setDefaultSuggestion).toHaveBeenCalledWith({
      description: "Please configure the extension first",
    });
  });

  it("offers to search once configured", async () => {
    await loadBackground();
    await omnibox.onInputStarted.trigger();

    expect(omnibox.setDefaultSuggestion).toHaveBeenCalledWith({
      description: "Search links in linkwarden",
    });
  });

  it("suggests cached links whose name or URL contains the text", async () => {
    await loadBackground();
    const { saveBookmarksMetadata } = await import("../../@/lib/cache.ts");
    await saveBookmarksMetadata([
      { ...SAVED_LINK, id: 1, name: "Docs home", url: "https://a.example/" },
      { ...SAVED_LINK, id: 2, name: "", url: "https://docs.example/" },
      { ...SAVED_LINK, id: 3, name: "Unrelated", url: "https://c.example/" },
    ]);
    const suggest = vi.fn();

    await omnibox.onInputChanged.trigger("ocs", suggest);

    expect(suggest).toHaveBeenCalledWith([
      { content: "https://a.example/", description: "Docs home" },
      {
        content: "https://docs.example/",
        description: "https://docs.example/",
      },
    ]);
  });

  it("suggests nothing until configured", async () => {
    await loadBackground({ configured: false });
    const suggest = vi.fn();

    await omnibox.onInputChanged.trigger("docs", suggest);

    expect(suggest).not.toHaveBeenCalled();
  });

  it("opens the chosen link where the user asked", async () => {
    await fakeBrowser.tabs.create({
      url: "https://example.com/start",
      active: true,
    });
    // fake-browser can't update the active tab without an explicit tab id, and
    // doesn't make new tabs active by default the way browsers do, so check
    // what the script asks for rather than the resulting tabs.
    const update = vi
      .spyOn(fakeBrowser.tabs, "update")
      .mockResolvedValue(undefined);
    const create = vi.spyOn(fakeBrowser.tabs, "create");
    await loadBackground();

    await omnibox.onInputEntered.trigger(
      "https://saved.example/1",
      "currentTab"
    );
    expect(update).toHaveBeenCalledWith({ url: "https://saved.example/1" });

    await omnibox.onInputEntered.trigger(
      "https://saved.example/2",
      "newForegroundTab"
    );
    expect(create).toHaveBeenLastCalledWith({ url: "https://saved.example/2" });

    await omnibox.onInputEntered.trigger(
      "https://saved.example/3",
      "newBackgroundTab"
    );
    expect(create).toHaveBeenLastCalledWith({
      url: "https://saved.example/3",
      active: false,
    });
  });

  it("opens a new tab instead of replacing Edge's new tab page", async () => {
    const newTabPage = await fakeBrowser.tabs.create({
      url: "edge://newtab/",
      active: true,
    });
    await loadBackground();

    await omnibox.onInputEntered.trigger(
      "https://saved.example/1",
      "currentTab"
    );

    expect((await fakeBrowser.tabs.get(newTabPage.id!)).url).toBe(
      "edge://newtab/"
    );
    expect(
      await fakeBrowser.tabs.query({ url: "https://saved.example/1" })
    ).toHaveLength(1);
  });

  it("ignores input until configured", async () => {
    await loadBackground({ configured: false });

    await omnibox.onInputEntered.trigger(
      "https://saved.example/1",
      "newForegroundTab"
    );

    expect(
      await fakeBrowser.tabs.query({ url: "https://saved.example/1" })
    ).toHaveLength(0);
  });
});
