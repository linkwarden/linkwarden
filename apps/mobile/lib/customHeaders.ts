import * as SecureStore from "expo-secure-store";

export type CustomHeader = { key: string; value: string };

type StoredHeaders = { instance: string; headers: CustomHeader[] };

const STORE_KEY = "CUSTOM_HEADERS";

// RFC 7230 header-name token; values must not allow CR/LF injection.
const NAME_REGEX = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const VALUE_REGEX = /^[^\r\n]*$/;

let stored: StoredHeaders | null = null;

export const loadCustomHeaders = async () => {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY);
    stored = raw ? (JSON.parse(raw) as StoredHeaders) : null;
  } catch {
    stored = null;
  }
};

const ready = loadCustomHeaders();

export const getCustomHeaders = () => stored;

export const isValidCustomHeader = ({ key, value }: CustomHeader) =>
  NAME_REGEX.test(key) && VALUE_REGEX.test(value);

export const setCustomHeaders = async (
  instance: string,
  headers: CustomHeader[]
) => {
  if (!headers.length) {
    stored = null;
    await SecureStore.deleteItemAsync(STORE_KEY);
    return;
  }

  stored = { instance, headers };
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(stored));
};

// Only requests to the exact instance the headers were configured for ever
// receive them — never the cloud instance or any other host.
export const customHeadersFor = (url: string): Record<string, string> => {
  if (!stored?.headers.length) return {};
  if (url !== stored.instance && !url.startsWith(stored.instance + "/"))
    return {};

  return Object.fromEntries(stored.headers.map((h) => [h.key, h.value]));
};

let originalFetch: typeof fetch | undefined;

// Covers every fetch in the app, including @linkwarden/router. Headers set by
// the app itself (e.g. Authorization) always take precedence.
// FileSystem.downloadAsync doesn't go through fetch — those callsites merge
// customHeadersFor() into their headers directly.
export const installCustomHeaders = () => {
  if (originalFetch) return;
  originalFetch = global.fetch;

  global.fetch = (async (input: any, init?: RequestInit) => {
    await ready;

    const url =
      typeof input === "string" ? input : (input?.url ?? String(input));
    const custom = customHeadersFor(url);

    if (Object.keys(custom).length) {
      const headers = new Headers(init?.headers ?? input?.headers ?? {});
      for (const [key, value] of Object.entries(custom)) {
        if (!headers.has(key)) headers.set(key, value);
      }
      init = { ...init, headers };
    }

    return originalFetch!(input, init);
  }) as typeof fetch;
};
