import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import archive from "./index";
import { prisma } from "@linkwarden/prisma";
import verifyUser from "@/lib/api/verifyUser";
import { removeFiles } from "@linkwarden/filesystem";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    link: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

vi.mock("@linkwarden/filesystem", () => ({
  removeFiles: vi.fn(),
}));

describe("links/archive/index API", () => {
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

    await archive(req as any, res as any);

    expect(prisma.link.findMany).not.toHaveBeenCalled();
  });

  test("DELETE: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "DELETE" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await archive(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("DELETE: returns 400 if validation fails", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "DELETE", body: { linkIds: "invalid" } }; // Invalid type
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await archive(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("DELETE: returns 401 if no links authorized", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "DELETE", body: { linkIds: [1, 2] } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.link.findMany).mockResolvedValue([]); // No authorized links found

    await archive(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("DELETE: archives links successfully", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "DELETE", body: { linkIds: [1] } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.link.findMany).mockResolvedValue([
      { id: 1, collectionId: 100 },
    ] as any);

    await archive(req as any, res as any);

    expect(removeFiles).toHaveBeenCalledWith(1, 100);
    expect(prisma.link.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.any(Object),
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
