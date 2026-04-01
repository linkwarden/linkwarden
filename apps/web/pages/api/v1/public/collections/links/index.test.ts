import { describe, expect, test, vi, beforeEach } from "vitest";
import collections from "./index";
import searchLinks from "@/lib/api/controllers/search/searchLinks";

vi.mock("@/lib/api/controllers/search/searchLinks", () => ({
  default: vi.fn(),
}));

describe("public/collections/links/index API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  test("returns 400 if collectionId missing", async () => {
    const req = { method: "GET", query: {} };
    const res = mockRes();

    await collections(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      response: "Please choose a valid collection.",
    });
  });

  test("GET: calls searchLinks", async () => {
    const req = {
      method: "GET",
      query: { collectionId: "100", sort: "1" },
    };
    const res = mockRes();

    vi.mocked(searchLinks).mockResolvedValue({
      statusCode: 200,
      data: [],
    } as any);

    await collections(req as any, res as any);

    expect(searchLinks).toHaveBeenCalledWith({
      query: expect.objectContaining({ collectionId: 100, sort: 1 }),
      publicOnly: true,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
