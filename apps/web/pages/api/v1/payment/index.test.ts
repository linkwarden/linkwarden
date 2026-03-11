import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import handler from "./index";
import paymentCheckout from "@/lib/api/paymentCheckout";
import { getToken } from "next-auth/jwt";
import { prisma } from "@linkwarden/prisma";
import { Plan } from "@linkwarden/types/global";

vi.mock("@/lib/api/paymentCheckout", () => ({
  default: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("payment API", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: "secret_key",
      MONTHLY_PRICE_ID: "monthly_id",
      YEARLY_PRICE_ID: "yearly_id",
    };
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

  test("returns 400 if Stripe environment variables are missing", async () => {
    process.env.STRIPE_SECRET_KEY = "";

    const req = { method: "GET", query: {} };
    const res = mockRes();

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ response: "Payment is disabled." });
  });

  test("returns 404 if token is missing or invalid", async () => {
    vi.mocked(getToken).mockResolvedValue(null);

    const req = { method: "GET", query: {} };
    const res = mockRes();

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ response: "Token invalid." });
  });

  test("returns 404 if token is present but user not found", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = { method: "GET", query: {} };
    const res = mockRes();

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ response: "User not found." });
  });

  test("returns 404 if user has no email", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1 } as any); // no email

    const req = { method: "GET", query: {} };
    const res = mockRes();

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ response: "User not found." });
  });

  test("GET: calls paymentCheckout with monthly plan by default or when specified", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      email: "test@example.com",
    } as any);
    vi.mocked(paymentCheckout).mockResolvedValue({
      status: 200,
      response: "success",
    });

    // Default (no query.plan or unrecognized)
    const req1 = { method: "GET", query: {} };
    const res1 = mockRes();
    await handler(req1 as any, res1 as any);
    expect(paymentCheckout).toHaveBeenCalledWith(
      "test@example.com",
      "monthly_id"
    );
    expect(res1.status).toHaveBeenCalledWith(200);
    expect(res1.json).toHaveBeenCalledWith({ response: "success" });

    // Explicitly monthly
    const req2 = { method: "GET", query: { plan: String(Plan.monthly) } };
    const res2 = mockRes();
    await handler(req2 as any, res2 as any);
    expect(paymentCheckout).toHaveBeenCalledWith(
      "test@example.com",
      "monthly_id"
    );
  });

  test("GET: calls paymentCheckout with yearly plan when specified", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      email: "test@example.com",
    } as any);
    vi.mocked(paymentCheckout).mockResolvedValue({
      status: 200,
      response: "success",
    });

    const req = { method: "GET", query: { plan: String(Plan.yearly) } };
    const res = mockRes();

    await handler(req as any, res as any);

    expect(paymentCheckout).toHaveBeenCalledWith(
      "test@example.com",
      "yearly_id"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ response: "success" });
  });

  test("Does not call paymentCheckout for non-GET methods", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      email: "test@example.com",
    } as any);

    const req = { method: "POST", query: {} };
    const res = mockRes();

    await handler(req as any, res as any);

    expect(paymentCheckout).not.toHaveBeenCalled();
  });
});
