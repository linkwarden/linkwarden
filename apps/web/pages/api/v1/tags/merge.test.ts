import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import merge from "./merge";
import mergeTags from "@/lib/api/controllers/tags/mergeTags";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@/lib/api/controllers/tags/mergeTags", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("tags/merge API", () => {
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
    const req = { method: "PUT" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue(null);

    await merge(req as any, res as any);

    expect(mergeTags).not.toHaveBeenCalled();
  });

  test("PUT: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "PUT" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await merge(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("PUT: calls mergeTags", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "PUT", body: { ids: [1, 2] } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(mergeTags).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await merge(req as any, res as any);

    expect(mergeTags).toHaveBeenCalledWith(1, { ids: [1, 2] });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
