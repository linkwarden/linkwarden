import { Collection, Link, User } from "@linkwarden/prisma/client";
import { Page } from "playwright";
import { generatePreview } from "@linkwarden/lib";
import { createFile } from "@linkwarden/filesystem";
import { prisma } from "@linkwarden/prisma";

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

  if (ogImageUrl) {
    console.log("Found og:image URL:", ogImageUrl);
    if (!ogImageUrl.startsWith("http://") && !ogImageUrl.startsWith("https://")) {
      const origin = await page.evaluate(() => document.location.origin);
      ogImageUrl = origin + (ogImageUrl.startsWith("/") ? ogImageUrl : ("/" + ogImageUrl));
    }

    // Download the image
    const imageResponse = await page.goto(ogImageUrl);

    // Check if imageResponse is not null
    if (imageResponse && !link.preview?.startsWith("archive")) {
      const buffer = await imageResponse.body();
      generatePreview(buffer, link.collectionId, link.id);
    }

    await page.goBack();
  } else if (!link.preview?.startsWith("archive")) {
    console.log("No og:image found");
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
