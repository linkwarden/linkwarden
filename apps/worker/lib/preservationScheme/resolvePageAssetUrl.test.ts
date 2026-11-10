import { describe, expect, it } from "vitest";
import { resolvePageAssetUrl } from "./resolvePageAssetUrl";

describe("resolvePageAssetUrl", () => {
  const pageOrigin = "https://space.bilibili.com";

  it("resolves a protocol-relative URL using the page protocol", () => {
    expect(
      resolvePageAssetUrl("//www.bilibili.com/favicon.ico", pageOrigin)
    ).toBe("https://www.bilibili.com/favicon.ico");
  });

  it("resolves a root-relative URL using the page origin", () => {
    expect(resolvePageAssetUrl("/favicon.ico", pageOrigin)).toBe(
      "https://space.bilibili.com/favicon.ico"
    );
  });

  it("keeps an absolute URL unchanged", () => {
    expect(
      resolvePageAssetUrl("https://cdn.example.com/preview.png", pageOrigin)
    ).toBe("https://cdn.example.com/preview.png");
  });
});
