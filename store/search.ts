import { SearchSettings } from "@/types/global";
import { create } from "zustand";

type SearchSettingsState = {
  searchSettings: SearchSettings;
  setSearchSettings: (searchSettings: SearchSettings) => void;
  toggleCheckbox: (name: keyof SearchSettings["filter"]) => void;
  setSearchQuery: (query: string) => void;
};

const useSearchSettingsStore = create<SearchSettingsState>((set) => ({
  searchSettings: {
    query: "",
    filter: {
      name: true,
      url: true,
      title: true,
      collection: true,
      tags: true,
    },
  },
  setSearchSettings: (searchSettings) => set({ searchSettings }),
  toggleCheckbox: (name) =>
    set((state) => ({
      searchSettings: {
        ...state.searchSettings,
        filter: {
          ...state.searchSettings.filter,
          [name]: !state.searchSettings.filter[name],
        },
      },
    })),
  setSearchQuery: (query) =>
    set((state) => ({
      searchSettings: {
        ...state.searchSettings,
        query,
      },
    })),
}));

export default useSearchSettingsStore;
