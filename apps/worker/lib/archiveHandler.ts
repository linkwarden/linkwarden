import { Browser } from "playwright";
import { prisma } from "@linkwarden/prisma";
import sendToWayback from "./preservationScheme/sendToWayback";
import { AiTaggingMethod } from "@linkwarden/prisma/client";
import fetchHeaders from "./fetchHeaders";
import { createFolder, readFile, removeFiles } from "@linkwarden/filesystem";
import handleMonolith from "./preservationScheme/handleMonolith";
import handleReadability from "./preservationScheme/handleReadability";
import handleArchivePreview from "./preservationScheme/handleArchivePreview";
import handleScreenshotAndPdf from "./preservationScheme/handleScreenshotAndPdf";
import imageHandler from "./preservationScheme/imageHandler";
import pdfHandler from "./preservationScheme/pdfHandler";
import autoTagLink from "./autoTagLink";
import { LinkWithCollectionOwnerAndTags } from "@linkwarden/types";
import { isArchivalTag } from "@linkwarden/lib";
import { ArchivalSettings } from "@linkwarden/types";
import { getDefaultContextOptions } from "./browser";

const BROWSER_TIMEOUT = Number(process.env.BROWSER_TIMEOUT) || 5;

export default async function archiveHandler(
  link: LinkWithCollectionOwnerAndTags,
  browser: Browser
) {
  const user = link.collection?.owner;

  if (
    process.env.DISABLE_PRESERVATION === "true" ||
    (!link.url?.startsWith("http://") && !link.url?.startsWith("https://"))
  ) {
    await prisma.link.update({
      where: { id: link.id },
      data: {
        lastPreserved: new Date().toISOString(),
        readable: "unavailable",
        image: "unavailable",
        monolith: "unavailable",
        pdf: "unavailable",
        preview: "unavailable",

        // To prevent re-archiving the same link
        aiTagged:
          user.aiTaggingMethod !== AiTaggingMethod.DISABLED &&
          !link.aiTagged &&
          (process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL ||
            process.env.OPENAI_API_KEY ||
            process.env.AZURE_API_KEY ||
            process.env.ANTHROPIC_API_KEY ||
            process.env.OPENROUTER_API_KEY)
            ? true
            : undefined,
      },
    });
    return;
  }

  const abortController = new AbortController();
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      abortController.abort();
      reject(
        new Error(
          `Browser has been open for more than ${BROWSER_TIMEOUT} minutes.`
        )
      );
    }, BROWSER_TIMEOUT * 60000);
  });

  const contextOptions = getDefaultContextOptions();
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  createFolder({ filePath: `archives/preview/${link.collectionId}` });
  createFolder({ filePath: `archives/${link.collectionId}` });

  const archivalTags = link.tags.filter(isArchivalTag);
  const archivalSettings: ArchivalSettings =
    archivalTags.length > 0
      ? {
          archiveAsScreenshot: archivalTags.some(
            (tag) => tag.archiveAsScreenshot
          ),
          archiveAsMonolith: archivalTags.some((tag) => tag.archiveAsMonolith),
          archiveAsPDF: archivalTags.some((tag) => tag.archiveAsPDF),
          archiveAsReadable: archivalTags.some((tag) => tag.archiveAsReadable),
          archiveAsWaybackMachine: archivalTags.some(
            (tag) => tag.archiveAsWaybackMachine
          ),
          aiTag: archivalTags.some((tag) => tag.aiTag),
        }
      : {
          archiveAsScreenshot: user.archiveAsScreenshot,
          archiveAsMonolith: user.archiveAsMonolith,
          archiveAsPDF: user.archiveAsPDF,
          archiveAsReadable: user.archiveAsReadable,
          archiveAsWaybackMachine: user.archiveAsWaybackMachine,
          aiTag: user.aiTaggingMethod !== AiTaggingMethod.DISABLED,
        };

  try {
    await Promise.race([
      (async () => {
        const { linkType, imageExtension } = await determineLinkType(
          link.id,
          link.url
        );

        // send to archive.org
        if (archivalSettings.archiveAsWaybackMachine && link.url) {
          sendToWayback(link.url);
        }

        if (linkType === "image" && !link.image) {
          await imageHandler(link, imageExtension);
          return;
        } else if (linkType === "pdf" && !link.pdf) {
          await pdfHandler(link);
          return;
        } else if (link.url) {
          await page.goto(link.url, { waitUntil: "domcontentloaded" });

          // Handle Monolith being sent in beforehand while making sure other values line up
          if (link.monolith?.endsWith(".html")) {
            // Use Monolith content instead of page
            const file = await readFile(link.monolith);

            if (file.contentType == "text/html") {
              const fileContent = file.file;

              if (typeof fileContent === "string") {
                await page.setContent(fileContent, {
                  waitUntil: "domcontentloaded",
                });
              } else {
                await page.setContent(fileContent.toString("utf-8"), {
                  waitUntil: "domcontentloaded",
                });
              }
            }
          }

          const metaDescription = await page.evaluate(() => {
            const description = document.querySelector(
              'meta[name="description"]'
            );
            return description?.getAttribute("content") ?? undefined;
          });

          const content = await page.content();

          // Preview
          if (!link.preview) await handleArchivePreview(link, page);

          // Readability
          if (archivalSettings.archiveAsReadable && !link.readable)
            await handleReadability(content, link);

          // Screenshot/PDF
          if (
            (archivalSettings.archiveAsScreenshot && !link.image) ||
            (archivalSettings.archiveAsPDF && !link.pdf)
          ) {
            await handleScreenshotAndPdf(link, page, archivalSettings);
          }

          // Auto-tagging
          if (
            archivalSettings.aiTag &&
            user.aiTaggingMethod !== AiTaggingMethod.DISABLED &&
            !link.aiTagged &&
            (process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL ||
              process.env.OPENAI_API_KEY ||
              process.env.AZURE_API_KEY ||
              process.env.ANTHROPIC_API_KEY ||
              process.env.OPENROUTER_API_KEY)
          ) {
            await autoTagLink(user, link.id, metaDescription);
          }

          // Monolith
          if (
            archivalSettings.archiveAsMonolith &&
            !link.monolith &&
            link.url
          ) {
            await handleMonolith(link, content, abortController.signal).catch(
              (err) => {
                console.error(err);
              }
            );
          }
        }
      })(),
      timeoutPromise,
    ]);
  } catch (err) {
    console.log("Failed Link:", link.url);
    console.log("Reason:", err);
    throw err;
  } finally {
    const finalLink = await prisma.link.findUnique({
      where: { id: link.id },
    });

    if (finalLink) {
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
    } else {
      await removeFiles(link.id, link.collectionId);
    }

    await context?.close().catch(() => {});
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
    data: { type: linkType },
  });

  return { linkType, imageExtension };
}
