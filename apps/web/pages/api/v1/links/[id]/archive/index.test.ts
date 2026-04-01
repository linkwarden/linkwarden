import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import archive from "./index";
import { prisma } from "@linkwarden/prisma";
import verifyUser from "@/lib/api/verifyUser";
import getPermission from "@/lib/api/getPermission";
import { removeFiles } from "@linkwarden/filesystem";
import isValidUrl from "@/lib/shared/isValidUrl";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    link: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/getPermission", () => ({
  default: vi.fn(),
}));

vi.mock("@linkwarden/filesystem", () => ({
  removeFiles: vi.fn(),
}));

vi.mock("@/lib/shared/isValidUrl", () => ({
  default: vi.fn(),
}));

describe("links/[id]/archive/index API", () => {
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

    await archive(req as any, res as any);

    expect(prisma.link.findUnique).not.toHaveBeenCalled();
  });

  test("returns 404 if link not found", async () => {
    const req = { method: "PUT", query: { id: "1" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.link.findUnique).mockResolvedValue(null);

    await archive(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 401 if permission denied", async () => {
    const req = { method: "PUT", query: { id: "1" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.link.findUnique).mockResolvedValue({
      id: 1,
      collectionId: 100,
    } as any);
    vi.mocked(getPermission).mockResolvedValue(null); // No permission

    await archive(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("PUT: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "PUT", query: { id: "1" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.link.findUnique).mockResolvedValue({
      id: 1,
      collectionId: 100,
    } as any);
    vi.mocked(getPermission).mockResolvedValue({
      ownerId: 1,
      members: [],
    } as any);

    await archive(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("PUT: returns 200 with 'Invalid URL' if url invalid", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "PUT", query: { id: "1" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.link.findUnique).mockResolvedValue({
      id: 1,
      collectionId: 100,
      url: "invalid",
    } as any);
    vi.mocked(getPermission).mockResolvedValue({
      ownerId: 1,
      members: [],
    } as any);
    vi.mocked(isValidUrl).mockReturnValue(false);

    await archive(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ response: "Invalid URL." });
  });

  test("PUT: archives link successfully", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "PUT", query: { id: "1" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.link.findUnique).mockResolvedValue({
      id: 1,
      collectionId: 100,
      url: "http://example.com",
      collection: { id: 100 },
    } as any);
    vi.mocked(getPermission).mockResolvedValue({
      ownerId: 1,
      members: [],
    } as any);
    vi.mocked(isValidUrl).mockReturnValue(true);

    await archive(req as any, res as any);

    expect(prisma.link.update).toHaveBeenCalled();
    expect(removeFiles).toHaveBeenCalledWith(1, 100);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      response: "Link is being archived.",
    });
  });
});
