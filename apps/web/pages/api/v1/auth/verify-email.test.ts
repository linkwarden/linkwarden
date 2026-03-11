import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import verifyEmail from "./verify-email";
import { prisma } from "@linkwarden/prisma";
import updateCustomerEmail from "@/lib/api/stripe/updateCustomerEmail";

// Mock dependencies
vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    verificationToken: {
      findFirst: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    account: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/stripe/updateCustomerEmail", () => ({
  default: vi.fn(),
}));

describe("verifyEmail API", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_DEMO;
    delete process.env.STRIPE_SECRET_KEY;
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

  test("returns 400 if demo mode is enabled", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "POST" };
    const res = mockRes();

    await verifyEmail(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      response:
        "This action is disabled because this is a read-only demo of Linkwarden.",
    });
  });

  test("returns 400 for invalid input (schema validation failure)", async () => {
    const req = {
      method: "POST",
      query: {
        // Missing token
      },
    };
    const res = mockRes();

    await verifyEmail(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        response: expect.stringContaining("Error:"),
      })
    );
  });

  test("returns 400 if token is invalid or expired", async () => {
    const req = {
      method: "POST",
      query: { token: "invalid-token" },
    };
    const res = mockRes();

    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue(null);

    await verifyEmail(req as any, res as any);

    expect(prisma.verificationToken.findFirst).toHaveBeenCalledWith({
      where: {
        token: "invalid-token",
        expires: { gt: expect.any(Date) },
      },
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      response: "Invalid token.",
    });
  });

  test("returns 400 if user has no unverified email", async () => {
    const req = {
      method: "POST",
      query: { token: "valid-token" },
    };
    const res = mockRes();

    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      identifier: "user@example.com",
    } as any);

    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      unverifiedNewEmail: null,
    } as any);

    await verifyEmail(req as any, res as any);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: { unverifiedNewEmail: true },
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      response: "No unverified emails found.",
    });
  });

  test("returns 400 if new email is already in use", async () => {
    const req = {
      method: "POST",
      query: { token: "valid-token" },
    };
    const res = mockRes();

    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      identifier: "user@example.com",
    } as any);

    // First findFirst call: getting unverifiedNewEmail
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      unverifiedNewEmail: "taken@example.com",
    } as any);

    // Second findFirst call: checking if email is in use
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      email: "taken@example.com",
    } as any);

    await verifyEmail(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      response: "Email is already in use.",
    });
  });

  test("successfully verifies email and updates user", async () => {
    const req = {
      method: "POST",
      query: { token: "valid-token" },
    };
    const res = mockRes();

    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      identifier: "old@example.com",
    } as any);

    // Getting unverifiedNewEmail
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      unverifiedNewEmail: "new@example.com",
    } as any);

    // Checking if email is in use (returns null)
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

    await verifyEmail(req as any, res as any);

    // Check account deletion (SSO removal)
    expect(prisma.account.deleteMany).toHaveBeenCalledWith({
      where: { user: { email: "old@example.com" } },
    });

    // Check user update
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: "old@example.com" },
      data: {
        email: "new@example.com",
        unverifiedNewEmail: null,
      },
    });

    // Check token cleanup
    expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: "valid-token" },
    });
    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "old@example.com" },
    });

    // Stripe should NOT be called since key is missing
    expect(updateCustomerEmail).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      response: "valid-token",
    });
  });

  test("calls Stripe update if key is present", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    const req = {
      method: "POST",
      query: { token: "valid-token" },
    };
    const res = mockRes();

    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      identifier: "old@example.com",
    } as any);

    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      unverifiedNewEmail: "new@example.com",
    } as any);

    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

    await verifyEmail(req as any, res as any);

    expect(updateCustomerEmail).toHaveBeenCalledWith(
      "old@example.com",
      "new@example.com"
    );
  });

  test("does nothing for non-POST requests", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    const result = await verifyEmail(req as any, res as any);

    expect(result).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });
});
