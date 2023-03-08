import { chromium, devices } from "playwright";

export default async (url: string, collectionId: number, linkId: number) => {
  const archivePath = `data/archives/${collectionId}/${linkId}`;

  const browser = await chromium.launch();
  const context = await browser.newContext(devices["Desktop Chrome"]);
  const page = await context.newPage();

  // const contexts = browser.contexts();
  // console.log(contexts.length);

  await page.goto(url);

  await page.pdf({ path: archivePath + ".pdf" });

  await page.screenshot({ fullPage: true, path: archivePath + ".png" });

  await context.close();
  await browser.close();
};
