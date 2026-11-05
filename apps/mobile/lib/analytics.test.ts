import { beforeEach, describe, expect, it, vi } from "vitest";

const { PostHog, optIn, optOut, screen } = vi.hoisted(() => {
  const optIn = vi.fn();
  const optOut = vi.fn();
  const screen = vi.fn();
  const PostHog = vi.fn(function () {
    return { optIn, optOut, screen };
  });
  return { PostHog, optIn, optOut, screen };
});

vi.mock("posthog-react-native", () => ({ default: PostHog }));

const load = async () => await import("./analytics");

beforeEach(() => {
  vi.resetModules();
  PostHog.mockClear();
  optIn.mockClear();
  optOut.mockClear();
  screen.mockClear();
});

describe("mobile usage analytics", () => {
  it("does nothing before analytics start, like for self-hosted instances", async () => {
    const { captureScreen, stopAnalytics } = await load();

    expect(() => captureScreen("/dashboard")).not.toThrow();
    expect(() => stopAnalytics()).not.toThrow();
    expect(PostHog).not.toHaveBeenCalled();
    expect(screen).not.toHaveBeenCalled();
  });

  it("keeps the anonymous id in memory and turns off replays, surveys and push events", async () => {
    const { startAnalytics } = await load();

    startAnalytics("phc_mobile", "https://eu.i.posthog.com");

    expect(PostHog).toHaveBeenCalledTimes(1);
    expect(PostHog).toHaveBeenCalledWith(
      "phc_mobile",
      expect.objectContaining({
        host: "https://eu.i.posthog.com",
        persistence: "memory",
        enableSessionReplay: false,
        preloadFeatureFlags: false,
        disableSurveys: true,
        capturePushNotificationSubscriptions: false,
        capturePushNotificationOpened: false,
      })
    );
  });

  it("reuses the client when analytics start again, and only opts back in", async () => {
    const { startAnalytics, stopAnalytics, captureScreen } = await load();

    startAnalytics("phc_mobile", "https://eu.i.posthog.com");
    captureScreen("/dashboard");
    stopAnalytics();
    startAnalytics("phc_mobile", "https://eu.i.posthog.com");

    expect(PostHog).toHaveBeenCalledTimes(1);
    expect(screen).toHaveBeenCalledWith("/dashboard");
    expect(optOut).toHaveBeenCalledTimes(1);
    expect(optIn).toHaveBeenCalledTimes(1);
  });
});
