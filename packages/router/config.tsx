import { useQuery } from "@tanstack/react-query";
import { MobileAuth } from "@linkwarden/types/global";

export type Config = {
  DISABLE_REGISTRATION: boolean | null;
  ADMIN: number | null;
  RSS_POLLING_INTERVAL_MINUTES: number | null;
  EMAIL_PROVIDER: boolean | null;
  MAX_FILE_BUFFER: number | null;
  USER_CONTENT_DOMAIN: string | null;
  AI_ENABLED: boolean | null;
  INSTANCE_VERSION: string | null;
};

const normalizeVersion = (version?: string | null) => {
  if (!version) return null;

  return version
    .replace(/^v/i, "")
    .split("-")[0]
    .split(".")
    .map((part) => Number(part.replace(/\D/g, "")) || 0);
};

const compareInstanceVersions = (a?: string | null, b?: string | null) => {
  const normalizedA = normalizeVersion(a);
  const normalizedB = normalizeVersion(b);

  if (!normalizedA || !normalizedB) return -1;

  const length = Math.max(normalizedA.length, normalizedB.length);

  for (let index = 0; index < length; index++) {
    const left = normalizedA[index] ?? 0;
    const right = normalizedB[index] ?? 0;

    if (left > right) return 1;
    if (left < right) return -1;
  }

  return 0;
};

const isAtLeastInstanceVersion = (
  version?: string | null,
  minimumVersion?: string | null
) => {
  return compareInstanceVersions(version, minimumVersion) >= 0;
};

const useConfig = (auth?: MobileAuth) => {
  const isMobile = auth !== undefined;

  return useQuery({
    queryKey: ["config", auth?.instance ?? "web"],
    enabled:
      !isMobile || (auth.status === "authenticated" && Boolean(auth.instance)),
    queryFn: async () => {
      const response = await fetch(
        (auth?.instance ? auth.instance : "") + "/api/v1/config",
        auth?.session
          ? {
              headers: {
                Authorization: `Bearer ${auth.session}`,
              },
            }
          : undefined
      );
      const data = await response.json();

      return data.response as Config;
    },
  });
};

export { useConfig, compareInstanceVersions, isAtLeastInstanceVersion };
