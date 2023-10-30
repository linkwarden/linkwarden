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
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  // const checkExistingLink = await prisma.link.findFirst({
  //   where: {
  //     id: linkId,
  //     OR: [
  //       {
  //         screenshotPath: "pending",
  //       },
  //       {
  //         pdfPath: "pending",
  //       },
  //     ],
  //   },
  // });

  // if (checkExistingLink) return "A request has already been made.";

  const targetLink = await prisma.link.update({
    where: {
      id: linkId,
    },
    data: {
      screenshotPath: user?.archiveAsScreenshot ? "pending" : null,
      pdfPath: user?.archiveAsPDF ? "pending" : null,
      readabilityPath: "pending",
    },
  });

  if (user?.archiveAsWaybackMachine) sendToWayback(url);

  if (user?.archiveAsPDF || user?.archiveAsScreenshot) {
    const browser = await chromium.launch();
    const context = await browser.newContext(devices["Desktop Chrome"]);
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });

      await page.goto(url);
      const content = await page.content();

      // Readability

      const window = new JSDOM("").window;
      const purify = DOMPurify(window);
      const cleanedUpContent = purify.sanitize(content);

      const dom = new JSDOM(cleanedUpContent, {
        url: url,
      });

      const article = new Readability(dom.window.document).parse();

      await prisma.link.update({
        where: {
          id: linkId,
        },
        data: {
          readabilityPath: `archives/${targetLink.collectionId}/${linkId}_readability.txt`,
        },
      });

      await createFile({
        data: JSON.stringify(article),
        filePath: `archives/${targetLink.collectionId}/${linkId}_readability.txt`,
      });

      console.log(JSON.parse(JSON.stringify(article)));

      // Screenshot/PDF

      let faulty = true;
      await page
        .evaluate(autoScroll, Number(process.env.AUTOSCROLL_TIMEOUT) || 30)
        .catch((e) => (faulty = false));

      const linkExists = await prisma.link.findUnique({
        where: {
          id: linkId,
        },
      });

      if (linkExists && faulty) {
        if (user.archiveAsScreenshot) {
          const screenshot = await page.screenshot({
            fullPage: true,
          });

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

        const updateLink = await prisma.link.update({
          where: {
            id: linkId,
          },
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
          where: {
            id: linkId,
          },
          data: {
            screenshotPath: null,
            pdfPath: null,
          },
        });
      }

      await browser.close();
    } catch (err) {
      console.log(err);
      await browser.close();
      return err;
    }
  }
}

const autoScroll = async (AUTOSCROLL_TIMEOUT: number) => {
  const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Auto scroll took too long (more than ${AUTOSCROLL_TIMEOUT} seconds).`
        )
      );
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
