import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./app-store";
import { prisma } from "@linkwarden/prisma";
import getAppleSubscriptionState from "@/lib/api/billing/appStore";
import { writeAppleSubscription } from "@/lib/api/billing/syncStoreSubscription";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    subscription: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/api/billing/appStore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/billing/appStore")>()),
  default: vi.fn(),
}));

vi.mock("@/lib/api/billing/syncStoreSubscription", () => ({
  writeAppleSubscription: vi.fn(),
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
    send(body: any) {
      state.jsonBody = body;
      return res;
    },
  };

  return { res: res as any, state };
};

// Unsigned JWS, as an attacker would send it
const encodeJws = (payload: object) =>
  [
    Buffer.from(JSON.stringify({ alg: "ES256" })).toString("base64url"),
    Buffer.from(JSON.stringify(payload)).toString("base64url"),
    "signature",
  ].join(".");

const renewal = {
  signedPayload: encodeJws({
    notificationType: "DID_RENEW",
    data: {
      signedTransactionInfo: encodeJws({
        originalTransactionId: "2000000123456789",
      }),
    },
  }),
};

const createRequest = (query: Record<string, any>, body: any = renewal) =>
  ({ method: "POST", query, body }) as any;

describe("/api/v1/webhooks/app-store", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DEMO", "");
    vi.stubEnv("APP_STORE_ISSUER_ID", "issuer");
    vi.stubEnv("APP_STORE_KEY_ID", "key");
    vi.stubEnv("APP_STORE_PRIVATE_KEY", "private-key");
    vi.stubEnv("APP_STORE_WEBHOOK_TOKEN", "webhook-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects the request when App Store billing is not configured", async () => {
    vi.stubEnv("APP_STORE_PRIVATE_KEY", "");

    const { res, state } = createMockResponse();
    await handler(createRequest({ token: "webhook-token" }), res);

    expect(state.statusCode).toBe(400);
    expect(getAppleSubscriptionState).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests when the webhook token is not configured", async () => {
    vi.stubEnv("APP_STORE_WEBHOOK_TOKEN", "");

    const { res, state } = createMockResponse();
    await handler(createRequest({}), res);

    expect(state.statusCode).toBe(400);
    expect(state.jsonBody).toEqual({
      response:
        "This action is disabled because App Store billing is not configured.",
    });
    expect(getAppleSubscriptionState).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", {}],
    ["wrong", { token: "wrong-token" }],
    ["a prefix of the real one", { token: "webhook" }],
    ["repeated", { token: ["webhook-token", "webhook-token"] }],
  ])("rejects the request when the token is %s", async (_, query) => {
    const { res, state } = createMockResponse();
    await handler(createRequest(query), res);

    expect(state.statusCode).toBe(401);
    expect(state.jsonBody).toEqual({ response: "Invalid token." });
    expect(getAppleSubscriptionState).not.toHaveBeenCalled();
  });

  it("acknowledges test notifications without calling Apple", async () => {
    const { res, state } = createMockResponse();
    await handler(
      createRequest(
        { token: "webhook-token" },
        { signedPayload: encodeJws({ notificationType: "TEST" }) }
      ),
      res
    );

    expect(state.statusCode).toBe(200);
    expect(state.jsonBody).toEqual({ response: "Event ignored." });
    expect(getAppleSubscriptionState).not.toHaveBeenCalled();
  });

  it("rejects a malformed payload", async () => {
    const { res, state } = createMockResponse();
    await handler(
      createRequest({ token: "webhook-token" }, { signedPayload: "not-a-jws" }),
      res
    );

    expect(state.statusCode).toBe(400);
    expect(state.jsonBody).toEqual({ response: "Invalid payload." });
  });

  it("syncs the subscription from Apple for an authorized notification", async () => {
    const appleState = { originalTransactionId: "2000000123456789" } as any;
    vi.mocked(getAppleSubscriptionState).mockResolvedValue(appleState);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      userId: 7,
    } as any);

    const { res, state } = createMockResponse();
    await handler(createRequest({ token: "webhook-token" }), res);

    expect(getAppleSubscriptionState).toHaveBeenCalledWith("2000000123456789");
    expect(writeAppleSubscription).toHaveBeenCalledWith(7, appleState);
    expect(state.statusCode).toBe(200);
    expect(state.jsonBody).toEqual({ response: "Done!" });
  });
});
