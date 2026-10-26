import { getStorageItem, setStorageItem } from './utils.ts';
import { configType } from './validators/config.ts';

const DEFAULTS: configType = {
  baseUrl: '',
  apiKey: '',
  defaultCollection: 'Unorganized',
  syncBookmarks: false,
  overrideBookmarkShortcut: true,
};

const CONFIG_KEY = 'linkwarden_config';

export async function getConfig(): Promise<configType> {
  const config = await getStorageItem(CONFIG_KEY);
  if (!config) return { ...DEFAULTS };
  try {
    return { ...DEFAULTS, ...JSON.parse(config) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveConfig(config: configType) {
  return await setStorageItem(CONFIG_KEY, JSON.stringify(config));
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
  const current = await getConfig();
  return await setStorageItem(
    CONFIG_KEY,
    JSON.stringify({
      ...DEFAULTS,
      overrideBookmarkShortcut: current.overrideBookmarkShortcut,
    })
  );
}
