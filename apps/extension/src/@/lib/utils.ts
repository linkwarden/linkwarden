import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TabInfo {
  url: string;
  title: string;
}

export async function getCurrentTabInfo(): Promise<{
  id: number | undefined;
  title: string | undefined;
  url: string | undefined;
}> {
  const tabs = await getBrowser().tabs.query({
    active: true,
    currentWindow: true,
  });
  const { id, url, title } = tabs[0];
  return { id, url, title };
}

// Firefox exposes `browser`, Chromium exposes `chrome`. The two are API
// compatible for everything used here, and the rest of the codebase already
// refers to the `chrome.*` type namespace, so pin the return type to it rather
// than leaking a `chrome | browser` union that no call site can narrow.
export function getBrowser(): typeof chrome {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  return typeof browser !== "undefined" ? browser : chrome;
}

export function getChromeStorage() {
  return typeof chrome !== "undefined" && !!chrome.storage;
}

export async function getStorageItem(key: string): Promise<string | undefined> {
  if (getChromeStorage()) {
    const result = await getBrowser().storage.local.get([key]);
    return result[key] as string | undefined;
  } else {
    const result = await getBrowser().storage.local.get(key);
    return result[key] as string | undefined;
  }
}

export async function setStorageItem(key: string, value: string) {
  if (getChromeStorage()) {
    return await chrome.storage.local.set({ [key]: value });
  } else {
    await getBrowser().storage.local.set({ [key]: value });
    return Promise.resolve();
  }
}

export function isSafari(): boolean {
  try {
    return /^safari-web-extension:/.test(getBrowser().runtime.getURL(""));
  } catch {
    return false;
  }
}

export function hasAPI(api: string): boolean {
  const b = getBrowser();
  let obj: any = b;
  for (const part of api.split(".")) {
    if (!obj || typeof obj[part] === "undefined") return false;
    obj = obj[part];
  }
  return true;
}

export async function updateBadge(
  tabId: number | undefined,
  linkExists: boolean
) {
  if (!tabId) return;

  const browser = getBrowser();
  const action = browser.action ?? browser.browserAction;
  if (!action) return;

  const text = linkExists ? "✓" : "";
  const background = "#4688F1";
  const foreground = "#FFFFFF";

  action.setBadgeText({ tabId, text });
  if (linkExists) {
    action.setBadgeBackgroundColor({ tabId, color: background });
    action.setBadgeTextColor?.({ tabId, color: foreground });
  }

  // Brave (and some Chromium builds) do not repaint a tab-scoped toolbar
  // badge until the tab is deactivated and selected again. If this tab is
  // showing, also set the window badge so the checkmark appears immediately.
  try {
    const tab = await browser.tabs.get(tabId);
    if (!tab.active) return;
    action.setBadgeText({ text });
    if (linkExists) {
      action.setBadgeBackgroundColor({ color: background });
      action.setBadgeTextColor?.({ color: foreground });
    }
  } catch {
    // Tab was closed.
  }
}
