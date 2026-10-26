import { Readable } from "stream";
import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./stripe";
import aliasHandler from "../webhook";
import handleSubscription from "@/lib/api/billing/handleStripeSubscription";

vi.mock("@/lib/api/billing/handleStripeSubscription", () => ({
  default: vi.fn(),
}));

const WEBHOOK_SECRET = "whsec_test_secret";

const signPayload = (payload: string) =>
  new Stripe("sk_test_placeholder").webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  });

const createMockResponse = () => {
  const state = {
    statusCode: 200,
    jsonBody: undefined as any,
    sentBody: undefined as any,
    headers: new Map<string, string>(),
  };

  const res = {
    setHeader(name: string, value: string) {
      state.headers.set(name, value);
      return res;
    },
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: any) {
      state.jsonBody = body;
      return res;
    },
    send(body: any) {
      state.sentBody = body;
      return res;
    },
  };

  return { res: res as any, state };
};

const withRequestFields = (stream: Readable, headers: Record<string, string>) =>
  Object.assign(stream, { method: "POST", headers }) as any;

const createRequest = (chunks: Buffer[], headers: Record<string, string>) =>
  withRequestFields(Readable.from(chunks, { objectMode: false }), headers);

// Generates the body on demand and records how much of it the handler pulled.
const createStreamingRequest = (
  totalBytes: number,
  headers: Record<string, string>
) => {
  const chunk = Buffer.alloc(64 * 1024, 0x61);
  let pulledBytes = 0;

  const stream = new Readable({
    read() {
      if (pulledBytes >= totalBytes) return this.push(null);
      pulledBytes += chunk.length;
      this.push(chunk);
    },
  });

  return {
    req: withRequestFields(stream, headers),
    pulledBytes: () => pulledBytes,
  };
};

const subscriptionEvent = JSON.stringify({
  id: "evt_test",
  object: "event",
  type: "customer.subscription.updated",
  data: {
    object: {
      id: "sub_test",
      status: "active",
      items: {
        data: [
          {
            current_period_start: 1700000000,
            current_period_end: 1702592000,
            quantity: 3,
          },
        ],
      },
      description: "Ünïcödé so multi-byte characters can split across chunks",
    },
  },
});

describe("/api/v1/webhooks/stripe", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DEMO", "");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_placeholder");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("verifies the signature against the exact raw bytes, even when chunks split a multi-byte character", async () => {
    const raw = Buffer.from(subscriptionEvent, "utf8");
    const splitAt = raw.indexOf("Ü") + 1;
    const req = createRequest(
      [raw.subarray(0, splitAt), raw.subarray(splitAt)],
      {
        "stripe-signature": signPayload(subscriptionEvent),
      }
    );

    const { res, state } = createMockResponse();
    await handler(req, res);

    expect(state.statusCode).toBe(200);
    expect(state.jsonBody).toEqual({ response: "Done!" });
    expect(handleSubscription).toHaveBeenCalledWith({
      id: "sub_test",
      active: true,
      quantity: 3,
      periodStart: 1700000000,
      periodEnd: 1702592000,
      action: "customer.subscription.updated",
    });
  });

  it("serves the same handler from the /api/v1/webhook alias", async () => {
    const req = createRequest([Buffer.from(subscriptionEvent)], {
      "stripe-signature": signPayload(subscriptionEvent),
    });

    const { res, state } = createMockResponse();
    await aliasHandler(req, res);

    expect(state.statusCode).toBe(200);
    expect(handleSubscription).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid signature", async () => {
    const req = createRequest([Buffer.from(subscriptionEvent)], {
      "stripe-signature": "t=1,v1=invalid",
    });

    const { res, state } = createMockResponse();
    await handler(req, res);

    expect(state.statusCode).toBe(400);
    expect(state.sentBody).toBe("Webhook signature verification failed.");
    expect(handleSubscription).not.toHaveBeenCalled();
  });

  it("rejects a body that was modified after signing", async () => {
    const tampered = subscriptionEvent.replace('"quantity":3', '"quantity":9');
    const req = createRequest([Buffer.from(tampered)], {
      "stripe-signature": signPayload(subscriptionEvent),
    });

    const { res, state } = createMockResponse();
    await handler(req, res);

    expect(state.statusCode).toBe(400);
    expect(handleSubscription).not.toHaveBeenCalled();
  });

  it("rejects a request without a signature", async () => {
    const req = createRequest([Buffer.from(subscriptionEvent)], {});

    const { res, state } = createMockResponse();
    await handler(req, res);

    expect(state.statusCode).toBe(400);
    expect(handleSubscription).not.toHaveBeenCalled();
  });

  it("does not read the body when Stripe is not configured", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const { req, pulledBytes } = createStreamingRequest(1024 * 1024, {
      "stripe-signature": "invalid",
    });

    const { res, state } = createMockResponse();
    await handler(req, res);

    expect(state.statusCode).toBe(400);
    expect(state.jsonBody).toEqual({
      response: "This action is disabled because Stripe is not initialized.",
    });
    expect(pulledBytes()).toBe(0);
  });

  it("returns 400 when the request stream errors", async () => {
    const stream = new Readable({
      read() {
        this.destroy(new Error("socket hang up"));
      },
    });
    const req = withRequestFields(stream, { "stripe-signature": "invalid" });

    const { res, state } = createMockResponse();
    await handler(req, res);

    expect(state.statusCode).toBe(400);
    expect(handleSubscription).not.toHaveBeenCalled();
  });

  // GHSA-2wwr-q2ww-hq75
  it("stops reading an oversized unauthenticated body instead of buffering all of it", async () => {
    const { req, pulledBytes } = createStreamingRequest(16 * 1024 * 1024, {
      "stripe-signature": "invalid",
      "transfer-encoding": "chunked",
    });

    const { res, state } = createMockResponse();
    await handler(req, res);

    expect(state.statusCode).toBe(413);
    expect(state.sentBody).toBe("Payload too large.");
    expect(state.headers.get("Connection")).toBe("close");
    expect(pulledBytes()).toBeLessThan(2 * 1024 * 1024);
  });

  it("rejects an oversized Content-Length without reading the body", async () => {
    const { req, pulledBytes } = createStreamingRequest(16 * 1024 * 1024, {
      "stripe-signature": "invalid",
      "content-length": String(16 * 1024 * 1024),
    });

    const { res, state } = createMockResponse();
    await handler(req, res);

    expect(state.statusCode).toBe(413);
    expect(state.headers.get("Connection")).toBe("close");
    expect(pulledBytes()).toBe(0);
  });

  it("accepts a signed body of exactly 1 MiB and rejects one byte more", async () => {
    const padEvent = (size: number) => {
      const base = JSON.stringify({
        id: "evt_test",
        type: "invoice.created",
        data: { object: {} },
        pad: "",
      });
      return base.replace(
        '"pad":""',
        `"pad":"${"a".repeat(size - base.length)}"`
      );
    };

    const atLimit = padEvent(1024 * 1024);
    const overLimit = padEvent(1024 * 1024 + 1);
    expect(Buffer.byteLength(atLimit)).toBe(1024 * 1024);
    expect(Buffer.byteLength(overLimit)).toBe(1024 * 1024 + 1);

    const accepted = createMockResponse();
    await handler(
      createRequest([Buffer.from(atLimit)], {
        "stripe-signature": signPayload(atLimit),
      }),
      accepted.res
    );
    expect(accepted.state.statusCode).toBe(200);

    const rejected = createMockResponse();
    await handler(
      createRequest([Buffer.from(overLimit)], {
        "stripe-signature": signPayload(overLimit),
      }),
      rejected.res
    );
    expect(rejected.state.statusCode).toBe(413);
  });

  it("reports a stream error as an invalid body rather than a bad signature", async () => {
    const stream = new Readable({
      read() {
        this.destroy(new Error("socket hang up"));
      },
    });
    const req = withRequestFields(stream, { "stripe-signature": "invalid" });

    const { res, state } = createMockResponse();
    await handler(req, res);

    expect(state.statusCode).toBe(400);
    expect(state.sentBody).toBe("Invalid request body.");
  });
});
