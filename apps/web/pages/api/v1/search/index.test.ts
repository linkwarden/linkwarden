import { describe, expect, test, vi, beforeEach } from "vitest";
import search from "./index";
import searchLinks from "@/lib/api/controllers/search/searchLinks";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@/lib/api/controllers/search/searchLinks", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("search/index API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    await search(req as any, res as any);

    expect(searchLinks).not.toHaveBeenCalled();
  });

  test("GET: calls searchLinks", async () => {
    const req = {
      method: "GET",
      query: { searchQueryString: "test" },
    };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(searchLinks).mockResolvedValue({
      statusCode: 200,
      data: [],
    } as any);

    await search(req as any, res as any);

    expect(searchLinks).toHaveBeenCalledWith({
      userId: 1,
      query: expect.objectContaining({ searchQueryString: "test" }),
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
