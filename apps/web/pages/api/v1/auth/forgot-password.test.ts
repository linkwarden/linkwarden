import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./forgot-password";
import { prisma } from "@linkwarden/prisma";
import sendPasswordResetRequest from "@/lib/api/sendPasswordResetRequest";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
    passwordResetToken: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/sendPasswordResetRequest", () => ({
  default: vi.fn(),
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

describe("/api/v1/auth/forgot-password", () => {
  beforeEach(() => {
    vi.mocked(prisma.passwordResetToken.count).mockResolvedValue(0 as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("answers the same way whether or not the email is registered", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      email: "known@example.com",
      name: "Known",
    } as any);
    const known = createMockResponse();
    await handler(
      { method: "POST", body: { email: "known@example.com" } } as any,
      known.res
    );

    vi.mocked(prisma.user.findFirst).mockResolvedValue(null as any);
    const unknown = createMockResponse();
    await handler(
      { method: "POST", body: { email: "unknown@example.com" } } as any,
      unknown.res
    );

    expect(known.state.statusCode).toBe(200);
    expect(unknown.state.statusCode).toBe(known.state.statusCode);
    expect(unknown.state.jsonBody).toEqual(known.state.jsonBody);
  });

  it("sends a reset email only when the account exists", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      email: "known@example.com",
      name: "Known",
    } as any);
    await handler(
      { method: "POST", body: { email: "known@example.com" } } as any,
      createMockResponse().res
    );
    expect(sendPasswordResetRequest).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();
    vi.mocked(prisma.passwordResetToken.count).mockResolvedValue(0 as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null as any);
    await handler(
      { method: "POST", body: { email: "unknown@example.com" } } as any,
      createMockResponse().res
    );
    expect(sendPasswordResetRequest).not.toHaveBeenCalled();
  });
});
