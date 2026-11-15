/* 課程規格驗收測試：模擬一個零基礎、什麼都沒做過的學生（content/課程規格.md 的 A1–A5、H5、H9–H14、H18、H19）
   用法：cd web && python3 -m http.server 8802 &   然後   node tests/beginner_walk.js
   （要用純靜態 server：server.py 會從 bridge/state.json 還原進度，學生就不是「全新」的了）
   參數：WALK=30（A2 走前幾個知識點）  PORT=8802 */
const { chromium } = require('playwright');
const PORT = process.env.PORT || 8802, WALK = +(process.env.WALK || 30), FROM = +(process.env.FROM || 0);   // FROM：前 FROM 個當作已學會，從第 FROM+1 個開始走
const URL = `http://127.0.0.1:${PORT}/index.html`;
const V = {}; const bad = (r, msg) => { (V[r] = V[r] || []).push(msg); };
const A = {};

async function fresh(b, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const pg = await ctx.newPage(); pg._errs = [];
  await pg.addLocatorHandler(pg.getByRole('heading', { name: '開啟提醒？', exact: true }), async () => {
    await pg.getByRole('button', { name: '不用', exact: true }).click();
  });
  pg.on('pageerror', e => pg._errs.push(e.message));
  return pg;
}
const wait = (pg, ms = 160) => pg.waitForTimeout(ms);

/* 目前頁面的主按鈕狀態 */
const goState = pg => pg.evaluate(() => { const b = document.querySelector('#kpGo'); return b ? { t: b.textContent, off: b.disabled, id: b.dataset.act } : null; });

/* 在知識點頁作答（right=true 用正解；false 用錯的） */
async function answer(pg, right) {
  return pg.evaluate(right => {
    const k = decodeURIComponent(location.hash.slice(3)), n = KP.N[k], a = document.querySelector('.kp-active');
    const self = document.querySelector('[data-self="ok"], [data-ew="ok"], [data-qself="ok"]');
    if (self) { self.click(); return 'self'; }
    if (!a) return 'none';
    const paper = () => { const p = document.querySelector('#kpPaper'); if (p && !p.checked) p.click(); };
    if (a.dataset.qid) {
      const q = QBANK.get(a.dataset.qid);
      if (q.type === 'fill') { const i = a.querySelector('.kp-fill'); i.value = right ? q.ans[0] : '@@錯@@'; i.dispatchEvent(new Event('input')); return 'q'; }
      if (q.type === 'essay') { paper(); return 'essay'; }
      const js = right ? q.ans : [[...q.opts.keys()].find(j => !q.ans.includes(j))];
      js.forEach(j => a.querySelector(`.kp-opt[data-j="${j}"]`).click()); return 'q';
    }
    if (a.classList.contains('kp-step') || a.classList.contains('w')) { paper(); return 'paper'; }
    const x = n.items && n.items[+a.dataset.idx];
    if (!x) { paper(); return 'paper'; }
    if (x.t === 'mc') { const js = right ? x.ans : [[...x.opts.keys()].find(j => !x.ans.includes(j))]; js.forEach(j => a.querySelector(`.kp-opt[data-j="${j}"]`).click()); return 'mc'; }
    if (x.t === 'fill') { const i = a.querySelector('.kp-fill'); i.value = right ? x.ans[0] : '@@錯@@'; i.dispatchEvent(new Event('input')); return 'fill'; }
    if (x.t === 'order') { const pool = [...a.querySelectorAll('.kp-pool-i')]; const order = right ? pool.map(p => +p.dataset.j).sort((p, q) => p - q) : pool.map(p => +p.dataset.j).sort((p, q) => q - p); (async () => { })(); window.__ord = order; return 'order'; }
    if (x.t === 'write') { paper(); return 'write'; }
    return 'other';
  }, right);
}
async function doOrder(pg) {
  for (let i = 0; i < 20; i++) {
    const ok = await pg.evaluate(() => { const o = window.__ord || []; const j = o.shift(); if (j == null) return false; const b = document.querySelector(`.kp-active .kp-pool-i[data-j="${j}"]`); if (!b) return false; b.click(); return true; });
    if (!ok) break; await wait(pg, 60);
  }
}

/* 每一步都檢查的規則 */
async function stepChecks(pg, k, wide) {
  const r = await pg.evaluate(({ k, wide }) => {
    const out = {};
    const art = document.querySelector('article.kp');
    out.primary = art ? [...document.querySelectorAll('main .btn.primary')].filter(b => b.offsetParent !== null).length : -1;
    out.goPill = !!document.querySelector('#goPill');
    // H5：畫面上的練習題，主知識點＝目前節點，而且它的先修都學會了
    out.h5 = [...document.querySelectorAll('.kp-q[data-qid]')].map(el => { const q = QBANK.get(el.dataset.qid); return q.kp === k ? null : `${q.id} 主知識點是 ${q.kp}`; }).filter(Boolean);
    out.preOK = (KP.N[k].pre || []).every(KP.learned);
    // H18：講解、題目、手寫板同一頁；寬螢幕左右並排、手機上下
    const pad = document.querySelector('#kpPadBox'), act = document.querySelector('.kp-active'), main = document.querySelector('.kp-main');
    out.pad = !!(pad && document.body.contains(pad));
    if (pad && act && main && wide) { const a = main.getBoundingClientRect(), p = pad.getBoundingClientRect(); out.side = p.left >= a.right - 2; }
    if (pad && act && !wide && pad.offsetParent) { const a = act.getBoundingClientRect(), p = pad.getBoundingClientRect(); out.stack = p.top >= a.top - 2; }   // U6（2026-11-14）：手機純閱讀時手寫板整塊不掛（要作答時一定打開，由 I12 檢查）
    // H7（畫面上）：教學區連續純閱讀不超過 250 字
    const blks = [...document.querySelectorAll('[data-sec="teach"] .kp-blk')]; let run = 0, worst = 0;
    const txt = el => { const c = el.cloneNode(true); c.querySelectorAll('.katex-mathml, svg, .fig, figure').forEach(x => x.remove()); return c.textContent.replace(/\s/g, ''); };   // KaTeX 會把公式存兩份（MathML＋畫面），只算畫面那份；配圖（figure，含圖說）照規格不算閱讀字數
    for (const b of blks) { if (b.classList.contains('kp-q')) { run = 0; continue; } if (b.classList.contains('kp-read')) { run += txt(b).length; worst = Math.max(worst, run); } }
    out.read = worst;
    out.hscroll = document.documentElement.scrollWidth > innerWidth + 1;
    const g = document.querySelector('#kpGo'); if (g) { const r = g.getBoundingClientRect(); out.goVis = r.bottom <= innerHeight + 1 && r.top >= 0 && r.width > 40; }
    return out;
  }, { k, wide });
  if (r.primary !== 1) bad('H14', `${k}：主按鈕 ${r.primary} 個`);
  if (r.goPill) bad('H14', `${k}：多一顆浮動「下一步」`);
  r.h5.forEach(m => bad('H5', `${k}：${m}`));
  if (!r.preOK) bad('H12', `${k}：先修還沒學會就能上`);
  if (!r.pad) bad('H18', `${k}：沒有手寫板`);
  if (wide && r.side === false) bad('H18', `${k}：寬螢幕手寫板沒有在右邊`);
  if (!wide && r.stack === false) bad('H18', `${k}：手機手寫板不在題目下面`);
  if (r.read > 300 && !(V.H7 || []).some(m => m.startsWith(k + '：'))) bad('H7', `${k}：畫面上連續純閱讀 ${r.read} 字`);   // 畫面字數含公式排版，放寬到 300；原文 250 字由 check.py 管
  if (r.hscroll) bad('A5', `${k}：有橫向捲動`);
  if (r.goVis === false) bad('A5', `${k}：主按鈕不在畫面內`);
}

/* ---------- 互動規格 I5–I14 ---------- */
let enterMc = false, enterFill = false, strokeTests = 0;
/* I11：在手寫板上畫一條橫線，量墨跡跟指標差多少（只看這一筆新增的像素） */
async function strokeTest(pg, fx0 = .2, fx1 = .8, fy = .5) {
  await pg.evaluate(() => { const p = document.querySelector('#kpPadBox'); if (p && p.classList.contains('kp-code-on')) { const b = p.querySelector('[data-pm="ink"]'); if (b) b.click(); } });   // 打字模式時先切回手寫再量
  const geo = await pg.evaluate(() => { const c = document.querySelector('#kpPadBox canvas.kp-pad'); if (!c || !c.offsetParent) return null; c.scrollIntoView({ block: 'nearest' }); const r = c.getBoundingClientRect(); return { x: r.left + c.clientLeft, y: r.top + c.clientTop, w: c.clientWidth, h: c.clientHeight }; });
  if (!geo || geo.w < 10) return null;
  await pg.evaluate(() => { const c = document.querySelector('#kpPadBox canvas.kp-pad'); window.__padBefore = c.getContext('2d').getImageData(0, 0, c.width, c.height).data.slice(); });
  const X0 = geo.x + geo.w * fx0, X1 = geo.x + geo.w * fx1, Y = geo.y + geo.h * fy;
  await pg.mouse.move(X0, Y); await pg.mouse.down();
  for (let i = 1; i <= 24; i++) await pg.mouse.move(X0 + (X1 - X0) * i / 24, Y);
  await pg.mouse.up();
  const ink = await pg.evaluate(() => {
    const c = document.querySelector('#kpPadBox canvas.kp-pad'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, b = window.__padBefore;
    if (!b || b.length !== d.length) return { resized: true };
    let L = 1e9, R = -1, T = 1e9, B = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4 + 3; if (d[i] > 40 && b[i] <= 40) { if (x < L) L = x; if (x > R) R = x; if (y < T) T = y; if (y > B) B = y; } }
    if (R < 0) return { none: true };
    const sx = c.clientWidth / c.width, sy = c.clientHeight / c.height;
    return { L: L * sx, R: (R + 1) * sx, cy: (T + B + 1) / 2 * sy };
  });
  if (!ink || ink.none || ink.resized) return { err: ink ? (ink.none ? '畫了沒有墨跡' : '畫的時候畫布被重設') : '量不到' };
  const lw = 3;   // 筆寬一半左右
  return { dl: Math.abs(ink.L - (X0 - geo.x - lw / 2)), dr: Math.abs(ink.R - (X1 - geo.x + lw / 2)), dy: Math.abs(ink.cy - (Y - geo.y)) };
}
function checkStroke(k, where, r) {
  if (!r) { bad('I11', `${k}：${where}量不到手寫板`); return; }
  if (r.err) { bad('I11', `${k}：${where}${r.err}`); return; }
  const m = Math.max(r.dl, r.dr, r.dy);
  if (m > 3) bad('I11', `${k}：${where}筆跡偏了 ${m.toFixed(1)}px（左 ${r.dl.toFixed(1)}、右 ${r.dr.toFixed(1)}、上下 ${r.dy.toFixed(1)}）`);
}
async function interChecks(pg, k, wide, st) {
  const r = await pg.evaluate(() => {
    const a = document.querySelector('.kp-active'); if (!a) return null;
    const isQ = a.classList.contains('kp-q') && !a.classList.contains('done') && !a.querySelector('.kp-fb.good, .kp-fb.bad');
    const wStep = a.classList.contains('kp-step') && a.classList.contains('w');
    const wQ = a.classList.contains('kp-q') && !!a.querySelector('.kp-do');
    return { isQ, wStep, wQ, leak: (wStep && !!a.querySelector('.prose')) || (wQ && !!a.querySelector('.kp-model')), self: !!document.querySelector('[data-self], [data-ew], [data-qself]') };
  });
  if (!r) return;
  if ((r.isQ || r.wStep) && !st.off && !r.self) bad('I5', `${k}：還沒作答，主按鈕就能按（${st.t}）`);
  if (r.leak) bad('I5', `${k}：還沒寫，答案就出現在畫面上`);
  // I12：有題目要作答，手寫板就是打開的；寬螢幕一直打開
  if (r.isQ || r.wStep || r.wQ || wide) {
    const o = await pg.evaluate(() => { const p = document.querySelector('#kpPadBox'), c = p && (p.classList.contains('kp-code-on') ? p.querySelector('textarea.kp-code') : p.querySelector('canvas.kp-pad')); return { has: !!p, open: !!(p && !p.classList.contains('kp-pad-quiet') && c && c.offsetParent), h: c ? c.getBoundingClientRect().height : 0 }; });   // 寫程式的步驟會切到打字框，打字框打開也算
    if (!o.open) bad('I12', `${k}：${r.isQ || r.wStep || r.wQ ? '要作答' : '寬螢幕'}的時候手寫板沒有打開`);
    else if (o.h < (wide ? 420 : 300) - 1) bad('I13', `${k}：手寫板只有 ${Math.round(o.h)}px 高`);
  }
  // I13：字級與按鈕大小
  {
    const z = await pg.evaluate(() => { const a = document.querySelector('.kp-active'); const pr = a && (a.querySelector('.prose') || a); const fs = pr ? parseFloat(getComputedStyle(pr).fontSize) : 99; const sm = [...document.querySelectorAll('.kp-active .kp-opt, .kp-active .kp-pool-i, #kpGo')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 48).map(e => (e.textContent || e.id).trim().slice(0, 10)); return { fs, sm }; });
    if (z.fs < 17) bad('I13', `${k}：內文字只有 ${z.fs}px`);
    z.sm.forEach(t => bad('I13', `${k}：「${t}」高度不到 48px`));
  }
  if (r.wStep || r.wQ) {
    await wait(pg, 750);
    const v = await pg.evaluate(() => { const p = document.querySelector('#kpPadBox'), f = document.querySelector('#kpFoot'); if (!p) return { none: true }; const b = p.getBoundingClientRect(), fh = f ? f.getBoundingClientRect().height : 0; return { top: b.top, bot: b.bottom, room: innerHeight - (innerWidth < 1180 ? fh : 0), sy: scrollY, max: document.documentElement.scrollHeight - innerHeight, fh }; });
    if (process.env.DBG && !v.none && v.bot > v.room + 1) console.log('DBG', k, JSON.stringify(v), JSON.stringify(await pg.evaluate(async () => { const p = document.querySelector('#kpPadBox'), cv = p.querySelector('canvas'), a = document.querySelector('.kp-active'); const o = { cv: cv.getBoundingClientRect().height, css: cv.style.height, cls: p.className, after: a.nextElementSibling === p, padH: p.getBoundingClientRect().height, sb: getComputedStyle(document.documentElement).scrollBehavior, ac: a.className, sc: KP._v._scroll, now: Math.round(performance.now()), st: Math.round(document.querySelector('#kpStream').getBoundingClientRect().top + scrollY) }; KP._v.reveal(true, true); await new Promise(r => setTimeout(r, 100)); o.after2 = p.getBoundingClientRect().bottom; o.rv = (window.__rv || []).slice(-4); return o; })));
    if (v.none) bad('I7', `${k}：要寫的時候沒有手寫板`);
    else if (v.top < -1 || v.bot > v.room + 1) bad('I7', `${k}：要寫的時候手寫板不在畫面內（${Math.round(v.top)}–${Math.round(v.bot)}，可見到 ${Math.round(v.room)}；捲到 ${Math.round(v.sy)}/${Math.round(v.max)}）`);
    // I11：真的在上面寫一筆（也等於學生寫了，主按鈕應該就能按）
    if (strokeTests < 40) { strokeTests++; checkStroke(k, wide ? '寬螢幕' : '手機', await strokeTest(pg, .15 + .1 * (strokeTests % 3), .7, .3 + .1 * (strokeTests % 4))); }
  }
  if (!wide) {
    const small = await pg.evaluate(() => [...document.querySelectorAll('.kp-active .kp-opt, .kp-active .kp-pool-i, [data-self], [data-ew], [data-qself], #kpGo')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 40).map(e => (e.textContent || e.id).trim().slice(0, 12)));
    small.forEach(t => bad('I9', `${k}：「${t}」高度不到 40px`));
  }
}
/* 送出並計時（I6）；需要時改用 Enter（I10） */
async function submit(pg, k, st) {
  const kind = await pg.evaluate(() => { const a = document.querySelector('.kp-active'); if (!a) return ''; return a.querySelector('.kp-fill:not([disabled])') ? 'fill' : a.querySelector('.kp-opt.on') ? 'mc' : ''; });
  if ((kind === 'mc' && !enterMc) || (kind === 'fill' && !enterFill)) {
    await pg.evaluate(kind => { const a = document.querySelector('.kp-active'); (kind === 'fill' ? a.querySelector('.kp-fill') : a.querySelector('.kp-opt.on')).focus(); }, kind);
    const key = await pg.evaluate(() => { const a = document.querySelector('.kp-active'); return a.dataset.idx || a.dataset.qid; });
    await pg.keyboard.press('Enter'); await wait(pg, 120);
    const ok = await pg.evaluate(key => { const a = document.querySelector(`.kp-q[data-idx="${key}"], .kp-q[data-qid="${key}"]`); return !!(a && a.querySelector('.kp-fb')); }, key);
    if (!ok) bad('I10', `${k}：${kind === 'mc' ? '選好選項' : '填好答案'}按 Enter 沒有送出`);
    if (kind === 'mc') enterMc = true; else enterFill = true;
    return;
  }
  const r = await pg.evaluate(() => {
    const a = document.querySelector('.kp-active'), key = a && (a.dataset.idx || a.dataset.qid), h0 = location.hash, t0 = performance.now();
    document.querySelector('#kpGo').click();
    const b = document.querySelector(`.kp-q[data-idx="${key}"], .kp-q[data-qid="${key}"]`);
    return { ms: performance.now() - t0, fb: !!(b && b.querySelector('.kp-fb')), same: location.hash === h0, st: !!(b && /\bis-(ok|no|try)\b/.test(b.className)), hit: !!(b && /\bkp-hit-(ok|bad)\b/.test(b.className)), prac: !!(b && b.dataset.qid) };
  });
  if (r.fb && !r.st) bad('I14', `${k}：送出後題框沒有變色`);
  if (r.fb && !r.hit) bad('I14', `${k}：送出後題框沒有動一下`);
  if (r.prac) { const sk = await pg.evaluate(() => { const s = KP.view ? null : null; const k = decodeURIComponent(location.hash.slice(3)); const a = ((S.st.kp || {})[k] || {}).att || []; let n = 0; for (let i = a.length - 1; i >= 0 && a[i].ok; i--) n++; return { n, shown: !!document.querySelector('.kp-streak') }; }); if (sk.n >= 2 && !sk.shown) bad('I14', `${k}：連對 ${sk.n} 題沒有顯示`); }
  if (!r.fb) bad('I6', `${k}：送出後同一題框裡沒有回饋`);
  else if (r.ms > 500) bad('I6', `${k}：回饋花了 ${Math.round(r.ms)} 毫秒`);
  if (!r.same) bad('I6', `${k}：送出後換頁了`);
  await wait(pg);
}

/* 走完一個知識點；firstWrong：第一題故意先答錯（檢查 H9） */
async function walkKP(pg, k, wide, firstWrong) {
  await pg.evaluate(k => { location.hash = KP.href(k); }, k); await wait(pg, 400);
  if (process.env.DBG) await pg.evaluate(() => { const V = KP._v; if (V.__h) return; V.__h = 1; const r0 = V.reveal.bind(V); V.reveal = function (i, p) { const pe = document.querySelector('#kpPadBox'); const b0 = pe ? pe.getBoundingClientRect().bottom : -1, s0 = scrollY; r0(i, p); (window.__rv = window.__rv || []).push({ t: Math.round(performance.now()), i: !!i, p: !!p, b0: Math.round(b0), s0, s1: scrollY, st: Math.round(document.querySelector('#kpStream').getBoundingClientRect().top + scrollY) }); }; });
  let wrongDone = !firstWrong, guard = 0, logs0 = await pg.evaluate(() => (S.day().kp || []).length), inter = 0;
  await stepChecks(pg, k, wide);
  while (guard++ < 160) {
    let st = await goState(pg); if (!st) { bad('A2', `${k}：沒有主按鈕`); return false; }
    if (['goto', 'home', 'map'].includes(st.id)) break;
    await interChecks(pg, k, wide, st);
    if (st.off) {
      // H9：第一次故意答錯 → 要看到提示、而且可以再答；第二次再錯 → 要看到正解
      const isQ = await pg.evaluate(() => { const a = document.querySelector('.kp-active'); if (!a || !a.classList.contains('kp-q')) return false; if (a.dataset.qid) { const q = QBANK.get(a.dataset.qid); return q.type !== 'essay'; } const k = decodeURIComponent(location.hash.slice(3)); const x = KP.N[k].items[+a.dataset.idx]; return x && (x.t === 'mc' || x.t === 'fill'); });
      if (!wrongDone && isQ) {
        await answer(pg, false); await wait(pg, 80); await pg.click('#kpGo'); await wait(pg);
        const h = await pg.evaluate(() => { const fb = document.querySelector('.kp-active .kp-fb'); return fb ? fb.className + '|' + fb.textContent : ''; });
        if (!/hint/.test(h)) bad('H9', `${k}：第一次答錯沒有提示（${h.slice(0, 40)}）`);
        await answer(pg, false); await wait(pg, 80); st = await goState(pg);
        if (st.off) bad('H9', `${k}：答錯後不能再答一次`);
        await pg.click('#kpGo'); await wait(pg);
        const h2 = await pg.evaluate(() => { const fb = [...document.querySelectorAll('.kp-fb')].pop(); return fb ? fb.className + '|' + fb.textContent : ''; });
        if (!/bad/.test(h2) || !/正解|如上/.test(h2)) bad('H9', `${k}：第二次答錯沒有給正解`);
        wrongDone = true; inter += 2; continue;
      }
      const did = await answer(pg, true); if (did === 'order') await doOrder(pg);
      await wait(pg, 80); st = await goState(pg);
      if (st.off) { const p = await pg.evaluate(() => { const x = document.querySelector('#kpPaper'); if (x && !x.checked) { x.click(); return true; } return false; }); if (p) { await wait(pg, 60); st = await goState(pg); } }
      if (st.off) { bad('A2', `${k}：卡住了（${st.t}）`); return false; }
      if (did !== 'self') inter++;
    }
    if (['submit', 'q-submit'].includes(st.id)) await submit(pg, k, st);
    else { await pg.click('#kpGo'); await wait(pg); }
    await stepChecks(pg, k, wide);
  }
  const ok = await pg.evaluate(k => KP.learned(k), k);
  if (!ok) bad('A2', `${k}：走完沒有學會`);
  const logs1 = await pg.evaluate(() => (S.day().kp || []).length);
  if (logs1 - logs0 < inter) bad('H19', `${k}：互動 ${inter} 次，紀錄只有 ${logs1 - logs0} 筆`);
  return ok;
}

(async () => {
  const b = await chromium.launch();
  /* ---------- A4：一個點都沒學 ---------- */
  {
    const pg = await fresh(b, 1280, 800);
    await pg.goto(URL + '#go'); await wait(pg, 900);
    const r = await pg.evaluate(() => ({ cards: Learn.newCards().length, due: Learn.cardDue().length, pick: !!Learn.pick(new Set()), rev: S.dueReviews().length, M: KP.M().length }));
    A.A4 = !r.cards && !r.due && !r.pick && !r.rev && !r.M;
    if (!A.A4) bad('A4', JSON.stringify(r));
    // H12：直接打開後面的知識點 → 鎖住，主按鈕帶回目前進度
    await pg.evaluate(() => { location.hash = KP.href(KP.ORDER[40]); }); await wait(pg, 400);
    const lk = await pg.evaluate(() => ({ lock: !!document.querySelector('.kp-lock'), q: document.querySelectorAll('.kp-q').length, go: (document.querySelector('#kpGo') || {}).dataset.act }));
    if (!lk.lock || lk.q || lk.go !== 'goto') bad('H12', `先修沒學會的知識點沒有鎖住：${JSON.stringify(lk)}`);
    if (pg._errs.length) bad('A4', '頁面錯誤：' + pg._errs.join(' | '));
    await pg.close();
  }
  /* ---------- A1 ＋ A2（手機 390 寬，再用 1440 寬抽查） ---------- */
  for (const [w, h, n] of [[390, 844, WALK], [1440, 900, 3]]) {
    const wide = w >= 1180, pg = await fresh(b, w, h);
    await pg.goto(URL + '#go'); await wait(pg, 900);
    // 開始前設定：用預設值按開始
    const t0 = Date.now();
    const ob = await pg.evaluate(() => { const b = document.querySelector('#obGo, #obStart, [data-ob="go"]'); return b ? b.id || 'btn' : null; });
    if (ob) { await pg.click('#' + ob); await wait(pg, 500); } else await pg.evaluate(() => { S.st.onboarded = true; S.save(); route(); });
    await wait(pg, 300);
    const first = await pg.evaluate(() => { const c = Auto.current(); return c ? c.id : null; });
    if (w === 390) {
      if (!first || !first.startsWith('kp:')) bad('A1', `第一步是 ${first}，不是上課`);
      const go = await pg.$('#goNow'); if (go) { await go.click(); await wait(pg, 500); }
      const fk = await pg.evaluate(() => ({ h: location.hash, first: (document.querySelector('#kpStream .kp-blk') || {}).className || '' }));
      if (!/^#k\//.test(fk.h) || !/kp-read/.test(fk.first)) bad('A1', `按開始後不是知識點的「教」：${JSON.stringify(fk)}`);
      if (Date.now() - t0 > 30000) bad('A1', '超過 30 秒');
      A.A1 = !(V.A1 || []).length;
      // H14：從課程地圖 1 次點擊回到目前節點
      await pg.evaluate(() => { location.hash = '#map'; }); await wait(pg, 300);
      const back = await pg.evaluate(() => !!document.querySelector(`main a[href="${KP.href(KP.current())}"]`));
      if (!back) bad('H14', '課程地圖沒有直接回到目前知識點的連結');
    }
    const order = await pg.evaluate(() => KP.ORDER);
    const from = w === 390 ? FROM : 0;
    if (from) await pg.evaluate(f => { const y = D.add(D.today(), -3); KP.ORDER.slice(0, f).forEach(k => { (S.st.kp = S.st.kp || {})[k] = { done: y, stage: 'done', att: [], res: {}, i: 999 }; }); S.save(); }, from);
    for (let i = from; i < Math.min(n, order.length); i++) {
      const ok = await walkKP(pg, order[i], wide, i % 3 === 0);
      if (!ok) break;
    }
    if (pg._errs.length) bad('A2', `${w}px 頁面錯誤：` + [...new Set(pg._errs)].slice(0, 4).join(' | '));
    if (w === 390) {
      A.A2 = !['A2', 'H5', 'H7', 'H9', 'H14'].some(r => (V[r] || []).length);
      /* ---------- H10：學過的才會出 ---------- */
      const h10 = await pg.evaluate(() => {
        const M = new Set(KP.M()), out = [];
        Learn.newCards().forEach(c => { if (c.kp && !M.has(c.kp)) out.push('卡片 ' + c.id); });
        for (let i = 0; i < 40; i++) { const p = Learn.pick(new Set()); if (p && p.q && p.q.kp && !M.has(p.q.kp)) out.push('練習 ' + p.id); }
        return out;
      });
      h10.forEach(m => bad('H10', m));
      /* ---------- A3：隔天 ---------- */
      const a3 = await pg.evaluate(() => {
        const y = D.today(), done = (S.st.log[y] || {}).kpDone || [], tmr = D.add(y, 1);
        D.today = () => tmr; S.st.auto = null;
        const ids = Auto.plan(true), first = ids[0], rec = Auto.learnedOn(D.add(D.today(), -1));
        return { first, done, rec, ids };
      });
      const same = a3.done.length === a3.rec.length && a3.done.every(x => a3.rec.includes(x));
      if (a3.first !== 'blurt') bad('A3', `隔天第一件事是 ${a3.first}，不是回想`);
      if (!same) bad('H11', `回想的點 ${a3.rec.length} 個 ≠ 昨天學會的 ${a3.done.length} 個`);
      // 回想的題目只能出自昨天學會的點
      await pg.evaluate(() => { blurtDialog(); }); await wait(pg, 300);
      await pg.click('.modal [data-ok]'); await wait(pg, 400);
      const rq = await pg.evaluate(() => (Practice.sess ? Practice.sess.ids : []).map(id => (QBANK.get(id) || {}).kp));
      const yset = new Set(a3.done); rq.forEach(k => { if (!yset.has(k)) bad('H11', `回想出了別的知識點的題目：${k}`); });
      if (!rq.length && a3.done.some(k => 1)) bad('A3', '回想沒有出任何題目');
      A.A3 = !(V.A3 || []).length && !(V.H11 || []).length;
    }
    await pg.close();
  }
  /* ---------- I11：手寫板換位置、收起再打開、改視窗大小、放大之後，筆跡還是對準 ---------- */
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const pg = await fresh(b, w, h);
    await pg.goto(URL + '#go'); await wait(pg, 800);
    const k = await pg.evaluate(() => { S.st.onboarded = true; const O = KP.ORDER; O.slice(0, 1).forEach(x => { (S.st.kp = S.st.kp || {})[x] = { done: D.today(), stage: 'done', att: [], res: {}, i: 999 }; }); const k = O[1]; (S.st.kp[k] = { stage: 'ex', ex: 0, es: 0, i: 999, res: {}, ew: {}, att: [] }); S.save(); return k; });
    await pg.evaluate(k => { location.hash = KP.href(k); }, k); await wait(pg, 700);
    const tag = `${w}px 例題`;
    checkStroke(k, tag + '：', await strokeTest(pg));
    await pg.click('#kpPadBox .kp-pad-t'); await wait(pg, 200); await pg.click('#kpPadBox .kp-pad-t'); await wait(pg, 300);
    checkStroke(k, tag + '收起再打開後：', await strokeTest(pg, .3, .6, .7));
    await pg.setViewportSize({ width: w === 390 ? 430 : 1200, height: h }); await wait(pg, 500);
    checkStroke(k, tag + '改視窗大小後：', await strokeTest(pg, .25, .75, .4));
    await pg.click('#kpPadBox [data-pt="full"]'); await wait(pg, 400);
    const fh = await pg.evaluate(() => document.querySelector('#kpPadBox canvas.kp-pad').getBoundingClientRect().height);
    if (fh < h * .5) bad('I12', `${tag}：按「放大」之後手寫板只有 ${Math.round(fh)}px`);
    checkStroke(k, tag + '放大後：', await strokeTest(pg, .1, .9, .5));
    const go = await pg.evaluate(() => { const g = document.querySelector('#kpGo').getBoundingClientRect(); return g.bottom <= innerHeight + 1 && g.top >= 0; });
    if (!go) bad('I12', `${tag}：放大時主按鈕被擋住`);
    if (pg._errs.length) bad('I11', `${w}px 頁面錯誤：` + [...new Set(pg._errs)].slice(0, 3).join(' | '));
    await pg.close();
  }
  /* ---------- A5：每個知識點頁在 390 與 1440 寬 ---------- */
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const pg = await fresh(b, w, h);
    await pg.goto(URL + '#go'); await wait(pg, 800);
    await pg.evaluate(() => { S.st.onboarded = true; for (const k of KP.ORDER) (S.st.kp = S.st.kp || {})[k] = { done: '2026-11-01', stage: 'done', att: [], res: {}, i: 999 }; S.save(); });
    const ks = await pg.evaluate(() => KP.ORDER);
    for (const k of ks) {
      await pg.evaluate(k => { location.hash = KP.href(k); }, k); await wait(pg, 120);
      const r = await pg.evaluate(() => { const g = document.querySelector('#kpGo'); const rr = g && g.getBoundingClientRect(); return { hs: document.documentElement.scrollWidth > innerWidth + 1, vis: !!(rr && rr.bottom <= innerHeight + 1 && rr.width > 40) }; });
      if (r.hs) bad('A5', `${w}px ${k}：橫向捲動`);
      if (!r.vis) bad('A5', `${w}px ${k}：主按鈕看不到`);
    }
    if (pg._errs.length) bad('A5', `${w}px 頁面錯誤：` + [...new Set(pg._errs)].slice(0, 3).join(' | '));
    await pg.close();
  }
  A.A5 = !(V.A5 || []).length;
  await b.close();
  /* ---------- 報告 ---------- */
  const R = ['H5', 'H9', 'H10', 'H11', 'H12', 'H14', 'H18', 'H19', 'H7', 'I5', 'I6', 'I7', 'I9', 'I10', 'I11', 'I12', 'I13', 'I14'];
  console.log('驗收測試（模擬零基礎學生）');
  for (const a of ['A1', 'A2', 'A3', 'A4', 'A5']) {
    console.log(`${a}  ${A[a] ? '通過' : '沒過'}`);
    (V[a] || []).slice(0, 4).forEach(m => console.log('     ·', m)); if ((V[a] || []).length > 4) console.log(`     … 還有 ${(V[a] || []).length - 4} 條`);
  }
  console.log();
  for (const r of R) { const v = V[r] || []; console.log(`${r.padEnd(4)} 違規 ${String(v.length).padStart(3)}`); v.slice(0, 3).forEach(m => console.log('     ·', m)); if (v.length > 3) console.log(`     … 還有 ${v.length - 3} 條`); }
  const pass = ['A1', 'A2', 'A3', 'A4', 'A5'].filter(a => A[a]).length, tot = R.reduce((t, r) => t + (V[r] || []).length, 0);
  console.log(`\n測試 ${pass}/5，H 規則違規 ${tot}`);
  require('fs').writeFileSync(require('path').join(__dirname, 'beginner_walk_report.json'), JSON.stringify({ date: new Date().toISOString(), A, V }, null, 1));
  process.exit(pass === 5 && !tot ? 0 : 1);
})();
