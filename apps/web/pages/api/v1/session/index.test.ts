import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import verifyByCredentials from "@/lib/api/verifyByCredentials";
import createSession from "@/lib/api/controllers/session/createSession";
import handler from "./index";

vi.mock("@/lib/api/verifyByCredentials", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/session/createSession", () => ({
  default: vi.fn(),
}));

const createMockResponse = () => {
  const state = {
    statusCode: 200,
    jsonBody: undefined as any,
    headers: {} as Record<string, string>,
  };

  const res = {
    setHeader(name: string, value: string) {
      state.headers[name] = value;
      return res;
    },
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

const request = (body: Record<string, unknown>) =>
  ({ method: "POST", body }) as any;

const user = { id: 4, email: "user@lab.test" } as any;

describe("/api/v1/session", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CREDENTIALS_ENABLED", "");
    vi.mocked(createSession).mockResolvedValue({
      status: 200,
      response: { token: "session-token" },
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects the request without checking the password when credentials are disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_CREDENTIALS_ENABLED", "false");

    const { res, state } = createMockResponse();
    await handler(
      request({ username: "user", password: "Passw0rd!", sessionName: "a" }),
      res
    );

    expect(state.statusCode).toBe(400);
    expect(state.jsonBody).toEqual({
      response: "Login with credentials is disabled.",
    });
    expect(verifyByCredentials).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("creates a session for valid credentials", async () => {
    vi.mocked(verifyByCredentials).mockResolvedValue({
      status: "success",
      user,
    });
    const { res, state } = createMockResponse();

    await handler(
      request({ username: "user", password: "Passw0rd!", sessionName: "a" }),
      res
    );

    expect(createSession).toHaveBeenCalledWith(4, "a");
    expect(state.jsonBody).toEqual({ response: { token: "session-token" } });
  });

  it("reports an unverified email with its code and address", async () => {
    vi.mocked(verifyByCredentials).mockResolvedValue({
      status: "email_not_verified",
      user,
    });
    const { res, state } = createMockResponse();

    await handler(request({ username: "user", password: "Passw0rd!" }), res);

    expect(state.statusCode).toBe(401);
    expect(state.jsonBody).toMatchObject({
      code: "EMAIL_NOT_VERIFIED",
      email: "user@lab.test",
    });
    expect(createSession).not.toHaveBeenCalled();
  });

  it("rejects invalid credentials without creating a session", async () => {
    vi.mocked(verifyByCredentials).mockResolvedValue({
      status: "invalid_credentials",
    });
    const { res, state } = createMockResponse();

    await handler(request({ username: "user", password: "Passw0rd!" }), res);

    expect(state.statusCode).toBe(400);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("passes the verification code to the credentials check", async () => {
    vi.mocked(verifyByCredentials).mockResolvedValue({
      status: "success",
      user,
    });
    const { res } = createMockResponse();

    await handler(
      request({ username: "user", password: "Passw0rd!", code: " 123456 " }),
      res
    );

    expect(verifyByCredentials).toHaveBeenCalledWith({
      username: "user",
      password: "Passw0rd!",
      code: "123456",
    });
  });

  it("reports a wrong verification code with its own error code", async () => {
    vi.mocked(verifyByCredentials).mockResolvedValue({
      status: "invalid_code",
      response: "Invalid or expired code.",
    } as any);
    const { res, state } = createMockResponse();

    await handler(
      request({ username: "user", password: "Passw0rd!", code: "000000" }),
      res
    );

    expect(state.statusCode).toBe(400);
    expect(state.jsonBody).toEqual({
      response: "Invalid or expired code.",
      code: "INVALID_VERIFICATION_CODE",
    });
    expect(createSession).not.toHaveBeenCalled();
  });

  it("asks to wait with a 429 and Retry-After after too many wrong passwords", async () => {
    vi.mocked(verifyByCredentials).mockResolvedValue({
      status: "too_many_attempts",
      response: "Too many incorrect passwords. Please try again in 7 seconds.",
      retryAfter: 7,
    });
    const { res, state } = createMockResponse();

    await handler(request({ username: "user", password: "Passw0rd!" }), res);

    expect(state.statusCode).toBe(429);
    expect(state.headers["Retry-After"]).toBe("7");
    expect(state.jsonBody).toEqual({
      response: "Too many incorrect passwords. Please try again in 7 seconds.",
      code: "TOO_MANY_ATTEMPTS",
    });
    expect(createSession).not.toHaveBeenCalled();
  });
});
