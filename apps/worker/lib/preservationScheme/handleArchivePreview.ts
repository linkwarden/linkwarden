import { Collection, Link, User } from "@linkwarden/prisma/client";
import { Page } from "playwright";
import { generatePreview } from "@linkwarden/lib/generatePreview";
import { createFile } from "@linkwarden/filesystem";
import { prisma } from "@linkwarden/prisma";
import { safeFetch } from "@linkwarden/lib/safeFetch";

type LinksAndCollectionAndOwner = Link & {
  collection: Collection & {
    owner: User;
  };
};

const handleArchivePreview = async (
  link: LinksAndCollectionAndOwner,
  page: Page
) => {
  let ogImageUrl = await page.evaluate(() => {
    const metaTag = document.querySelector('meta[property="og:image"]');
    return metaTag ? (metaTag as any).content : null;
  });

  let previewGenerated = false;

  if (ogImageUrl && !link.preview?.startsWith("archive")) {
    if (
      !ogImageUrl.startsWith("http://") &&
      !ogImageUrl.startsWith("https://")
    ) {
      const pageUrl = await page.evaluate(
        () => document.location.href
      );
      if (ogImageUrl.startsWith("//")) {
        // Protocol-relative URL — prepend the page's protocol
        const protocol = new URL(pageUrl).protocol;
        ogImageUrl = protocol + ogImageUrl;
      } else {
        const origin = new URL(pageUrl).origin;
        ogImageUrl =
          origin + (ogImageUrl.startsWith("/") ? ogImageUrl : "/" + ogImageUrl);
      }
    }

    try {
      const imageResponse = await safeFetch(ogImageUrl);

      if (imageResponse.ok) {
        const buffer = await imageResponse.buffer();
        previewGenerated = await generatePreview(
          buffer,
          link.collectionId,
          link.id
        );
      }
    } catch (error) {
      // OG image fetch is non-critical — log and fall through to screenshot
      console.log(
        "Failed to fetch OG image preview:",
        ogImageUrl,
        error instanceof Error ? error.message : error
      );
    }
  }

  if (!previewGenerated && !link.preview?.startsWith("archive")) {
    await page
      .screenshot({ type: "jpeg", quality: 20 })
      .then(async (screenshot) => {
        if (
          Buffer.byteLength(screenshot) >
          1024 * 1024 * Number(process.env.PREVIEW_MAX_BUFFER || 10)
        )
          return console.log("Error generating preview: Buffer size exceeded");

        await createFile({
          data: screenshot,
          filePath: `archives/preview/${link.collectionId}/${link.id}.jpeg`,
        });

        await prisma.link.update({
          where: { id: link.id },
          data: {
            preview: `archives/preview/${link.collectionId}/${link.id}.jpeg`,
          },
        });
      });
  }
};

export default handleArchivePreview;
