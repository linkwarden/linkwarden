import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import forgotPassword from "./forgot-password";
import { prisma } from "@linkwarden/prisma";
import sendPasswordResetRequest from "@/lib/api/sendPasswordResetRequest";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    passwordResetToken: {
      count: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/sendPasswordResetRequest", () => ({
  default: vi.fn(),
}));

describe("forgotPassword API", () => {
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

    await forgotPassword(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      response:
        "This action is disabled because this is a read-only demo of Linkwarden.",
    });
  });

  test("returns 400 for invalid email", async () => {
    const req = {
      method: "POST",
      body: { email: "invalid-email" },
    };
    const res = mockRes();

    await forgotPassword(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        response: expect.stringContaining("Error: Invalid email"),
      })
    );
  });

  test("returns 400 if too many requests", async () => {
    const req = {
      method: "POST",
      body: { email: "test@example.com" },
    };
    const res = mockRes();

    vi.mocked(prisma.passwordResetToken.count).mockResolvedValue(3);

    await forgotPassword(req as any, res as any);

    expect(prisma.passwordResetToken.count).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      response: "Too many requests. Please try again later.",
    });
  });

  test("returns 400 if user not found", async () => {
    const req = {
      method: "POST",
      body: { email: "test@example.com" },
    };
    const res = mockRes();

    vi.mocked(prisma.passwordResetToken.count).mockResolvedValue(0);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    await forgotPassword(req as any, res as any);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      response: "No user found with that email.",
    });
  });

  test("sends password reset email and returns 200 on success", async () => {
    const req = {
      method: "POST",
      body: { email: "test@example.com" },
    };
    const res = mockRes();

    vi.mocked(prisma.passwordResetToken.count).mockResolvedValue(0);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 1,
      email: "test@example.com",
      name: "Test User",
    } as any);

    await forgotPassword(req as any, res as any);

    expect(sendPasswordResetRequest).toHaveBeenCalledWith(
      "test@example.com",
      "Test User"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      response: "Password reset email sent.",
    });
  });

  test("does nothing for non-POST requests", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    const result = await forgotPassword(req as any, res as any);

    expect(result).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
