import { chromium, devices } from "playwright";
import { prisma } from "../../lib/api/db";
import createFile from "../../lib/api/storage/createFile";
import sendToWayback from "../../lib/api/sendToWayback";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import { Collection, Link, User } from "@prisma/client";

type LinksAndCollectionAndOwner = Link & {
  collection: Collection & {
    owner: User;
  };
};

export default async function urlHandler(link: LinksAndCollectionAndOwner) {
  const user = link.collection?.owner;

  const targetLink = await prisma.link.update({
    where: { id: link.id },
    data: {
      screenshotPath: user.archiveAsScreenshot ? "pending" : null,
      pdfPath: user.archiveAsPDF ? "pending" : null,
      readabilityPath: "pending",
      lastPreserved: new Date().toISOString(),
    },
  });

  // archive.org

  if (user.archiveAsWaybackMachine && link.url) sendToWayback(link.url);

  if (user.archiveAsPDF || user.archiveAsScreenshot) {
    const browser = await chromium.launch();
    const context = await browser.newContext(devices["Desktop Chrome"]);
    const page = await context.newPage();

    try {
      link.url &&
        (await page.goto(link.url, { waitUntil: "domcontentloaded" }));

      const content = await page.content();

      // TODO
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

      await createFile({
        data: JSON.stringify(article),
        filePath: `archives/${targetLink.collectionId}/${link.id}_readability.json`,
      });

      await prisma.link.update({
        where: { id: link.id },
        data: {
          readabilityPath: `archives/${targetLink.collectionId}/${link.id}_readability.json`,
          textContent: articleText,
        },
      });

      // Screenshot/PDF

      let faulty = false;
      await page
        .evaluate(autoScroll, Number(process.env.AUTOSCROLL_TIMEOUT) || 30)
        .catch((e) => (faulty = true));

      const linkExists = await prisma.link.findUnique({
        where: { id: link.id },
      });

      if (linkExists && !faulty) {
        const processingPromises = [];

        if (user.archiveAsScreenshot) {
          const screenshot = await page.screenshot({ fullPage: true });
          processingPromises.push(
            createFile({
              data: screenshot,
              filePath: `archives/${linkExists.collectionId}/${link.id}.png`,
            })
          );
        }

        if (user.archiveAsPDF) {
          const pdf = await page.pdf({
            width: "1366px",
            height: "1931px",
            printBackground: true,
            margin: { top: "15px", bottom: "15px" },
          });
          processingPromises.push(
            createFile({
              data: pdf,
              filePath: `archives/${linkExists.collectionId}/${link.id}.pdf`,
            })
          );
        }

        await Promise.allSettled(processingPromises);

        await prisma.link.update({
          where: { id: link.id },
          data: {
            screenshotPath: user.archiveAsScreenshot
              ? `archives/${linkExists.collectionId}/${link.id}.png`
              : null,
            pdfPath: user.archiveAsPDF
              ? `archives/${linkExists.collectionId}/${link.id}.pdf`
              : null,
          },
        });
      } else if (faulty) {
        await prisma.link.update({
          where: { id: link.id },
          data: {
            screenshotPath: null,
            pdfPath: null,
          },
        });
      }
    } catch (err) {
      console.log(err);
      throw err;
    } finally {
      await browser.close();
    }
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
