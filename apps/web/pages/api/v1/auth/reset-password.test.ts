import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./reset-password";
import { prisma } from "@linkwarden/prisma";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
    passwordResetToken: {
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    emailVerificationCode: {
      deleteMany: vi.fn(),
    },
  },
}));

const createMockResponse = () => {
  const state = {
    statusCode: 200,
    jsonBody: undefined as any,
  };

  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: any) {
      state.jsonBody = body;
      return res;
    },
  };

  return { res: res as any, state };
};

const request = {
  method: "POST",
  body: { token: "reset-token", password: "NewPassw0rd!" },
} as any;

describe("/api/v1/auth/reset-password", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("clears failed email verification attempts along with the password", async () => {
    vi.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue({
      identifier: "Owner@Example.com",
    } as any);
    const { res, state } = createMockResponse();

    await handler(request, res);

    expect(state.statusCode).toBe(200);
    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.emailVerificationCode.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "owner@example.com" },
    });
  });

  it("leaves verification attempts alone for an invalid token", async () => {
    vi.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(null);
    const { res, state } = createMockResponse();

    await handler(request, res);

    expect(state.statusCode).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.emailVerificationCode.deleteMany).not.toHaveBeenCalled();
  });
});
