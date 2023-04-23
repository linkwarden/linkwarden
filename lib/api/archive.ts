// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { Page } from "puppeteer";
import { prisma } from "@/lib/api/db";
import puppeteer from "puppeteer-extra";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

export default async (url: string, collectionId: number, linkId: number) => {
  const archivePath = `data/archives/${collectionId}/${linkId}`;

  const browser = await puppeteer.launch();

  try {
    puppeteer.use(AdblockerPlugin()).use(StealthPlugin());

    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 300000 });

    await page.setViewport({ width: 1080, height: 1024 });

    await autoScroll(page);

    const linkExists = await prisma.link.findFirst({
      where: {
        id: linkId,
      },
    });

    if (linkExists) {
      await Promise.all([
        page.pdf({ path: archivePath + ".pdf", format: "a4" }),
        page.screenshot({ fullPage: true, path: archivePath + ".png" }),
      ]);
    }

    await browser.close();
  } catch (err) {
    console.log(err);
    await browser.close();
  }
};

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
