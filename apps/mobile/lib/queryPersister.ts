import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system/legacy";
import { AppState } from "react-native";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";

const DATABASE_NAME = "react-query.db";

const CACHE_KEY = "REACT_QUERY_CACHE";

const deleteLegacyStorage = () =>
  FileSystem.deleteAsync(FileSystem.documentDirectory + "mmkv", {
    idempotent: true,
  }).catch(() => {});

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME)
      .then(async (db) => {
        await db.execAsync(
          `PRAGMA journal_mode = WAL;
           CREATE TABLE IF NOT EXISTS cache (
             key TEXT PRIMARY KEY NOT NULL,
             value TEXT NOT NULL
           );`
        );
        deleteLegacyStorage();
        return db;
      })
      .catch((e) => {
        dbPromise = null;
        throw e;
      });
  }

  return dbPromise;
};

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

const withoutStaleError = (query: any) => {
  if (query?.state?.data === undefined) return query;
  if (query.state.status === "success" && query.state.error == null) {
    return query;
  }

  return {
    ...query,
    state: {
      ...query.state,
      status: "success",
      error: null,
      fetchFailureCount: 0,
      fetchFailureReason: null,
    },
  };
};

export const sanitizePersistedClient = (
  client: PersistedClient
): PersistedClient => {
  const queries = client.clientState?.queries;
  if (!Array.isArray(queries)) return client;

  const sanitizedQueries = queries
    .filter((query) => {
      if (!isInfiniteQueryKey(query.queryKey)) return true;
      return hasInfiniteDataShape(query.state?.data);
    })
    .map(withoutStaleError);

  return {
    ...client,
    clientState: {
      ...client.clientState,
      queries: sanitizedQueries,
    },
  };
};

const WRITE_DEBOUNCE_MS = 3000;

let pendingClient: PersistedClient | null = null;
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

const writePendingClient = async () => {
  const client = pendingClient;
  pendingClient = null;
  if (!client) return;

  let json: string;
  try {
    json = JSON.stringify(client);
  } catch (e) {
    console.error("Error persisting client:", e);
    return;
  }

  try {
    const db = await getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO cache (key, value) VALUES (?, ?)",
      CACHE_KEY,
      json
    );
  } catch (e) {
    console.error(`Error persisting client (payload ${json.length} chars):`, e);
  }
};

const cancelScheduledFlush = () => {
  if (!flushTimeout) return;
  clearTimeout(flushTimeout);
  flushTimeout = null;
};

const enqueueWrite = () => {
  writeQueue = writeQueue.then(writePendingClient).catch(() => {});
  return writeQueue;
};

const scheduleFlush = () => {
  if (flushTimeout) return;

  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    enqueueWrite();
  }, WRITE_DEBOUNCE_MS);
};

const flushNow = () => {
  cancelScheduledFlush();
  return enqueueWrite();
};

AppState.addEventListener("change", (state) => {
  if (state !== "active") flushNow();
});

export const queryPersister: Persister = {
  persistClient: async (client) => {
    pendingClient = client;
    scheduleFlush();
  },
  restoreClient: async () => {
    try {
      const db = await getDb();
      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM cache WHERE key = ?",
        CACHE_KEY
      );

      return row?.value
        ? sanitizePersistedClient(JSON.parse(row.value) as PersistedClient)
        : undefined;
    } catch (e) {
      console.error("Error restoring client:", e);
      return undefined;
    }
  },
  removeClient: async () => {
    pendingClient = null;
    cancelScheduledFlush();
    await writeQueue.catch(() => {});

    try {
      const db = await getDb();
      await db.runAsync("DELETE FROM cache WHERE key = ?", CACHE_KEY);
    } catch (e) {
      console.error("Error removing client:", e);
    }
  },
};
