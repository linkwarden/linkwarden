import { LaunchOptions, Page, chromium, devices } from "playwright";
import { prisma } from "@/lib/api/db";
import createFile from "@/lib/api/storage/createFile";

export default async function archive(linkId: number, url: string) {
  // allow user to configure a proxy
  let browserOptions:LaunchOptions = {};
  if (process.env.ARCHIVER_PROXY) {
      browserOptions.proxy = {
        server: process.env.ARCHIVER_PROXY,
        bypass: process.env.ARCHIVER_PROXY_BYPASS,
        username: process.env.ARCHIVER_PROXY_USERNAME,
        password: process.env.ARCHIVER_PROXY_PASSWORD,
      }
  }

  const browser = await chromium.launch(browserOptions);
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
        filePath: `archives/${linkExists.collectionId}/${linkId}.png`,
      });

      createFile({
        data: pdf,
        filePath: `archives/${linkExists.collectionId}/${linkId}.pdf`,
      });
    }

    await browser.close();
  } catch (err) {
    console.log(err);
    await browser.close();
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
