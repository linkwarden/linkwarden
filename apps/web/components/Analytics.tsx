import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useConfig } from "@linkwarden/router/config";
import { useUser } from "@linkwarden/router/user";
import { setAnalyticsAllowed, startAnalytics } from "@/lib/client/analytics";

export default function Analytics() {
  const { data: config } = useConfig();
  const { status } = useSession();
  const { data: user } = useUser();

  const shareUsageAnalytics = user?.shareUsageAnalytics;

  useEffect(() => {
    if (!config?.POSTHOG_KEY || !config.POSTHOG_HOST) return;

    // Nothing is counted for a signed in user until their setting has loaded
    const allowed =
      status === "unauthenticated" ||
      (status === "authenticated" && shareUsageAnalytics === true);

    setAnalyticsAllowed(allowed);

    if (allowed) startAnalytics(config.POSTHOG_KEY, config.POSTHOG_HOST);
  }, [config?.POSTHOG_KEY, config?.POSTHOG_HOST, status, shareUsageAnalytics]);

  return null;
}
