import { describe, expect, test, vi, beforeEach } from "vitest";
import handler from "./[id]";
import { prisma } from "@linkwarden/prisma";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    rssSubscription: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("rss/[id] API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    await handler(req as any, res as any);

    expect(prisma.rssSubscription.delete).not.toHaveBeenCalled();
  });

  test("DELETE: returns 404 if not found", async () => {
    const req = { method: "DELETE", query: { id: "100" } };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.rssSubscription.findUnique).mockResolvedValue(null);

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("DELETE: returns 403 if permission denied", async () => {
    const req = { method: "DELETE", query: { id: "100" } };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.rssSubscription.findUnique).mockResolvedValue({
      id: 100,
      ownerId: 2, // Different owner
    } as any);

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("DELETE: deletes subscription successfully", async () => {
    const req = { method: "DELETE", query: { id: "100" } };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.rssSubscription.findUnique).mockResolvedValue({
      id: 100,
      ownerId: 1,
    } as any);

    await handler(req as any, res as any);

    expect(prisma.rssSubscription.delete).toHaveBeenCalledWith({
      where: { id: 100 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
