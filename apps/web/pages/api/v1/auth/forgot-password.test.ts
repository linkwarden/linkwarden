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

  // Emails are stored lowercased and the login form lowercases what's typed
  it("finds the account however the email is capitalized", async () => {
    vi.mocked(prisma.user.findFirst).mockImplementation((async (args: any) =>
      args.where.email === "known@example.com"
        ? { email: "known@example.com", name: "Known" }
        : null) as any);
    await handler(
      { method: "POST", body: { email: " Known@Example.com " } } as any,
      createMockResponse().res
    );

    expect(sendPasswordResetRequest).toHaveBeenCalledWith(
      "known@example.com",
      "Known"
    );
  });

  it("prefers the account spelled exactly as typed", async () => {
    vi.mocked(prisma.user.findFirst).mockImplementation((async (args: any) =>
      args.where.email === "Known@Example.com"
        ? { email: "Known@Example.com", name: "Capitals" }
        : args.where.email === "known@example.com"
          ? { email: "known@example.com", name: "Lowercase" }
          : null) as any);
    await handler(
      { method: "POST", body: { email: "Known@Example.com" } } as any,
      createMockResponse().res
    );

    expect(sendPasswordResetRequest).toHaveBeenCalledTimes(1);
    expect(sendPasswordResetRequest).toHaveBeenCalledWith(
      "Known@Example.com",
      "Capitals"
    );
  });

  it("limits requests for every spelling of the email together", async () => {
    vi.mocked(prisma.passwordResetToken.count).mockResolvedValue(3 as any);
    const { res, state } = createMockResponse();
    await handler(
      { method: "POST", body: { email: "Known@Example.com" } } as any,
      res
    );

    expect(state.statusCode).toBe(400);
    expect(prisma.passwordResetToken.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        identifier: {
          in: expect.arrayContaining([
            "Known@Example.com",
            "known@example.com",
          ]),
        },
      }),
    });
    expect(sendPasswordResetRequest).not.toHaveBeenCalled();
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
