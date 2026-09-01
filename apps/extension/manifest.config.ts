/**
 * Single source of truth for the extension manifest.
 *
 * Every browser gets the same manifest apart from the handful of keys collected
 * in `targets` below. The vite plugin in vite.config.ts writes the result into
 * the build output, so there is no manifest.json checked into the repo.
 */

/**
 * `default` is the Chrome and Firefox build (`dist/`), which the two browsers
 * share, so it carries the keys for both. `safari` is `dist-safari/`.
 */
export type ManifestTarget = "default" | "safari";

type TargetOptions = {
  /** `minimum_chrome_version`, left off where it means nothing. */
  minimumChromeVersion?: string;
  /** Safari web extensions have no bookmarks API. */
  bookmarks: boolean;
  /** Chrome runs the background as a service worker; the others use `scripts`. */
  serviceWorker: boolean;
  /** Address bar keyword, which Safari does not support. */
  omnibox: boolean;
  browserSpecificSettings: Record<string, unknown>;
};

const targets: Record<ManifestTarget, TargetOptions> = {
  default: {
    minimumChromeVersion: "121",
    bookmarks: true,
    serviceWorker: true,
    omnibox: true,
    browserSpecificSettings: {
      gecko: {
        id: "jordanlinkwarden@gmail.com",
        strict_min_version: "121.0",
      },
    },
  },
  safari: {
    bookmarks: false,
    serviceWorker: false,
    omnibox: false,
    browserSpecificSettings: {
      safari: {
        strict_min_version: "15.4",
      },
    },
  },
};

const version = "1.5.4";

const icons = {
  "16": "16.png",
  "32": "32.png",
  "48": "48.png",
  "128": "128.png",
};

export function buildManifest(target: ManifestTarget) {
  const options = targets[target];

  return {
    manifest_version: 3,
    ...(options.minimumChromeVersion
      ? { minimum_chrome_version: options.minimumChromeVersion }
      : {}),
    name: "Linkwarden",
    description:
      "Save webpages, capture screenshots, and organize links in your Linkwarden collections.",
    homepage_url: "https://linkwarden.app/",
    version,
    action: {
      default_popup: "index.html",
      default_icon: icons,
      default_title: "Linkwarden",
    },
    options_ui: {
      page: "src/pages/Options/options.html",
      browser_style: false,
    },
    icons,
    permissions: [
      "storage",
      "scripting",
      "activeTab",
      "tabs",
      ...(options.bookmarks ? ["bookmarks"] : []),
      "contextMenus",
    ],
    host_permissions: ["<all_urls>"],
    background: {
      ...(options.serviceWorker ? { service_worker: "background.js" } : {}),
      scripts: ["background.js"],
      type: "module",
    },
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; connect-src 'self' http: https:;",
    },
    ...(options.omnibox ? { omnibox: { keyword: "lk" } } : {}),
    commands: {
      _execute_action: {
        suggested_key: { default: "Ctrl+Shift+F", mac: "Command+Shift+Y" },
      },
    },
    browser_specific_settings: options.browserSpecificSettings,
  };
}

export function resolveTarget(value = process.env.EXT_TARGET): ManifestTarget {
  if (value === undefined || value === "default") return "default";
  if (value === "safari") return "safari";
  throw new Error(
    `Unknown EXT_TARGET "${value}". Expected "default" or "safari".`
  );
}
