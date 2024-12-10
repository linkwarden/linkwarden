import { LaunchOptions, chromium, devices } from "playwright";
import { prisma } from "./db";
import sendToWayback from "./preservationScheme/sendToWayback";
import { AiTaggingMethod, Collection, Link, User } from "@prisma/client";
import fetchHeaders from "./fetchHeaders";
import createFolder from "./storage/createFolder";
import { removeFiles } from "./manageLinkFiles";
import handleMonolith from "./preservationScheme/handleMonolith";
import handleReadablility from "./preservationScheme/handleReadablility";
import handleArchivePreview from "./preservationScheme/handleArchivePreview";
import handleScreenshotAndPdf from "./preservationScheme/handleScreenshotAndPdf";
import imageHandler from "./preservationScheme/imageHandler";
import pdfHandler from "./preservationScheme/pdfHandler";
import autoTagLink from "./autoTagLink";

type LinksAndCollectionAndOwner = Link & {
  collection: Collection & {
    owner: User;
  };
};

const BROWSER_TIMEOUT = Number(process.env.BROWSER_TIMEOUT) || 5;

export default async function archiveHandler(link: LinksAndCollectionAndOwner) {
  if (process.env.DISABLE_PRESERVATION === "true") {
    await prisma.link.update({
      where: { id: link.id },
      data: {
        lastPreserved: new Date().toISOString(),
        readable: "unavailable",
        image: "unavailable",
        monolith: "unavailable",
        pdf: "unavailable",
        preview: "unavailable",
      },
    });
    return;
  }

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () =>
        reject(
          new Error(
            `Browser has been open for more than ${BROWSER_TIMEOUT} minutes.`
          )
        ),
      BROWSER_TIMEOUT * 60000
    );
  });

  const browserOptions = getBrowserOptions();

  const browser = await chromium.launch(browserOptions);
  const context = await browser.newContext({
    ...devices["Desktop Chrome"],
    ignoreHTTPSErrors: process.env.IGNORE_HTTPS_ERRORS === "true",
  });

  const page = await context.newPage();

  createFolder({ filePath: `archives/preview/${link.collectionId}` });
  createFolder({ filePath: `archives/${link.collectionId}` });

  const user = link.collection?.owner;

  try {
    await Promise.race([
      (async () => {
        const { linkType, imageExtension } = await determineLinkType(
          link.id,
          link.url
        );

        // send to archive.org
        if (user.archiveAsWaybackMachine && link.url) sendToWayback(link.url);

        if (linkType === "image" && !link.image) {
          await imageHandler(link, imageExtension); // archive image (jpeg/png)
          return;
        } else if (linkType === "pdf" && !link.pdf) {
          await pdfHandler(link); // archive pdf
          return;
        } else if (link.url) {
          // archive url

          await page.goto(link.url, { waitUntil: "domcontentloaded" });

          const content = await page.content();

          // Preview
          if (!link.preview) await handleArchivePreview(link, page);

          // Readability
          if (!link.readable) await handleReadablility(content, link);

          // Auto-tagging
          if (
            user.aiTaggingMethod !== AiTaggingMethod.DISABLED &&
            !link.aiTagged &&
            process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL
          )
            await autoTagLink(user, link.id);

          // Screenshot/PDF
          if (
            (user.archiveAsScreenshot && !link.image) ||
            (user.archiveAsPDF && !link.pdf)
          )
            await handleScreenshotAndPdf(link, page, user);

          // Monolith
          if (user.archiveAsMonolith && !link.monolith && link.url)
            await handleMonolith(link, content);
        }
      })(),
      timeoutPromise,
    ]);
  } catch (err) {
    console.log(err);
    console.log("Failed Link details:", link);
    throw err;
  } finally {
    const finalLink = await prisma.link.findUnique({
      where: { id: link.id },
    });

    if (finalLink)
      await prisma.link.update({
        where: { id: link.id },
        data: {
          lastPreserved: new Date().toISOString(),
          readable: !finalLink.readable ? "unavailable" : undefined,
          image: !finalLink.image ? "unavailable" : undefined,
          monolith: !finalLink.monolith ? "unavailable" : undefined,
          pdf: !finalLink.pdf ? "unavailable" : undefined,
          preview: !finalLink.preview ? "unavailable" : undefined,
          aiTagged:
            user.aiTaggingMethod !== AiTaggingMethod.DISABLED &&
            !finalLink.aiTagged
              ? true
              : undefined,
        },
      });
    else {
      await removeFiles(link.id, link.collectionId);
    }

    await browser.close();
  }
}

// Determine the type of the link based on its content-type header.
async function determineLinkType(
  linkId: number,
  url?: string | null
): Promise<{
  linkType: "url" | "pdf" | "image";
  imageExtension: "png" | "jpeg";
}> {
  let linkType: "url" | "pdf" | "image" = "url";
  let imageExtension: "png" | "jpeg" = "png";

  if (!url) return { linkType: "url", imageExtension };

  const headers = await fetchHeaders(url);
  const contentType = headers?.get("content-type");

  if (contentType?.includes("application/pdf")) {
    linkType = "pdf";
  } else if (contentType?.startsWith("image")) {
    linkType = "image";
    if (contentType.includes("image/jpeg")) imageExtension = "jpeg";
    else if (contentType.includes("image/png")) imageExtension = "png";
  }

  await prisma.link.update({
    where: { id: linkId },
    data: {
      type: linkType,
    },
  });

  return { linkType, imageExtension };
}

// Construct browser launch options based on environment variables.
function getBrowserOptions(): LaunchOptions {
  let browserOptions: LaunchOptions = {};

  if (process.env.PROXY) {
    browserOptions.proxy = {
      server: process.env.PROXY,
      bypass: process.env.PROXY_BYPASS,
      username: process.env.PROXY_USERNAME,
      password: process.env.PROXY_PASSWORD,
    };
  }

  if (process.env.PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH) {
    browserOptions.executablePath =
      process.env.PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH;
  }

  return browserOptions;
}
