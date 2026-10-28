// Imported explicitly so Next.js does not inline NEXT_PUBLIC_* values at
// build time. These flags have to follow the environment of the running server.
import * as process from "process";

const truthyValues = ["true", "1", "yes", "on"];

export function parseBooleanEnv(value: string | undefined) {
  if (!value) return false;

  // Docker Compose list syntax keeps quotes as part of the value,
  // e.g. `- NEXT_PUBLIC_DISABLE_REGISTRATION="true"`.
  const normalized = value
    .trim()
    .replace(/^(["'])(.*)\1$/, "$2")
    .trim()
    .toLowerCase();

  return truthyValues.includes(normalized);
}

export function isRegistrationDisabled() {
  return parseBooleanEnv(process.env.NEXT_PUBLIC_DISABLE_REGISTRATION);
}

export function isNewSsoUsersDisabled() {
  return parseBooleanEnv(process.env.DISABLE_NEW_SSO_USERS);
}
