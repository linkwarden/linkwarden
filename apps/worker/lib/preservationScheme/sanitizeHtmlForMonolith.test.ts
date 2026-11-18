import { afterEach, describe, expect, it, vi } from "vitest";
import sanitizeHtmlForMonolith from "./sanitizeHtmlForMonolith";

const UNREADABLE_CSS = [
  { feature: "@layer", css: "@layer base{a{color:red}}" },
  { feature: "@container", css: "@container (min-width:400px){a{color:red}}" },
  { feature: "nesting", css: ".card{color:blue;&:hover{color:green}}" },
  { feature: "@scope", css: "@scope (.a){b{color:red}}" },
  { feature: "@starting-style", css: "@starting-style{a{opacity:0}}" },
  { feature: "a stray }", css: "a{color:red}}" },
];

const pageWith = (css: string) =>
  `<!doctype html><html><head><style>${css}</style></head><body><style>${css}</style><p>Hello</p></body></html>`;

const watchConsole = () =>
  (["error", "warn", "log", "info"] as const).map((method) =>
    vi.spyOn(console, method).mockImplementation(() => {})
  );

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("sanitizeHtmlForMonolith", () => {
  it.each(UNREADABLE_CSS)(
    "keeps a stylesheet that uses $feature as it was",
    async ({ css }) => {
      watchConsole();

      const result = await sanitizeHtmlForMonolith(
        pageWith(css),
        "https://example.com/"
      );

      expect(result.split(`<style>${css}</style>`)).toHaveLength(3);
      expect(result).toContain("<p>Hello</p>");
    }
  );

  it.each(UNREADABLE_CSS)(
    "logs nothing for a stylesheet that uses $feature",
    async ({ css }) => {
      const spies = watchConsole();

      await sanitizeHtmlForMonolith(pageWith(css), "https://example.com/");

      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    }
  );

  it("still takes a private address out of a stylesheet jsdom can't read", async () => {
    vi.stubEnv("ALLOW_PRIVATE_NETWORK_ACCESS", "");
    const spies = watchConsole();
    const css =
      '@layer base{a{background:url(http://127.0.0.1/a.png)}}@import "http://127.0.0.1/b.css";';

    const result = await sanitizeHtmlForMonolith(
      pageWith(css),
      "https://example.com/"
    );

    expect(result).not.toContain("127.0.0.1");
    expect(result).toContain("@layer base{a{background:url(about:invalid)}}");
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });

  it("logs nothing for a stylesheet jsdom can read", async () => {
    const spies = watchConsole();
    const css = "a{color:red}";

    const result = await sanitizeHtmlForMonolith(
      pageWith(css),
      "https://example.com/"
    );

    expect(result.split(`<style>${css}</style>`)).toHaveLength(3);
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});
