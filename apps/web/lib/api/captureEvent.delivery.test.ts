import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { gunzipSync } from "node:zlib";
import type { NextApiRequest } from "next";

// Runs the real posthog-node client against a local server. Only the
// batching and retry timings are shortened, so failures show up quickly.
const clients = vi.hoisted(() => [] as { flush: () => Promise<void> }[]);

vi.mock("posthog-node", async (importOriginal) => {
  const actual = await importOriginal<typeof import("posthog-node")>();

  class QuickPostHog extends actual.PostHog {
    constructor(key: string, options: Record<string, unknown>) {
      super(key, {
        ...options,
        flushAt: 1,
        flushInterval: 0,
        fetchRetryCount: 1,
        fetchRetryDelay: 10,
        requestTimeout: 300,
      });
      clients.push(this);
    }
  }

  return { ...actual, PostHog: QuickPostHog };
});

type Mode = "ok" | "error" | "hang" | "reset" | "bad-json";

let mode: Mode = "ok";
let received: { url: string; headers: http.IncomingHttpHeaders; body: any }[] =
  [];
const sockets = new Set<import("node:net").Socket>();

const server = http.createServer((req, res) => {
  const chunks: Uint8Array[] = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const raw = Buffer.concat(chunks);
    const text =
      raw[0] === 0x1f && raw[1] === 0x8b
        ? gunzipSync(new Uint8Array(raw)).toString("utf8")
        : raw.toString("utf8");
    received.push({ url: req.url || "", headers: req.headers, body: text });

    if (mode === "hang") return;
    if (mode === "reset") return req.socket.destroy();
    if (mode === "error") {
      res.writeHead(500, { "content-type": "application/json" });
      return res.end('{"error":"down"}');
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(mode === "bad-json" ? "<html>not json" : '{"status":1}');
  });
});
server.on("connection", (socket) => {
  sockets.add(socket);
  socket.on("close", () => sockets.delete(socket));
});

let host = "";

const request = (headers: Record<string, string> = {}) =>
  ({ headers }) as unknown as NextApiRequest;

const user = { id: 42, shareUsageAnalytics: true };

const unhandled: unknown[] = [];
const onUnhandled = (reason: unknown) => unhandled.push(reason);

const load = async () => (await import("./captureEvent")).default;

const settle = async () => {
  await Promise.all(clients.map((client) => client.flush().catch(() => {})));
  await new Promise((resolve) => setTimeout(resolve, 50));
};

beforeAll(async () => {
  await new Promise<void>((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve())
  );
  host = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.on("unhandledRejection", onUnhandled);
});

afterAll(async () => {
  process.off("unhandledRejection", onUnhandled);
  sockets.forEach((socket) => socket.destroy());
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  vi.resetModules();
  clients.length = 0;
  received = [];
  unhandled.length = 0;
  mode = "ok";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("captureEvent with a real PostHog client", () => {
  it("sends only the event, the account id and the platform", async () => {
    vi.stubEnv("POSTHOG_KEY", "phc_delivery");
    vi.stubEnv("POSTHOG_HOST", host);
    const captureEvent = await load();

    captureEvent({
      req: request({
        cookie: "next-auth.session-token=session-secret",
        authorization: "Bearer token-secret",
        "x-forwarded-for": "203.0.113.7",
        "user-agent": "Mozilla/5.0 Firefox/140.0",
      }),
      user,
      event: "link_created",
      properties: { type: "url" },
    });
    await settle();

    expect(received).toHaveLength(1);
    expect(received[0].url).toMatch(/^\/batch\/?/);
    expect(received[0].headers.cookie).toBeUndefined();

    const payload = JSON.parse(received[0].body);
    expect(payload.api_key).toBe("phc_delivery");
    expect(payload.batch).toHaveLength(1);

    const [sent] = payload.batch;
    expect(sent.event).toBe("link_created");
    expect(sent.distinct_id).toBe("42");
    expect(sent.properties).toMatchObject({
      type: "url",
      platform: "api",
      $geoip_disable: true,
    });
    expect(Object.keys(sent.properties).sort()).toEqual(
      [
        "$geoip_disable",
        "$is_server",
        "$lib",
        "$lib_version",
        "platform",
        "type",
      ].sort()
    );

    const everything = JSON.stringify(received);
    for (const secret of [
      "session-secret",
      "token-secret",
      "203.0.113.7",
      "Firefox",
    ])
      expect(everything).not.toContain(secret);
  });

  it("accepts a host with a trailing slash or surrounding spaces", async () => {
    vi.stubEnv("POSTHOG_KEY", "phc_delivery");
    vi.stubEnv("POSTHOG_HOST", ` ${host}/ `);
    const captureEvent = await load();

    captureEvent({ req: request(), user, event: "collection_created" });
    await settle();

    expect(received.map((r) => r.url)).toEqual([
      expect.stringMatching(/^\/batch\/?/),
    ]);
  });

  it.each<Mode>(["error", "hang", "reset", "bad-json"])(
    "returns at once and never throws when PostHog answers with %s",
    async (failure) => {
      mode = failure;
      vi.stubEnv("POSTHOG_KEY", "phc_delivery");
      vi.stubEnv("POSTHOG_HOST", host);
      const captureEvent = await load();

      const started = performance.now();
      expect(() =>
        captureEvent({ req: request(), user, event: "link_created" })
      ).not.toThrow();
      expect(performance.now() - started).toBeLessThan(50);

      await settle();
      await new Promise((resolve) => setTimeout(resolve, 400));

      expect(received.length).toBeGreaterThan(0);
      expect(unhandled).toEqual([]);
    }
  );

  it.each([
    ["a closed port", "http://127.0.0.1:1"],
    ["a host without a scheme", "eu.i.posthog.com.invalid"],
    ["a value that isn't a URL", "not a url"],
  ])("never throws when POSTHOG_HOST is %s", async (_label, badHost) => {
    vi.stubEnv("POSTHOG_KEY", "phc_delivery");
    vi.stubEnv("POSTHOG_HOST", badHost);
    const captureEvent = await load();

    expect(() =>
      captureEvent({ req: request(), user, event: "signed_up" })
    ).not.toThrow();

    await settle();
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(unhandled).toEqual([]);
  });

  it("sends nothing for an account that turned usage analytics off", async () => {
    vi.stubEnv("POSTHOG_KEY", "phc_delivery");
    vi.stubEnv("POSTHOG_HOST", host);
    const captureEvent = await load();

    captureEvent({
      req: request(),
      user: { id: 42, shareUsageAnalytics: false },
      event: "link_created",
    });
    await settle();

    expect(received).toEqual([]);
  });
});
