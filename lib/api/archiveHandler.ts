import { LaunchOptions, chromium, devices } from "playwright";
import { prisma } from "./db";
import createFile from "./storage/createFile";
import sendToWayback from "./preservationScheme/sendToWayback";
import { Collection, Link, User } from "@prisma/client";
import validateUrlSize from "./validateUrlSize";
import createFolder from "./storage/createFolder";
import generatePreview from "./generatePreview";
import { removeFiles } from "./manageLinkFiles";
import archiveAsSinglefile from "./preservationScheme/archiveAsSinglefile";
import archiveAsReadability from "./preservationScheme/archiveAsReadablility";

type LinksAndCollectionAndOwner = Link & {
  collection: Collection & {
    owner: User;
  };
};

const BROWSER_TIMEOUT = Number(process.env.BROWSER_TIMEOUT) || 5;

export default async function archiveHandler(link: LinksAndCollectionAndOwner) {
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

        const validatedUrl = link.url
          ? await validateUrlSize(link.url)
          : undefined;

        if (
          validatedUrl === null &&
          process.env.IGNORE_URL_SIZE_LIMIT !== "true"
        )
          throw "Something went wrong while retrieving the file size.";

        const contentType = validatedUrl?.get("content-type");
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
                : "unavailable",
            pdf:
              user.archiveAsPDF && !link.pdf?.startsWith("archive")
                ? "pending"
                : "unavailable",
            readable: !link.readable?.startsWith("archive")
              ? "pending"
              : undefined,
            singlefile: !link.singlefile?.startsWith("archive")
              ? "pending"
              : undefined,
            preview: !link.readable?.startsWith("archive")
              ? "pending"
              : undefined,
            lastPreserved: new Date().toISOString(),
          },
        });

        // SingleFile
        if (
          !link.singlefile?.startsWith("archive") &&
          !link.singlefile?.startsWith("unavailable") &&
          user.archiveAsSinglefile &&
          link.url
        )
          await archiveAsSinglefile(link);

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

          const context = await browser.newContext({
            ...devices["Desktop Chrome"],
            ignoreHTTPSErrors: process.env.IGNORE_HTTPS_ERRORS === "true",
          });

          const page = await context.newPage();

          await page.goto(link.url, { waitUntil: "domcontentloaded" });

          const content = await page.content();

          // Readability
          if (
            !link.readable?.startsWith("archives") &&
            !link.readable?.startsWith("unavailable")
          )
            await archiveAsReadability(content, link);

          // Preview

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
              await generatePreview(buffer, link.collectionId, link.id);
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
        }

        if (
          (!link.image?.startsWith("archives") &&
            !link.image?.startsWith("unavailable")) ||
          (!link.pdf?.startsWith("archives") &&
            !link.pdf?.startsWith("unavailable"))
        ) {
          // Screenshot/PDF
          await page.evaluate(
            autoScroll,
            Number(process.env.AUTOSCROLL_TIMEOUT) || 30
          );

          // Check if the user hasn't deleted the link by the time we're done scrolling
          const linkExists = await prisma.link.findUnique({
            where: { id: link.id },
          });
          if (linkExists) {
            const processingPromises = [];

            if (
              user.archiveAsScreenshot &&
              !link.image?.startsWith("archive")
            ) {
              processingPromises.push(
                page.screenshot({ fullPage: true }).then((screenshot) => {
                  return createFile({
                    data: screenshot,
                    filePath: `archives/${linkExists.collectionId}/${link.id}.png`,
                  });
                })
              );
            }

            // apply administrator's defined pdf margins or default to 15px
            const margins = {
              top: process.env.PDF_MARGIN_TOP || "15px",
              bottom: process.env.PDF_MARGIN_BOTTOM || "15px",
            };

            if (user.archiveAsPDF && !link.pdf?.startsWith("archive")) {
              processingPromises.push(
                page
                  .pdf({
                    width: "1366px",
                    height: "1931px",
                    printBackground: true,
                    margin: margins,
                  })
                  .then((pdf) => {
                    return createFile({
                      data: pdf,
                      filePath: `archives/${linkExists.collectionId}/${link.id}.pdf`,
                    });
                  })
              );
            }
            await Promise.allSettled(processingPromises);
            await prisma.link.update({
              where: { id: link.id },
              data: {
                image: user.archiveAsScreenshot
                  ? `archives/${linkExists.collectionId}/${link.id}.png`
                  : undefined,
                pdf: user.archiveAsPDF
                  ? `archives/${linkExists.collectionId}/${link.id}.pdf`
                  : undefined,
              },
            });
          }
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
          singlefile: !finalLink.singlefile?.startsWith("archives")
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

const autoScroll = async (AUTOSCROLL_TIMEOUT: number) => {
  const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Webpage was too long to be archived.`));
    }, AUTOSCROLL_TIMEOUT * 1000);
  });

  const scrollingPromise = new Promise<void>((resolve) => {
    let totalHeight = 0;
    let distance = 100;
    let scrollDown = setInterval(() => {
      let scrollHeight = document.body.scrollHeight;
      window.scrollBy(0, distance);
      totalHeight += distance;
      if (totalHeight >= scrollHeight) {
        clearInterval(scrollDown);
        window.scroll(0, 0);
        resolve();
      }
    }, 100);
  });

  await Promise.race([scrollingPromise, timeoutPromise]);
};

const imageHandler = async ({ url, id }: Link, extension: string) => {
  const image = await fetch(url as string).then((res) => res.blob());

  const buffer = Buffer.from(await image.arrayBuffer());

  const linkExists = await prisma.link.findUnique({
    where: { id },
  });

  if (linkExists) {
    await createFile({
      data: buffer,
      filePath: `archives/${linkExists.collectionId}/${id}.${extension}`,
    });

    await prisma.link.update({
      where: { id },
      data: {
        image: `archives/${linkExists.collectionId}/${id}.${extension}`,
      },
    });
  }
};

const pdfHandler = async ({ url, id }: Link) => {
  const pdf = await fetch(url as string).then((res) => res.blob());

  const buffer = Buffer.from(await pdf.arrayBuffer());

  const linkExists = await prisma.link.findUnique({
    where: { id },
  });

  if (linkExists) {
    await createFile({
      data: buffer,
      filePath: `archives/${linkExists.collectionId}/${id}.pdf`,
    });

    await prisma.link.update({
      where: { id },
      data: {
        pdf: `archives/${linkExists.collectionId}/${id}.pdf`,
      },
    });
  }
};
