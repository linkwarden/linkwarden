import { create } from "zustand";
import { MobileData } from "@linkwarden/types";

type DataStore = {
  data: MobileData;
  updateData: (newData: Partial<MobileData>) => void;
};

const useDataStore = create<DataStore>((set) => ({
  data: {
    shareIntent: {
      hasShareIntent: false,
      url: "",
    },
  },
  updateData: (newData) => {
    set((state) => ({
      data: {
        ...state.data,
        ...newData,
      },
    }));
  },
}));

export default useDataStore;
