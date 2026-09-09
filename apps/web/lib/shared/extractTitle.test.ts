import { describe, expect, it } from "vitest";
import { extractTitle } from "./extractTitle";

describe("extractTitle", () => {
  it("prefers the article title from the Open Graph metadata", () => {
    const html = `
      <title>Golem</title>
      <meta property="og:title" content="Shieldfont Diese Schrift füttert KI-Crawler mit Unsinn">
    `;

    expect(extractTitle(html)).toBe(
      "Shieldfont Diese Schrift füttert KI-Crawler mit Unsinn",
    );
  });

  it("supports Open Graph attributes in either order", () => {
    expect(
      extractTitle('<meta content="Article title" property="og:title">'),
    ).toBe("Article title");
  });

  it("falls back to the document title when Open Graph metadata is absent", () => {
    expect(extractTitle("<title>Fallback title</title>")).toBe("Fallback title");
  });
});
