import { createMMKV } from "react-native-mmkv";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";

const storage = createMMKV({ id: "react-query" });

const infiniteQueryKeys = new Set(["links", "publicLinks", "tags"]);

const isInfiniteQueryKey = (queryKey: unknown) =>
  Array.isArray(queryKey) &&
  typeof queryKey[0] === "string" &&
  infiniteQueryKeys.has(queryKey[0]);

const hasInfiniteDataShape = (data: unknown) =>
  data == null ||
  (typeof data === "object" &&
    Array.isArray((data as any).pages) &&
    Array.isArray((data as any).pageParams));

export const sanitizePersistedClient = (
  client: PersistedClient
): PersistedClient => {
  const queries = client.clientState?.queries;
  if (!Array.isArray(queries)) return client;

  const sanitizedQueries = queries.filter((query) => {
    if (!isInfiniteQueryKey(query.queryKey)) return true;
    return hasInfiniteDataShape(query.state?.data);
  });

  if (sanitizedQueries.length === queries.length) return client;

  return {
    ...client,
    clientState: {
      ...client.clientState,
      queries: sanitizedQueries,
    },
  };
};

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
      return json ? sanitizePersistedClient(JSON.parse(json)) : undefined;
    } catch (e) {
      console.error("Error restoring client:", e);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      storage.remove("REACT_QUERY_CACHE");
    } catch (e) {
      console.error("Error removing client:", e);
    }
  },
};
