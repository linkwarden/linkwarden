import { chromium, devices } from "playwright";
import { prisma } from "@/lib/api/db";
import createFile from "@/lib/api/storage/createFile";
import sendToWayback from "./sendToWayback";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

export default async function archive(
  linkId: number,
  url: string,
  userId: number
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const targetLink = await prisma.link.update({
    where: { id: linkId },
    data: {
      screenshotPath: user?.archiveAsScreenshot ? "pending" : null,
      pdfPath: user?.archiveAsPDF ? "pending" : null,
      readabilityPath: "pending",
      lastPreserved: new Date().toISOString(),
    },
  });

  // Archive.org

  if (user?.archiveAsWaybackMachine) sendToWayback(url);

  if (user?.archiveAsPDF || user?.archiveAsScreenshot) {
    const browser = await chromium.launch();
    const context = await browser.newContext(devices["Desktop Chrome"]);
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });

      const content = await page.content();

      // Readability

      const window = new JSDOM("").window;
      const purify = DOMPurify(window);
      const cleanedUpContent = purify.sanitize(content);
      const dom = new JSDOM(cleanedUpContent, { url: url });
      const article = new Readability(dom.window.document).parse();

      const articleText = article?.textContent
        .replace(/ +(?= )/g, "") // strip out multiple spaces
        .replace(/(\r\n|\n|\r)/gm, " "); // strip out line breaks

      await createFile({
        data: JSON.stringify(article),
        filePath: `archives/${targetLink.collectionId}/${linkId}_readability.json`,
      });

      await prisma.link.update({
        where: { id: linkId },
        data: {
          readabilityPath: `archives/${targetLink.collectionId}/${linkId}_readability.json`,
          textContent: articleText,
        },
      });

      // Screenshot/PDF

      let faulty = false;
      await page
        .evaluate(autoScroll, Number(process.env.AUTOSCROLL_TIMEOUT) || 30)
        .catch((e) => (faulty = true));

      const linkExists = await prisma.link.findUnique({
        where: { id: linkId },
      });

      if (linkExists && !faulty) {
        if (user.archiveAsScreenshot) {
          const screenshot = await page.screenshot({ fullPage: true });
          await createFile({
            data: screenshot,
            filePath: `archives/${linkExists.collectionId}/${linkId}.png`,
          });
        }

        if (user.archiveAsPDF) {
          const pdf = await page.pdf({
            width: "1366px",
            height: "1931px",
            printBackground: true,
            margin: { top: "15px", bottom: "15px" },
          });

          await createFile({
            data: pdf,
            filePath: `archives/${linkExists.collectionId}/${linkId}.pdf`,
          });
        }

        await prisma.link.update({
          where: { id: linkId },
          data: {
            screenshotPath: user.archiveAsScreenshot
              ? `archives/${linkExists.collectionId}/${linkId}.png`
              : null,
            pdfPath: user.archiveAsPDF
              ? `archives/${linkExists.collectionId}/${linkId}.pdf`
              : null,
          },
        });
      } else if (faulty) {
        await prisma.link.update({
          where: { id: linkId },
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
