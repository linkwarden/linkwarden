import { describe, expect, it } from "vitest";
import fetchTitleAndHeaders from "./fetchTitleAndHeaders";

// SingleFile compresses saved pages onto long lines. A saved page keeps the
// document <title> and, later on that same line, inline SVG icons whose
// <title> is a footer icon.
const singleFilePage = `<!DOCTYPE html><html lang="en"><head><title data-next-head="">Example Site</title><meta property="og:title" content="Example Site"></head><body><footer><svg viewBox="0 0 30 14" width="30" height="14"><title>LinkedIn</title></svg><svg viewBox="0 0 30 14" width="30" height="14"><title>California Consumer Privacy Act (CCPA) Opt-Out Icon</title><path fill="#1A1A1A" fill-rule="evenodd" d="M7.4 12.8h6.8l3.1-11.6H7.4C4.2 1.2 1.6 3.8 1.6 7c0 3.2 2.6 5.8 5.8 5.8Z"/></svg></footer></body></html>`;

describe("fetchTitleAndHeaders", () => {
  it("reads the head title from a SingleFile page instead of the footer svg title", async () => {
    const { title } = await fetchTitleAndHeaders(
      "https://example.com/",
      singleFilePage
    );

    expect(title).toBe("Example Site");
  });

  it("ignores an svg title that appears before the document title", async () => {
    const html = `<svg><title>California Consumer Privacy Act (CCPA) Opt-Out Icon</title></svg><head><title>Why the Fed cut rates</title></head><svg><title>California Consumer Privacy Act (CCPA) Opt-Out Icon</title></svg>`;

    const { title } = await fetchTitleAndHeaders(
      "https://example.com/articles/sample",
      html
    );

    expect(title).toBe("Why the Fed cut rates");
  });

  it("ignores an svg title nested in the head", async () => {
    const html = `<head><svg><title>California Consumer Privacy Act (CCPA) Opt-Out Icon</title></svg><title>  Why the Fed cut rates  </title></head><svg><title>California Consumer Privacy Act (CCPA) Opt-Out Icon</title></svg>`;

    const { title } = await fetchTitleAndHeaders(
      "https://example.com/articles/sample",
      html
    );

    expect(title).toBe("Why the Fed cut rates");
  });

  it("falls back to og:title when the head title is empty", async () => {
    const html = `<head><title></title><meta content="Why the Fed cut rates" property="og:title"></head><svg><title>California Consumer Privacy Act (CCPA) Opt-Out Icon</title></svg>`;

    const { title } = await fetchTitleAndHeaders(
      "https://example.com/articles/sample",
      html
    );

    expect(title).toBe("Why the Fed cut rates");
  });

  it("decodes entities in the head title", async () => {
    const html = `<head><title>AT&amp;T &amp; the Fed</title></head><svg><title>California Consumer Privacy Act (CCPA) Opt-Out Icon</title></svg>`;

    const { title } = await fetchTitleAndHeaders(
      "https://example.com/articles/sample",
      html
    );

    expect(title).toBe("AT&T & the Fed");
  });

  it("reads an unquoted og:title when the document title is missing", async () => {
    const html = `<head><meta property=og:title content="Why the Fed cut rates"></head><svg><title>California Consumer Privacy Act (CCPA) Opt-Out Icon</title></svg>`;

    const { title } = await fetchTitleAndHeaders(
      "https://example.com/articles/sample",
      html
    );

    expect(title).toBe("Why the Fed cut rates");
  });

  it("falls back to twitter:title when there is no document title or og:title", async () => {
    const html = `<head><meta name="twitter:title" content="AT&amp;T &amp; the Fed"></head><svg><title>California Consumer Privacy Act (CCPA) Opt-Out Icon</title></svg>`;

    const { title } = await fetchTitleAndHeaders(
      "https://example.com/articles/sample",
      html
    );

    expect(title).toBe("AT&T & the Fed");
  });

  it("prefers the head title over a different og:title", async () => {
    const html = `<head><title>Document title</title><meta property="og:title" content="Social title"></head><svg><title>California Consumer Privacy Act (CCPA) Opt-Out Icon</title></svg>`;

    const { title } = await fetchTitleAndHeaders("https://example.com/", html);

    expect(title).toBe("Document title");
  });

  it("reads a head title from pretty-printed html on the normal fetch path", async () => {
    const html = `<html>
<head>
<title>Example Site</title>
</head>
<body>
<svg viewBox="0 0 30 14"><title>California Consumer Privacy Act (CCPA) Opt-Out Icon</title></svg>
</body>
</html>`;

    const { title } = await fetchTitleAndHeaders("https://example.com/", html);

    expect(title).toBe("Example Site");
  });

  it("keeps a plain document title and returns no headers for uploaded html", async () => {
    const { title, headers } = await fetchTitleAndHeaders(
      "https://example.com/article",
      "<html><head><title>Uploaded secret page</title></head></html>"
    );

    expect(title).toBe("Uploaded secret page");
    expect(headers).toBeNull();
  });

  it("returns an empty title for a non-http url with no html", async () => {
    const { title, headers } = await fetchTitleAndHeaders("not a url");

    expect(title).toBe("");
    expect(headers).toBeNull();
  });
});
