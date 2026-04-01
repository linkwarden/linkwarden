import { describe, expect, test, vi, beforeEach } from "vitest";
import handler from "./index";
import { PassThrough } from "stream";

// Helper to create a mock ReadableStream for fetch response
function createMockStream(content: string) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(content));
      controller.close();
    },
  });
}

describe("getFavicon/index API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const mockRes = () => {
    const res: any = new PassThrough();
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.end = vi.fn().mockReturnValue(res);
    res.setHeader = vi.fn().mockReturnValue(res);
    res.redirect = vi.fn().mockReturnValue(res);
    return res;
  };

  test("returns 405 for non-GET", async () => {
    const req = { method: "POST" };
    const res = mockRes();

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.end).toHaveBeenCalled();
  });

  test("returns 400 if url missing", async () => {
    const req = { method: "GET", query: {} };
    const res = mockRes();

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.end).toHaveBeenCalled();
  });

  test("returns 204 if url invalid", async () => {
    const req = { method: "GET", query: { url: "invalid-url" } };
    const res = mockRes();

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  test("returns 204 if protocol not http/https", async () => {
    const req = { method: "GET", query: { url: "ftp://linkwarden.app" } };
    const res = mockRes();

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test("redirects to canonical if url mismatch", async () => {
    const req = {
      method: "GET",
      query: { url: "https://linkwarden.app/foo" },
      url: "/api/v1/getFavicon?url=https://linkwarden.app/foo",
    };
    const res = mockRes();

    await handler(req as any, res as any);

    const expectedCanonical =
      "/api/v1/getFavicon?url=https%3A%2F%2Flinkwarden.app";
    expect(res.redirect).toHaveBeenCalledWith(308, expectedCanonical);
  });

  test("fetches favicon successfully", async () => {
    const canonicalUrl = "/api/v1/getFavicon?url=https%3A%2F%2Flinkwarden.app";
    const req = {
      method: "GET",
      query: { url: "https://linkwarden.app" },
      url: canonicalUrl,
    };
    const res = mockRes();

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (key: string) => (key === "content-type" ? "image/png" : null),
      },
      body: createMockStream("image data"),
    } as any);

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/png");
    // We can't easily check pipe output in unit test without more complex setup,
    // but status 200 confirms we reached that block.
  });

  test("returns 204 if fetch fails", async () => {
    const canonicalUrl = "/api/v1/getFavicon?url=http%3A%2F%2Flinkwarden.app";
    const req = {
      method: "GET",
      query: { url: "http://linkwarden.app" },
      url: canonicalUrl,
    };
    const res = mockRes();

    // Mock fetch to fail for all sources
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    } as any);

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });
});
