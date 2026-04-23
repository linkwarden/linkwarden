import archiveHandler from "../lib/archiveHandler";
import { LinkWithCollectionOwnerAndTags } from "@linkwarden/types/global";
import { delay } from "@linkwarden/lib/utils";
import getLinkBatchFairly from "../lib/getLinkBatchFairly";
import { launchBrowser } from "../lib/browser";
import { countUnprocessedBillableLinks } from "../lib/countUnprocessedBillableLinks";
import { Browser } from "playwright";

const ARCHIVE_TAKE_COUNT = Number(process.env.ARCHIVE_TAKE_COUNT || "") || 5;
const BROWSER_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

// On-demand mode: launch browser only when links need processing, close when
// idle. Dramatically reduces memory usage on instances with sporadic traffic.
// Default ("persistent") preserves existing always-on behavior.
const BROWSER_LIFECYCLE = (
  process.env.BROWSER_LIFECYCLE || "persistent"
).toLowerCase();
const BROWSER_IDLE_TIMEOUT_MS =
  Number(process.env.BROWSER_IDLE_TIMEOUT_MS || "") || 60_000; // 1 minute

export async function linkProcessing(interval = 10) {
  console.log("\x1b[34m%s\x1b[0m", "Starting link processing...");

  if (BROWSER_LIFECYCLE === "on-demand") {
    await linkProcessingOnDemand(interval);
  } else {
    await linkProcessingPersistent(interval);
  }
}

// ── Persistent mode (existing behavior) ─────────────────────────────────────

async function linkProcessingPersistent(interval: number) {
  let browser = await launchBrowser();
  let browserStartTs = Date.now();

  const restartBrowser = async (reason: string) => {
    try {
      if (browser && browser.isConnected()) {
        await browser.close();
      }
    } catch {}
    console.log("\x1b[34m%s\x1b[0m", `Restarting main browser (${reason})...`);
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

    const archiveLink = async (link: LinkWithCollectionOwnerAndTags) => {
      try {
        console.log(
          "\x1b[34m%s\x1b[0m",
          `- Link ${link.url} for user ${link.collection.ownerId}`
        );

        await archiveHandler(link, browser);

        console.log(
          "\x1b[34m%s\x1b[0m",
          `Succeeded processing link ${link.url} for user ${link.collection.ownerId}.`
        );
      } catch (error: any) {
        console.error(
          "\x1b[34m%s\x1b[0m",
          `Error processing link ${link.url} for user ${link.collection.ownerId}:`,
          error
        );

        if (!browser.isConnected?.()) {
          await restartBrowser("browser disconnected");
        }
      }
    };

    const processingPromises = links.map((e) => archiveLink(e));
    await Promise.allSettled(processingPromises);

    const unprocessedLinkCount = await countUnprocessedBillableLinks();

    console.log(
      "\x1b[34m%s\x1b[0m",
      `Processed ${links.length} link${
        links.length === 1 ? "" : "s"
      }, ${unprocessedLinkCount} left.`
    );

    await delay(interval);
  }
}

// ── On-demand mode ──────────────────────────────────────────────────────────
//
// Browser lifecycle:
//   idle (no browser) → links found → launch browser → process all queued
//   links → start idle timer → if no new links within BROWSER_IDLE_TIMEOUT_MS
//   → close browser → back to idle
//
// This avoids launching/closing Chromium for every single link while still
// freeing ~300-800 MB of RAM when the instance is idle.

async function linkProcessingOnDemand(interval: number) {
  let browser: Browser | null = null;
  let browserStartTs = 0;
  let lastActivityTs = 0;

  const ensureBrowser = async (): Promise<Browser> => {
    if (browser && browser.isConnected()) {
      // Rotate if the browser has been alive too long (same leak prevention
      // as persistent mode).
      if (Date.now() - browserStartTs >= BROWSER_MAX_AGE_MS) {
        console.log(
          "\x1b[34m%s\x1b[0m",
          "Rotating on-demand browser (30-minute max age)..."
        );
        await closeBrowser();
      } else {
        return browser;
      }
    }

    console.log("\x1b[34m%s\x1b[0m", "Launching browser on demand...");
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
    console.log(
      "\x1b[34m%s\x1b[0m",
      "Browser closed (on-demand idle shutdown)."
    );
  };

  while (true) {
    const links = await getLinkBatchFairly({
      maxBatchLinks: ARCHIVE_TAKE_COUNT,
    });

    if (links.length === 0) {
      // No work — close the browser if idle timeout has elapsed.
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

    // Work available — ensure browser is running.
    const activeBrowser = await ensureBrowser();
    lastActivityTs = Date.now();

    const archiveLink = async (link: LinkWithCollectionOwnerAndTags) => {
      try {
        console.log(
          "\x1b[34m%s\x1b[0m",
          `- Link ${link.url} for user ${link.collection.ownerId}`
        );

        await archiveHandler(link, activeBrowser);

        console.log(
          "\x1b[34m%s\x1b[0m",
          `Succeeded processing link ${link.url} for user ${link.collection.ownerId}.`
        );
      } catch (error: any) {
        console.error(
          "\x1b[34m%s\x1b[0m",
          `Error processing link ${link.url} for user ${link.collection.ownerId}:`,
          error
        );

        if (!activeBrowser.isConnected?.()) {
          console.log(
            "\x1b[34m%s\x1b[0m",
            "Browser disconnected during processing, will relaunch on next batch."
          );
          browser = null;
          browserStartTs = 0;
        }
      }
    };

    const processingPromises = links.map((e) => archiveLink(e));
    await Promise.allSettled(processingPromises);

    const unprocessedLinkCount = await countUnprocessedBillableLinks();

    console.log(
      "\x1b[34m%s\x1b[0m",
      `Processed ${links.length} link${
        links.length === 1 ? "" : "s"
      }, ${unprocessedLinkCount} left.`
    );

    await delay(interval);
  }
}
