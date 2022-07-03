const puppeteer = require("puppeteer");
const { PuppeteerBlocker } = require("@cliqz/adblocker-puppeteer");
const fetch = require("cross-fetch");
const { screenshotDirectory, pdfDirectory } = require("../config.js");

module.exports = async (link, id) => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    timeout: 10000,
  });
  const page = await browser.newPage();

  await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    blocker.enableBlockingInPage(page);
  });

  await page.goto(link, { waitUntil: "load", timeout: 300000 });

  await page.setViewport({
    width: 1200,
    height: 800,
  });

  await autoScroll(page);

  await page.screenshot({
    path: screenshotDirectory + "/" + id + ".png",
    fullPage: true,
  });
  await page.pdf({ path: pdfDirectory + "/" + id + ".pdf", format: "a4" });

  await browser.close();
};

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      let distance = 100;
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });

    window.scrollTo(0,0);
  });
}
