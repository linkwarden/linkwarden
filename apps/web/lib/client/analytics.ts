import type { CaptureResult, PostHog, Properties } from "posthog-js";

// Loaded by startAnalytics, so pages on instances without a PostHog key
// (like self-hosted ones) never download posthog-js
let posthog: PostHog | null = null;
let started = false;
let allowed = false;
let droppedPageview = false;

// Ids in paths become [id] and query strings (search terms, tokens) and
// hashes are dropped, so a page is only recorded as its route
export const sanitizePath = (path: string) =>
  path.split(/[?#]/)[0].replace(/\/\d+(?=\/|$)/g, "/[id]");

export const sanitizeUrl = (url: string) => {
  try {
    const { origin, pathname } = new URL(url);
    return origin + sanitizePath(pathname);
  } catch {
    return null;
  }
};

const getOrigin = (url: string) => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

// Ad networks' URL parameters, like gclid and fbclid, can identify a single
// click, so of the campaign parameters PostHog reads only utm_* tags are kept
const adParameters = new Set([
  "gad_source",
  "mc_cid",
  "gclid",
  "gclsrc",
  "dclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "msclkid",
  "twclid",
  "li_fat_id",
  "igshid",
  "ttclid",
  "rdt_cid",
  "epik",
  "qclid",
  "sccid",
  "oppref",
  "bfcid",
  "irclid",
  "_kx",
  "$fbc",
  "$fbp",
]);

// Also matches the first-touch copies PostHog keeps, like $initial_gclid
const isAdParameter = (key: string) =>
  adParameters.has(key.replace(/^\$initial_/, ""));

const sanitizeProperties = (properties?: Properties) => {
  if (!properties) return properties;

  const sanitized: Properties = {};

  for (const [key, value] of Object.entries(properties)) {
    // The page title can be a collection or link name
    if (key === "title" || isAdParameter(key)) continue;

    if (typeof value === "string" && key.endsWith("_url"))
      sanitized[key] = sanitizeUrl(value);
    else if (typeof value === "string" && key.endsWith("pathname"))
      sanitized[key] = sanitizePath(value);
    // Only the referring site is kept, not the page on it
    else if (typeof value === "string" && key.endsWith("referrer"))
      sanitized[key] = value.startsWith("http") ? getOrigin(value) : value;
    // Heatmap clicks are grouped by the page URL
    else if (key === "$heatmap_data" && value && typeof value === "object") {
      const heatmapData: Record<string, unknown[]> = {};

      for (const [url, clicks] of Object.entries(value)) {
        const sanitizedUrl = sanitizeUrl(url);
        if (!sanitizedUrl || !Array.isArray(clicks)) continue;

        heatmapData[sanitizedUrl] = [
          ...(heatmapData[sanitizedUrl] || []),
          ...clicks,
        ];
      }

      sanitized[key] = heatmapData;
    } else sanitized[key] = value;
  }

  return sanitized;
};

export const beforeSend = (event: CaptureResult | null) => {
  if (!event) return null;

  if (!allowed) {
    if (event.event === "$pageview") droppedPageview = true;
    return null;
  }

  return {
    ...event,
    properties: sanitizeProperties(event.properties) as Properties,
    $set: sanitizeProperties(event.$set),
    $set_once: sanitizeProperties(event.$set_once),
  };
};

// Turned off while a signed in user's setting is loading or once they opt out
export const setAnalyticsAllowed = (value: boolean) => {
  allowed = value;

  // Records the page that was opened while the setting was loading, like the
  // dashboard right after signing in
  if (posthog && allowed && droppedPageview) {
    droppedPageview = false;
    posthog.capture("$pageview");
  }
};

export const startAnalytics = async (key: string, host: string) => {
  if (started) return;
  started = true;

  let client: PostHog;

  try {
    client = (await import("posthog-js")).default;
  } catch {
    // Like a chunk that failed to download, so a later call can try again
    started = false;
    return;
  }

  client.init(key, {
    api_host: host,
    defaults: "2026-08-30",
    // Nothing is stored in the browser, so no cookie banner is needed.
    // Requires "Enable cookieless tracking" in the PostHog project settings.
    cookieless_mode: "always",
    disable_session_recording: true,
    // Clicked elements and their text can include saved links and names
    autocapture: false,
    rageclick: false,
    capture_dead_clicks: false,
    // Web vitals keep their own copy of the page URL
    capture_performance: false,
    // Heatmaps only keep positions (clicks, where the pointer rests, scroll
    // depth), grouped by the cleaned page URL in beforeSend. Set here because
    // advanced_disable_flags also turns off the project's remote config.
    capture_heatmaps: true,
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
    advanced_disable_flags: true,
    disable_surveys: true,
    disable_product_tours: true,
    disable_conversations: true,
    disable_web_experiments: true,
    before_send: beforeSend,
  });

  posthog = client;
};
