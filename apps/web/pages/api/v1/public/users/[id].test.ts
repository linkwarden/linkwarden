import { describe, expect, test, vi, beforeEach } from "vitest";
import users from "./[id]";
import getPublicUser from "@/lib/api/controllers/public/users/getPublicUser";
import verifyToken from "@/lib/api/verifyToken";

vi.mock("@/lib/api/controllers/public/users/getPublicUser", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyToken", () => ({
  default: vi.fn(),
}));

describe("public/users/[id] API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  test("GET: calls getPublicUser with ID check", async () => {
    const req = { method: "GET", query: { id: "123" } }; // Numeric string
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any);
    vi.mocked(getPublicUser).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await users(req as any, res as any);

    expect(getPublicUser).toHaveBeenCalledWith("123", true);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("GET: calls getPublicUser with Username check", async () => {
    const req = { method: "GET", query: { id: "user123" } };
    const res = mockRes();

    vi.mocked(verifyToken).mockResolvedValue(null as any); // Not logged in
    vi.mocked(getPublicUser).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await users(req as any, res as any);

    expect(getPublicUser).toHaveBeenCalledWith("user123", false);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
