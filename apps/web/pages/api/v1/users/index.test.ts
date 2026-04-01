import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import users from "./index";
import postUser from "@/lib/api/controllers/users/postUser";
import getUsers from "@/lib/api/controllers/users/getUsers";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@/lib/api/controllers/users/postUser", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/users/getUsers", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("users/index API", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  test("POST: returns 400 in demo mode", async () => {
    const req = { method: "POST" };
    const res = mockRes();

    process.env.NEXT_PUBLIC_DEMO = "true";

    await users(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      response:
        "This action is disabled because this is a read-only demo of Linkwarden.",
    });
  });

  test("POST: calls postUser", async () => {
    const req = { method: "POST" };
    const res = mockRes();

    process.env.NEXT_PUBLIC_DEMO = "false";
    vi.mocked(postUser).mockResolvedValue({
      status: 201,
      response: { id: 1 },
    } as any);

    await users(req as any, res as any);

    expect(postUser).toHaveBeenCalledWith(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ response: { id: 1 } });
  });

  test("GET: returns 401 if unauthorized", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue(null);

    await users(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ response: "Unauthorized..." });
  });

  test("GET: calls getUsers", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    const mockUser = { id: 1 };
    vi.mocked(verifyUser).mockResolvedValue(mockUser as any);
    vi.mocked(getUsers).mockResolvedValue({
      status: 200,
      response: [mockUser],
    } as any);

    await users(req as any, res as any);

    expect(getUsers).toHaveBeenCalledWith(mockUser);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ response: [mockUser] });
  });
});
