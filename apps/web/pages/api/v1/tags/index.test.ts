import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import tags from "./index";
import getTags from "@/lib/api/controllers/tags/getTags";
import createOrUpdateTags from "@/lib/api/controllers/tags/createOrUpdateTags";
import bulkTagDelete from "@/lib/api/controllers/tags/bulkTagDelete";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@/lib/api/controllers/tags/getTags", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/tags/createOrUpdateTags", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/tags/bulkTagDelete", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("tags/index API", () => {
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

    await tags(req as any, res as any);

    expect(getTags).not.toHaveBeenCalled();
  });

  test("GET: calls getTags", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(getTags).mockResolvedValue({ status: 200, response: [] } as any);

    await tags(req as any, res as any);

    expect(getTags).toHaveBeenCalledWith({ userId: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("POST: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "POST" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await tags(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("POST: returns 400 if validation fails", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "POST", body: {} }; // Missing tags
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await tags(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("POST: calls createOrUpdateTags", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = {
      method: "POST",
      body: { tags: [{ label: "new tag" }] },
    };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(createOrUpdateTags).mockResolvedValue({} as any);

    await tags(req as any, res as any);

    expect(createOrUpdateTags).toHaveBeenCalledWith(1, [{ label: "new tag" }]);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("DELETE: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "DELETE" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await tags(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("DELETE: calls bulkTagDelete", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "DELETE", body: { tagIds: [1] } };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(bulkTagDelete).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await tags(req as any, res as any);

    expect(bulkTagDelete).toHaveBeenCalledWith(1, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
