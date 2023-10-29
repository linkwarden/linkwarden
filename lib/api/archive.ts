import { chromium, devices } from "playwright";
import { prisma } from "@/lib/api/db";
import createFile from "@/lib/api/storage/createFile";
import sendToWayback from "./sendToWayback";

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

  const link = await prisma.link.update({
    where: {
      id: linkId,
    },
    data: {
      screenshotPath: user?.archiveAsScreenshot ? "pending" : null,
      pdfPath: user?.archiveAsPDF ? "pending" : null,
    },
  });

  if (user?.archiveAsWaybackMachine) sendToWayback(url);

  if (user?.archiveAsPDF || user?.archiveAsScreenshot) {
    const browser = await chromium.launch();
    const context = await browser.newContext(devices["Desktop Chrome"]);
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });

      await page.evaluate(
        autoScroll,
        Number(process.env.AUTOSCROLL_TIMEOUT) || 30
      );

      const linkExists = await prisma.link.findUnique({
        where: {
          id: linkId,
        },
      });

      if (linkExists) {
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
      }

      await browser.close();
    } catch (err) {
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
