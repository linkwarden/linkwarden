import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./index";
import verifyByCredentials from "@/lib/api/verifyByCredentials";
import createSession from "@/lib/api/controllers/session/createSession";

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
  body: {
    username: "user",
    password: "password123",
    sessionName: "Browser Extension",
  },
} as any;

describe("/api/v1/session", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects the request without checking the password when credentials are disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_CREDENTIALS_ENABLED", "false");

    const { res, state } = createMockResponse();
    await handler(request, res);

    expect(state.statusCode).toBe(400);
    expect(state.jsonBody).toEqual({
      response: "Login with credentials is disabled.",
    });
    expect(verifyByCredentials).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("creates a session for valid credentials when credentials are enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_CREDENTIALS_ENABLED", "");
    vi.mocked(verifyByCredentials).mockResolvedValue({
      status: "success",
      user: { id: 7 },
    } as any);
    vi.mocked(createSession).mockResolvedValue({
      status: 200,
      response: { token: "token" },
    } as any);

    const { res, state } = createMockResponse();
    await handler(request, res);

    expect(verifyByCredentials).toHaveBeenCalledWith({
      username: "user",
      password: "password123",
    });
    expect(createSession).toHaveBeenCalledWith(7, "Browser Extension");
    expect(state.statusCode).toBe(200);
    expect(state.jsonBody).toEqual({ response: { token: "token" } });
  });
});
