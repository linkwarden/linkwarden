import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./[linkId]";
import verifyToken from "@/lib/api/verifyToken";
import resolveAccessibleArchive from "@/lib/api/archives/resolveAccessibleArchive";
import { readFile } from "@linkwarden/filesystem";

vi.mock("@/lib/api/verifyToken", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/archives/resolveAccessibleArchive", () => ({
  default: vi.fn(),
}));

vi.mock("@linkwarden/filesystem", () => ({
  readFile: vi.fn(),
  createFile: vi.fn(),
  createFolder: vi.fn(),
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

describe("/api/v1/archives/[linkId] GET", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_USER_CONTENT_DOMAIN", "https://content.example.com");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns 403 for browser-style monolith GET requests when user-content delivery is enabled", async () => {
    const { res, state } = createMockResponse();
    await handler(
      {
        method: "GET",
        query: { linkId: "10", format: "4" },
        headers: {},
      } as any,
      res
    );

    expect(state.statusCode).toBe(403);
    expect(state.jsonBody).toEqual({
      response:
        "Monolith archive access must use the user content domain when it is configured.",
    });
  });

  it("allows bearer-authorized monolith GET requests", async () => {
    vi.mocked(verifyToken).mockResolvedValue({ id: 7 } as any);
    vi.mocked(resolveAccessibleArchive).mockResolvedValue({
      status: 200,
      response: {
        filePath: "archives/5/10.html",
      },
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
        query: { linkId: "10", format: "4" },
        headers: {
          authorization: "Bearer test-token",
        },
      } as any,
      res
    );

    expect(state.statusCode).toBe(200);
    expect(state.headers.get("Content-Type")).toBe("text/html");
    expect(state.headers.get("Cache-Control")).toBe(
      "private, max-age=31536000, immutable"
    );
    expect(state.sentBody).toBe("<html>ok</html>");
  });
});
