import { JSDOM, VirtualConsole } from "jsdom";
import { isUrlSafeForServerSideFetch } from "@linkwarden/lib/ssrf";

// Attributes that cause monolith to fetch a remote resource at archive time.
// `<a href>` is intentionally excluded: anchors are not fetched.
const RESOURCE_ATTRIBUTES: ReadonlyArray<[selector: string, attribute: string]> =
  [
    ["img[src]", "src"],
    ["script[src]", "src"],
    ["iframe[src]", "src"],
    ["frame[src]", "src"],
    ["embed[src]", "src"],
    ["input[src]", "src"],
    ["audio[src]", "src"],
    ["video[src]", "src"],
    ["video[poster]", "poster"],
    ["source[src]", "src"],
    ["track[src]", "src"],
    ["object[data]", "data"],
    ["link[href]", "href"],
    ["[background]", "background"],
  ];

const SRCSET_ATTRIBUTES: ReadonlyArray<[selector: string, attribute: string]> = [
  ["img[srcset]", "srcset"],
  ["source[srcset]", "srcset"],
];

// SVG <image>/<use> resources can be referenced via either the plain `href` or
// the legacy namespaced `xlink:href`; monolith fetches both. The `xlink:`
// prefix is awkward to express as a CSS selector, so these are handled
// separately by element + attribute name.
const SVG_ELEMENTS = ["image", "use"];
const SVG_HREF_ATTRIBUTES = ["href", "xlink:href"];

// CSS url(...) and @import targets, e.g. url("x"), url('x'), url(x), @import "x".
const CSS_URL_REGEX = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
const CSS_IMPORT_REGEX = /@import\s+(['"])([^'"]+)\1/gi;

/**
 * Resolves a raw URL against the page's base URL and reports whether monolith
 * may safely fetch it. Non-network references (data:, blob:, fragments, …) and
 * unparseable values are considered safe (left untouched); only http(s)
 * targets are validated against the SSRF allow-list.
 */
async function resolvesToSafeTarget(
  raw: string,
  baseUrl: string | undefined,
  cache: Map<string, Promise<boolean>>
): Promise<boolean> {
  let absolute: URL;
  try {
    absolute = new URL(raw.trim(), baseUrl || undefined);
  } catch {
    return true;
  }

  if (absolute.protocol !== "http:" && absolute.protocol !== "https:") {
    return true;
  }

  // Safety depends only on the host; cache per host to avoid duplicate lookups.
  const key = absolute.host;
  let result = cache.get(key);
  if (!result) {
    result = isUrlSafeForServerSideFetch(absolute.href);
    cache.set(key, result);
  }
  return result;
}

async function sanitizeCss(
  css: string,
  baseUrl: string | undefined,
  cache: Map<string, Promise<boolean>>
): Promise<string> {
  const replacements: Array<{ match: string; raw: string }> = [];

  for (const match of css.matchAll(CSS_URL_REGEX)) {
    replacements.push({ match: match[0], raw: match[2] });
  }
  for (const match of css.matchAll(CSS_IMPORT_REGEX)) {
    replacements.push({ match: match[0], raw: match[2] });
  }

  let result = css;
  for (const { match, raw } of replacements) {
    if (!(await resolvesToSafeTarget(raw, baseUrl, cache))) {
      // Neutralize so monolith cannot fetch it; keep CSS syntactically valid.
      result = result.split(match).join("url(about:invalid)");
    }
  }
  return result;
}

/**
 * Removes references to private/internal resources from rendered page HTML
 * before it is handed to the `monolith` binary.
 *
 * monolith re-fetches every embedded resource URL with its own HTTP client,
 * which has no SSRF protection and is not routed through any proxy we control.
 * Playwright blocks these requests for the browser, but the attributes survive
 * into `page.content()`, so an attacker-controlled page can point them at
 * internal services. Stripping the unsafe URLs here closes that vector.
 */
export default async function sanitizeHtmlForMonolith(
  html: string,
  baseUrl?: string | null
): Promise<string> {
  const dom = new JSDOM(html, {
    url: baseUrl || undefined,
    virtualConsole: new VirtualConsole(),
  });
  const { document } = dom.window;
  const cache = new Map<string, Promise<boolean>>();

  for (const [selector, attribute] of RESOURCE_ATTRIBUTES) {
    for (const element of Array.from(document.querySelectorAll(selector))) {
      const value = element.getAttribute(attribute);
      if (value && !(await resolvesToSafeTarget(value, baseUrl ?? undefined, cache))) {
        element.removeAttribute(attribute);
      }
    }
  }

  for (const element of Array.from(
    document.querySelectorAll(SVG_ELEMENTS.join(","))
  )) {
    for (const attribute of SVG_HREF_ATTRIBUTES) {
      const value = element.getAttribute(attribute);
      if (value && !(await resolvesToSafeTarget(value, baseUrl ?? undefined, cache))) {
        element.removeAttribute(attribute);
      }
    }
  }

  for (const [selector, attribute] of SRCSET_ATTRIBUTES) {
    for (const element of Array.from(document.querySelectorAll(selector))) {
      const value = element.getAttribute(attribute);
      if (!value) continue;

      const safeCandidates: string[] = [];
      for (const candidate of value.split(",")) {
        const url = candidate.trim().split(/\s+/)[0];
        if (!url) continue;
        if (await resolvesToSafeTarget(url, baseUrl ?? undefined, cache)) {
          safeCandidates.push(candidate.trim());
        }
      }

      if (safeCandidates.length) {
        element.setAttribute(attribute, safeCandidates.join(", "));
      } else {
        element.removeAttribute(attribute);
      }
    }
  }

  // Inline style attributes and <style> blocks (covers CSS url() and @import).
  for (const element of Array.from(document.querySelectorAll("[style]"))) {
    const style = element.getAttribute("style");
    if (style) {
      element.setAttribute(
        "style",
        await sanitizeCss(style, baseUrl ?? undefined, cache)
      );
    }
  }

  for (const styleElement of Array.from(document.querySelectorAll("style"))) {
    if (styleElement.textContent) {
      styleElement.textContent = await sanitizeCss(
        styleElement.textContent,
        baseUrl ?? undefined,
        cache
      );
    }
  }

  return dom.serialize();
}
