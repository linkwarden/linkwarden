import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import dashboard from "./index";
import getDashboardDataV2 from "@/lib/api/controllers/dashboard/getDashboardDataV2";
import updateDashboardLayout from "@/lib/api/controllers/dashboard/updateDashboardLayout";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@/lib/api/controllers/dashboard/getDashboardDataV2", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/dashboard/updateDashboardLayout", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("v2/dashboard/index API", () => {
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

  test("returns if verifyUser fails", async () => {
    const req = { method: "GET" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue(null);

    await dashboard(req as any, res as any);

    expect(getDashboardDataV2).not.toHaveBeenCalled();
  });

  test("GET: calls getDashboardDataV2", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(getDashboardDataV2).mockResolvedValue({
      statusCode: 200,
      data: "some data",
    } as any);

    await dashboard(req as any, res as any);

    expect(getDashboardDataV2).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: "some data" });
  });

  test("PUT: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "PUT" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await dashboard(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("PUT: calls updateDashboardLayout", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "PUT", body: {} };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(updateDashboardLayout).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await dashboard(req as any, res as any);

    expect(updateDashboardLayout).toHaveBeenCalledWith(1, {});
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
