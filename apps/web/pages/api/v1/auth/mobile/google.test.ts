import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@linkwarden/prisma";
import { verifyGoogleIdentityToken } from "@/lib/api/google";
import createSession from "@/lib/api/controllers/session/createSession";
import handler from "./google";

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

vi.mock("@/lib/api/google", () => ({
  verifyGoogleIdentityToken: vi.fn(),
}));

vi.mock("@/lib/api/controllers/session/createSession", () => ({
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

const request = {
  method: "POST",
  body: { identityToken: "id-token", sessionName: "phone" },
} as any;

describe("/api/v1/auth/mobile/google", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ENABLED", "true");
    vi.stubEnv("GOOGLE_CLIENT_ID", "client-id");
    vi.mocked(verifyGoogleIdentityToken).mockResolvedValue({
      sub: "google-sub",
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

    await handler(request, res);

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

    await handler(request, res);

    expect(prisma.account.create).toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(createSession).toHaveBeenCalledWith(5, "phone");
  });
});
