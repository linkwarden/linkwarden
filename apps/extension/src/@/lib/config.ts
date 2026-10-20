import { getStorageItem, setStorageItem } from './utils.ts';
import { configType } from './validators/config.ts';

const DEFAULTS: configType = {
  baseUrl: '',
  apiKey: '',
  defaultCollection: 'Unorganized',
  syncBookmarks: false,
};

const CONFIG_KEY = 'linkwarden_config';

export async function getConfig(): Promise<configType> {
  const config = await getStorageItem(CONFIG_KEY);
  return config ? JSON.parse(config) : DEFAULTS;
}

// Writes are serialised so a read-modify-write can never interleave with
// another write. Without this, a partial update that read the config just
// before it was cleared would write the old credentials straight back.
let writes: Promise<unknown> = Promise.resolve();

function withConfigLock<T>(operation: () => Promise<T>): Promise<T> {
  const result = writes.then(operation, operation);
  writes = result.catch(() => undefined);
  return result;
}

export async function saveConfig(config: configType) {
  return await withConfigLock(() =>
    setStorageItem(CONFIG_KEY, JSON.stringify(config))
  );
}

/**
 * Merges a partial update into the stored config.
 *
 * Returns the written config, or `null` when there is no configured account
 * any more — the user signed out while the update was in flight, and writing
 * the merged copy would resurrect the credentials they just cleared.
 */
export async function updateConfig(
  patch: Partial<configType>
): Promise<configType | null> {
  return await withConfigLock(async () => {
    const config = await getConfig();

    if (!config.baseUrl || !config.apiKey) return null;

    const updated = { ...config, ...patch };
    await setStorageItem(CONFIG_KEY, JSON.stringify(updated));

    return updated;
  });
}

export async function isConfigured() {
  const config = await getConfig();
  return (
    !!config.baseUrl &&
    config.baseUrl !== '' &&
    !!config.apiKey &&
    config.apiKey !== ''
  );
}

export async function clearConfig() {
  return await withConfigLock(() =>
    setStorageItem(CONFIG_KEY, JSON.stringify(DEFAULTS))
  );
}
