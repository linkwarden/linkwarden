import { Page } from "puppeteer";
import { prisma } from "@/lib/api/db";
import puppeteer from "puppeteer-extra";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import createFile from "@/lib/api/storage/createFile";

export default async function archive(
  url: string,
  collectionId: number,
  linkId: number
) {
  const browser = await puppeteer.launch();

  try {
    puppeteer.use(AdblockerPlugin()).use(StealthPlugin());

    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 300000 });

    await page.setViewport({ width: 1080, height: 1024 });

    await autoScroll(page);

    const linkExists = await prisma.link.findUnique({
      where: {
        id: linkId,
      },
    });

    if (linkExists) {
      const pdf = await page.pdf({
        width: "1366px",
        height: "1931px",
        printBackground: true,
        margin: { top: "15px", bottom: "15px" },
      });
      const screenshot = await page.screenshot({
        fullPage: true,
      });

      createFile({
        data: screenshot,
        filePath: `archives/${collectionId}/${linkId}.png`,
      });

      createFile({
        data: pdf,
        filePath: `archives/${collectionId}/${linkId}.pdf`,
      });
    }

    await browser.close();
  } catch (err) {
    console.log(err);
    await browser.close();
  }
}

const autoScroll = async (page: Page) => {
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
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

    await new Promise((r) => setTimeout(r, 2000));
  });
};
