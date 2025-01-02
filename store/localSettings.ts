import { Sort } from "@/types/global";
import { create } from "zustand";

type LocalSettings = {
  theme: string;
  viewMode: string;
  color: string;
  show: {
    link: boolean;
    name: boolean;
    description: boolean;
    image: boolean;
    tags: boolean;
    icon: boolean;
    collection: boolean;
    preserved_formats: boolean;
    date: boolean;
  };
  columns: number;
  sortBy?: Sort;
};

type LocalSettingsStore = {
  settings: LocalSettings;
  updateSettings: (settings: Partial<LocalSettings>) => void;
  setSettings: () => void;
};

const useLocalSettingsStore = create<LocalSettingsStore>((set) => ({
  settings: {
    theme: "",
    viewMode: "",
    color: "",
    show: {
      link: true,
      name: true,
      description: true,
      image: true,
      tags: true,
      icon: true,
      collection: true,
      preserved_formats: true,
      date: true,
    },
    columns: 0,
    sortBy: Sort.DateNewestFirst,
  },
  updateSettings: (newSettings) => {
    const { theme, viewMode, color, sortBy, show, columns } = newSettings;

    if (theme !== undefined && theme !== localStorage.getItem("theme")) {
      localStorage.setItem("theme", theme);
      document.querySelector("html")?.setAttribute("data-theme", theme);
    }

    if (
      viewMode !== undefined &&
      viewMode !== localStorage.getItem("viewMode")
    ) {
      localStorage.setItem("viewMode", viewMode);
    }

    if (color !== undefined) {
      localStorage.setItem("color", color);
      document.documentElement.style.setProperty("--p", `var(${color})`);
    }

    if (sortBy !== undefined) {
      localStorage.setItem("sortBy", sortBy.toString());
    }

    if (columns !== undefined) {
      localStorage.setItem("columns", columns.toString());
    }

    const currentShowString = localStorage.getItem("show");
    const newShowString = show ? JSON.stringify(show) : currentShowString;

    if (newShowString !== currentShowString) {
      localStorage.setItem("show", newShowString || "");
    }

    set((state) => ({
      settings: {
        ...state.settings,
        ...newSettings,
        show: show ? { ...state.settings.show, ...show } : state.settings.show,
      },
    }));
  },
  setSettings: () => {
    const theme = localStorage.getItem("theme") || "dark";
    localStorage.setItem("theme", theme);

    const color = localStorage.getItem("color") || "--default";
    localStorage.setItem("color", color);

    const viewMode = localStorage.getItem("viewMode") || "card";
    localStorage.setItem("viewMode", viewMode);

    const columns = parseInt(localStorage.getItem("columns") || "0");
    localStorage.setItem("columns", columns.toString());

    const storedShow = localStorage.getItem("show");
    const defaultShow = {
      link: true,
      name: true,
      description: true,
      image: true,
      tags: true,
      icon: true,
      collection: true,
      preserved_formats: true,
      date: true,
    };
    const show = storedShow
      ? { ...defaultShow, ...JSON.parse(storedShow) }
      : defaultShow;
    localStorage.setItem("show", JSON.stringify(show));

    set({
      settings: {
        theme,
        viewMode,
        color,
        show,
        columns,
        sortBy: useLocalSettingsStore.getState().settings.sortBy,
      },
    });

    document.querySelector("html")?.setAttribute("data-theme", theme);
    document.documentElement.style.setProperty("--p", `var(${color})`);
  },
}));

export default useLocalSettingsStore;
