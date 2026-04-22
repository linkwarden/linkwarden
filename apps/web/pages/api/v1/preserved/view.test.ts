import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArchivedFormat } from "@linkwarden/types/global";
import handler from "./view";
import { readFile } from "@linkwarden/filesystem";
import { decodePreservedFormatToken } from "@/lib/api/preserved/createPreservedFormatUrl";

vi.mock("@linkwarden/filesystem", () => ({
  readFile: vi.fn(),
}));

vi.mock("@/lib/api/preserved/createPreservedFormatUrl", () => ({
  PRESERVED_FORMAT_SCOPE: "preserved-format",
  decodePreservedFormatToken: vi.fn(),
}));

const createMockResponse = () => {
  const state = {
    statusCode: 200,
    jsonBody: undefined as any,
    sentBody: undefined as any,
    headers: new Map<string, string>(),
  };

  const res = {
    setHeader(name: string, value: string) {
      state.headers.set(name, value);
      return res;
    },
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: any) {
      state.jsonBody = body;
      return res;
    },
    send(body: any) {
      state.sentBody = body;
      return res;
    },
  };

  return { res: res as any, state };
};

describe("/api/v1/preserved/view", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_USER_CONTENT_DOMAIN", "https://content.example.com");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("streams the archived format on the configured user content host", async () => {
    vi.mocked(decodePreservedFormatToken).mockResolvedValue({
      scope: "preserved-format",
      linkId: 11,
      filePath: "archives/7/11.html",
      format: ArchivedFormat.monolith,
      iat: 100,
      exp: Math.floor(Date.now() / 1000) + 60,
    } as any);
    vi.mocked(readFile).mockResolvedValue({
      file: "<html>ok</html>",
      contentType: "text/html",
      status: 200,
    } as any);

    const { res, state } = createMockResponse();
    await handler(
      {
        method: "GET",
        query: { token: "abc", download: "1" },
        headers: {
          host: "content.example.com",
        },
      } as any,
      res
    );

    expect(state.statusCode).toBe(200);
    expect(state.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(state.headers.get("Cache-Control")).toBe("private, no-store");
    expect(state.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(state.headers.get("Content-Disposition")).toBe(
      'attachment; filename="Webpage.html"'
    );
    expect(state.sentBody).toBe("<html>ok</html>");
  });

  it("rejects requests on the wrong host", async () => {
    const { res, state } = createMockResponse();
    await handler(
      {
        method: "GET",
        query: { token: "abc" },
        headers: {
          host: "app.example.com",
        },
      } as any,
      res
    );

    expect(state.statusCode).toBe(403);
    expect(state.jsonBody).toEqual({ response: "Invalid user content host." });
  });

  it("accepts forwarded user content hosts with default https ports", async () => {
    vi.mocked(decodePreservedFormatToken).mockResolvedValue({
      scope: "preserved-format",
      linkId: 11,
      filePath: "archives/7/11.html",
      format: ArchivedFormat.monolith,
      iat: 100,
      exp: Math.floor(Date.now() / 1000) + 60,
    } as any);
    vi.mocked(readFile).mockResolvedValue({
      file: "<html>ok</html>",
      contentType: "text/html",
      status: 200,
    } as any);

    const { res, state } = createMockResponse();
    await handler(
      {
        method: "GET",
        query: { token: "abc" },
        headers: {
          host: "internal-upstream",
          "x-forwarded-host": "content.example.com:443",
        },
      } as any,
      res
    );

    expect(state.statusCode).toBe(200);
    expect(state.sentBody).toBe("<html>ok</html>");
  });

  it("accepts standard forwarded headers from proxies", async () => {
    vi.mocked(decodePreservedFormatToken).mockResolvedValue({
      scope: "preserved-format",
      linkId: 11,
      filePath: "archives/7/11.html",
      format: ArchivedFormat.monolith,
      iat: 100,
      exp: Math.floor(Date.now() / 1000) + 60,
    } as any);
    vi.mocked(readFile).mockResolvedValue({
      file: "<html>ok</html>",
      contentType: "text/html",
      status: 200,
    } as any);

    const { res, state } = createMockResponse();
    await handler(
      {
        method: "GET",
        query: { token: "abc" },
        headers: {
          host: "internal-upstream",
          forwarded: 'for=1.2.3.4;proto=https;host="content.example.com:443"',
        },
      } as any,
      res
    );

    expect(state.statusCode).toBe(200);
    expect(state.sentBody).toBe("<html>ok</html>");
  });

  it("rejects invalid tokens", async () => {
    vi.mocked(decodePreservedFormatToken).mockResolvedValue(null);

    const { res, state } = createMockResponse();
    await handler(
      {
        method: "GET",
        query: { token: "abc" },
        headers: {
          host: "content.example.com",
        },
      } as any,
      res
    );

    expect(state.statusCode).toBe(401);
    expect(state.jsonBody).toEqual({ response: "Invalid archived format token." });
  });
});
