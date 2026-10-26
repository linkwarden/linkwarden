import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@linkwarden/prisma";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    verificationToken: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/sendVerificationRequest", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/emailVerificationCode", () => ({
  sendEmailVerificationCode: vi.fn(),
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

const request = (email: unknown) =>
  ({ method: "POST", body: { email } }) as any;

// emailEnabled is read when the module loads
const loadHandler = async () =>
  (await import("./request-verification-email")).default;

describe("/api/v1/auth/request-verification-email", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("EMAIL_FROM", "noreply@lab.test");
    vi.stubEnv("EMAIL_SERVER", "smtp://127.0.0.1:2525");
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret");
    vi.stubEnv("NEXTAUTH_URL", "http://127.0.0.1:3000/api/v1/auth");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("refuses when email isn't configured", async () => {
    vi.stubEnv("EMAIL_SERVER", "");
    const handler = await loadHandler();
    const { res, state } = createMockResponse();

    await handler(request("user@lab.test"), res);

    expect(state.statusCode).toBe(400);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("refuses an unknown email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const handler = await loadHandler();
    const { res, state } = createMockResponse();

    await handler(request("nobody@lab.test"), res);

    expect(state.statusCode).toBe(400);
    expect(state.jsonBody).toEqual({ response: "Invalid email." });
  });

  it("refuses an email that is already verified", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      email: "user@lab.test",
      emailVerified: new Date(),
    } as any);
    const handler = await loadHandler();
    const { res, state } = createMockResponse();

    await handler(request("user@lab.test"), res);

    expect(state.statusCode).toBe(400);
    expect(state.jsonBody).toEqual({ response: "Email is already verified." });
  });

  it("normalizes the email before looking it up", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const handler = await loadHandler();
    const { res } = createMockResponse();

    await handler(request("  User@Lab.TEST "), res);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@lab.test" },
    });
  });

  it("accepts a username and sends the code to that account's email", async () => {
    const { sendEmailVerificationCode } = await import(
      "@/lib/api/emailVerificationCode"
    );
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 1,
        email: "user@lab.test",
        emailVerified: null,
      } as any);
    vi.mocked(sendEmailVerificationCode).mockResolvedValue({
      response: "Verification code sent.",
      status: 200,
    });
    const handler = await loadHandler();
    const { res, state } = createMockResponse();

    await handler(request("SomeUser"), res);

    expect(prisma.user.findUnique).toHaveBeenLastCalledWith({
      where: { username: "someuser" },
    });
    expect(sendEmailVerificationCode).toHaveBeenCalledWith("user@lab.test");
    expect(state.statusCode).toBe(200);
  });

  it("prefers the account with that email over one with that username", async () => {
    const { sendEmailVerificationCode } = await import(
      "@/lib/api/emailVerificationCode"
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 1,
      email: "user@lab.test",
      emailVerified: null,
    } as any);
    vi.mocked(sendEmailVerificationCode).mockResolvedValue({
      response: "Verification code sent.",
      status: 200,
    });
    const handler = await loadHandler();
    const { res } = createMockResponse();

    await handler(request("user@lab.test"), res);

    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(sendEmailVerificationCode).toHaveBeenCalledWith("user@lab.test");
  });

  it("sends a verification code and passes its result through", async () => {
    const { sendEmailVerificationCode } = await import(
      "@/lib/api/emailVerificationCode"
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      email: "user@lab.test",
      emailVerified: null,
    } as any);
    vi.mocked(sendEmailVerificationCode).mockResolvedValue({
      response: "Please wait a minute before requesting a new code.",
      status: 429,
    });
    const handler = await loadHandler();
    const { res, state } = createMockResponse();

    await handler(request("user@lab.test"), res);

    expect(sendEmailVerificationCode).toHaveBeenCalledWith("user@lab.test");
    expect(state.statusCode).toBe(429);
    expect(prisma.verificationToken.create).not.toHaveBeenCalled();
  });
});
