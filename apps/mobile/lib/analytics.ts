import PostHog from "posthog-react-native";

let client: PostHog | null = null;

export const startAnalytics = (key: string, host: string) => {
  if (client) return client.optIn();

  client = new PostHog(key, {
    host,
    // The anonymous id is only kept in memory, so nothing is stored on the
    // device and every app launch counts as a new visitor
    persistence: "memory",
    enableSessionReplay: false,
    errorTracking: {
      autocapture: {
        uncaughtExceptions: true,
        unhandledRejections: true,
        console: false,
      },
    },
    preloadFeatureFlags: false,
    disableSurveys: true,
    capturePushNotificationSubscriptions: false,
    capturePushNotificationOpened: false,
  });
};

export const stopAnalytics = () => client?.optOut();

export const captureScreen = (name: string) => client?.screen(name);
