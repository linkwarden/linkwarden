import { useEffect } from "react";
import { AppState } from "react-native";
import { useSegments } from "expo-router";
import { useConfig } from "@linkwarden/router/config";
import { useUser } from "@linkwarden/router/user";
import useAuthStore from "@/store/auth";
import { captureScreen, startAnalytics, stopAnalytics } from "@/lib/analytics";

const cloudInstance = "https://cloud.linkwarden.app";

// Only Linkwarden Cloud accounts that share usage analytics are counted, so
// nothing is ever sent while signed in to a self-hosted instance
export default function Analytics() {
  const { auth } = useAuthStore();
  const { data: config } = useConfig(auth);
  const { data: user, refetch: refetchUser } = useUser(auth);
  const segments = useSegments();

  const key = config?.POSTHOG_KEY;
  const host = config?.POSTHOG_HOST;
  const enabled =
    auth.status === "authenticated" &&
    auth.instance === cloudInstance &&
    Boolean(key && host) &&
    user?.shareUsageAnalytics === true;

  useEffect(() => {
    if (enabled && key && host) startAnalytics(key, host);
    else stopAnalytics();
  }, [enabled, key, host]);

  // The setting can be turned off on another device, and the cached user is
  // kept for a day, so it's checked again whenever the app comes back to the
  // foreground
  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refetchUser();
    });

    return () => subscription.remove();
  }, [enabled, refetchUser]);

  // Route groups are dropped and ids stay as [id], like /collections/[id]
  const screen = "/" + segments.filter((s) => !s.startsWith("(")).join("/");

  useEffect(() => {
    if (enabled) captureScreen(screen);
  }, [enabled, screen]);

  return null;
}
