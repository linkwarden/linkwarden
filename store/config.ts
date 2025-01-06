// store/localSettings.ts
import { create } from "zustand";

export type Config = {
  DISABLE_REGISTRATION?: boolean;
  ADMIN?: number;
  RSS_POLLING_INTERVAL_MINUTES?: number;
  EMAIL_PROVIDER?: boolean;
  MAX_FILE_BUFFER?: number;
  AI_ENABLED?: boolean;
};

type ConfigStore = {
  config: Config;
  setConfig: (data: Config) => void;
};

const useConfigStore = create<ConfigStore>((set) => ({
  config: {
    DISABLE_REGISTRATION: false,
    ADMIN: 0,
    RSS_POLLING_INTERVAL_MINUTES: 60,
    EMAIL_PROVIDER: false,
    MAX_FILE_BUFFER: 0,
    AI_ENABLED: false,
  },
  setConfig: (data) => {
    set((state) => ({
      config: {
        ...state.config,
        ...data,
      },
    }));
  },
}));

export default useConfigStore;
