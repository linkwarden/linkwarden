import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import tags from "./[id]";
import updateTagById from "@/lib/api/controllers/tags/tagId/updateTagById";
import deleteTagById from "@/lib/api/controllers/tags/tagId/deleteTagById";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@/lib/api/controllers/tags/tagId/updateTagById", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/tags/tagId/deleteTagById", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("tags/[id]/index API", () => {
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

    await tags(req as any, res as any);

    expect(updateTagById).not.toHaveBeenCalled();
  });

  test("returns 400 if id is missing/invalid", async () => {
    const req = { method: "PUT", query: {} };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await tags(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("PUT: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "PUT", query: { id: "1" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await tags(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("PUT: calls updateTagById", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "PUT", query: { id: "1" }, body: { name: "New" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(updateTagById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await tags(req as any, res as any);

    expect(updateTagById).toHaveBeenCalledWith(1, 1, { name: "New" });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("DELETE: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "DELETE", query: { id: "1" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await tags(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("DELETE: calls deleteTagById", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "DELETE", query: { id: "1" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(deleteTagById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await tags(req as any, res as any);

    expect(deleteTagById).toHaveBeenCalledWith(1, 1);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
