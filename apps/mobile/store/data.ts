import { create } from "zustand";
import { MobileData } from "@linkwarden/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "nativewind";

type DataStore = {
  data: MobileData;
  updateData: (newData: Partial<MobileData>) => void;
  setData: () => void;
};

const useDataStore = create<DataStore>((set, get) => ({
  data: {
    shareIntent: {
      hasShareIntent: false,
      url: "",
    },
    theme: "light",
  },
  setData: async () => {
    const dataString = JSON.parse((await AsyncStorage.getItem("data")) || "{}");

    colorScheme.set(dataString.theme || "light");

    if (dataString)
      set((state) => ({ data: { ...state.data, ...dataString } }));
  },
  updateData: async (patch) => {
    const merged = { ...get().data, ...patch };
    const { shareIntent, ...persistable } = merged;
    await AsyncStorage.setItem("data", JSON.stringify(persistable));
    set({ data: merged });
  },
}));

export default useDataStore;
