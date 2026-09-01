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
  return await setStorageItem(
    CONFIG_KEY,
    JSON.stringify({
      baseUrl: '',
      apiKey: '',
      defaultCollection: 'Unorganized',
      syncBookmarks: false,
    })
  );
}
