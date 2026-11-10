import type { NextApiRequest } from "next";
import { PostHog } from "posthog-node";

let client: PostHog | null | undefined;

// Usage analytics are only set up on Linkwarden Cloud, so self-hosted
// instances never create a client or send anything
const getClient = () => {
  if (client !== undefined) return client;

  const key = process.env.POSTHOG_KEY;
  const host = process.env.POSTHOG_HOST;

  client = key && host ? new PostHog(key, { host, disableGeoip: true }) : null;

  return client;
};

// The mobile app's requests carry the native HTTP client's user agent, while
// the browser extension and other integrations send a bearer token
export const getPlatform = (req: NextApiRequest) => {
  if (/CFNetwork|okhttp/i.test(req.headers["user-agent"] || ""))
    return "mobile";

  return req.headers.authorization?.startsWith("Bearer ") ? "api" : "web";
};

type Props = {
  req: NextApiRequest;
  user: { id: number; shareUsageAnalytics: boolean };
  event: string;
  // Never pass anything the user wrote or saved, like URLs, titles or names
  properties?: Record<string, string | number | boolean>;
};

export default function captureEvent({ req, user, event, properties }: Props) {
  const posthog = getClient();

  if (!posthog || !user.shareUsageAnalytics) return;

  posthog.capture({
    distinctId: String(user.id),
    event,
    properties: { ...properties, platform: getPlatform(req) },
  });
}
