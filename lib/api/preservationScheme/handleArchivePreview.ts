import { Collection, Link, User } from "@prisma/client";
import { Page } from "playwright";
import generatePreview from "../generatePreview";
import createFile from "../storage/createFile";
import { prisma } from "../db";

type LinksAndCollectionAndOwner = Link & {
  collection: Collection & {
    owner: User;
  };
};

const handleArchivePreview = async (
  link: LinksAndCollectionAndOwner,
  page: Page
) => {
  const ogImageUrl = await page.evaluate(() => {
    const metaTag = document.querySelector('meta[property="og:image"]');
    return metaTag ? (metaTag as any).content : null;
  });

  if (ogImageUrl) {
    console.log("Found og:image URL:", ogImageUrl);

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
      .then((screenshot) => {
        return createFile({
          data: screenshot,
          filePath: `archives/preview/${link.collectionId}/${link.id}.jpeg`,
        });
      })
      .then(() => {
        return prisma.link.update({
          where: { id: link.id },
          data: {
            preview: `archives/preview/${link.collectionId}/${link.id}.jpeg`,
          },
        });
      });
  }
};

export default handleArchivePreview;
