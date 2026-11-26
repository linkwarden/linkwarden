import { decodeHTML } from "entities";
import { safeFetch } from "@linkwarden/lib/safeFetch";

const TIMEOUT_MS = 10 * 1000;

// Reads the first <title> before </head>, so an inline SVG's <title> in the
// body can't win, and decodes entities like &amp; and &#8211;.
export function extractTitle(html: string) {
  const head = html.split(/<\/head\s*>/i)[0];
  const match = head.match(/<title[^>]*>([^<]*)<\/title\s*>/i);

  return match ? decodeHTML(match[1]).replace(/\s+/g, " ").trim() : "";
}

export default async function fetchTitleAndHeaders(
  url: string,
  content?: string
) {
  if (content) return { title: extractTitle(content), headers: null };

  if (!url?.startsWith("http://") && !url?.startsWith("https://"))
    return { title: "", headers: null };

  // The timeout covers reading the body too, not just the response headers.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await safeFetch(url, { signal: controller.signal });

    const { headers } = response;
    // If the body is slow or huge, keep the headers (used to detect PDFs and
    // images) and fall back to an empty title.
    const text = await response.text().catch(() => "");

    return { title: extractTitle(text), headers };
  } catch (err) {
    console.log(err);
    return { title: "", headers: null };
  } finally {
    clearTimeout(timeout);
  }
}
