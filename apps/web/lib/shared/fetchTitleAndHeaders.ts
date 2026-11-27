import { decodeHTML } from "entities";
import { safeFetch } from "@linkwarden/lib/safeFetch";

// The document title is the <title> in <head>, not an inline <svg><title>
// such as a footer icon. SingleFile saves the page on one line, so a greedy
// match would keep the last <title>.
function cleanTitle(value: string): string {
  return decodeHTML(value).replace(/\s+/g, " ").trim();
}

function attributeValue(tag: string, name: string): string {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")
  );
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? "";
}

function titleOutsideSvg(html: string): string {
  const withoutSvg = html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "");
  const match = withoutSvg.match(/<title\b[^>]*>([^<]*)<\/title>/i);
  return match ? cleanTitle(match[1]) : "";
}

function metaContent(html: string, key: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const found =
      attributeValue(tag, "property") || attributeValue(tag, "name");
    if (found.toLowerCase() !== key) continue;

    const value = cleanTitle(attributeValue(tag, "content"));
    if (value) return value;
  }
  return "";
}

function extractHtmlTitle(html: string): string {
  const head = html.match(/<head\b[^>]*>[\s\S]*?<\/head>/i)?.[0];
  const title = titleOutsideSvg(head ?? html);
  if (title) return title;

  return (
    metaContent(html, "og:title") || metaContent(html, "twitter:title") || ""
  );
}

export default async function fetchTitleAndHeaders(
  url: string,
  content?: string
) {
  if (!content && !url?.startsWith("http://") && !url?.startsWith("https://"))
    return { title: "", headers: null };

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const responsePromise = content ? Promise.resolve(null) : safeFetch(url);
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Fetch title timeout"));
      }, 10 * 1000); // Stop after 10 seconds
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);

    if ((response as any)?.status || content) {
      let text: string;

      if (content) {
        text = content;
      } else {
        text = await (response as any).text();
      }

      const headers = (response as Response | null)?.headers || null;

      return { title: extractHtmlTitle(text), headers };
    } else {
      return { title: "", headers: null };
    }
  } catch (err) {
    console.log(err);
    return { title: "", headers: null };
  } finally {
    clearTimeout(timeoutId);
  }
}
