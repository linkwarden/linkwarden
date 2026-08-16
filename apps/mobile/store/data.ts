import { create } from "zustand";
import { MobileData } from "@linkwarden/types/global";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "nativewind";

type DataStore = {
  data: MobileData;
  updateData: (newData: Partial<MobileData>) => Promise<void>;
  setData: () => Promise<void>;
};

const useDataStore = create<DataStore>((set, get) => ({
  data: {
    shareIntent: {
      hasShareIntent: false,
      url: "",
    },
    theme: "system",
    preferredBrowser: "app",
    preferredCollection: null,
    offlineEnabled: false,
  },
  setData: async () => {
    const dataString = JSON.parse((await AsyncStorage.getItem("data")) || "{}");

    colorScheme.set(dataString.theme || "system");

    set((state) => ({ data: { ...state.data, ...dataString } }));
  },
  updateData: async (patch) => {
    const merged = { ...get().data, ...patch };
    set({ data: merged });
    const { shareIntent, ...persistable } = merged;
    await AsyncStorage.setItem("data", JSON.stringify(persistable));
  },
}));

export default useDataStore;
