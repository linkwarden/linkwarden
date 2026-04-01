import { describe, expect, test, vi, beforeEach } from "vitest";
import link from "./[id]";
import getLinkById from "@/lib/api/controllers/public/links/linkId/getLinkById";

vi.mock("@/lib/api/controllers/public/links/linkId/getLinkById", () => ({
  default: vi.fn(),
}));

describe("public/links/[id] API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  test("returns 401 if id is missing", async () => {
    const req = { method: "GET", query: {} };
    const res = mockRes();

    await link(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ response: "Please choose a valid link." });
  });

  test("GET: calls getLinkById", async () => {
    const req = { method: "GET", query: { id: "100" } };
    const res = mockRes();

    vi.mocked(getLinkById).mockResolvedValue({ status: 200, response: {} } as any);

    await link(req as any, res as any);

    expect(getLinkById).toHaveBeenCalledWith(100);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
