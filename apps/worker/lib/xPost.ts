// X (Twitter) posts render nothing for a logged-out headless browser, so the
// readable copy is built from FxEmbed's public API instead (no key, no login).
// https://github.com/FxEmbed/FxEmbed

const X_HOSTS = [
  "x.com",
  "www.x.com",
  "mobile.x.com",
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
];

// Loose shape of an FxEmbed v2 status. Anything can be missing: deleted,
// private or withheld posts come back as tombstones with only a message.
export type XPost = {
  type?: string;
  id?: string;
  url?: string;
  text?: string;
  message?: string;
  author?: { screen_name?: string; name?: string } | null;
  created_timestamp?: number;
  lang?: string | null;
  media?: {
    all?: { type?: string; url?: string; thumbnail_url?: string }[];
  } | null;
  quote?: XPost | null;
  community_note?: { text?: string } | null;
  article?: XLongArticle | null;
};

// X "Articles" (long-form posts): the post's own text is just a link to the
// article; the body comes as Draft.js-style blocks. Shapes as FxEmbed
// returns them (see its src/helpers/article.ts).
export type XLongArticle = {
  title?: string;
  preview_text?: string;
  cover_media?: { media_info?: { original_img_url?: string } } | null;
  content?: {
    blocks?: {
      type?: string;
      text?: string;
      entityRanges?: { key?: number }[];
    }[];
    entityMap?: {
      key?: string;
      value?: {
        type?: string;
        data?: {
          mediaItems?: { mediaId?: string }[];
          tweetId?: string;
          markdown?: string;
        };
      };
    }[];
  } | null;
  media_entities?: {
    media_id?: string;
    media_info?: {
      __typename?: string;
      original_img_url?: string;
      variants?: { url?: string; content_type?: string }[];
      video_info?: { variants?: { url?: string; content_type?: string }[] };
    };
  }[];
};

// GET /2/thread/:id -> the chain back to the root, the post itself, then the
// author's own continuation (oldest first). Other people's replies are left
// out on purpose: a reply worth keeping can be saved as its own link.
export type XApiResponse = {
  code?: number;
  status?: XPost | null;
  thread?: XPost[] | null;
};

export type XArticle = {
  title: string;
  byline: string;
  siteName: string;
  lang: string | null;
  publishedTime: string | null;
  excerpt: string;
  content: string;
  textContent: string;
  length: number;
  dir: null;
};

// Returns the post id for x.com / twitter.com status URLs, otherwise null.
export function getXStatusId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!X_HOSTS.includes(parsed.hostname.toLowerCase())) return null;

  const match = parsed.pathname.match(
    /^\/(?:[A-Za-z0-9_]{1,15}|i\/web)\/status(?:es)?\/(\d{1,20})(?:\/|$)/
  );

  return match ? match[1] : null;
}

export function isFxTwitterEnabled() {
  return process.env.ENABLE_FXTWITTER === "true";
}

export function getFxTwitterApiUrl() {
  return (process.env.FXTWITTER_API_URL || "https://api.fxtwitter.com").replace(
    /\/+$/,
    ""
  );
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// The API is third-party: never trust a field's type.
const str = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : undefined;

const safeUrl = (value: unknown) => {
  if (typeof value !== "string" || !value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
};

type ValidPost = XPost & {
  id: string;
  text: string;
  author: { screen_name: string; name?: unknown };
};

const isPost = (post: unknown): post is ValidPost => {
  const p = post as XPost | null | undefined;
  return (
    !!p &&
    typeof p === "object" &&
    p.type !== "tombstone" &&
    typeof p.id === "string" &&
    typeof p.text === "string" &&
    !!p.author &&
    typeof p.author === "object" &&
    typeof p.author.screen_name === "string"
  );
};

const authorLabel = (post: ValidPost) => {
  const handle = post.author.screen_name;
  const name = str(post.author.name);
  return name && name.replace(/^@/, "") !== handle
    ? `${name} (@${handle})`
    : `@${handle}`;
};

const postDate = (post: XPost) => {
  const date = new Date(Number(post.created_timestamp) * 1000);
  return isNaN(date.getTime()) ? null : date.toISOString();
};

const mediaOf = (post: XPost) => {
  const all = post.media?.all;
  return (Array.isArray(all) ? all : []).flatMap((media) => {
    const url = safeUrl(media?.url);
    return url
      ? [
          {
            type: str(media.type) ?? "media",
            url,
            thumbnail: safeUrl(media.thumbnail_url),
          },
        ]
      : [];
  });
};

const noteOf = (post: XPost) => str(post.community_note?.text);

const unavailableText = (post: unknown) => {
  const message = str((post as XPost | null | undefined)?.message);
  return `[unavailable post${message ? `: ${message}` : ""}]`;
};

const arrayOf = <T>(value: T[] | null | undefined): T[] =>
  Array.isArray(value) ? value : [];

// One rendered piece of an X Article: HTML for the reader view, plain text
// for search. `list` groups consecutive list items into one <ul>/<ol>.
type ArticlePart = { html: string; text: string; list?: "ul" | "ol" };

function articleParts(article: XLongArticle): ArticlePart[] {
  const parts: ArticlePart[] = [];
  const entityMap = arrayOf(article.content?.entityMap);
  const mediaEntities = arrayOf(article.media_entities);

  const title = str(article.title);
  if (title) parts.push({ html: `<h2>${escapeHtml(title)}</h2>`, text: title });

  const cover = safeUrl(article.cover_media?.media_info?.original_img_url);
  if (cover)
    parts.push({
      html: `<p><img src="${escapeHtml(cover)}" alt=""></p>`,
      text: `image: ${cover}`,
    });

  let number = 0;
  for (const block of arrayOf(article.content?.blocks)) {
    const type = str(block?.type) ?? "unstyled";
    const text = str(block?.text)?.trim() ?? "";
    if (type !== "ordered-list-item") number = 0;
    // Any other block (even an empty one) ends a list, in HTML as in text.
    if (!type.endsWith("list-item") && parts[parts.length - 1]?.list)
      parts.push({ html: "", text: "" });

    if (type === "atomic") {
      for (const range of arrayOf(block.entityRanges)) {
        const entity = entityMap.find((e) => e?.key === String(range?.key))
          ?.value;
        const data = entity?.data;

        if (entity?.type === "MEDIA") {
          const mediaId = str(arrayOf(data?.mediaItems)[0]?.mediaId);
          const info = mediaId
            ? mediaEntities.find((m) => m?.media_id === mediaId)?.media_info
            : undefined;
          const image = safeUrl(info?.original_img_url);
          // Article videos carry variants directly; regular ones under video_info
          const video = arrayOf(info?.variants ?? info?.video_info?.variants)
            .filter((v) => v?.content_type !== "application/x-mpegURL")
            .map((v) => safeUrl(v?.url))
            .find((u) => u && !u.includes(".m3u8"));

          if (info?.__typename === "ApiImage" && image)
            parts.push({
              html: `<p><img src="${escapeHtml(image)}" alt=""></p>`,
              text: `image: ${image}`,
            });
          else if (video)
            parts.push({
              html: `<p><a href="${escapeHtml(video)}">video</a></p>`,
              text: `video: ${video}`,
            });
        } else if (
          entity?.type === "TWEET" &&
          /^\d+$/.test(data?.tweetId ?? "")
        ) {
          const url = `https://x.com/i/status/${data!.tweetId}`;
          parts.push({
            html: `<p>Embedded post: <a href="${url}">${url}</a></p>`,
            text: `Embedded post: ${url}`,
          });
        } else if (entity?.type === "MARKDOWN" && str(data?.markdown)) {
          const code = data!.markdown!.replace(/^```[^\n]*\n?|\n?```$/g, "");
          parts.push({ html: `<pre>${escapeHtml(code)}</pre>`, text: code });
        }
      }
      continue;
    }

    if (!text) continue;
    const safe = escapeHtml(text).replace(/\n/g, "<br>");

    if (type === "header-one" || type === "header-two")
      parts.push({
        html: `<h${type === "header-one" ? 2 : 3}>${safe}</h${
          type === "header-one" ? 2 : 3
        }>`,
        text,
      });
    else if (type === "blockquote")
      parts.push({ html: `<blockquote><p>${safe}</p></blockquote>`, text });
    else if (type === "unordered-list-item")
      parts.push({ html: `<li>${safe}</li>`, text: `- ${text}`, list: "ul" });
    else if (type === "ordered-list-item")
      parts.push({
        html: `<li>${safe}</li>`,
        text: `${++number}. ${text}`,
        list: "ol",
      });
    else parts.push({ html: `<p>${safe}</p>`, text });
  }

  return parts;
}

function articleToHtml(article: XLongArticle): string {
  const html: string[] = [];
  let open: "ul" | "ol" | undefined;

  for (const part of articleParts(article)) {
    if (part.list !== open) {
      if (open) html.push(`</${open}>`);
      if (part.list) html.push(`<${part.list}>`);
      open = part.list;
    }
    if (part.html) html.push(part.html);
  }
  if (open) html.push(`</${open}>`);

  return `<section>${html.join("\n")}</section>`;
}

const articleToText = (article: XLongArticle) =>
  articleParts(article)
    .map((part) => part.text)
    .filter(Boolean)
    .join("\n");

const articleOf = (post: XPost) =>
  post.article && typeof post.article === "object" ? post.article : null;

function postToHtml(post: XPost | null | undefined, heading?: string): string {
  if (!isPost(post))
    return `<p><em>${escapeHtml(unavailableText(post))}</em></p>`;

  const url = safeUrl(post.url);
  const date = postDate(post);
  const parts: string[] = [];

  let header = heading ? `<strong>${escapeHtml(heading)}</strong> · ` : "";
  header += `<strong>${escapeHtml(authorLabel(post))}</strong>`;
  if (url)
    header += ` · <a href="${escapeHtml(url)}">${escapeHtml(
      date ? date.slice(0, 16).replace("T", " ") + " UTC" : url
    )}</a>`;
  parts.push(`<p>${header}</p>`);

  if (post.text)
    parts.push(`<p>${escapeHtml(post.text).replace(/\n/g, "<br>")}</p>`);

  const article = articleOf(post);
  if (article) parts.push(articleToHtml(article));

  for (const media of mediaOf(post)) {
    parts.push(
      media.type === "photo"
        ? `<p><img src="${escapeHtml(media.url)}" alt=""></p>`
        : `<p><a href="${escapeHtml(media.url)}">${escapeHtml(media.type)}</a>${
            media.thumbnail
              ? `<br><img src="${escapeHtml(media.thumbnail)}" alt="">`
              : ""
          }</p>`
    );
  }

  const note = noteOf(post);
  if (note) parts.push(`<p><em>Community note: ${escapeHtml(note)}</em></p>`);

  if (post.quote)
    parts.push(`<blockquote>${postToHtml(post.quote, "Quoted")}</blockquote>`);

  return parts.join("\n");
}

function postToText(post: XPost | null | undefined): string {
  if (!isPost(post)) return unavailableText(post);

  const lines = [`${authorLabel(post)}: ${post.text}`];

  const article = articleOf(post);
  if (article) lines.push(articleToText(article));

  for (const media of mediaOf(post)) lines.push(`${media.type}: ${media.url}`);

  const note = noteOf(post);
  if (note) lines.push(`Community note: ${note}`);

  if (post.quote) lines.push(`Quoting ${postToText(post.quote)}`);

  return lines.join("\n");
}

// Turns FxEmbed's thread into the shape Readability.parse() returns, so the
// reader view, search and AI tagging treat it like any other readable copy.
// Returns null when there is no usable post.
export function buildXArticle(thread: XApiResponse): XArticle | null {
  const status = thread?.status;
  if (!isPost(status)) return null;

  const chain: XPost[] = Array.isArray(thread.thread) ? thread.thread : [];
  const index = chain.findIndex((p) => p?.id === status.id);
  const before = index > 0 ? chain.slice(0, index) : [];
  const after = index >= 0 ? chain.slice(index + 1) : [];

  const html: string[] = [];
  const text: string[] = [];
  const section = (heading: string, posts: XPost[]) => {
    if (posts.length === 0) return;
    html.push(`<h3>${escapeHtml(heading)}</h3>`);
    text.push(`${heading}:`);
    for (const post of posts) {
      html.push(`<section>${postToHtml(post)}</section>`);
      text.push(postToText(post));
    }
  };

  section("Earlier in the thread", before);
  html.push(`<article>${postToHtml(status, "Saved post")}</article>`);
  text.push("Saved post:", postToText(status));
  section("Thread continues", after);

  const textContent = text.join("\n\n");
  const article = articleOf(status);
  const headline = str(article?.title) ?? status.text;
  const snippet = headline.length > 80 ? headline.slice(0, 80) + "…" : headline;
  const excerpt = article
    ? [str(article.title), str(article.preview_text)].filter(Boolean).join(": ")
    : status.text;

  return {
    title: `${authorLabel(status)} on X: "${snippet}"`,
    byline: authorLabel(status),
    siteName: "X",
    lang: str(status.lang) ?? null,
    publishedTime: postDate(status),
    excerpt: excerpt.slice(0, 500),
    content: `<div>${html.join("\n")}</div>`,
    textContent,
    length: textContent.length,
    dir: null,
  };
}
