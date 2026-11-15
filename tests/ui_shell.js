/* 介面規格 U1–U7、U9 驗收（content/課程規格.md「介面規格」，2026-11-14）
   用法：python3 server.py --port 8765 --no-browser（要有學生進度，「下一步」才會出現）然後  node tests/ui_shell.js
   參數：PORT=8765 */
const { chromium } = require('playwright');
const PORT = process.env.PORT || 8765, BASE = `http://127.0.0.1:${PORT}/index.html`;
const V = {}; const bad = (r, m) => (V[r] = V[r] || []).push(m);
const PAGES = { today: ['go', 'today'], course: ['map', 'subj-ds', 'videos', 'lab', 'notes'], practice: ['practice', 'wrong', 'cards', 'papers', 'gen'], me: ['me', 'stats', 'rewards', 'palace', 'state', 'agent', 'setup', 'methods'] };
const HOME = { today: 'go', course: 'map', practice: 'practice', me: 'me' };

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, args: ['--no-sandbox'] } : {});
  const open = async (w, hgt) => { const c = await b.newContext({ viewport: { width: w, height: hgt } }); await c.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); const p = await c.newPage(); p._e = []; p.on('pageerror', e => p._e.push(e.message)); await p.goto(BASE + '#go'); await p.waitForTimeout(2500); return p; };
  const go = async (p, h, ms = 700) => { await p.evaluate(h => { location.hash = '#' + h; }, h); await p.waitForTimeout(ms); };

  /* ---------- 桌機 1440×900 ---------- */
  const d = await open(1440, 900);
  const u1 = await d.evaluate(() => { const r = document.querySelector('#rail'); return { n: document.querySelectorAll('#rail .r-nav .r-item').length, over: r.scrollHeight - innerHeight, sub: document.querySelectorAll('#rail details, #rail .nav-sub, #rail .nav-ch').length }; });
  if (u1.n !== 4) bad('U1', `桌機主導覽 ${u1.n} 個入口`);
  if (u1.over > 1) bad('U1', `桌機左欄要捲 ${u1.over}px`);
  if (u1.sub) bad('U1', `左欄還有 ${u1.sub} 個子選單／章節項目`);
  for (const [sec, pages] of Object.entries(PAGES)) {
    // U2：主導覽一下到區塊首頁，分頁列再一下到每一頁
    const navHas = await d.evaluate(h => !!document.querySelector(`#rail .r-item[href="#${h}"]`), HOME[sec]);
    if (!navHas) bad('U2', `主導覽沒有 #${HOME[sec]}`);
    await go(d, HOME[sec]);
    const tabs = await d.evaluate(() => [...document.querySelectorAll('#secTabs .st-tab')].map(a => a.getAttribute('href').slice(1)));
    for (const pg of pages) if (!tabs.some(t => t === pg || (pg.startsWith('subj-') && t.startsWith('subj-')))) bad('U2', `${sec} 分頁列沒有 #${pg}`);
    for (const pg of pages) {
      await go(d, pg, 900);
      const r = await d.evaluate(() => ({ sec: (document.querySelector('#rail .r-item.cur') || {}).dataset?.sec, nCur: document.querySelectorAll('#rail .r-item.cur').length, tab: (document.querySelector('#secTabs .st-tab.cur') || { getAttribute: () => '' }).getAttribute('href'), hidden: document.querySelector('#secTabs').hidden, hs: document.documentElement.scrollWidth > innerWidth + 1 }));
      if (r.nCur !== 1 || r.sec !== sec) bad('U4', `#${pg}：主導覽目前頁標成 ${r.sec}（${r.nCur} 個）`);
      if (!r.hidden && !(r.tab === '#' + pg || (pg.startsWith('subj-') && /^#subj-/.test(r.tab)))) bad('U4', `#${pg}：分頁列目前頁是 ${r.tab}`);
      if (r.hs) bad('U1', `#${pg}：桌機有橫向捲動`);
    }
  }
  // U3：搜尋
  await go(d, 'map');
  await d.keyboard.press('Control+k'); await d.waitForTimeout(200);
  const sp = await d.evaluate(() => !!document.querySelector('.sp-wrap .sp-in') && document.activeElement === document.querySelector('.sp-in'));
  if (!sp) bad('U3', 'Ctrl+K 沒有打開搜尋（或游標不在輸入框）');
  else {
    await d.keyboard.type('堆疊'); await d.waitForTimeout(200);
    const kinds = await d.evaluate(() => [...document.querySelectorAll('.sp-i .sp-k')].map(x => x.textContent));
    if (!kinds.includes('知識點') || !kinds.includes('章節')) bad('U3', `搜尋「堆疊」只找到：${[...new Set(kinds)].join('、') || '沒有'}`);
    const want = await d.evaluate(() => { const li = document.querySelector('.sp-i.on'); return li ? li.textContent : ''; });
    await d.keyboard.press('Enter'); await d.waitForTimeout(800);
    const { h, still } = await d.evaluate(() => ({ h: decodeURIComponent(location.hash), still: !!document.querySelector('.sp-wrap') }));
    if (!want || h === '#map' || still) bad('U3', `Enter 沒有跳到結果（${h}）`);
    await d.keyboard.press('Control+k'); await d.waitForTimeout(150); await d.keyboard.type('錯題'); await d.waitForTimeout(150); await d.keyboard.press('Enter'); await d.waitForTimeout(700);
    if ((await d.evaluate(() => location.hash)) !== '#wrong') bad('U3', '搜尋「錯題」Enter 沒有到錯題本');
  }
  // U7：桌機「下一步」在左欄，不浮在內容上
  await go(d, 'map', 1000);
  const u7 = await d.evaluate(() => { const p = document.querySelector('#goPill'); return p ? { inRail: !!p.closest('#railNext'), pos: getComputedStyle(p).position } : null; });
  if (u7 && (!u7.inRail || u7.pos === 'fixed')) bad('U7', `桌機「下一步」不在左欄（${JSON.stringify(u7)}）`);
  // U5、U6：知識點頁
  const kp = await d.evaluate(() => { const k = KP.ORDER.find(x => !KP.learned(x) && KP.canStart(x) && (S.st.kp[x] || {}).i > 2) || KP.current(); return k; });
  await go(d, 'k/' + encodeURIComponent(kp), 1500);
  const u5 = await d.evaluate(() => {
    const vis = [...document.querySelectorAll('#kpStream .kp-blk')].filter(e => e.offsetParent !== null && !e.closest('details:not([open])'));
    const doneQ = vis.filter(e => e.classList.contains('kp-q') && e.classList.contains('done') && !e.classList.contains('kp-active'));
    const head = document.querySelector('.kp-pad-h'), foot = document.querySelector('#kpFoot');
    return { vis: vis.length, doneQ: doneQ.length, notesInStream: !!document.querySelector('#kpStream .kp-notes, .kp-side .kp-notes'), notesBtn: !!document.querySelector('#kpNotesBtn'), padH: head ? Math.round(head.getBoundingClientRect().height) : -1, footInMain: !!(foot && foot.closest('.kp-main')) };
  });
  if (u5.vis > 3) bad('U5', `${kp}：畫面上展開 ${u5.vis} 塊（應 ≤ 3）`);
  if (u5.doneQ) bad('U5', `${kp}：已作答的題目還展開 ${u5.doneQ} 題`);
  if (u5.notesInStream) bad('U6', `${kp}：考試筆記還在內容裡`);
  if (u5.padH > 52) bad('U6', `${kp}：手寫板工具列高 ${u5.padH}px（不是一行）`);
  if (!u5.footInMain) bad('U6', `${kp}：主按鈕不在內容欄`);
  if (u5.notesBtn) {
    await d.click('#kpNotesBtn'); await d.waitForTimeout(300);
    const dr = await d.evaluate(() => { const x = document.querySelector('#kpDrawer'); return !!(x && !x.hidden && x.querySelector('.kp-drawer-b').textContent.trim().length > 20); });
    if (!dr) bad('U6', `${kp}：按「考試筆記」沒有打開抽屜`);
    await d.keyboard.press('Escape'); await d.waitForTimeout(200);
    if (await d.evaluate(() => !document.querySelector('#kpDrawer').hidden)) bad('U6', `${kp}：Esc 關不掉考試筆記`);
  }
  // 往回看：展開「前面」
  const past = await d.evaluate(() => { const x = document.querySelector('#kpStream .kp-past'); if (!x) return null; x.querySelector('summary').click(); return x.open; });
  if (past === false) bad('U5', `${kp}：「前面」點了沒有展開`);
  // U9：練習作答卡——選項直接點、草稿紙在旁邊、一顆主按鈕；把握度不選也能送
  for (const [pg, tag] of [[d, '桌機'], [null, '']]) {
    if (!pg) break;
    await go(pg, 'practice', 1200);
    if (await pg.locator('#qQuit').count()) { await pg.click('#qQuit'); await pg.waitForTimeout(400); if (await pg.locator('#goNextRec').count()) { await pg.click('#goNextRec'); await pg.waitForTimeout(400); } }
    if (!(await pg.locator('#fhGo').count())) { bad('U9', `${tag}練習頁沒有「開打」`); break; }
    await pg.click('#fhGo'); await pg.waitForTimeout(700);
    if (await pg.locator('#stGo').count()) { await pg.click('#stGo'); await pg.waitForTimeout(700); }
    const r = await pg.evaluate(() => {
      const card = document.querySelector('.pq'), pad = document.querySelector('#pqPad'), q = Practice.getQ(Practice.sess.ids[Practice.sess.i]);
      const prim = [...document.querySelectorAll('#main .btn.primary')].filter(b => b.offsetParent);
      const opts = [...document.querySelectorAll('#ansArea .opt input, #ansArea input.fill-in, #ansArea .fill-pi, #ansArea textarea')].filter(x => !x.disabled);
      const qb = document.querySelector('.pq-q').getBoundingClientRect(), pb = pad ? pad.getBoundingClientRect() : null;
      return { card: !!card, prim: prim.map(b => b.id), opts: opts.length, type: q.type, pad: !!(pad && pad.offsetParent && !pad.classList.contains('shut')), side: pb ? pb.left >= qb.right - 2 : false, old: !!document.querySelector('#paperDone, #toPaper, #toKey'), tabs: !document.querySelector('#secTabs').hidden };
    });
    if (!r.card) bad('U9', `${tag}沒有新的作答卡`);
    if (r.prim.length !== 1 || r.prim[0] !== 'qSubmit') bad('U9', `${tag}主按鈕：${r.prim.join(',') || '沒有'}`);
    if (!r.opts) bad('U9', `${tag}${r.type} 題沒有可以直接作答的輸入`);
    if (!r.pad || !r.side) bad('U9', `${tag}草稿紙沒有在右欄打開（pad ${r.pad}、side ${r.side}）`);
    if (r.old) bad('U9', `${tag}還有舊的紙筆切換／對答案按鈕`);
    if (r.tabs) bad('U9', `${tag}做題中分頁列沒藏起來`);
    const sub = await pg.evaluate(() => { const s = Practice.sess, q = Practice.getQ(s.ids[s.i]); if (q.type === 'single' || q.type === 'multi') document.querySelectorAll('#ansArea .opt input')[q.ans[0]].click(); else if (q.type === 'fill') document.querySelector('#opt-fill').value = String(q.ans[0]); else document.querySelector('#opt-essay').value = 'x'; document.querySelector('#qSubmit').click(); return { st: s.state, conf: (s.results.slice(-1)[0] || {}).conf, next: !!document.querySelector('#qNext, [data-se]') }; });
    if (sub.st !== 'done' || !sub.next) bad('U9', `${tag}沒選把握度按「送出答案」沒有送出（${JSON.stringify(sub)}）`);
    await pg.click('#qQuit'); await pg.waitForTimeout(300);
  }
  if (d._e.length) bad('ERR', '桌機頁面錯誤：' + d._e.slice(0, 3).join(' | '));

  /* ---------- 手機 390×844 ---------- */
  const m = await open(390, 844);
  const m1 = await m.evaluate(() => ({ tabs: [...document.querySelectorAll('#tabbar .t-item')].filter(a => a.offsetParent).length, rail: !!document.querySelector('#rail').offsetParent }));
  if (m1.tabs !== 4) bad('U1', `手機底部分頁列 ${m1.tabs} 個入口`);
  if (m1.rail) bad('U1', '手機還看得到左欄');
  for (const pg of ['map', 'practice', 'me', 'wrong', 'stats']) {
    await go(m, pg, 900);
    const r = await m.evaluate(() => {
      const dock = document.querySelector('#mDock'), tb = document.querySelector('#tabbar');
      scrollTo(0, document.documentElement.scrollHeight); const last = [...document.querySelectorAll('#main > *')].filter(e => e.offsetParent).pop();
      const lim = Math.min(dock && dock.offsetParent && dock.children.length ? dock.getBoundingClientRect().top : innerHeight, tb.getBoundingClientRect().top);
      return { cover: last ? Math.round(last.getBoundingClientRect().bottom - lim) : 0, hs: document.documentElement.scrollWidth > innerWidth + 1, pill: !!document.querySelector('#goPill'), inDock: !!document.querySelector('#mDock #goPill') };
    });
    if (r.cover > 1) bad('U7', `手機 #${pg}：最後一塊內容被底部列蓋住 ${r.cover}px`);
    if (r.pill && !r.inDock) bad('U7', `手機 #${pg}：「下一步」不在底部固定列`);
    if (r.hs) bad('U1', `手機 #${pg}：橫向捲動`);
  }
  await go(m, 'k/' + encodeURIComponent(kp), 1500);
  const mk = await m.evaluate(() => {
    const act = document.querySelector('.kp-active'), pad = document.querySelector('#kpPadBox');
    const reading = act && act.classList.contains('kp-read');
    return { reading, padShown: !!(pad && pad.offsetParent), openBtn: !!(document.querySelector('#kpPadOpen') && document.querySelector('#kpPadOpen').offsetParent), tabbar: !!document.querySelector('#tabbar').offsetParent };
  });
  if (mk.reading && mk.padShown) bad('U6', '手機純閱讀時還掛著手寫板');
  if (mk.reading && !mk.openBtn) bad('U6', '手機純閱讀時沒有「手寫板」按鈕可以叫出來');
  if (mk.tabbar) bad('U6', '手機上課時底部分頁列還在（應進入專心模式）');
  if (mk.reading && mk.openBtn) { await m.click('#kpPadOpen'); await m.waitForTimeout(300); if (!(await m.evaluate(() => !!document.querySelector('#kpPadBox').offsetParent))) bad('U6', '按「手寫板」沒有叫出手寫板'); }
  if (m._e.length) bad('ERR', '手機頁面錯誤：' + m._e.slice(0, 3).join(' | '));

  await b.close();
  const R = ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7', 'U9', 'ERR']; let tot = 0;
  console.log('介面規格 U1–U7、U9');
  for (const r of R) { const v = V[r] || []; tot += v.length; console.log(`${r.padEnd(4)} 違規 ${String(v.length).padStart(3)}`); v.slice(0, 6).forEach(x => console.log('     · ' + x)); if (v.length > 6) console.log(`     … 還有 ${v.length - 6} 條`); }
  console.log(`合計違規 ${tot}`);
  process.exit(tot ? 1 : 0);
})();
