import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ArchivedFormat } from "@linkwarden/types/global";
import createPreservedFormatUrl, {
  decodePreservedFormatToken,
} from "./createPreservedFormatUrl";

describe("createPreservedFormatUrl", () => {
  beforeEach(() => {
    vi.stubEnv(
      "NEXT_PUBLIC_USER_CONTENT_DOMAIN",
      "https://content.example.com"
    );
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates a signed preserved-format URL", async () => {
    const url = await createPreservedFormatUrl({
      linkId: 42,
      filePath: "archives/7/42.html",
      format: ArchivedFormat.monolith,
    });

    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://content.example.com");
    expect(parsed.pathname).toBe("/api/v1/preserved/view");

    const token = parsed.searchParams.get("token");
    expect(token).toBeTruthy();

    const decoded = await decodePreservedFormatToken(token as string);
    expect(decoded).toMatchObject({
      scope: "preserved-format",
      linkId: 42,
      filePath: "archives/7/42.html",
      format: ArchivedFormat.monolith,
    });
    expect((decoded?.exp ?? 0) - (decoded?.iat ?? 0)).toBe(300);
  });

  it("rejects invalid tokens", async () => {
    const decoded = await decodePreservedFormatToken("not-a-token");
    expect(decoded).toBeNull();
  });
});
