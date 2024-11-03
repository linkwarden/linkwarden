import { Sort } from "@/types/global";
import { create } from "zustand";

type LocalSettings = {
  theme: string;
  viewMode: string;
  show: {
    link: boolean;
    name: boolean;
    description: boolean;
    image: boolean;
    tags: boolean;
    icon: boolean;
    collection: boolean;
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
    show: {
      link: true,
      name: true,
      description: true,
      image: true,
      tags: true,
      icon: true,
      collection: true,
      date: true,
    },
    columns: 0,
    sortBy: Sort.DateNewestFirst,
  },
  updateSettings: (newSettings) => {
    const { theme, viewMode, sortBy, show, columns } = newSettings;

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

    const viewMode = localStorage.getItem("viewMode") || "card";
    localStorage.setItem("viewMode", viewMode);

    const columns = parseInt(localStorage.getItem("columns") || "0");
    localStorage.setItem("columns", columns.toString());

    const storedShow = localStorage.getItem("show");
    const show = storedShow
      ? JSON.parse(storedShow)
      : {
          link: true,
          name: true,
          description: true,
          image: true,
          tags: true,
          icon: true,
          collection: true,
          date: true,
        };
    localStorage.setItem("show", JSON.stringify(show));

    set({
      settings: {
        theme,
        viewMode,
        show,
        columns,
        sortBy: useLocalSettingsStore.getState().settings.sortBy,
      },
    });

    document.querySelector("html")?.setAttribute("data-theme", theme);
  },
}));

export default useLocalSettingsStore;
