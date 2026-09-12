const OPEN_POPUP_MESSAGE = "lw-open-popup";
const CONFIG_KEY = "linkwarden_config";

let overrideBookmarkShortcut = true;

function readOverride(raw: unknown): boolean {
  if (typeof raw !== "string") return true;
  try {
    return JSON.parse(raw).overrideBookmarkShortcut !== false;
  } catch {
    return true;
  }
}

void chrome.storage.local.get(CONFIG_KEY).then((result) => {
  overrideBookmarkShortcut = readOverride(result[CONFIG_KEY]);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[CONFIG_KEY]) return;
  overrideBookmarkShortcut = readOverride(changes[CONFIG_KEY].newValue);
});

function isBookmarkShortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || event.repeat || event.altKey || event.shiftKey) {
    return false;
  }

  const isD = event.key.toLowerCase() === "d" || event.code === "KeyD";
  if (!isD) return false;

  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  if (isMac) return event.metaKey && !event.ctrlKey;
  return event.ctrlKey && !event.metaKey;
}

window.addEventListener(
  "keydown",
  (event) => {
    if (!overrideBookmarkShortcut || !isBookmarkShortcut(event)) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      const sent = chrome.runtime.sendMessage({ type: OPEN_POPUP_MESSAGE });
      void sent?.catch?.(() => {});
    } catch {
      // The background script may be asleep; the next keypress retries.
    }
  },
  true
);
