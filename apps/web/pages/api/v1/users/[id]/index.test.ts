import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "@linkwarden/prisma";
import verifyToken from "@/lib/api/verifyToken";
import verifySubscription from "@/lib/api/stripe/verifySubscription";
import getUserById from "@/lib/api/controllers/users/userId/getUserById";
import updateUserById from "@/lib/api/controllers/users/userId/updateUserById";
import deleteUserById from "@/lib/api/controllers/users/userId/deleteUserById";

// Mock dependencies
vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/verifyToken", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/stripe/verifySubscription", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/users/userId/getUserById", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/users/userId/updateUserById", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/users/userId/deleteUserById", () => ({
  default: vi.fn(),
}));

describe("users/[id]/index API", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
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

  const loadHandler = async () => {
    return (await import("./index")).default;
  };

  test("returns 400 for invalid request (missing id)", async () => {
    const req = { query: {} };
    const res = mockRes();
    vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any);

    const handler = await loadHandler();
    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ response: "Invalid request." });
  });

  test("returns 401 for invalid token", async () => {
    const req = { query: { id: "1" } };
    const res = mockRes();
    vi.mocked(verifyToken).mockResolvedValue("Invalid token");

    const handler = await loadHandler();
    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ response: "Invalid token" });
  });

  test("GET: returns 401 if permission denied (not owner/admin)", async () => {
    const req = { method: "GET", query: { id: "2" } }; // Requesting user 2
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any); // Current user 1
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1 } as any);
    process.env.NEXT_PUBLIC_ADMIN = "999"; // Admin is 999

    const handler = await loadHandler();
    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ response: "Permission denied." });
  });

  test("GET: returns user data if owner", async () => {
    const req = { method: "GET", query: { id: "1" } };
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1 } as any);
    vi.mocked(getUserById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    const handler = await loadHandler();
    await handler(req as any, res as any);

    expect(getUserById).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("GET: returns user data if admin", async () => {
    const req = { method: "GET", query: { id: "2" } };
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any);
    process.env.NEXT_PUBLIC_ADMIN = "1"; // User 1 is admin
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1 } as any);
    vi.mocked(getUserById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    const handler = await loadHandler();
    await handler(req as any, res as any);

    expect(getUserById).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("Stripe: returns 401 if subscription invalid", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    const req = { method: "PUT", query: { id: "1" } };
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1 } as any);
    vi.mocked(verifySubscription).mockResolvedValue(false as any);

    const handler = await loadHandler();
    await handler(req as any, res as any);

    expect(verifySubscription).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("PUT: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "PUT", query: { id: "1" } };
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1 } as any);

    const handler = await loadHandler();
    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ response: expect.stringContaining("demo") })
    );
  });

  test("PUT: updates user successfully", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = {
      method: "PUT",
      query: { id: "1" },
      body: { name: "New Name" },
    };
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1 } as any);
    vi.mocked(updateUserById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    const handler = await loadHandler();
    await handler(req as any, res as any);

    expect(updateUserById).toHaveBeenCalledWith(1, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("DELETE: deletes user successfully", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "DELETE", query: { id: "1" } };
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1 } as any);
    vi.mocked(deleteUserById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    const handler = await loadHandler();
    await handler(req as any, res as any);

    expect(deleteUserById).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
