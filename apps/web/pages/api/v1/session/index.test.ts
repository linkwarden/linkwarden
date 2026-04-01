import { describe, expect, test, vi, beforeEach } from "vitest";
import session from "./index";
import verifyByCredentials from "@/lib/api/verifyByCredentials";
import createSession from "@/lib/api/controllers/session/createSession";

vi.mock("@/lib/api/verifyByCredentials", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/session/createSession", () => ({
  default: vi.fn(),
}));

describe("session/index API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  test("returns 400 for invalid input", async () => {
    const req = {
      method: "POST",
      body: {},
    };
    const res = mockRes();

    await session(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ response: expect.stringContaining("Error:") })
    );
  });

  test("returns 400 if credentials verification fails", async () => {
    const req = {
      method: "POST",
      body: {
        username: "user",
        password: "password123",
      },
    };
    const res = mockRes();

    vi.mocked(verifyByCredentials).mockResolvedValue(null);

    await session(req as any, res as any);

    expect(verifyByCredentials).toHaveBeenCalledWith({
      username: "user",
      password: "password123",
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      response:
        "Invalid credentials. You might need to reset your password if you're sure you already signed up with the current username/email.",
    });
  });

  test("creates session successfully", async () => {
    const req = {
      method: "POST",
      body: {
        username: "user",
        password: "password123",
        sessionName: "My Session",
      },
    };
    const res = mockRes();

    vi.mocked(verifyByCredentials).mockResolvedValue({ id: 1 } as any);
    vi.mocked(createSession).mockResolvedValue({
      status: 200,
      response: { token: "token" },
    } as any);

    await session(req as any, res as any);

    expect(verifyByCredentials).toHaveBeenCalled();
    expect(createSession).toHaveBeenCalledWith(1, "My Session");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ response: { token: "token" } });
  });

  test("does nothing for non-POST requests but performs validation", async () => {
    const req = {
      method: "GET",
      body: {
        username: "user",
        password: "password123",
      },
    };
    const res = mockRes();

    vi.mocked(verifyByCredentials).mockResolvedValue({ id: 1 } as any);

    await session(req as any, res as any);

    expect(verifyByCredentials).toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
