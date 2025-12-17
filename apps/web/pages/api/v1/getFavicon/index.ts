import type { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "node:stream";

function isImage(ct: string | null) {
  return !!ct && ct.toLowerCase().startsWith("image/");
}

async function fetchImage(src: string, timeoutMs = 1500) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(src, {
      method: "GET",
      headers: { Accept: "image/*" },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!r.ok || !r.body) return null;

    const ct = r.headers.get("content-type");
    if (!isImage(ct)) return null;

    return { body: r.body, contentType: ct! };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") return res.status(405).end();

  const raw = req.query.url;
  const urlStr = Array.isArray(raw) ? raw[0] : raw;
  if (!urlStr) return res.status(400).end();

  let u: URL;
  try {
    u = new URL(decodeURIComponent(urlStr));
  } catch {
    return res.status(204).end();
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return res.status(204).end();
  }

  const origin = u.origin;
  const hostname = u.hostname;

  const canonical = `/api/v1/getFavicon?url=${encodeURIComponent(origin)}`;
  if (req.url !== canonical) {
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.redirect(308, canonical);
  }

  const sources = [
    `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
      origin
    )}&size=64`,
    `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
  ];

  for (const src of sources) {
    const hit = await fetchImage(src);
    if (!hit) continue;

    res.status(200);
    res.setHeader("Content-Type", hit.contentType);
    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800, immutable"
    );

    Readable.fromWeb(hit.body as any).pipe(res);
    return;
  }

  res.status(204);
  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
  );
  return res.end();
}
