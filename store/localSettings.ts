import { create } from "zustand";

type LocalSettings = {
  darkMode: boolean;
};

type LocalSettingsStore = {
  settings: LocalSettings;
  updateSettings: (settings: LocalSettings) => void;
};

const useLocalSettingsStore = create<LocalSettingsStore>((set) => ({
  settings: {
    darkMode: false,
  },
  updateSettings: async (newSettings) => {
    set((state) => ({ settings: { ...state.settings, ...newSettings } }));
  },
}));

export default useLocalSettingsStore;

// TODO: Add Dark mode.
