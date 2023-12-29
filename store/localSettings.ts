import { create } from "zustand";
import { ViewMode } from "@/types/global";

type LocalSettings = {
  theme?: string;
  viewMode?: string
};

type LocalSettingsStore = {
  settings: LocalSettings;
  updateSettings: (settings: LocalSettings) => void;
  setSettings: () => void;
};

const useLocalSettingsStore = create<LocalSettingsStore>((set) => ({
  settings: {
    theme: "",
    viewMode: "",
  },
  updateSettings: async (newSettings) => {
    if (newSettings.theme) {
      localStorage.setItem("theme", newSettings.theme);
      document.documentElement.setAttribute('data-theme', newSettings.theme);
      
      if (newSettings.theme.endsWith("-dark")) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    if (newSettings.viewMode) {
      localStorage.setItem("viewMode", newSettings.viewMode);
    }

    set((state) => ({ settings: { ...state.settings, ...newSettings } }));
  },
  setSettings: async () => {
    let theme = localStorage.getItem("theme");
    if (!theme || !theme.includes("-")) {
      theme = "default-dark"; // Default theme
      localStorage.setItem("theme", theme);
    }

    const localTheme = theme;

    document.documentElement.setAttribute('data-theme', localTheme);

    if (localTheme.endsWith("-dark")) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    set((state) => ({
      settings: { ...state.settings, theme: localTheme },
    }));

    document.querySelector("html")?.setAttribute("data-theme", localTheme);
  },
}));

export default useLocalSettingsStore;
