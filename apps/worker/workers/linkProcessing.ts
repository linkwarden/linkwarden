import archiveHandler from "../lib/archiveHandler";
import { LinkWithCollectionOwnerAndTags } from "@linkwarden/types/global";
import { delay } from "@linkwarden/lib/utils";
import getLinkBatchFairly from "../lib/getLinkBatchFairly";
import { launchBrowser } from "../lib/browser";
import { countUnprocessedBillableLinks } from "../lib/countUnprocessedBillableLinks";
import { Browser } from "playwright";

const ARCHIVE_TAKE_COUNT = Number(process.env.ARCHIVE_TAKE_COUNT || "") || 5;
const BROWSER_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

const BROWSER_LIFECYCLE = (
  process.env.BROWSER_LIFECYCLE || "on-demand"
).toLowerCase();
const BROWSER_IDLE_TIMEOUT_MS = 60_000;

// Blue console output
const logInfo = (message: string) => console.log("\x1b[34m%s\x1b[0m", message);

const launchingMessage = () =>
  process.env.PLAYWRIGHT_WS_URL
    ? `Connecting to remote browser (${process.env.PLAYWRIGHT_WS_URL}).`
    : "Launching browser.";

export async function linkProcessing(interval = 10) {
  logInfo("Starting link processing...");

  if (BROWSER_LIFECYCLE === "on-demand") {
    await linkProcessingOnDemand(interval);
  } else {
    await linkProcessingPersistent(interval);
  }
}

// Archive a batch of links concurrently, then report how many remain.
async function processBatch(
  links: LinkWithCollectionOwnerAndTags[],
  browser: Browser,
  onDisconnect: () => void | Promise<void>
) {
  await Promise.allSettled(
    links.map(async (link) => {
      try {
        logInfo(`- Link ${link.url} for user ${link.collection.ownerId}`);

        await archiveHandler(link, browser);

        logInfo(
          `Succeeded processing link ${link.url} for user ${link.collection.ownerId}.`
        );
      } catch (error: any) {
        console.error(
          "\x1b[34m%s\x1b[0m",
          `Error processing link ${link.url} for user ${link.collection.ownerId}:`,
          error
        );

        if (!browser.isConnected?.()) {
          await onDisconnect();
        }
      }
    })
  );

  const unprocessedLinkCount = await countUnprocessedBillableLinks();

  logInfo(
    `Processed ${links.length} link${
      links.length === 1 ? "" : "s"
    }, ${unprocessedLinkCount} left.`
  );
}

async function linkProcessingPersistent(interval: number) {
  let browser = await launchBrowser();
  let browserStartTs = Date.now();

  const restartBrowser = async (reason: string) => {
    try {
      if (browser && browser.isConnected()) {
        await browser.close();
      }
    } catch {}
    logInfo(`Restarting main browser (${reason})...`);
    browser = await launchBrowser();
    browserStartTs = Date.now();
  };

  while (true) {
    if (Date.now() - browserStartTs >= BROWSER_MAX_AGE_MS) {
      await restartBrowser("30-minute rotation");
    }

    const links = await getLinkBatchFairly({
      maxBatchLinks: ARCHIVE_TAKE_COUNT,
      mode: "links",
    });

    if (links.length === 0) {
      await delay(interval);
      continue;
    }

    await processBatch(links, browser, () =>
      restartBrowser("browser disconnected")
    );

    await delay(interval);
  }
}

async function linkProcessingOnDemand(interval: number) {
  let browser: Browser | null = null;
  let browserStartTs = 0;
  let lastActivityTs = 0;

  const ensureBrowser = async (): Promise<Browser> => {
    if (browser && browser.isConnected()) {
      if (Date.now() - browserStartTs >= BROWSER_MAX_AGE_MS) {
        logInfo("Rotating on-demand browser (30-minute max age)...");
        await closeBrowser();
      } else {
        return browser;
      }
    }

    logInfo(launchingMessage());
    browser = await launchBrowser();
    browserStartTs = Date.now();
    return browser;
  };

  const closeBrowser = async () => {
    if (!browser) return;
    try {
      if (browser.isConnected()) {
        await browser.close();
      }
    } catch {}
    browser = null;
    browserStartTs = 0;
    logInfo("Browser closed.");
  };

  while (true) {
    const links = await getLinkBatchFairly({
      maxBatchLinks: ARCHIVE_TAKE_COUNT,
      mode: "links",
    });

    if (links.length === 0) {
      if (
        browser &&
        lastActivityTs > 0 &&
        Date.now() - lastActivityTs >= BROWSER_IDLE_TIMEOUT_MS
      ) {
        await closeBrowser();
      }

      await delay(interval);
      continue;
    }

    const activeBrowser = await ensureBrowser();
    lastActivityTs = Date.now();

    await processBatch(links, activeBrowser, () => {
      logInfo(
        "Browser disconnected during processing, will relaunch on next batch."
      );
      browser = null;
      browserStartTs = 0;
    });

    await delay(interval);
  }
}
