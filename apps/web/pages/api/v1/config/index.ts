import type { NextApiRequest, NextApiResponse } from "next";
import * as process from "process";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ response: getEnvData() });
}

export const getEnvData = () => {
  const hasAiProvider = !!(
    process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL ||
    process.env.OPENAI_API_KEY ||
    process.env.AZURE_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.PERPLEXITY_API_KEY
  );

  return {
    DISABLE_REGISTRATION:
      process.env.NEXT_PUBLIC_DISABLE_REGISTRATION === "true" || null,
    ADMIN: Number(process.env.NEXT_PUBLIC_ADMIN) || null,
    RSS_POLLING_INTERVAL_MINUTES:
      Number(process.env.NEXT_PUBLIC_RSS_POLLING_INTERVAL_MINUTES) || null,
    EMAIL_PROVIDER: process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true" || null,
    MAX_FILE_BUFFER: Number(process.env.NEXT_PUBLIC_MAX_FILE_BUFFER) || null,
    USER_CONTENT_DOMAIN: process.env.NEXT_PUBLIC_USER_CONTENT_DOMAIN || null,
    AI_ENABLED: hasAiProvider || null,
    INSTANCE_VERSION: process.env.version,
    STRIPE_ENABLED:
      process.env.NEXT_PUBLIC_STRIPE === "true" ||
      Boolean(process.env.STRIPE_SECRET_KEY) ||
      null,
    STRIPE_BILLING_PORTAL_URL:
      process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL || null,
    TRIAL_PERIOD_DAYS:
      Number(process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS) || null,
    REQUIRE_CC: process.env.NEXT_PUBLIC_REQUIRE_CC === "true" || null,
    DEMO: process.env.NEXT_PUBLIC_DEMO === "true" || null,
    DEMO_USERNAME:
      (process.env.NEXT_PUBLIC_DEMO === "true" &&
        process.env.NEXT_PUBLIC_DEMO_USERNAME) ||
      null,
    DEMO_PASSWORD:
      (process.env.NEXT_PUBLIC_DEMO === "true" &&
        process.env.NEXT_PUBLIC_DEMO_PASSWORD) ||
      null,
    GOOGLE_ENABLED: process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" || null,
    MOBILE_APP_REDIRECT_ENABLED:
      process.env.NEXT_PUBLIC_MOBILE_APP_REDIRECT_ENABLED === "true" || null,
  };
};
