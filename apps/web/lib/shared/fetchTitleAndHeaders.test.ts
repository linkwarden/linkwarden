import http from "http";
import { AddressInfo } from "net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import fetchTitleAndHeaders, { extractTitle } from "./fetchTitleAndHeaders";

describe("extractTitle", () => {
  it("decodes HTML entities", () => {
    expect(
      extractTitle("<title>Tom &amp; Jerry &#8211; Wiki &quot;A&quot;</title>")
    ).toBe('Tom & Jerry – Wiki "A"');
  });

  it("matches the tag in any case and with attributes", () => {
    expect(extractTitle("<HEAD><TITLE>Upper</TITLE></HEAD>")).toBe("Upper");
    expect(extractTitle('<title data-rh="true">Attr</title>')).toBe("Attr");
  });

  it("ignores an SVG <title> in the body", () => {
    expect(
      extractTitle(
        "<head><title>Page</title></head><body><svg><title>Icon</title></svg></body>"
      )
    ).toBe("Page");
    expect(
      extractTitle(
        "<head><meta charset=utf-8></head><body><svg><title>Icon</title></svg></body>"
      )
    ).toBe("");
  });

  it("collapses whitespace and handles a missing title", () => {
    expect(extractTitle("<title>\n  Multi\n  line\n</title>")).toBe(
      "Multi line"
    );
    expect(extractTitle("<p>No title</p>")).toBe("");
  });
});

describe("fetchTitleAndHeaders", () => {
  let server: http.Server;
  let base: string;
  const previous = process.env.ALLOW_PRIVATE_NETWORK_ACCESS;

  beforeAll(async () => {
    process.env.ALLOW_PRIVATE_NETWORK_ACCESS = "true";
    server = http.createServer((req, res) => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      if (req.url === "/slow") {
        res.write("<html><head>"); // never finishes
        return;
      }
      res.end("<html><head><title>Fish &amp; Chips</title></head></html>");
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve)
    );
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    process.env.ALLOW_PRIVATE_NETWORK_ACCESS = previous;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  it("returns the decoded title and the response headers", async () => {
    const { title, headers } = await fetchTitleAndHeaders(`${base}/`);

    expect(title).toBe("Fish & Chips");
    expect(headers?.get("content-type")).toContain("text/html");
  });

  it("uses the given content instead of fetching", async () => {
    const { title, headers } = await fetchTitleAndHeaders(
      "https://example.com",
      "<title>Saved &lt;copy&gt;</title>"
    );

    expect(title).toBe("Saved <copy>");
    expect(headers).toBeNull();
  });

  it("stops reading a body that never ends and keeps the headers", async () => {
    const realSetTimeout = setTimeout;
    const sleep = (ms: number) =>
      new Promise((resolve) => realSetTimeout(resolve, ms));
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const result = fetchTitleAndHeaders(`${base}/slow`);
      // Let the response headers arrive, then fire the 10 s timeout.
      await sleep(200);
      vi.advanceTimersByTime(10_000);

      const { title, headers } = await result;
      expect(title).toBe("");
      expect(headers?.get("content-type")).toContain("text/html");
    } finally {
      vi.useRealTimers();
    }
  });
});
