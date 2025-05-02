import { useQuery } from "@tanstack/react-query";

export type Config = {
  DISABLE_REGISTRATION: boolean | null;
  ADMIN: number | null;
  RSS_POLLING_INTERVAL_MINUTES: number | null;
  EMAIL_PROVIDER: boolean | null;
  MAX_FILE_BUFFER: number | null;
  AI_ENABLED: boolean | null;
};

const useConfig = () => {
  return useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const response = await fetch("/api/v1/config");
      const data = await response.json();

      return data.response as Config;
    },
  });
};

export { useConfig };
