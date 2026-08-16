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
  };
}
