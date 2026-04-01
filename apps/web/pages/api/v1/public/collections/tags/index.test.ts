import { describe, expect, test, vi, beforeEach } from "vitest";
import collections from "./index";
import getTags from "@/lib/api/controllers/tags/getTags";
import { prisma } from "@linkwarden/prisma";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    collection: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/controllers/tags/getTags", () => ({
  default: vi.fn(),
}));

describe("public/collections/tags/index API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  test("returns 400 if collectionId missing", async () => {
    const req = { method: "GET", query: {} };
    const res = mockRes();

    await collections(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      response: "Please choose a valid collection.",
    });
  });

  test("returns 404 if collection not found or not public", async () => {
    const req = { method: "GET", query: { collectionId: "100" } };
    const res = mockRes();

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);

    await collections(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      response: "Collection not found.",
    });
  });

  test("GET: calls getTags", async () => {
    const req = { method: "GET", query: { collectionId: "100" } };
    const res = mockRes();

    vi.mocked(prisma.collection.findFirst).mockResolvedValue({
      id: 100,
    } as any);
    vi.mocked(getTags).mockResolvedValue({ status: 200, response: [] } as any);

    await collections(req as any, res as any);

    expect(getTags).toHaveBeenCalledWith({ collectionId: 100 });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
