import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import resetPassword from "./reset-password";
import { prisma } from "@linkwarden/prisma";
import bcrypt from "bcrypt";

// Mock dependencies
vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    passwordResetToken: {
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
  },
}));

describe("resetPassword API", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_DEMO;
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

    await resetPassword(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      response:
        "This action is disabled because this is a read-only demo of Linkwarden.",
    });
  });

  test("returns 400 for invalid input (schema validation failure)", async () => {
    const req = {
      method: "POST",
      body: {
        // Missing token and password
      },
    };
    const res = mockRes();

    await resetPassword(req as any, res as any);

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
      body: {
        token: "invalid-token",
        password: "newPassword123",
      },
    };
    const res = mockRes();

    // Mock findFirst to return null (token not found)
    vi.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(null);

    await resetPassword(req as any, res as any);

    expect(prisma.passwordResetToken.findFirst).toHaveBeenCalledWith({
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

  test("successfully resets password", async () => {
    const req = {
      method: "POST",
      body: {
        token: "valid-token",
        password: "newPassword123",
      },
    };
    const res = mockRes();

    const mockTokenData = {
      identifier: "user@example.com",
      token: "valid-token",
    };

    // Mock findFirst to return valid token
    vi.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(
      mockTokenData as any
    );
    // Mock bcrypt hash
    vi.mocked(bcrypt.hash).mockResolvedValue("hashedPassword123" as never);

    await resetPassword(req as any, res as any);

    // Verify password hashing
    expect(bcrypt.hash).toHaveBeenCalledWith("newPassword123", 10);

    // Verify user update
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      data: { password: "hashedPassword123" },
    });

    // Verify token expiration update
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { token: "valid-token" },
      data: { expires: expect.any(Date) },
    });

    // Verify cleanup of old tokens
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: {
        identifier: "user@example.com",
        createdAt: { lt: expect.any(Date) },
      },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      response: "Password has been reset successfully.",
    });
  });

  test("does nothing for non-POST requests", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    const result = await resetPassword(req as any, res as any);

    expect(result).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });
});
