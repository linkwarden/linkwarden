import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import { prisma } from "@linkwarden/prisma";
import { createFile } from "@linkwarden/filesystem";
import { safeFetch } from "@linkwarden/lib/safeFetch";
import { Link } from "@linkwarden/prisma/client";
import {
  buildXArticle,
  getFxTwitterApiUrl,
  getXStatusId,
  XApiResponse,
} from "../xPost";

const FETCH_TIMEOUT_MS = 15 * 1000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

async function fetchFxTwitter(path: string): Promise<XApiResponse | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await safeFetch(`${getFxTwitterApiUrl()}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      size: MAX_RESPONSE_BYTES,
    });

    // 404 = deleted/private post; the caller logs that once
    if (!response.ok) return null;

    return (await response.json()) as XApiResponse;
  } catch (err) {
    console.error(`FxTwitter ${path} failed:`, err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Saves the readable copy of an X post (its thread, quote and media) from
// FxEmbed's API. Returns false if the link is not an X post or nothing usable
// came back, so the caller can fall back to Readability.
const handleXPost = async (link: Link): Promise<boolean> => {
  const statusId = link.url ? getXStatusId(link.url) : null;
  if (!statusId) return false;

  try {
    const thread = await fetchFxTwitter(`/2/thread/${statusId}`);
    const article = thread ? buildXArticle(thread) : null;

    if (!article) {
      console.error(
        `Error archiving X post ${statusId}: FxTwitter returned no post`
      );
      return false;
    }

    const window = new JSDOM("").window;
    article.content = DOMPurify(window).sanitize(article.content);

    const TEXT_CONTENT_LIMIT = Number(process.env.TEXT_CONTENT_LIMIT);
    const textContent = article.textContent
      .replace(/ +(?= )/g, "") // strip out multiple spaces
      .replace(/(\r\n|\n|\r)/gm, " ") // strip out line breaks
      .slice(0, TEXT_CONTENT_LIMIT ? TEXT_CONTENT_LIMIT : undefined); // limit characters if TEXT_CONTENT_LIMIT is defined

    const data = JSON.stringify(article);

    if (
      Buffer.byteLength(data, "utf8") >
      1024 * 1024 * Number(process.env.READABILITY_MAX_BUFFER || 100)
    ) {
      console.error(`Error archiving X post ${statusId}: Buffer size exceeded`);
      return false;
    }

    const collectionId = (
      await prisma.link.findUnique({
        where: { id: link.id },
        select: { collectionId: true },
      })
    )?.collectionId;

    await createFile({
      data,
      filePath: `archives/${collectionId}/${link.id}_readability.json`,
    });

    await prisma.link.update({
      where: { id: link.id },
      data: {
        readable: `archives/${collectionId}/${link.id}_readability.json`,
        textContent,
        // x.com gives a logged-out browser no description; AI tagging reads
        // this before textContent.
        metaDescription: article.excerpt.trim().slice(0, 500) || undefined,
      },
    });

    return true;
  } catch (err) {
    console.error(`Error archiving X post ${statusId}:`, err);
    return false;
  }
};

export default handleXPost;
