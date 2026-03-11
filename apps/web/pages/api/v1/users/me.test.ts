import { describe, expect, test, vi, beforeEach } from "vitest";
import me from "./me";
import getUserById from "@/lib/api/controllers/users/userId/getUserById";
import verifyToken from "@/lib/api/verifyToken";

vi.mock("@/lib/api/controllers/users/userId/getUserById", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyToken", () => ({
  default: vi.fn(),
}));

describe("users/me API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  test("returns 401 if token is invalid", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue("Invalid token");

    await me(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ response: "Invalid token" });
  });

  test("returns user data for GET request", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    const mockUser = { id: 1, name: "Test User" };
    vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any);
    vi.mocked(getUserById).mockResolvedValue({
      status: 200,
      response: mockUser,
    } as any);

    await me(req as any, res as any);

    expect(getUserById).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ response: mockUser });
  });

  test("does nothing for non-GET requests", async () => {
    const req = { method: "POST" };
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any);

    await me(req as any, res as any);

    expect(getUserById).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
