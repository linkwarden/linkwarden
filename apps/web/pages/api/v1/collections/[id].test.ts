import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import collections from "./[id]";
import getCollectionById from "@/lib/api/controllers/collections/collectionId/getCollectionById";
import updateCollectionById from "@/lib/api/controllers/collections/collectionId/updateCollectionById";
import deleteCollectionById from "@/lib/api/controllers/collections/collectionId/deleteCollectionById";
import verifyUser from "@/lib/api/verifyUser";

vi.mock(
  "@/lib/api/controllers/collections/collectionId/getCollectionById",
  () => ({
    default: vi.fn(),
  })
);

vi.mock(
  "@/lib/api/controllers/collections/collectionId/updateCollectionById",
  () => ({
    default: vi.fn(),
  })
);

vi.mock(
  "@/lib/api/controllers/collections/collectionId/deleteCollectionById",
  () => ({
    default: vi.fn(),
  })
);

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("collections/[id]/index API", () => {
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

    expect(getCollectionById).not.toHaveBeenCalled();
  });

  test("GET: calls getCollectionById", async () => {
    const req = { method: "GET", query: { id: "100" } };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(getCollectionById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await collections(req as any, res as any);

    expect(getCollectionById).toHaveBeenCalledWith(1, 100);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("PUT: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "PUT", query: { id: "1" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await collections(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("PUT: calls updateCollectionById", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = {
      method: "PUT",
      query: { id: "100" },
      body: { name: "Updated" },
    };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(updateCollectionById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await collections(req as any, res as any);

    expect(updateCollectionById).toHaveBeenCalledWith(1, 100, {
      name: "Updated",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("DELETE: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "DELETE", query: { id: "1" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await collections(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("DELETE: calls deleteCollectionById", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "DELETE", query: { id: "100" } };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(deleteCollectionById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await collections(req as any, res as any);

    expect(deleteCollectionById).toHaveBeenCalledWith(1, 100);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
