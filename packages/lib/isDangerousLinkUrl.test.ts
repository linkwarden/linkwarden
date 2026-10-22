import { describe, expect, it } from "vitest";
import { isDangerousLinkUrl } from "./isDangerousLinkUrl";

describe("isDangerousLinkUrl", () => {
  it("flags script-executing schemes", () => {
    expect(isDangerousLinkUrl("javascript:alert(1)")).toBe(true);
    expect(isDangerousLinkUrl("data:text/html,<script>alert(1)</script>")).toBe(
      true
    );
    expect(isDangerousLinkUrl("vbscript:msgbox(1)")).toBe(true);
  });

  it("is case-insensitive and tolerates leading/embedded whitespace and controls", () => {
    expect(isDangerousLinkUrl("JaVaScRiPt:alert(1)")).toBe(true);
    expect(isDangerousLinkUrl("  javascript:alert(1)")).toBe(true);
    expect(isDangerousLinkUrl("\u0000\u0009javascript:alert(1)")).toBe(true);
    // Browsers ignore whitespace inside the scheme when resolving the URL.
    expect(isDangerousLinkUrl("java\tscript:alert(1)")).toBe(true);
    expect(isDangerousLinkUrl("java\nscript:alert(1)")).toBe(true);
  });

  it("leaves ordinary and relative links alone", () => {
    expect(isDangerousLinkUrl("https://example.com")).toBe(false);
    expect(isDangerousLinkUrl("http://example.com/a:b")).toBe(false);
    expect(isDangerousLinkUrl("mailto:someone@example.com")).toBe(false);
    expect(isDangerousLinkUrl("ftp://example.com/file")).toBe(false);
    expect(isDangerousLinkUrl("/preserved/1?format=1")).toBe(false);
    expect(isDangerousLinkUrl("example.com")).toBe(false);
  });

  it("handles empty/nullish input", () => {
    expect(isDangerousLinkUrl("")).toBe(false);
    expect(isDangerousLinkUrl(null)).toBe(false);
    expect(isDangerousLinkUrl(undefined)).toBe(false);
  });
});
