import { beforeEach, describe, expect, it, vi } from 'vitest';

// The real helpers talk to the extension's storage API, which does not exist
// under the test runner. This stand-in keeps the async gap between reading and
// writing, which is what makes interleaving observable in the first place.
const store = new Map<string, string>();

vi.mock('./utils.ts', () => ({
  getStorageItem: async (key: string) => {
    await Promise.resolve();
    return store.get(key);
  },
  setStorageItem: async (key: string, value: string) => {
    await Promise.resolve();
    store.set(key, value);
  },
}));

const { clearConfig, getConfig, saveConfig, updateConfig } = await import(
  './config.ts'
);

const SIGNED_IN = {
  baseUrl: 'https://links.example.com',
  apiKey: 'secret-token',
  defaultCollection: 'Unorganized',
  syncBookmarks: false,
};

describe('updateConfig', () => {
  beforeEach(async () => {
    store.clear();
    await saveConfig(SIGNED_IN);
  });

  it('merges the patch and leaves the rest of the config alone', async () => {
    const updated = await updateConfig({
      defaultCollection: 'Reading list',
      defaultCollectionId: 7,
    });

    expect(updated).toMatchObject({
      baseUrl: SIGNED_IN.baseUrl,
      apiKey: SIGNED_IN.apiKey,
      defaultCollection: 'Reading list',
      defaultCollectionId: 7,
    });
    expect(await getConfig()).toMatchObject({ defaultCollectionId: 7 });
  });

  it('does not write once a sign-out has cleared the account', async () => {
    const signOut = clearConfig();
    const update = updateConfig({
      defaultCollection: 'Reading list',
      defaultCollectionId: 7,
    });

    await signOut;
    expect(await update).toBeNull();

    const config = await getConfig();
    expect(config.apiKey).toBe('');
    expect(config.baseUrl).toBe('');
  });

  it('leaves the account cleared when a sign-out lands mid-update', async () => {
    const update = updateConfig({
      defaultCollection: 'Reading list',
      defaultCollectionId: 7,
    });
    const signOut = clearConfig();

    await Promise.all([update, signOut]);

    const config = await getConfig();
    expect(config.apiKey).toBe('');
    expect(config.baseUrl).toBe('');
  });
});
