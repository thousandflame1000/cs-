const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const H = require('./_answer');

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`http://127.0.0.1:${process.env.PORT || 8801}/index.html#practice`);
    await page.locator('#fhGo').click();
    const stage = page.locator('#stGo');
    if (await stage.count()) await stage.click();
    await H.answer(page);
    await page.locator('#qNext').click();
    await page.locator('#qQuit').click();
    const back = page.locator('#goNextRec');
    await back.waitFor();
    await page.waitForTimeout(5500);
    assert.equal(await back.textContent(), '返回練習');
    await page.reload();
    assert.equal(await back.textContent(), '返回練習');
    await back.click();
    await page.locator('.self-pick').waitFor();
    console.log('summary stays until explicitly dismissed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
