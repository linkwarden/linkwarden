import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnvData } from "./index";

describe("getEnvData", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the raw user content domain when configured", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_USER_CONTENT_DOMAIN",
      "https://content.example.com/view/"
    );

    expect(getEnvData().USER_CONTENT_DOMAIN).toBe(
      "https://content.example.com/view/"
    );
  });

  it("returns null when the user content domain is absent", () => {
    vi.stubEnv("NEXT_PUBLIC_USER_CONTENT_DOMAIN", "");

    expect(getEnvData().USER_CONTENT_DOMAIN).toBeNull();
  });

  it("returns subscription config from the environment", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("NEXT_PUBLIC_TRIAL_PERIOD_DAYS", "30");
    vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", "true");

    expect(getEnvData()).toMatchObject({
      STRIPE_ENABLED: true,
      TRIAL_PERIOD_DAYS: 30,
      REQUIRE_CC: true,
    });
  });

  it("returns the PostHog key and host when both are set", () => {
    vi.stubEnv("POSTHOG_KEY", "phc_test");
    vi.stubEnv("POSTHOG_HOST", "https://eu.i.posthog.com");

    expect(getEnvData()).toMatchObject({
      POSTHOG_KEY: "phc_test",
      POSTHOG_HOST: "https://eu.i.posthog.com",
    });
  });

  it("returns no PostHog config unless both the key and host are set", () => {
    vi.stubEnv("POSTHOG_KEY", "phc_test");
    vi.stubEnv("POSTHOG_HOST", "");

    expect(getEnvData()).toMatchObject({
      POSTHOG_KEY: null,
      POSTHOG_HOST: null,
    });

    vi.stubEnv("POSTHOG_KEY", "");
    vi.stubEnv("POSTHOG_HOST", "https://eu.i.posthog.com");

    expect(getEnvData()).toMatchObject({
      POSTHOG_KEY: null,
      POSTHOG_HOST: null,
    });
  });
});
