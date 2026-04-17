import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArchivedFormat } from "@linkwarden/types/global";
import handler from "./token";
import resolveAccessibleArchive from "@/lib/api/archives/resolveAccessibleArchive";
import createPreservedFormatUrl from "@/lib/api/preserved/createPreservedFormatUrl";
import verifyToken from "@/lib/api/verifyToken";
import { fileExists } from "@linkwarden/filesystem";

vi.mock("@/lib/api/archives/resolveAccessibleArchive", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/preserved/createPreservedFormatUrl", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyToken", () => ({
  default: vi.fn(),
}));

vi.mock("@linkwarden/filesystem", () => ({
  fileExists: vi.fn(),
}));

const createMockResponse = () => {
  const state = {
    statusCode: 200,
    jsonBody: undefined as any,
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
  };

  return { res: res as any, state };
};

describe("/api/v1/preserved/token", () => {
  beforeEach(() => {
    vi.stubEnv(
      "NEXT_PUBLIC_USER_CONTENT_DOMAIN",
      "https://content.example.com"
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns a user-content URL for an accessible archived format", async () => {
    vi.mocked(verifyToken).mockResolvedValue({ id: 9 } as any);
    vi.mocked(resolveAccessibleArchive).mockResolvedValue({
      status: 200,
      response: {
        filePath: "archives/5/10.html",
        collectionId: 5,
        linkId: 10,
        format: ArchivedFormat.monolith,
        isPreview: false,
      },
    } as any);
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(createPreservedFormatUrl).mockResolvedValue(
      "https://content.example.com/api/v1/preserved/view?token=abc"
    );

    const { res, state } = createMockResponse();
    await handler(
      {
        method: "GET",
        query: { linkId: "10", format: String(ArchivedFormat.monolith) },
        headers: {},
      } as any,
      res
    );

    expect(state.statusCode).toBe(200);
    expect(state.headers.get("Cache-Control")).toBe("no-store");
    expect(state.jsonBody).toEqual({
      response: {
        url: "https://content.example.com/api/v1/preserved/view?token=abc",
      },
    });
  });

  it("returns the archive resolution error when access is denied", async () => {
    vi.mocked(verifyToken).mockResolvedValue("You must be logged in.");
    vi.mocked(resolveAccessibleArchive).mockResolvedValue({
      status: 401,
      response: "You don't have access to this collection.",
    } as any);

    const { res, state } = createMockResponse();
    await handler(
      {
        method: "GET",
        query: { linkId: "10", format: String(ArchivedFormat.monolith) },
        headers: {},
      } as any,
      res
    );

    expect(state.statusCode).toBe(401);
    expect(state.jsonBody).toEqual({
      response: "You don't have access to this collection.",
    });
  });

  it("returns 404 when the archived format is missing", async () => {
    vi.mocked(verifyToken).mockResolvedValue({ id: 9 } as any);
    vi.mocked(resolveAccessibleArchive).mockResolvedValue({
      status: 200,
      response: {
        filePath: "archives/5/10.html",
        collectionId: 5,
        linkId: 10,
        format: ArchivedFormat.monolith,
        isPreview: false,
      },
    } as any);
    vi.mocked(fileExists).mockResolvedValue(false);

    const { res, state } = createMockResponse();
    await handler(
      {
        method: "GET",
        query: { linkId: "10", format: String(ArchivedFormat.monolith) },
        headers: {},
      } as any,
      res
    );

    expect(state.statusCode).toBe(404);
    expect(state.jsonBody).toEqual({
      response: "Archived format not found.",
    });
  });
});
