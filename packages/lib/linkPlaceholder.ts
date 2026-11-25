// Colors for links that have no preview image. A fixed set of hues keeps every
// color readable in both themes, and the site name picks one, so a site gets
// the same color on every card.
const SITE_HUES = [250, 200, 165, 145, 75, 40, 15, 350, 310, 280];

// Second-level labels under a country code that belong to the suffix, so
// "bbc.co.uk" is named "bbc" rather than "co".
const SECOND_LEVEL_SUFFIXES = new Set([
  "ac",
  "co",
  "com",
  "edu",
  "go",
  "gov",
  "ne",
  "net",
  "or",
  "org",
]);

// FNV-1a, so the same name gives the same color on web and mobile.
const hashString = (text: string) => {
  let hash = 2166136261;

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

/**
 * The part of a URL's host that names the site: "news.example.com" and
 * "www.example.com" are both "example", "bbc.co.uk" is "bbc". IP addresses and
 * single-label hosts are returned whole.
 */
export const getSiteName = (url?: string | null) => {
  if (!url) return undefined;

  let host: string;

  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }

  host = host.replace(/\.$/, "").replace(/^www\./, "");

  if (!host) return undefined;

  if (!host.includes(".") || host.startsWith("[") || /^[\d.]+$/.test(host))
    return host;

  const labels = host.split(".");
  let index = labels.length - 2;

  if (
    index > 0 &&
    labels[labels.length - 1].length === 2 &&
    SECOND_LEVEL_SUFFIXES.has(labels[index])
  )
    index--;

  return labels[index];
};

// ASCII whitespace and punctuation, skipped when picking the initial.
const SKIPPED_CHARACTER = /[\s!-/:-@[-`{-~]/;

/**
 * What a card shows in place of a missing preview: the site's color and the
 * first letter of the site's name (or of the link's name when it has no URL).
 */
export const getLinkPlaceholder = (link: {
  url?: string | null;
  name?: string | null;
}) => {
  const key = getSiteName(link.url) || link.name?.trim() || "";

  const color = `oklch(0.62 0.14 ${
    SITE_HUES[hashString(key) % SITE_HUES.length]
  })`;

  const initial = Array.from(key)
    .find((character) => !SKIPPED_CHARACTER.test(character))
    ?.toUpperCase();

  return { color, initial };
};
