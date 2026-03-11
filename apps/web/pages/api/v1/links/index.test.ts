import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import links from "./index";
import getLinks from "@/lib/api/controllers/links/getLinks";
import postLink from "@/lib/api/controllers/links/postLink";
import updateLinks from "@/lib/api/controllers/links/bulk/updateLinks";
import deleteLinksById from "@/lib/api/controllers/links/bulk/deleteLinksById";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@/lib/api/controllers/links/getLinks", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/links/postLink", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/links/bulk/updateLinks", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/links/bulk/deleteLinksById", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("links/index API", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  test("returns if verifyUser fails", async () => {
    const req = { method: "GET" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue(null);

    await links(req as any, res as any);

    expect(getLinks).not.toHaveBeenCalled();
  });

  test("GET: calls getLinks with parsed query", async () => {
    const req = {
      method: "GET",
      query: {
        sort: "1",
        cursor: "100",
        collectionId: "5",
        tagId: "2",
        pinnedOnly: "true",
        searchQueryString: "search",
      },
    };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(getLinks).mockResolvedValue({ status: 200, response: [] } as any);

    await links(req as any, res as any);

    expect(getLinks).toHaveBeenCalledWith(1, {
      sort: 1,
      cursor: 100,
      collectionId: 5,
      tagId: 2,
      pinnedOnly: true,
      searchQueryString: "search",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("POST: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "POST" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await links(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("POST: calls postLink", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "POST", body: { url: "http://example.com" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(postLink).mockResolvedValue({ status: 201, response: {} } as any);

    await links(req as any, res as any);

    expect(postLink).toHaveBeenCalledWith(req.body, 1);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("PUT: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "PUT" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await links(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("PUT: calls updateLinks", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = {
      method: "PUT",
      body: { links: [], removePreviousTags: true, newData: {} },
    };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(updateLinks).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await links(req as any, res as any);

    expect(updateLinks).toHaveBeenCalledWith(1, [], true, {});
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("DELETE: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "DELETE" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await links(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("DELETE: calls deleteLinksById", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "DELETE", body: { linkIds: [1, 2] } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(deleteLinksById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await links(req as any, res as any);

    expect(deleteLinksById).toHaveBeenCalledWith(1, [1, 2]);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
