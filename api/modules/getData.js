const puppeteer = require("puppeteer");
const { PuppeteerBlocker } = require("@cliqz/adblocker-puppeteer");
const fetch = require("cross-fetch");
const { screenshotDirectory, pdfDirectory } = require("../config.js");

module.exports = async (link, id) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    timeout: 10000,
  });
  const page = await browser.newPage();

  await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    blocker.enableBlockingInPage(page);
  });

  await page.goto(link, { waitUntil: "load", timeout: 0 });

  await page.screenshot({
    path: screenshotDirectory + "/" + id + ".png",
    fullPage: true,
  });
  await page.pdf({ path: pdfDirectory + "/" + id + ".pdf", format: "a4" });

  await browser.close();
};
