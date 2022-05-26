const puppeteer = require('puppeteer');
const { PuppeteerBlocker } = require('@cliqz/adblocker-puppeteer');
const fetch = require('cross-fetch');
const config = require('../../src/config.json');
const fs = require('fs');

const screenshotDirectory = config.api.storage_location + '/Webmarker/screenshot\'s/';
const pdfDirectory = config.api.storage_location + '/Webmarker/pdf\'s/';

if (!fs.existsSync(screenshotDirectory)){
  fs.mkdirSync(screenshotDirectory, { recursive: true });
}

if (!fs.existsSync(pdfDirectory)){
  fs.mkdirSync(pdfDirectory, { recursive: true });
}

module.exports = async (link, id) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    blocker.enableBlockingInPage(page);
  });
  
  await page.goto(link, { waitUntil: 'load', timeout: 0 });

  const title = await page.title();
  await page.screenshot({ path: screenshotDirectory + id + '.png', fullPage: true});
  await page.pdf({ path: pdfDirectory + id + '.pdf', format: 'a4' });

  await browser.close();

  return title;
}