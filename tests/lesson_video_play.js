// 教材頁以影片＋互動為主：有新版影片就播 mp4、影片下面直接是「動手玩」實驗室、正文不再重複同一個實驗室的入口
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const base = 'http://localhost:' + (process.env.PORT || 8801) + '/index.html#';
  await pg.goto(base + 'ds-heap'); await pg.waitForTimeout(1200);
  const r = await pg.evaluate(() => ({
    videos: Object.keys(DATA.videos || {}).length,
    video: !!document.querySelector('.clip-sec video'),
    route: [...document.querySelectorAll('.route-st .route-t')].map(x => x.textContent).join(' → '),
    play: !!document.querySelector('#play'),
    dupEmbeds: [...document.querySelectorAll('#lessonBody .lab-embed')].map(x => x.dataset.lab).filter(id => Labs.list.find(l => l.id === id && l.lessons.includes('ds-heap'))).length,
  }));
  console.log('ds-heap', JSON.stringify(r));
  await pg.locator('#play').scrollIntoViewIfNeeded(); await pg.waitForTimeout(1500);
  console.log('lab mounted:', await pg.evaluate(() => !!document.querySelector('#playHost .lab')), 'form folded:', await pg.evaluate(() => !!document.querySelector('#playHost details.lab-edit .lab-form')));
  await pg.click('#playHost .lab-stage', { force: true }).catch(() => {}); await pg.waitForTimeout(200);
  console.log('play step done:', await pg.evaluate(() => document.querySelector('.route-st[data-to="#play"]').classList.contains('done')));
  // 沒有新版影片的章：仍用即時畫面
  await pg.goto(base + 'al-np'); await pg.waitForTimeout(1200);
  console.log('al-np canvas:', await pg.evaluate(() => !!document.querySelector('.clip-sec canvas')), 'video:', await pg.evaluate(() => !!document.querySelector('.clip-sec video')));
  // 短影音頁
  await pg.goto(base + 'feed'); await pg.waitForTimeout(1500);
  console.log('feed videos:', await pg.evaluate(() => document.querySelectorAll('.feed video').length), 'canvases:', await pg.evaluate(() => document.querySelectorAll('.feed canvas').length));
  console.log(errs); await b.close();
})();
