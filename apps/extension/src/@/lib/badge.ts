import { checkLinkExists } from "./actions/links.ts";
import { getConfig, isConfigured } from "./config.ts";
import { getBrowser, updateBadge } from "./utils.ts";

const MAX_URL_RETRIES = 8;
const badgeHints = new Map<number, string>();
const badgeRetries = new Map<number, number>();
const scheduledTabs = new Set<number>();

export function isCheckableUrl(url: string | undefined): url is string {
  return !!url && (url.startsWith("http://") || url.startsWith("https://"));
}

function isPendingTabUrl(url: string | undefined, status?: string) {
  return (
    status === "loading" ||
    !url ||
    url === "about:blank" ||
    url === "about:newtab"
  );
}

/**
 * `tabs.onActivated` fires before the tab URL is populated, and
 * `tabs.onUpdated` can report `status: "complete"` before `tab.url` is set.
 * Keep the last http(s) URL we saw for this tab and retry until it shows up,
 * otherwise the checkmark only appears after switching away and back.
 *
 * Coalesce with queueMicrotask instead of setTimeout: MV3 service workers
 * in Brave/Chrome often drop those timers before they run.
 */
export function scheduleTabBadge(tabId: number | undefined, url?: string) {
  if (!tabId) return;
  if (isCheckableUrl(url)) {
    badgeHints.set(tabId, url);
  }
  if (scheduledTabs.has(tabId)) return;
  scheduledTabs.add(tabId);
  queueMicrotask(() => {
    scheduledTabs.delete(tabId);
    const hint = badgeHints.get(tabId);
    void updateTabBadge(tabId, hint);
  });
}

export async function updateTabBadge(tabId: number | undefined, url?: string) {
  if (!tabId) return;

  if (!(await isConfigured())) {
    badgeRetries.delete(tabId);
    await updateBadge(tabId, false);
    return;
  }

  let tabUrl = isCheckableUrl(url) ? url : undefined;
  let tab: chrome.tabs.Tab | undefined;
  try {
    tab = await getBrowser().tabs.get(tabId);
    if (!tabUrl) tabUrl = tab.url;
  } catch {
    badgeRetries.delete(tabId);
    return;
  }

  if (!isCheckableUrl(tabUrl)) {
    const attempt = badgeRetries.get(tabId) ?? 0;
    if (isPendingTabUrl(tabUrl, tab.status) && attempt < MAX_URL_RETRIES) {
      badgeRetries.set(tabId, attempt + 1);
      setTimeout(() => {
        void updateTabBadge(tabId);
      }, 100 * (attempt + 1));
      return;
    }
    badgeRetries.delete(tabId);
    await updateBadge(tabId, false);
    return;
  }

  badgeRetries.delete(tabId);

  const { baseUrl, apiKey } = await getConfig();
  const exists = await checkLinkExists(baseUrl, apiKey, tabUrl);
  if (exists === null) return;
  await updateBadge(tabId, exists);
}
