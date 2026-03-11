import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import highlight from "./[id]";
import deleteHighlightById from "@/lib/api/controllers/highlights/deleteHighlightById";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@/lib/api/controllers/highlights/deleteHighlightById", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("highlights/[id] API", () => {
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
    const req = { method: "DELETE" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue(null);

    await highlight(req as any, res as any);

    expect(deleteHighlightById).not.toHaveBeenCalled();
  });

  test("DELETE: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "DELETE" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await highlight(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("DELETE: calls deleteHighlightById", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "DELETE", query: { id: "100" } };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(deleteHighlightById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await highlight(req as any, res as any);

    expect(deleteHighlightById).toHaveBeenCalledWith(1, 100);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
