import { defineConfig } from "@playwright/test";

/**
 * Extensions only load in Chromium, so there is a single project. The fixture
 * in e2e/index.ts launches the browser itself with `dist/` loaded; run
 * `yarn build` first (the `e2e` script does).
 *
 * See https://playwright.dev/docs/chrome-extensions.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : Number(process.env.MAX_WORKERS) || undefined,
  reporter: "html",
  use: {
    // The Linkwarden instance the extension signs in to.
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
});
