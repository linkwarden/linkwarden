import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@linkwarden/prisma";
import { verifyAppleIdentityToken } from "@/lib/api/apple";
import createSession from "@/lib/api/controllers/session/createSession";
import captureEvent from "@/lib/api/captureEvent";
import handler from "./apple";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    account: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/apple", () => ({
  verifyAppleIdentityToken: vi.fn(),
}));

vi.mock("@/lib/api/controllers/session/createSession", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/captureEvent", () => ({
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

const request = (body: Record<string, unknown> = {}) =>
  ({
    method: "POST",
    body: { identityToken: "id-token", sessionName: "phone", ...body },
  }) as any;

describe("/api/v1/auth/mobile/apple", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APPLE_ENABLED", "true");
    vi.mocked(verifyAppleIdentityToken).mockResolvedValue({
      sub: "apple-sub",
      email: "victim@lab.test",
      email_verified: true,
    } as any);
    vi.mocked(prisma.account.findFirst).mockResolvedValue(null);
    vi.mocked(createSession).mockResolvedValue({
      status: 200,
      response: { token: "session-token" },
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("drops the password of an unverified account it links to", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 4,
      email: "victim@lab.test",
      emailVerified: null,
      password: "attacker-hash",
      accounts: [],
    } as any);
    const { res, state } = createMockResponse();

    await handler(request(), res);

    expect(prisma.account.create).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { password: null, emailVerified: expect.any(Date) },
    });
    expect(createSession).toHaveBeenCalledWith(4, "phone");
    expect(state.statusCode).toBe(200);
  });

  it("keeps the password of a verified account it links to", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 5,
      email: "victim@lab.test",
      emailVerified: new Date(),
      password: "own-hash",
      accounts: [],
    } as any);
    const { res } = createMockResponse();

    await handler(request(), res);

    expect(prisma.account.create).toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(createSession).toHaveBeenCalledWith(5, "phone");
  });

  it("refuses an account already linked to another sign-in method", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 6,
      email: "victim@lab.test",
      emailVerified: null,
      password: "attacker-hash",
      accounts: [{ provider: "google" }],
    } as any);
    const { res, state } = createMockResponse();

    await handler(request(), res);

    expect(state.statusCode).toBe(409);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("doesn't match accounts by an email Apple hasn't verified", async () => {
    vi.mocked(verifyAppleIdentityToken).mockResolvedValue({
      sub: "apple-sub",
      email: "victim@lab.test",
      email_verified: false,
    } as any);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 9 } as any);
    const { res } = createMockResponse();

    await handler(request(), res);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.account.create).not.toHaveBeenCalled();
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: undefined }),
      })
    );
  });

  it("records a sign up only when it creates the account", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 9,
      shareUsageAnalytics: true,
    } as any);
    const req = request();

    await handler(req, createMockResponse().res);

    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith({
      req,
      user: { id: 9, shareUsageAnalytics: true },
      event: "signed_up",
      properties: { method: "apple" },
    });

    vi.mocked(captureEvent).mockClear();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 5,
      email: "victim@lab.test",
      emailVerified: new Date(),
      accounts: [],
    } as any);

    await handler(request(), createMockResponse().res);

    expect(captureEvent).not.toHaveBeenCalled();
  });
});
