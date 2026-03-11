import { describe, expect, test, vi, beforeEach } from "vitest";
import worker from "./index";
import verifyUser from "@/lib/api/verifyUser";
import getWorkerStats from "@/lib/api/controllers/worker/getWorkerStats";

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/worker/getWorkerStats", () => ({
  default: vi.fn(),
}));

describe("worker/index API", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  test("returns 403 if user is not admin", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 2 } as any); // Default admin is 1
    process.env.NEXT_PUBLIC_ADMIN = "1";

    await worker(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ response: "Forbidden." });
  });

  test("returns worker stats if user is admin", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    process.env.NEXT_PUBLIC_ADMIN = "1";

    vi.mocked(getWorkerStats).mockResolvedValue({
      status: 200,
      active: 5,
      completed: 10,
    } as any);

    await worker(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ active: 5, completed: 10 });
  });

  test("does nothing if verifyUser fails", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue(null); // verifyUser handles response

    await worker(req as any, res as any);

    expect(getWorkerStats).not.toHaveBeenCalled();
  });
});
