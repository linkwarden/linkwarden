import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import tokens from "./index";
import postToken from "@/lib/api/controllers/tokens/postToken";
import getTokens from "@/lib/api/controllers/tokens/getTokens";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@/lib/api/controllers/tokens/postToken", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/tokens/getTokens", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("tokens/index API", () => {
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

    await tokens(req as any, res as any);

    expect(getTokens).not.toHaveBeenCalled();
  });

  test("GET: calls getTokens", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(getTokens).mockResolvedValue({
      status: 200,
      response: [],
    } as any);

    await tokens(req as any, res as any);

    expect(getTokens).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("POST: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "POST" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await tokens(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("POST: calls postToken", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "POST", body: { name: "New Token" } };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(postToken).mockResolvedValue({
      status: 201,
      response: {},
    } as any);

    await tokens(req as any, res as any);

    expect(postToken).toHaveBeenCalledWith({ name: "New Token" }, 1);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
