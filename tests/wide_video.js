// 橫式影片（16:9）：播放器載入後要變成 16:9、外框跟著變；直式影片維持 9:16
// 需要 web/media/_wide_test.mp4（任何一支橫式 mp4；測完可刪）
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const base = 'http://localhost:' + (process.env.PORT || 8801) + '/index.html#';
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const pg = await (await b.newContext({ viewport: vp })).newPage();
    const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(base + 'feed'); await pg.waitForTimeout(800);
    // 把第一支換成橫式測試檔，重畫短影音頁
    await pg.evaluate(() => { const id = Object.keys(DATA.shorts)[0]; DATA.shorts[id] = Object.assign({}, DATA.shorts[id], { src: 'media/_wide_test.mp4', poster: '' }); window._wideId = id; location.hash = 'today'; });
    await pg.waitForTimeout(300); await pg.evaluate(() => { location.hash = 'feed'; }); await pg.waitForTimeout(2500);
    const r = await pg.evaluate(() => {
      const sec = document.querySelector(`.feed-item[data-id="${window._wideId}"]`) || document.querySelector('.feed-item[data-id]');
      const box = sec && sec.querySelector('.clip-player'), v = box && box.querySelector('video');
      const other = [...document.querySelectorAll('.feed-item[data-id] .clip-player')].find(x => x !== box && x.querySelector('video') && x.querySelector('video').videoWidth);
      const R = (e) => { const q = e.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; };
      return { id: sec && sec.dataset.id, vw: v && v.videoWidth, vh: v && v.videoHeight, wide: box && box.classList.contains('wide'), slotWide: sec && sec.querySelector('.feed-slot').classList.contains('wide'), size: box && R(box), otherWide: other ? other.classList.contains('wide') : 'n/a', otherSize: other ? R(other) : null, docW: document.documentElement.scrollWidth };
    });
    console.log(vp.width, JSON.stringify(r), 'ratio', r.size ? (r.size[0] / r.size[1]).toFixed(3) : '-', errs);
    await pg.screenshot({ path: `/tmp/wide_${vp.width}.png` });
  }
  await b.close();
})();
