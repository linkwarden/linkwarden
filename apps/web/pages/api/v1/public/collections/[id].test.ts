import { describe, expect, test, vi, beforeEach } from "vitest";
import collection from "./[id]";
import getPublicCollection from "@/lib/api/controllers/public/collections/getPublicCollection";

vi.mock("@/lib/api/controllers/public/collections/getPublicCollection", () => ({
  default: vi.fn(),
}));

describe("public/collections/[id] API", () => {
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

    await collection(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      response: "Please choose a valid collection.",
    });
  });

  test("GET: calls getPublicCollection", async () => {
    const req = { method: "GET", query: { id: "100" } };
    const res = mockRes();

    vi.mocked(getPublicCollection).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await collection(req as any, res as any);

    expect(getPublicCollection).toHaveBeenCalledWith(100);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
