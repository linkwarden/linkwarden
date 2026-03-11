import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import highlights from "./index";
import postOrUpdateHighlight from "@/lib/api/controllers/highlights/postOrUpdateHighlight";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@/lib/api/controllers/highlights/postOrUpdateHighlight", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("highlights/index API", () => {
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
    const req = { method: "POST" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue(null);

    await highlights(req as any, res as any);

    expect(postOrUpdateHighlight).not.toHaveBeenCalled();
  });

  test("POST: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "POST" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await highlights(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("POST: returns 400 if validation fails", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "POST", body: {} }; // Missing required fields
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await highlights(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("POST: calls postOrUpdateHighlight", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = {
      method: "POST",
      body: {
        color: "yellow",
        text: "highlighted text",
        startOffset: 0,
        endOffset: 10,
        linkId: 1,
      },
    };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(postOrUpdateHighlight).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await highlights(req as any, res as any);

    expect(postOrUpdateHighlight).toHaveBeenCalledWith(1, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("does nothing for non-POST methods", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "GET" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await highlights(req as any, res as any);

    expect(postOrUpdateHighlight).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
