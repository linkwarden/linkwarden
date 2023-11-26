import { create } from "zustand";

type LocalSettings = {
  theme: string;
};

type LocalSettingsStore = {
  settings: LocalSettings;
  updateSettings: (settings: LocalSettings) => void;
  setSettings: () => void;
};

const useLocalSettingsStore = create<LocalSettingsStore>((set) => ({
  settings: {
    theme: "",
  },
  updateSettings: async (newSettings) => {
    if (
      newSettings.theme &&
      newSettings.theme !== localStorage.getItem("theme")
    ) {
      localStorage.setItem("theme", newSettings.theme);

      const localTheme = localStorage.getItem("theme") || "";

      document.querySelector("html")?.setAttribute("data-theme", localTheme);
    }

    set((state) => ({ settings: { ...state.settings, ...newSettings } }));
  },
  setSettings: async () => {
    if (!localStorage.getItem("theme")) {
      localStorage.setItem("theme", "dark");
    }

    const localTheme = localStorage.getItem("theme") || "";

    set((state) => ({
      settings: { ...state.settings, theme: localTheme },
    }));

    document.querySelector("html")?.setAttribute("data-theme", localTheme);
  },
}));

export default useLocalSettingsStore;
