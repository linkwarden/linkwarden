const extractMetaTitle = (html: string) => {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    const property = tag.match(/\bproperty\s*=\s*["']([^"']+)["']/i)?.[1];
    if (property?.toLowerCase() !== "og:title") continue;

    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1];
    if (content) return content.trim();
  }

  return "";
};

export const extractTitle = (html: string) => {
  const metaTitle = extractMetaTitle(html);
  if (metaTitle) return metaTitle;

  return html.match(/<title\b[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
};
