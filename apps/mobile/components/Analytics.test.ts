import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  auth: {} as Record<string, unknown>,
  config: {} as Record<string, unknown> | undefined,
  user: {} as Record<string, unknown> | undefined,
  segments: [] as string[],
  appStateListeners: [] as ((state: string) => void)[],
}));

const refetchUser = vi.hoisted(() => vi.fn());

const analytics = vi.hoisted(() => ({
  startAnalytics: vi.fn(),
  stopAnalytics: vi.fn(),
  captureScreen: vi.fn(),
}));

// Effects run as soon as the component is called, so it can be called like a
// plain function with its hooks replaced
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useEffect: (effect: () => void) => effect(),
}));
vi.mock("react-native", () => ({
  AppState: {
    addEventListener: (_: string, listener: (state: string) => void) => {
      state.appStateListeners.push(listener);
      return { remove: vi.fn() };
    },
  },
}));
vi.mock("expo-router", () => ({ useSegments: () => state.segments }));
vi.mock("@linkwarden/router/config", () => ({
  useConfig: () => ({ data: state.config }),
}));
vi.mock("@linkwarden/router/user", () => ({
  useUser: () => ({ data: state.user, refetch: refetchUser }),
}));
vi.mock("@/store/auth", () => ({ default: () => ({ auth: state.auth }) }));
vi.mock("@/lib/analytics", () => analytics);

import Analytics from "./Analytics";

const cloud = "https://cloud.linkwarden.app";

beforeEach(() => {
  state.auth = { instance: cloud, session: "token", status: "authenticated" };
  state.config = {
    POSTHOG_KEY: "phc_test",
    POSTHOG_HOST: "https://eu.i.posthog.com",
  };
  state.user = { id: 1, shareUsageAnalytics: true };
  state.segments = ["(tabs)", "dashboard"];
  state.appStateListeners = [];
  refetchUser.mockClear();
  analytics.startAnalytics.mockClear();
  analytics.stopAnalytics.mockClear();
  analytics.captureScreen.mockClear();
});

const expectStopped = () => {
  Analytics();

  expect(analytics.startAnalytics).not.toHaveBeenCalled();
  expect(analytics.captureScreen).not.toHaveBeenCalled();
  expect(analytics.stopAnalytics).toHaveBeenCalled();
};

describe("mobile Analytics", () => {
  it("runs for a Linkwarden Cloud account that shares usage analytics", () => {
    Analytics();

    expect(analytics.startAnalytics).toHaveBeenCalledWith(
      "phc_test",
      "https://eu.i.posthog.com"
    );
    expect(analytics.captureScreen).toHaveBeenCalledWith("/dashboard");
    expect(analytics.stopAnalytics).not.toHaveBeenCalled();
  });

  it("never runs while signed in to a self-hosted instance", () => {
    state.auth.instance = "https://links.example.com";
    expectStopped();
  });

  it("never runs for an instance that only looks like Linkwarden Cloud", () => {
    for (const instance of [
      "https://cloud.linkwarden.app.example.com",
      "http://cloud.linkwarden.app",
      "https://cloud.linkwarden.app/",
      "https://evil.test/https://cloud.linkwarden.app",
    ]) {
      state.auth.instance = instance;
      expectStopped();
    }
  });

  it("never runs for a self-hosted instance that serves PostHog keys of its own", () => {
    state.auth.instance = "https://links.example.com";
    state.config = { POSTHOG_KEY: "phc_other", POSTHOG_HOST: "https://x.test" };
    expectStopped();
  });

  it("stops once the user turns usage analytics off", () => {
    state.user = { id: 1, shareUsageAnalytics: false };
    expectStopped();
  });

  it("waits for the user's setting to load", () => {
    // useUser's placeholder before the first response
    state.user = {};
    expectStopped();

    state.user = undefined;
    expectStopped();
  });

  it("stops after signing out", () => {
    state.auth.status = "unauthenticated";
    expectStopped();
  });

  it("needs both the key and the host", () => {
    state.config = { POSTHOG_KEY: "phc_test", POSTHOG_HOST: null };
    expectStopped();

    state.config = {
      POSTHOG_KEY: null,
      POSTHOG_HOST: "https://eu.i.posthog.com",
    };
    expectStopped();

    state.config = undefined;
    expectStopped();
  });

  it("records screens as routes, without route groups or ids", () => {
    state.segments = ["(tabs)", "(collections)", "collections", "[id]"];
    Analytics();
    expect(analytics.captureScreen).toHaveBeenLastCalledWith(
      "/collections/[id]"
    );

    state.segments = [];
    Analytics();
    expect(analytics.captureScreen).toHaveBeenLastCalledWith("/");
  });

  it("checks the setting again when the app comes back to the foreground", () => {
    Analytics();
    expect(state.appStateListeners).toHaveLength(1);

    state.appStateListeners[0]("background");
    expect(refetchUser).not.toHaveBeenCalled();

    state.appStateListeners[0]("active");
    expect(refetchUser).toHaveBeenCalledTimes(1);
  });

  it("doesn't watch the app state while analytics are off", () => {
    state.user = { id: 1, shareUsageAnalytics: false };
    Analytics();

    expect(state.appStateListeners).toEqual([]);
  });
});
