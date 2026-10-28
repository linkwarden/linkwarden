import { fakeBrowser } from "@webext-core/fake-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearConfig, getConfig, isConfigured, saveConfig } from "./config.ts";

const DEFAULTS = {
  baseUrl: "",
  apiKey: "",
  defaultCollection: "Unorganized",
  syncBookmarks: false,
};

const SAVED = {
  baseUrl: "https://links.example.com",
  apiKey: "secret-token",
  defaultCollection: "Reading",
  syncBookmarks: false,
};

beforeEach(() => {
  fakeBrowser.reset();
  vi.stubGlobal("chrome", fakeBrowser);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("config", () => {
  it("falls back to the defaults before anything is saved", async () => {
    expect(await getConfig()).toEqual(DEFAULTS);
    expect(await isConfigured()).toBe(false);
  });

  it("saves the config and reads it back", async () => {
    await saveConfig(SAVED);

    expect(await getConfig()).toEqual(SAVED);
    expect(await isConfigured()).toBe(true);
  });

  it("keeps the config as JSON under linkwarden_config", async () => {
    // Existing installs already have their sign-in stored under this key, so
    // renaming it would sign every user out on update.
    await saveConfig(SAVED);

    expect(await fakeBrowser.storage.local.get("linkwarden_config")).toEqual({
      linkwarden_config: JSON.stringify(SAVED),
    });
  });

  it("needs both an instance URL and an API key", async () => {
    await saveConfig({ ...SAVED, apiKey: "" });
    expect(await isConfigured()).toBe(false);

    await saveConfig({ ...SAVED, baseUrl: "" });
    expect(await isConfigured()).toBe(false);
  });

  it("signs the extension out on clear", async () => {
    await saveConfig(SAVED);
    await clearConfig();

    expect(await getConfig()).toEqual(DEFAULTS);
    expect(await isConfigured()).toBe(false);
  });

  it("uses Firefox's browser global when chrome is missing", async () => {
    vi.stubGlobal("chrome", undefined);
    vi.stubGlobal("browser", fakeBrowser);

    await saveConfig(SAVED);

    expect(await getConfig()).toEqual(SAVED);
  });
});
