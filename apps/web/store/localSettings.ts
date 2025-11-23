import { Sort } from "@linkwarden/types";
import { create } from "zustand";

type LocalSettings = {
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
    relevance: boolean;
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
      relevance: true,
    },
    columns: 0,
    sortBy: Sort.DateNewestFirst,
  },
  updateSettings: (newSettings) => {
    const { viewMode, color, sortBy, show, columns } = newSettings;

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
      relevance: true,
    };
    const show = storedShow
      ? { ...defaultShow, ...JSON.parse(storedShow) }
      : defaultShow;
    localStorage.setItem("show", JSON.stringify(show));

    set({
      settings: {
        viewMode,
        color,
        show,
        columns,
        sortBy: useLocalSettingsStore.getState().settings.sortBy,
      },
    });

    document.documentElement.style.setProperty("--p", `var(${color})`);
  },
}));

export default useLocalSettingsStore;
