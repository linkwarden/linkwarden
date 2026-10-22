import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./[id]";
import getPublicUser from "@/lib/api/controllers/public/users/getPublicUser";
import verifyToken from "@/lib/api/verifyToken";

vi.mock("@/lib/api/controllers/public/users/getPublicUser", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyToken", () => ({
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

describe("/api/v1/public/users/[id]", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("looks up a username without authentication", async () => {
    vi.mocked(verifyToken).mockResolvedValue("You must be logged in." as any);
    vi.mocked(getPublicUser).mockResolvedValue({
      response: { id: 1, username: "alice" },
      status: 200,
    } as any);

    const { res, state } = createMockResponse();
    await handler(
      { method: "GET", query: { id: "alice" }, headers: {} } as any,
      res
    );

    expect(getPublicUser).toHaveBeenCalledWith("alice", false, false);
    expect(state.statusCode).toBe(200);
  });

  it("does not look up an email for an unauthenticated request", async () => {
    vi.mocked(verifyToken).mockResolvedValue("You must be logged in." as any);
    vi.mocked(getPublicUser).mockResolvedValue({
      response: "User not found.",
      status: 404,
    } as any);

    const { res, state } = createMockResponse();
    await handler(
      { method: "GET", query: { id: "alice@example.com" }, headers: {} } as any,
      res
    );

    expect(getPublicUser).toHaveBeenCalledWith("alice@example.com", false, false);
    expect(state.statusCode).toBe(404);
  });

  it("allows an email lookup for an authenticated request", async () => {
    vi.mocked(verifyToken).mockResolvedValue({ id: 7 } as any);
    vi.mocked(getPublicUser).mockResolvedValue({
      response: { id: 3, username: "bob" },
      status: 200,
    } as any);

    const { res, state } = createMockResponse();
    await handler(
      { method: "GET", query: { id: "bob@example.com" }, headers: {} } as any,
      res
    );

    expect(getPublicUser).toHaveBeenCalledWith("bob@example.com", false, true);
    expect(state.statusCode).toBe(200);
  });
});
