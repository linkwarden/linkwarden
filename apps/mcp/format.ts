import { decode } from "html-entities";
import type { Collection, Highlight, Link } from "./types.js";

// Linkwarden stores names and descriptions HTML-escaped (e.g. scraped
// <title> tags); the web and mobile clients decode them on display.

export function collectionsToMarkdown(collections: Collection[]): string {
  if (collections.length === 0) return "No collections found.";
  return collections
    .map(
      (c) =>
        `- **${decode(c.name)}** (id: ${c.id})${
          c.description ? ` — ${decode(c.description)}` : ""
        }`
    )
    .join("\n");
}

export function linksToMarkdown(links: Link[]): string {
  if (links.length === 0) return "No links found.";
  return links
    .map((l) => {
      const tags = l.tags?.length
        ? ` [${l.tags.map((t) => decode(t.name)).join(", ")}]`
        : "";
      return `- **${decode(l.name) || l.url}** (id: ${l.id})${tags}\n  ${
        l.url ?? ""
      }${l.description ? `\n  ${decode(l.description)}` : ""}`;
    })
    .join("\n");
}

export function linkToMarkdown(link: Link): string {
  const lines = [
    `# ${decode(link.name) || link.url}`,
    `URL: ${link.url ?? "n/a"}`,
    `Collection: ${
      link.collection?.name ? decode(link.collection.name) : link.collectionId
    }`,
  ];
  if (link.tags?.length)
    lines.push(`Tags: ${link.tags.map((t) => decode(t.name)).join(", ")}`);
  if (link.description) lines.push(`\n${decode(link.description)}`);
  if (link.textContent)
    lines.push(`\n## Readable content\n\n${link.textContent}`);
  return lines.join("\n");
}

export function highlightsToMarkdown(highlights: Highlight[]): string {
  if (highlights.length === 0) return "No highlights found for this link.";
  return highlights
    .map(
      (h) =>
        `- (${h.color}) "${h.text}"${h.comment ? `\n  Note: ${h.comment}` : ""}`
    )
    .join("\n");
}
