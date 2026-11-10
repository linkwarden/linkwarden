import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CaptureResult } from "posthog-js";

const { init, capture } = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: { init, capture } }));

// The allowed and started flags live in the module, so each test loads a
// fresh copy
const load = async () => await import("./analytics");

const event = (
  properties: Record<string, any>,
  extra: Partial<CaptureResult> = {}
) =>
  ({
    uuid: "1",
    event: "$pageview",
    properties,
    ...extra,
  }) as CaptureResult;

beforeEach(() => {
  vi.resetModules();
  init.mockClear();
  capture.mockClear();
});

describe("sanitizePath", () => {
  it("replaces ids with [id]", async () => {
    const { sanitizePath } = await load();

    expect(sanitizePath("/collections/123")).toBe("/collections/[id]");
    expect(sanitizePath("/public/collections/5/rss")).toBe(
      "/public/collections/[id]/rss"
    );
    expect(sanitizePath("/de/links/9/")).toBe("/de/links/[id]/");
  });

  it("drops query strings and hashes, which can hold search terms and tokens", async () => {
    const { sanitizePath } = await load();

    expect(sanitizePath("/search?q=my%20secret%20bookmark")).toBe("/search");
    expect(sanitizePath("/auth/reset-password?token=abc#top")).toBe(
      "/auth/reset-password"
    );
    expect(sanitizePath("/links/12#highlight-4")).toBe("/links/[id]");
  });

  it("leaves routes without ids alone", async () => {
    const { sanitizePath } = await load();

    expect(sanitizePath("/")).toBe("/");
    expect(sanitizePath("/dashboard")).toBe("/dashboard");
    expect(sanitizePath("/settings/preference")).toBe("/settings/preference");
  });
});

describe("sanitizeUrl", () => {
  it("keeps the origin and the cleaned path", async () => {
    const { sanitizeUrl } = await load();

    expect(
      sanitizeUrl(
        "https://cloud.linkwarden.app/collections/7?sort=1&q=private#x"
      )
    ).toBe("https://cloud.linkwarden.app/collections/[id]");
  });

  it("returns null for something that isn't a URL", async () => {
    const { sanitizeUrl } = await load();

    expect(sanitizeUrl("not a url")).toBeNull();
    expect(sanitizeUrl("")).toBeNull();
  });
});

describe("beforeSend", () => {
  it("drops every event until analytics are allowed", async () => {
    const { beforeSend, setAnalyticsAllowed } = await load();

    expect(beforeSend(event({ $current_url: "https://a.test/" }))).toBeNull();

    setAnalyticsAllowed(true);
    expect(beforeSend(event({ $current_url: "https://a.test/" }))).not.toBe(
      null
    );

    // Like a signed in user who turned usage analytics off
    setAnalyticsAllowed(false);
    expect(beforeSend(event({ $current_url: "https://a.test/" }))).toBeNull();
  });

  it("passes on an event an earlier function already dropped", async () => {
    const { beforeSend, setAnalyticsAllowed } = await load();
    setAnalyticsAllowed(true);

    expect(beforeSend(null)).toBeNull();
  });

  it("cleans every URL, path and referrer and removes the page title", async () => {
    const { beforeSend, setAnalyticsAllowed } = await load();
    setAnalyticsAllowed(true);

    const sent = beforeSend(
      event(
        {
          $current_url: "https://cloud.linkwarden.app/search?q=tax%20documents",
          $pathname: "/search",
          $prev_pageview_pathname: "/links/31",
          $session_entry_url: "https://cloud.linkwarden.app/tags/4?x=1",
          $referrer: "https://news.example.com/item?id=123456",
          $referring_domain: "news.example.com",
          title: "My private collection",
          $browser: "Firefox",
          utm_source: "newsletter",
        },
        {
          $set_once: {
            $initial_current_url: "https://cloud.linkwarden.app/links/8?a=b",
            $initial_referrer: "$direct",
          },
        }
      )
    );

    expect(sent?.properties).toEqual({
      $current_url: "https://cloud.linkwarden.app/search",
      $pathname: "/search",
      $prev_pageview_pathname: "/links/[id]",
      $session_entry_url: "https://cloud.linkwarden.app/tags/[id]",
      $referrer: "https://news.example.com",
      $referring_domain: "news.example.com",
      $browser: "Firefox",
      utm_source: "newsletter",
    });
    expect(sent?.$set_once).toEqual({
      $initial_current_url: "https://cloud.linkwarden.app/links/[id]",
      $initial_referrer: "$direct",
    });
  });

  it("drops ad click ids but keeps utm tags", async () => {
    const { beforeSend, setAnalyticsAllowed } = await load();
    setAnalyticsAllowed(true);

    const sent = beforeSend(
      event(
        {
          utm_source: "newsletter",
          utm_campaign: "launch",
          gclid: "Cj0KCQ-click-id",
          fbclid: "IwAR-click-id",
          msclkid: "ms-click-id",
          $fbc: "fb.1.1700000000.IwAR-click-id",
          $browser: "Firefox",
        },
        {
          $set_once: {
            $initial_utm_source: "newsletter",
            $initial_gclid: "Cj0KCQ-click-id",
            $initial_fbclid: "IwAR-click-id",
          },
        }
      )
    );

    expect(sent?.properties).toEqual({
      utm_source: "newsletter",
      utm_campaign: "launch",
      $browser: "Firefox",
    });
    expect(sent?.$set_once).toEqual({ $initial_utm_source: "newsletter" });
  });

  it("groups heatmap clicks under the cleaned page URL", async () => {
    const { beforeSend, setAnalyticsAllowed } = await load();
    setAnalyticsAllowed(true);

    const sent = beforeSend(
      event(
        {
          $heatmap_data: {
            "https://cloud.linkwarden.app/collections/1": [{ x: 1, y: 1 }],
            "https://cloud.linkwarden.app/collections/2?q=a": [{ x: 2, y: 2 }],
            "not a url": [{ x: 3, y: 3 }],
          },
        },
        { event: "$$heatmap" }
      )
    );

    expect(sent?.properties.$heatmap_data).toEqual({
      "https://cloud.linkwarden.app/collections/[id]": [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ],
    });
  });
});

describe("startAnalytics", () => {
  it("starts PostHog once, without cookies, replays or autocapture, and with heatmaps", async () => {
    const { startAnalytics, beforeSend } = await load();

    await startAnalytics("phc_test", "https://eu.i.posthog.com");
    await startAnalytics("phc_test", "https://eu.i.posthog.com");

    expect(init).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        api_host: "https://eu.i.posthog.com",
        cookieless_mode: "always",
        disable_session_recording: true,
        autocapture: false,
        rageclick: false,
        capture_dead_clicks: false,
        capture_heatmaps: true,
        disable_surveys: true,
        before_send: beforeSend,
      })
    );
  });

  it("starts PostHog once when called again while posthog-js is loading", async () => {
    const { startAnalytics } = await load();

    await Promise.all([
      startAnalytics("phc_test", "https://eu.i.posthog.com"),
      startAnalytics("phc_test", "https://eu.i.posthog.com"),
    ]);

    expect(init).toHaveBeenCalledTimes(1);
  });

  it("records a page view that was dropped while a signed in user's setting loaded", async () => {
    const { startAnalytics, setAnalyticsAllowed, beforeSend } = await load();

    // Signed out on the login page
    setAnalyticsAllowed(true);
    await startAnalytics("phc_test", "https://eu.i.posthog.com");

    // Signed in and sent to the dashboard while the setting loads
    setAnalyticsAllowed(false);
    expect(beforeSend(event({}))).toBeNull();

    setAnalyticsAllowed(true);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith("$pageview");

    // Only once
    setAnalyticsAllowed(true);
    expect(capture).toHaveBeenCalledTimes(1);
  });

  it("records no extra page view when none was dropped", async () => {
    const { startAnalytics, setAnalyticsAllowed, beforeSend } = await load();

    setAnalyticsAllowed(true);
    await startAnalytics("phc_test", "https://eu.i.posthog.com");

    // The setting loaded before the next page was opened
    setAnalyticsAllowed(false);
    expect(beforeSend(event({}, { event: "$pageleave" }))).toBeNull();
    setAnalyticsAllowed(true);

    expect(capture).not.toHaveBeenCalled();
  });

  it("records nothing for a user who stays opted out", async () => {
    const { startAnalytics, setAnalyticsAllowed, beforeSend } = await load();

    setAnalyticsAllowed(true);
    await startAnalytics("phc_test", "https://eu.i.posthog.com");
    setAnalyticsAllowed(false);
    beforeSend(event({}));
    setAnalyticsAllowed(false);

    expect(capture).not.toHaveBeenCalled();
  });
});
