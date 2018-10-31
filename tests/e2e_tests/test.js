const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rawJs = fs.readFileSync(path.resolve(__dirname, '../../painty.js'), { encoding: 'utf8' });
async function sleep(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  })
}


describe('painty basic', function() {
  this.timeout(60000);

  it('should calculate fmp with timeout specified', async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.evaluateOnNewDocument(rawJs);
    await page.goto('https://www.taobao.com');
    await page.waitForFunction('typeof painty === "function"');
    const result = await page.evaluate(async () => {
      return {
        fmp: await new Promise(resolve => painty(10000, fmp => resolve(fmp))),
        load: performance.timing.loadEventEnd - performance.timing.navigationStart,
      };
    });

    console.log(`fmp: ${result.fmp} ms, load: ${result.load} ms`);
    assert.equal(typeof result.fmp, 'number');
    assert.notEqual(result.fmp, 0);
    await browser.close();
  });

  it('should calculate fmp when page is to be unloaded', async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.evaluateOnNewDocument(rawJs);
    await page.goto('https://www.taobao.com');
    await page.waitForFunction('typeof painty === "function"');
    const result = await page.evaluate(async () => {
      return new Promise(resolve => {
        painty(fmp => resolve({
          fmp,
          load: performance.timing.loadEventEnd - performance.timing.navigationStart,
        }));
        setTimeout(() => window.dispatchEvent(new Event('beforeunload')), 5000);
      });
    });

    console.log(`fmp: ${result.fmp} ms, load: ${result.load} ms`);
    assert.equal(typeof result.fmp, 'number');
    assert.notEqual(result.fmp, 0);
    await browser.close();
  });

  it('should have a record size limit', async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.evaluateOnNewDocument('window.MutationObserver = null; __PAINTY_STACK_LIMIT__ = 10;');
    await page.evaluateOnNewDocument(rawJs);
    await page.goto('https://www.taobao.com');
    await page.waitForFunction('typeof painty === "function"');
    const result = await page.evaluate(async () => {
      return new Promise(resolve => {
        painty(fmp => resolve({
          fmp,
          load: performance.timing.loadEventEnd - performance.timing.navigationStart,
        }));
      });
    });

    console.log(`fmp: ${result.fmp} ms, load: ${result.load} ms`);
    assert.equal(typeof result.fmp, 'number');
    assert.notEqual(result.fmp, 0);
    await browser.close();
  });

  it('should correctly calculate fmp for SPAs', async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.evaluateOnNewDocument(rawJs);
    await page.goto('https://ant.design/index-cn');
    await page.waitForFunction('typeof painty === "function"');
    await page.evaluate(async () => {
      return painty(fmp => {
        window.fmp = fmp;
      });
    });

    const btn = await page.$('#banner > div.banner.page > div.text-wrapper > div > a.banner-btn.components');
    await btn.click();
    await page.waitFor('.main-menu');
    const sideLinks = await page.$$('#react-content > div > div > div:nth-child(1) > div.main-menu.ant-col-xs-24.ant-col-sm-24.ant-col-md-24.ant-col-lg-6.ant-col-xl-5.ant-col-xxl-4 > ul a');
    await sideLinks[1].click();
    await sleep(2000);
    await sideLinks[2].click();
    await sleep(2000);
    await sideLinks[3].click();
    await sleep(2000);
    await sideLinks[4].click();
    const result = await page.evaluate(async () => {
      window.dispatchEvent(new Event('beforeunload'));

      return await new Promise(resolve => {
        setTimeout(() => {
          resolve({
            fmp: window.fmp,
            load: performance.timing.loadEventEnd - performance.timing.navigationStart,
          });
        });
      });
    });

    console.log(`fmp: ${result.fmp} ms, load: ${result.load} ms`);
    assert.equal(typeof result.fmp, 'number');
    assert(Math.abs(result.load - result.fmp) < 5000);
    await browser.close();
  });
});
