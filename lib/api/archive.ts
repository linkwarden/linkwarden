import { chromium, devices } from "playwright";
import { prisma } from "@/lib/api/db";

export default async (url: string, collectionId: number, linkId: number) => {
  const archivePath = `data/archives/${collectionId}/${linkId}`;

  const browser = await chromium.launch();
  const context = await browser.newContext(devices["Desktop Chrome"]);
  const page = await context.newPage();

  // const contexts = browser.contexts();
  // console.log(contexts.length);

  await page.goto(url);

  const linkExists = await prisma.link.findFirst({
    where: {
      id: linkId,
    },
  });

  if (linkExists) {
    await Promise.all([
      page.pdf({ path: archivePath + ".pdf" }),
      page.screenshot({ fullPage: true, path: archivePath + ".png" }),
    ]);
  }

  await context.close();
  await browser.close();
};
