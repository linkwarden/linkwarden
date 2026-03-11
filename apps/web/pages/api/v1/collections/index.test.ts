import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import collections from "./index";
import getCollections from "@/lib/api/controllers/collections/getCollections";
import postCollection from "@/lib/api/controllers/collections/postCollection";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@/lib/api/controllers/collections/getCollections", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/collections/postCollection", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("collections/index API", () => {
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

    await collections(req as any, res as any);

    expect(getCollections).not.toHaveBeenCalled();
  });

  test("GET: calls getCollections", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(getCollections).mockResolvedValue({
      status: 200,
      response: [],
    } as any);

    await collections(req as any, res as any);

    expect(getCollections).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ response: [] });
  });

  test("POST: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "POST" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await collections(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("POST: calls postCollection", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "POST", body: { name: "Test" } };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(postCollection).mockResolvedValue({
      status: 201,
      response: {},
    } as any);

    await collections(req as any, res as any);

    expect(postCollection).toHaveBeenCalledWith({ name: "Test" }, 1);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
