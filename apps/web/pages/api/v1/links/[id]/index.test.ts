import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import links from "./index";
import getLinkById from "@/lib/api/controllers/links/linkId/getLinkById";
import updateLinkById from "@/lib/api/controllers/links/linkId/updateLinkById";
import deleteLinkById from "@/lib/api/controllers/links/linkId/deleteLinkById";
import verifyUser from "@/lib/api/verifyUser";

vi.mock("@/lib/api/controllers/links/linkId/getLinkById", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/links/linkId/updateLinkById", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/controllers/links/linkId/deleteLinkById", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

describe("links/[id]/index API", () => {
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

    await links(req as any, res as any);

    expect(getLinkById).not.toHaveBeenCalled();
  });

  test("GET: calls getLinkById", async () => {
    const req = { method: "GET", query: { id: "100" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(getLinkById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await links(req as any, res as any);

    expect(getLinkById).toHaveBeenCalledWith(1, 100);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("PUT: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "PUT" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await links(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("PUT: calls updateLinkById", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = {
      method: "PUT",
      query: { id: "100" },
      body: { name: "Updated" },
    };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(updateLinkById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await links(req as any, res as any);

    expect(updateLinkById).toHaveBeenCalledWith(1, 100, req.body, true);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("DELETE: returns 400 in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO = "true";
    const req = { method: "DELETE" };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);

    await links(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("DELETE: calls deleteLinkById", async () => {
    process.env.NEXT_PUBLIC_DEMO = "false";
    const req = { method: "DELETE", query: { id: "100" } };
    const res = mockRes();
    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(deleteLinkById).mockResolvedValue({
      status: 200,
      response: {},
    } as any);

    await links(req as any, res as any);

    expect(deleteLinkById).toHaveBeenCalledWith(1, 100);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
