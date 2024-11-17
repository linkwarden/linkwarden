import { LaunchOptions, chromium, devices } from "playwright";
import { prisma } from "./db";
import sendToWayback from "./preservationScheme/sendToWayback";
import { Collection, Link, User } from "@prisma/client";
import fetchHeaders from "./fetchHeaders";
import createFolder from "./storage/createFolder";
import { removeFiles } from "./manageLinkFiles";
import handleMonolith from "./preservationScheme/handleMonolith";
import handleReadablility from "./preservationScheme/handleReadablility";
import handleArchivePreview from "./preservationScheme/handleArchivePreview";
import handleScreenshotAndPdf from "./preservationScheme/handleScreenshotAndPdf";
import imageHandler from "./preservationScheme/imageHandler";
import pdfHandler from "./preservationScheme/pdfHandler";

type LinksAndCollectionAndOwner = Link & {
  collection: Collection & {
    owner: User;
  };
};

const BROWSER_TIMEOUT = Number(process.env.BROWSER_TIMEOUT) || 5;

export default async function archiveHandler(link: LinksAndCollectionAndOwner) {
  if (process.env.DISABLE_PRESERVATION === "true")
    return await prisma.link.update({
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

  // allow user to configure a proxy
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

  const browser = await chromium.launch(browserOptions);
  const context = await browser.newContext({
    ...devices["Desktop Chrome"],
    ignoreHTTPSErrors: process.env.IGNORE_HTTPS_ERRORS === "true",
  });

  const page = await context.newPage();

  createFolder({
    filePath: `archives/preview/${link.collectionId}`,
  });

  createFolder({
    filePath: `archives/${link.collectionId}`,
  });

  try {
    await Promise.race([
      (async () => {
        const user = link.collection?.owner;

        const header = link.url ? await fetchHeaders(link.url) : undefined;

        const contentType = header?.get("content-type");
        let linkType = "url";
        let imageExtension = "png";

        if (!link.url) linkType = link.type;
        else if (contentType?.includes("application/pdf")) linkType = "pdf";
        else if (contentType?.startsWith("image")) {
          linkType = "image";
          if (contentType.includes("image/jpeg")) imageExtension = "jpeg";
          else if (contentType.includes("image/png")) imageExtension = "png";
        }

        await prisma.link.update({
          where: { id: link.id },
          data: {
            type: linkType,
            image:
              user.archiveAsScreenshot && !link.image?.startsWith("archive")
                ? "pending"
                : undefined,
            pdf:
              user.archiveAsPDF && !link.pdf?.startsWith("archive")
                ? "pending"
                : undefined,
            monolith:
              user.archiveAsMonolith && !link.monolith?.startsWith("archive")
                ? "pending"
                : undefined,
            readable: !link.readable?.startsWith("archive")
              ? "pending"
              : undefined,
            preview: !link.readable?.startsWith("archive")
              ? "pending"
              : undefined,
            lastPreserved: new Date().toISOString(),
          },
        });

        // send to archive.org
        if (user.archiveAsWaybackMachine && link.url) sendToWayback(link.url);

        if (linkType === "image" && !link.image?.startsWith("archive")) {
          await imageHandler(link, imageExtension); // archive image (jpeg/png)
          return;
        } else if (linkType === "pdf" && !link.pdf?.startsWith("archive")) {
          await pdfHandler(link); // archive pdf
          return;
        } else if (link.url) {
          // archive url

          await page.goto(link.url, { waitUntil: "domcontentloaded" });

          const content = await page.content();

          // Preview
          if (
            !link.preview?.startsWith("archives") &&
            !link.preview?.startsWith("unavailable")
          )
            await handleArchivePreview(link, page);

          // Readability
          if (
            !link.readable?.startsWith("archives") &&
            !link.readable?.startsWith("unavailable")
          )
            await handleReadablility(content, link);

          // Screenshot/PDF
          if (
            (!link.image?.startsWith("archives") &&
              !link.image?.startsWith("unavailable")) ||
            (!link.pdf?.startsWith("archives") &&
              !link.pdf?.startsWith("unavailable"))
          )
            await handleScreenshotAndPdf(link, page, user);

          // Monolith
          if (
            !link.monolith?.startsWith("archive") &&
            !link.monolith?.startsWith("unavailable") &&
            user.archiveAsMonolith &&
            link.url
          )
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
          readable: !finalLink.readable?.startsWith("archives")
            ? "unavailable"
            : undefined,
          image: !finalLink.image?.startsWith("archives")
            ? "unavailable"
            : undefined,
          monolith: !finalLink.monolith?.startsWith("archives")
            ? "unavailable"
            : undefined,
          pdf: !finalLink.pdf?.startsWith("archives")
            ? "unavailable"
            : undefined,
          preview: !finalLink.preview?.startsWith("archives")
            ? "unavailable"
            : undefined,
        },
      });
    else {
      await removeFiles(link.id, link.collectionId);
    }

    await browser.close();
  }
}
