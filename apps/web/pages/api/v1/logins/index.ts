import {
  authProviders,
  getAuthProviderButtonName,
  isAuthProviderEnabled,
} from "@/lib/api/authProviders";
import type { NextApiRequest, NextApiResponse } from "next";
import * as process from "process";

export type ResponseData = {
  credentialsEnabled: string | undefined;
  emailEnabled: string | undefined;
  registrationDisabled: string | undefined;
  buttonAuths: {
    method: string;
    name: string;
  }[];
  autoLoginProvider: string | null;
};
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  res.json(getLogins());
}

export function getLogins() {
  const buttonAuths = authProviders
    .filter(isAuthProviderEnabled)
    .map((entry) => ({
      method: entry.id,
      name: getAuthProviderButtonName(entry),
    }));

  // Only redirect automatically when the provider is unambiguous, otherwise
  // fall back to the normal login page.
  let autoLoginProvider: string | null = null;

  if (process.env.NEXT_PUBLIC_SSO_AUTO_LOGIN === "true") {
    const requested = process.env.SSO_AUTO_LOGIN_PROVIDER;

    if (requested) {
      autoLoginProvider =
        buttonAuths.find((auth) => auth.method === requested)?.method ?? null;
    } else if (buttonAuths.length === 1) {
      autoLoginProvider = buttonAuths[0].method;
    }
  }

  return {
    credentialsEnabled:
      process.env.NEXT_PUBLIC_CREDENTIALS_ENABLED !== "false"
        ? "true"
        : "false",
    emailEnabled:
      process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true" ? "true" : "false",
    registrationDisabled:
      process.env.NEXT_PUBLIC_DISABLE_REGISTRATION === "true"
        ? "true"
        : "false",
    buttonAuths: buttonAuths,
    autoLoginProvider,
  };
}
