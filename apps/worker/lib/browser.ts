import {
  chromium,
  devices,
  type Browser,
  type LaunchOptions,
  type BrowserContextOptions,
} from "playwright";

export function getBrowserOptions(): LaunchOptions {
  let browserOptions: LaunchOptions = {
    // headless: false,
  };

  if (process.env.PROXY) {
    browserOptions.proxy = {
      server: process.env.PROXY,
      bypass: process.env.PROXY_BYPASS,
      username: process.env.PROXY_USERNAME,
      password: process.env.PROXY_PASSWORD,
    };
  }

  if (
    process.env.PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH &&
    !process.env.PLAYWRIGHT_WS_URL
  ) {
    browserOptions.executablePath =
      process.env.PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH;
  }

  return browserOptions;
}

export function getDefaultContextOptions(): BrowserContextOptions {
  const base: BrowserContextOptions = {
    ...devices["Desktop Chrome"],
    ignoreHTTPSErrors: process.env.IGNORE_HTTPS_ERRORS === "true",
  };

  if (process.env.PLAYWRIGHT_WS_URL) {
    const launchLike = getBrowserOptions();
    return {
      ...base,
      ...(launchLike as unknown as Partial<BrowserContextOptions>),
    };
  }

  return base;
}

export async function launchBrowser(): Promise<Browser> {
  const browserOptions = getBrowserOptions();

  if (process.env.PLAYWRIGHT_WS_URL) {
    return chromium.connectOverCDP(process.env.PLAYWRIGHT_WS_URL);
  }

  return chromium.launch(browserOptions);
}
