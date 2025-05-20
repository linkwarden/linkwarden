import { MMKV } from "react-native-mmkv";
import { Persister } from "@tanstack/react-query-persist-client";

const storage = new MMKV({ id: "react-query" });

export const mmkvPersister: Persister = {
  persistClient: async (client) => {
    try {
      const json = JSON.stringify(client);
      storage.set("REACT_QUERY_CACHE", json);
    } catch (e) {
      console.error("Error persisting client:", e);
    }
  },
  restoreClient: async () => {
    try {
      const json = storage.getString("REACT_QUERY_CACHE");
      return json ? JSON.parse(json) : undefined;
    } catch (e) {
      console.error("Error restoring client:", e);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      storage.delete("REACT_QUERY_CACHE");
    } catch (e) {
      console.error("Error removing client:", e);
    }
  },
};
