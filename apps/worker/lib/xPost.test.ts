import { describe, expect, it } from "vitest";
import { buildXArticle, getXStatusId, XApiResponse, XPost } from "./xPost";

const post = (
  id: string,
  screen_name: string,
  text: string,
  extra: Partial<XPost> = {}
): XPost => ({
  type: "status",
  id,
  url: `https://x.com/${screen_name}/status/${id}`,
  text,
  author: { screen_name, name: screen_name.toUpperCase() },
  created_timestamp: 1792539616,
  lang: "en",
  ...extra,
});

const tombstone: XPost = {
  type: "tombstone",
  message: "This post is from a suspended account.",
};

describe("getXStatusId", () => {
  it("reads the id from x.com and twitter.com status URLs", () => {
    expect(
      getXStatusId("https://x.com/stutxo/status/2112690392608956450")
    ).toBe("2112690392608956450");
    expect(
      getXStatusId("https://mobile.twitter.com/jack/status/20?s=20&t=abc")
    ).toBe("20");
    expect(getXStatusId("https://WWW.X.COM/jack/status/20/photo/1")).toBe("20");
    expect(getXStatusId("https://x.com/i/web/status/20")).toBe("20");
    expect(getXStatusId("https://x.com/i/status/20")).toBe("20");
    expect(getXStatusId("https://twitter.com/jack/statuses/20")).toBe("20");
  });

  it("ignores other URLs", () => {
    expect(getXStatusId("https://x.com/stutxo")).toBeNull();
    expect(getXStatusId("https://x.com/home")).toBeNull();
    expect(getXStatusId("https://notx.com/jack/status/20")).toBeNull();
    expect(
      getXStatusId("https://x.com.evil.example/jack/status/20")
    ).toBeNull();
    expect(getXStatusId("not a url")).toBeNull();
  });
});

describe("buildXArticle", () => {
  const root = post("1", "stutxo", "this is 9/11 for @levelsio");
  const saved = post("2", "artee_49", "he has a single server <i>ok</i>", {
    media: {
      all: [{ type: "photo", url: "https://pbs.twimg.com/media/a.jpg" }],
    },
    quote: post("9", "levelsio", "I disconnected all my servers"),
    community_note: { text: "Context here" },
  });
  const continuation = post("4", "artee_49", "and another thing");
  const thread: XApiResponse = {
    code: 200,
    status: saved,
    thread: [root, saved, continuation],
  };
  it("orders earlier posts, the post and the continuation", () => {
    const { textContent } = buildXArticle(thread)!;

    const order = [
      "STUTXO (@stutxo): this is 9/11",
      "ARTEE_49 (@artee_49): he has a single server",
      "photo: https://pbs.twimg.com/media/a.jpg",
      "Community note: Context here",
      "Quoting LEVELSIO (@levelsio): I disconnected all my servers",
      "ARTEE_49 (@artee_49): and another thing",
    ].map((line) => textContent.indexOf(line));

    expect(order).not.toContain(-1);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    // the saved post is not repeated as part of the thread
    expect(textContent.match(/single server/g)).toHaveLength(1);
  });

  it("escapes text and drops non-http URLs", () => {
    const article = buildXArticle({
      code: 200,
      status: post("5", "x", "<script>alert(1)</script>", {
        url: "javascript:alert(1)",
        media: { all: [{ type: "photo", url: "javascript:alert(2)" }] },
      }),
    })!;

    expect(article.content).toContain("&lt;script&gt;");
    expect(article.content).not.toContain("<script>");
    expect(article.content).not.toContain("javascript:");
  });

  it("survives deleted posts and malformed items", () => {
    const article = buildXArticle({
      code: 200,
      status: post("6", "a", "replying to a deleted post", {
        quote: tombstone,
        created_timestamp: undefined,
        media: null,
      }),
      thread: [tombstone, null as unknown as XPost, post("6", "a", "")],
    })!;

    expect(article.textContent).toContain(
      "[unavailable post: This post is from a suspended account.]"
    );
    expect(article.textContent).toContain("Quoting [unavailable post");
    expect(article.publishedTime).toBeNull();
  });

  it("keeps the post when optional fields have the wrong type", () => {
    const main = post("6", "a", "main post", { media: { all: "x" } as any });
    const odd = {
      ...post("8", "a", "odd continuation"),
      author: { screen_name: "a", name: 42 },
      media: { all: {} },
      community_note: { text: 7 },
      created_timestamp: "soon",
      quote: "nope",
    } as unknown as XPost;

    const article = buildXArticle({
      code: 200,
      status: main,
      thread: [main, odd, 5, "x"] as any,
    })!;

    expect(article.textContent).toContain("A (@a): main post");
    expect(article.textContent).toContain("@a: odd continuation");
    expect(
      buildXArticle({ code: 200, status: main, thread: "x" as any })
    ).not.toBeNull();
  });

  it("renders X Articles (long-form posts)", () => {
    const article = buildXArticle({
      code: 200,
      status: post("10", "carl", "https://x.com/i/article/11", {
        article: {
          title: "7 vs 9 fig brands",
          preview_text: "The fastest way to scale",
          cover_media: {
            media_info: { original_img_url: "https://pbs.twimg.com/c.jpg" },
          },
          content: {
            blocks: [
              { type: "unstyled", text: "Intro <b>text</b>" },
              { type: "header-two", text: "1: TAM" },
              { type: "unordered-list-item", text: "avatars" },
              { type: "unordered-list-item", text: "angles" },
              { type: "ordered-list-item", text: "offers" },
              { type: "ordered-list-item", text: "funnels" },
              { type: "atomic", text: " ", entityRanges: [{ key: 0 }] },
              { type: "atomic", text: " ", entityRanges: [{ key: 1 }] },
              { type: "atomic", text: " ", entityRanges: [{ key: 2 }] },
              { type: "atomic", text: " ", entityRanges: [{ key: 3 }] },
            ],
            entityMap: [
              {
                key: "0",
                value: {
                  type: "MEDIA",
                  data: { mediaItems: [{ mediaId: "m1" }] },
                },
              },
              { key: "1", value: { type: "TWEET", data: { tweetId: "20" } } },
              {
                key: "2",
                value: {
                  type: "MARKDOWN",
                  data: { markdown: "```js\nlet a = 1;\n```" },
                },
              },
              {
                key: "3",
                value: { type: "TWEET", data: { tweetId: "javascript:x" } },
              },
            ],
          },
          media_entities: [
            {
              media_id: "m1",
              media_info: {
                __typename: "ApiImage",
                original_img_url: "https://pbs.twimg.com/m1.jpg",
              },
            },
          ],
        },
      }),
    })!;

    const lines = [
      "7 vs 9 fig brands",
      "image: https://pbs.twimg.com/c.jpg",
      "Intro <b>text</b>",
      "1: TAM",
      "- avatars",
      "- angles",
      "1. offers",
      "2. funnels",
      "image: https://pbs.twimg.com/m1.jpg",
      "Embedded post: https://x.com/i/status/20",
      "let a = 1;",
    ].map((line) => article.textContent.indexOf(line));
    expect(lines).not.toContain(-1);
    expect([...lines].sort((a, b) => a - b)).toEqual(lines);

    expect(article.title).toContain('"7 vs 9 fig brands"');
    expect(article.excerpt).toBe("7 vs 9 fig brands: The fastest way to scale");
    expect(article.content).toContain(
      "<ul>\n<li>avatars</li>\n<li>angles</li>\n</ul>"
    );
    expect(article.content).toContain("<ol>\n<li>offers</li>");
    expect(article.content).toContain("Intro &lt;b&gt;text&lt;/b&gt;");
    expect(article.content).not.toContain("javascript:");
  });

  it("breaks lists on empty blocks and finds nested video variants", () => {
    const article = buildXArticle({
      code: 200,
      status: post("12", "c", "https://x.com/i/article/13", {
        article: {
          content: {
            blocks: [
              { type: "ordered-list-item", text: "a" },
              { type: "unstyled", text: "" },
              { type: "ordered-list-item", text: "b" },
              { type: "atomic", text: " ", entityRanges: [{ key: 0 }] },
              { type: "atomic", text: " ", entityRanges: [{ key: 1 }] },
            ],
            entityMap: [
              {
                key: "0",
                value: {
                  type: "MEDIA",
                  data: { mediaItems: [{ mediaId: "v1" }] },
                },
              },
              {
                key: "1",
                value: { type: "MEDIA", data: { mediaItems: [{}] } },
              },
            ],
          },
          media_entities: [
            {
              media_id: "v1",
              media_info: {
                __typename: "ApiVideo",
                video_info: {
                  variants: [
                    {
                      url: "https://video.twimg.com/v.m3u8",
                      content_type: "application/x-mpegURL",
                    },
                    {
                      url: "https://video.twimg.com/v.mp4",
                      content_type: "video/mp4",
                    },
                  ],
                },
              },
            },
            {
              media_info: {
                __typename: "ApiImage",
                original_img_url: "https://pbs.twimg.com/wrong.jpg",
              },
            },
          ],
        },
      }),
    })!;

    expect(article.textContent).toContain("1. a\n1. b");
    expect(article.content.match(/<ol>/g)).toHaveLength(2);
    expect(article.textContent).toContain(
      "video: https://video.twimg.com/v.mp4"
    );
    expect(article.textContent).not.toContain("wrong.jpg");
  });

  it("returns null when there is no usable post", () => {
    expect(buildXArticle({ code: 404, status: null })).toBeNull();
    expect(buildXArticle({ code: 200, status: tombstone })).toBeNull();
  });
});
