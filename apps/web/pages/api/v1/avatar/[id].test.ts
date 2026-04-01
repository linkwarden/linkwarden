import { describe, expect, test, vi, beforeEach } from "vitest";
import handler from "./[id]";
import { prisma } from "@linkwarden/prisma";
import verifyToken from "@/lib/api/verifyToken";
import { readFile } from "@linkwarden/filesystem";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    collection: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/verifyToken", () => ({
  default: vi.fn(),
}));

vi.mock("@linkwarden/filesystem", () => ({
  readFile: vi.fn(),
}));

describe("avatar/[id] API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    res.setHeader = vi.fn().mockReturnValue(res);
    return res;
  };

  test("returns 401 if id is missing", async () => {
    const req = { method: "GET", query: {} };
    const res = mockRes();

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith("Invalid parameters.");
  });

  test("returns 400 if user not found", async () => {
    const req = { method: "GET", query: { id: "100" } };
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("File inaccessible.");
  });

  test.skip("returns 400 if user private and not in public collection, and requester not whitelisted", async () => {
    const req = { method: "GET", query: { id: "100" } };
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue({ id: 2 } as any); // Requesting as user 2

    // Target user (100) is private
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({
        id: 100,
        isPrivate: true,
        whitelistedUsers: [],
      } as any) // Target user
      .mockResolvedValueOnce({ id: 2, username: "user2" } as any); // Requester

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(null); // Not in public collection
    vi.mocked(readFile).mockResolvedValue({
      file: "data",
      contentType: "image/jpeg",
      status: 200,
    } as any);

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("File inaccessible.");
  });

  test("returns file if user is public", async () => {
    const req = { method: "GET", query: { id: "100" } };
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue({ id: 2 } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 100,
      isPrivate: false,
      whitelistedUsers: [],
    } as any);

    vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);
    vi.mocked(readFile).mockResolvedValue({
      file: "data",
      contentType: "image/jpeg",
      status: 200,
    } as any);

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith("data");
  });
});
