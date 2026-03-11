import { describe, expect, test, vi, beforeEach } from "vitest";
import dashboard from "./index";
import getDashboardData from "@/lib/api/controllers/dashboard/getDashboardData";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@/lib/api/controllers/dashboard/getDashboardData", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("dashboard/index API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  test("returns if verifyUser fails", async () => {
    const req = { method: "GET" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue(null);

    await dashboard(req as any, res as any);

    expect(getDashboardData).not.toHaveBeenCalled();
  });

  test("GET: calls getDashboardData", async () => {
    const req = {
      method: "GET",
      query: { sort: "1", cursor: "100" },
    };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(getDashboardData).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await dashboard(req as any, res as any);

    expect(getDashboardData).toHaveBeenCalledWith(1, {
      sort: 1,
      cursor: 100,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
