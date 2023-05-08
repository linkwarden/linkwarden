// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

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
