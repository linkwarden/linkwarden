// Playwright hands each fixture a `use` callback, which isn't React's hook.
/* eslint-disable react-hooks/rules-of-hooks */
import {
  test as baseTest,
  chromium,
  type BrowserContext,
  type Page,
  type Worker,
} from "@playwright/test";
import { fileURLToPath } from "url";
import { uniqueUrl, type TestUser } from "./data/api";

export { expect } from "@playwright/test";

const extensionPath = fileURLToPath(new URL("../dist", import.meta.url));

export async function tabIdOf(background: Worker, page: Page) {
  const tabId = await background.evaluate(async (url) => {
    const [tab] = await chrome.tabs.query({ url });
    return tab?.id;
  }, page.url());
  if (tabId === undefined) throw new Error(`No tab found for ${page.url()}`);

  return tabId;
}

export function badgeOf(background: Worker, tabId: number) {
  return background.evaluate(
    (tabId) => chrome.action.getBadgeText({ tabId }),
    tabId
  );
}

export function storedConfig(background: Worker) {
  return background.evaluate(async () => {
    const { linkwarden_config } =
      await chrome.storage.local.get("linkwarden_config");
    return linkwarden_config ? JSON.parse(linkwarden_config as string) : null;
  });
}

export const test = baseTest.extend<{
  context: BrowserContext;
  background: Worker;
  extensionId: string;
  /** Stores a sign-in for `user` the way the options page does. */
  signIn: (user: Pick<TestUser, "token">) => Promise<void>;
  /** Serves a page titled `title` at a fresh localhost URL and opens it. */
  openWebPage: (title: string) => Promise<Page>;
  /** Opens the popup on `target`, as if its toolbar button were clicked. */
  openPopup: (target: Page) => Promise<Page>;
}>({
  // Extensions need a persistent context, and branded Chrome ignores
  // --load-extension, so this uses Playwright's own Chromium.
  context: async ({ baseURL }, use) => {
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      baseURL,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    await use(context);
    await context.close();
  },
  background: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent("serviceworker");
    await use(worker);
  },
  extensionId: async ({ background }, use) => {
    await use(new URL(background.url()).host);
  },
  signIn: async ({ background, baseURL }, use) => {
    await use(async ({ token }) => {
      await background.evaluate(
        (config) =>
          chrome.storage.local.set({
            linkwarden_config: JSON.stringify(config),
          }),
        {
          baseUrl: baseURL,
          apiKey: token,
          defaultCollection: "Unorganized",
          syncBookmarks: false,
        }
      );
    });
  },
  openWebPage: async ({ context }, use) => {
    await use(async (title) => {
      const url = uniqueUrl();
      await context.route(url, (route) =>
        route.fulfill({
          contentType: "text/html",
          body: `<title>${title}</title><h1>${title}</h1>`,
        })
      );
      const page = await context.newPage();
      await page.goto(url);
      return page;
    });
  },
  openPopup: async ({ context, background, extensionId }, use) => {
    await use(async (target) => {
      const tabId = await tabIdOf(background, target);
      const popup = await context.newPage();
      // Playwright can't reach the toolbar popup, so it opens in a tab of its
      // own, where "the active tab" would be the popup itself. Point
      // active-tab lookups at the target instead.
      await popup.addInitScript((tabId) => {
        const query = chrome.tabs.query.bind(chrome.tabs);
        chrome.tabs.query = (async (info: chrome.tabs.QueryInfo) =>
          info.active
            ? [await chrome.tabs.get(tabId)]
            : query(info)) as typeof chrome.tabs.query;
      }, tabId);
      await popup.goto(`chrome-extension://${extensionId}/index.html`);
      return popup;
    });
  },
});
