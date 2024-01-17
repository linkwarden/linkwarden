import { chromium, devices } from "playwright";
import { prisma } from "./db";
import createFile from "./storage/createFile";
import sendToWayback from "./sendToWayback";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import { Collection, Link, User } from "@prisma/client";
import validateUrlSize from "./validateUrlSize";
import removeFile from "./storage/removeFile";
import Jimp from "jimp";
import createFolder from "./storage/createFolder";

type LinksAndCollectionAndOwner = Link & {
  collection: Collection & {
    owner: User;
  };
};

const BROWSER_TIMEOUT = Number(process.env.BROWSER_TIMEOUT) || 5;

export default async function archiveHandler(link: LinksAndCollectionAndOwner) {
  const browser = await chromium.launch();
  const context = await browser.newContext(devices["Desktop Chrome"]);
  const page = await context.newPage();

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

  try {
    await Promise.race([
      (async () => {
        const validatedUrl = link.url
          ? await validateUrlSize(link.url)
          : undefined;

        if (validatedUrl === null)
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

        const user = link.collection?.owner;

        // send to archive.org
        if (user.archiveAsWaybackMachine && link.url) sendToWayback(link.url);

        const targetLink = await prisma.link.update({
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
            readable: !link.readable?.startsWith("archive")
              ? "pending"
              : undefined,
            preview: !link.readable?.startsWith("archive")
              ? "pending"
              : undefined,
            lastPreserved: new Date().toISOString(),
          },
        });

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

          // TODO single file
          // const session = await page.context().newCDPSession(page);
          // const doc = await session.send("Page.captureSnapshot", {
          //   format: "mhtml",
          // });
          // const saveDocLocally = (doc: any) => {
          //   console.log(doc);
          //   return createFile({
          //     data: doc,
          //     filePath: `archives/${targetLink.collectionId}/${link.id}.mhtml`,
          //   });
          // };
          // saveDocLocally(doc.data);

          // Readability
          const window = new JSDOM("").window;
          const purify = DOMPurify(window);
          const cleanedUpContent = purify.sanitize(content);
          const dom = new JSDOM(cleanedUpContent, { url: link.url || "" });
          const article = new Readability(dom.window.document).parse();
          const articleText = article?.textContent
            .replace(/ +(?= )/g, "") // strip out multiple spaces
            .replace(/(\r\n|\n|\r)/gm, " "); // strip out line breaks
          if (
            articleText &&
            articleText !== "" &&
            !link.readable?.startsWith("archive")
          ) {
            await createFile({
              data: JSON.stringify(article),
              filePath: `archives/${targetLink.collectionId}/${link.id}_readability.json`,
            });

            await prisma.link.update({
              where: { id: link.id },
              data: {
                readable: `archives/${targetLink.collectionId}/${link.id}_readability.json`,
                textContent: articleText,
              },
            });
          }

          // Preview

          const ogImageUrl = await page.evaluate(() => {
            const metaTag = document.querySelector('meta[property="og:image"]');
            return metaTag ? (metaTag as any).content : null;
          });

          createFolder({
            filePath: `archives/preview/${link.collectionId}`,
          });

          if (ogImageUrl) {
            console.log("Found og:image URL:", ogImageUrl);

            // Download the image
            const imageResponse = await page.goto(ogImageUrl);

            // Check if imageResponse is not null
            if (imageResponse && !link.preview?.startsWith("archive")) {
              const buffer = await imageResponse.body();

              // Check if buffer is not null
              if (buffer) {
                // Load the image using Jimp
                Jimp.read(buffer, async (err, image) => {
                  if (image && !err) {
                    image?.resize(1280, Jimp.AUTO).quality(20);
                    const processedBuffer = await image?.getBufferAsync(
                      Jimp.MIME_JPEG
                    );

                    createFile({
                      data: processedBuffer,
                      filePath: `archives/preview/${link.collectionId}/${link.id}.jpeg`,
                    }).then(() => {
                      return prisma.link.update({
                        where: { id: link.id },
                        data: {
                          preview: `archives/preview/${link.collectionId}/${link.id}.jpeg`,
                        },
                      });
                    });
                  }
                }).catch((err) => {
                  console.error("Error processing the image:", err);
                });
              } else {
                console.log("No image data found.");
              }
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
            if (user.archiveAsPDF && !link.pdf?.startsWith("archive")) {
              processingPromises.push(
                page
                  .pdf({
                    width: "1366px",
                    height: "1931px",
                    printBackground: true,
                    margin: { top: "15px", bottom: "15px" },
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
          pdf: !finalLink.pdf?.startsWith("archives")
            ? "unavailable"
            : undefined,
          preview: !finalLink.preview?.startsWith("archives")
            ? "unavailable"
            : undefined,
        },
      });
    else {
      removeFile({ filePath: `archives/${link.collectionId}/${link.id}.png` });
      removeFile({ filePath: `archives/${link.collectionId}/${link.id}.pdf` });
      removeFile({
        filePath: `archives/${link.collectionId}/${link.id}_readability.json`,
      });
      removeFile({
        filePath: `archives/preview/${link.collectionId}/${link.id}.jpeg`,
      });
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
