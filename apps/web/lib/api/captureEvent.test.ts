import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest } from "next";

const capture = vi.fn();
const PostHog = vi.fn(function () {
  return { capture };
});

vi.mock("posthog-node", () => ({ PostHog }));

const request = (headers: Record<string, string> = {}) =>
  ({ headers }) as unknown as NextApiRequest;

const user = { id: 42, shareUsageAnalytics: true };

// The client is created once per module, so each test loads a fresh copy
const load = async () => await import("./captureEvent");

describe("captureEvent", () => {
  beforeEach(() => {
    vi.resetModules();
    capture.mockClear();
    PostHog.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends nothing when PostHog isn't configured, like on self-hosted instances", async () => {
    vi.stubEnv("POSTHOG_KEY", "");
    vi.stubEnv("POSTHOG_HOST", "");
    const { default: captureEvent } = await load();

    captureEvent({ req: request(), user, event: "link_created" });

    expect(PostHog).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  it("sends nothing when only the key or only the host is set", async () => {
    vi.stubEnv("POSTHOG_KEY", "phc_test");
    vi.stubEnv("POSTHOG_HOST", "");
    let captureEvent = (await load()).default;
    captureEvent({ req: request(), user, event: "link_created" });

    vi.resetModules();
    vi.stubEnv("POSTHOG_KEY", "");
    vi.stubEnv("POSTHOG_HOST", "https://eu.i.posthog.com");
    captureEvent = (await load()).default;
    captureEvent({ req: request(), user, event: "link_created" });

    expect(PostHog).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  describe("with PostHog configured", () => {
    beforeEach(() => {
      vi.stubEnv("POSTHOG_KEY", "phc_test");
      vi.stubEnv("POSTHOG_HOST", "https://eu.i.posthog.com");
    });

    it("sends the event under the user's id, without a GeoIP lookup", async () => {
      const { default: captureEvent } = await load();

      captureEvent({
        req: request(),
        user,
        event: "link_created",
        properties: { type: "url" },
      });

      expect(PostHog).toHaveBeenCalledWith("phc_test", {
        host: "https://eu.i.posthog.com",
        disableGeoip: true,
      });
      expect(capture).toHaveBeenCalledWith({
        distinctId: "42",
        event: "link_created",
        properties: { type: "url", platform: "web" },
      });
    });

    it("sends nothing for a user who turned usage analytics off", async () => {
      const { default: captureEvent } = await load();

      captureEvent({
        req: request(),
        user: { id: 42, shareUsageAnalytics: false },
        event: "link_created",
      });

      expect(capture).not.toHaveBeenCalled();
    });

    it("creates the client once and reuses it", async () => {
      const { default: captureEvent } = await load();

      captureEvent({ req: request(), user, event: "link_created" });
      captureEvent({ req: request(), user, event: "collection_created" });

      expect(PostHog).toHaveBeenCalledTimes(1);
      expect(capture).toHaveBeenCalledTimes(2);
    });

    it("doesn't let a property override the platform", async () => {
      const { default: captureEvent } = await load();

      captureEvent({
        req: request(),
        user,
        event: "link_created",
        properties: { platform: "spoofed" },
      });

      expect(capture.mock.calls[0][0].properties).toEqual({ platform: "web" });
    });
  });
});

describe("getPlatform", () => {
  it("treats requests without a bearer token as the web app", async () => {
    const { getPlatform } = await load();

    expect(
      getPlatform(
        request({
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
        })
      )
    ).toBe("web");
    expect(getPlatform(request())).toBe("web");
  });

  it("recognizes the iOS and Android apps, signed in or not", async () => {
    const { getPlatform } = await load();

    expect(
      getPlatform(
        request({
          authorization: "Bearer token",
          "user-agent": "Linkwarden/42 CFNetwork/3826.500.111 Darwin/25.0.0",
        })
      )
    ).toBe("mobile");
    expect(getPlatform(request({ "user-agent": "okhttp/4.12.0" }))).toBe(
      "mobile"
    );
  });

  it("treats other bearer token requests as API clients, like the browser extension", async () => {
    const { getPlatform } = await load();

    expect(
      getPlatform(
        request({
          authorization: "Bearer token",
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0",
        })
      )
    ).toBe("api");
    expect(getPlatform(request({ authorization: "Bearer token" }))).toBe("api");
  });
});
