/* 資工所衝刺站 — 獎勵：經驗值／等級、金幣、寶箱、連勝凍結卡、成就、真實獎勵兌換
   經驗值由學習紀錄即時推算（不會重複計、匯入資料也算得回來）；金幣 = XP/10 ＋ 寶箱與成就 − 已兌換。 */
'use strict';

const RW_TITLES = [[1, 'Hello World'], [3, '指標不再迷路'], [5, '遞迴會停'], [8, 'Big-O 直覺'], [12, 'DP 填表人'], [16, 'Cache 命中'], [20, '死結終結者'], [25, 'Rank 看穿'], [30, '歸約大師'], [36, '上榜體質'], [42, '台大資工']];
const RW_SHOP = [
  { id: 'tea', ic: '🧋', name: '手搖飲', price: 80 },
  { id: 'ep', ic: '📺', name: '看一集劇', price: 120 },
  { id: 'game', ic: '🎮', name: '打一小時遊戲', price: 200 },
  { id: 'sleep', ic: '😴', name: '睡到自然醒', price: 300 },
  { id: 'feast', ic: '🍖', name: '吃大餐', price: 800 },
  { id: 'off', ic: '🏖️', name: '放半天假', price: 1000 },
];
const RW_FREEZE = 150, RW_FREEZE_MAX = 2;
const RW_XP = { ok: 10, bad: 4, card: 2, min: 1, full: 100, min_ci: 30, blurt: 20, mock: 150, read: 50, sub: 40, pass: 80, self: 20, clip: 5 };
const ACH = [
  { id: 'q1', ic: '🐣', name: '第一題', need: '做 1 題', c: 10, t: s => s.q >= 1 },
  { id: 'q100', ic: '💯', name: '百題斬', need: '做 100 題', c: 50, t: s => s.q >= 100 },
  { id: 'q500', ic: '⚔️', name: '五百題', need: '做 500 題', c: 100, t: s => s.q >= 500 },
  { id: 'q1000', ic: '🏯', name: '千題塔', need: '做 1000 題', c: 200, t: s => s.q >= 1000 },
  { id: 'cd100', ic: '🃏', name: '百卡', need: '複習 100 張卡', c: 40, t: s => s.cards >= 100 },
  { id: 'cd1000', ic: '🧠', name: '記憶宮殿', need: '複習 1000 張卡', c: 150, t: s => s.cards >= 1000 },
  { id: 'rd1', ic: '📖', name: '開卷', need: '讀完 1 章', c: 20, t: s => s.read >= 1 },
  { id: 'subj', ic: '✨', name: '一科到底', need: '讀完一整科', c: 100, t: s => s.subjDone },
  { id: 'rd21', ic: '📚', name: '半程', need: '讀完 21 章', c: 150, t: s => s.read >= 21 },
  { id: 'rd42', ic: '🏁', name: '全書制霸', need: '讀完 42 章', c: 300, t: s => s.read >= 42 },
  { id: 'fy1', ic: '🗣️', name: '開口講', need: '交 1 次費曼', c: 30, t: s => s.sub >= 1 },
  { id: 'ps1', ic: '✅', name: '講得清楚', need: '費曼通過 1 章', c: 50, t: s => s.pass >= 1 },
  { id: 'ps10', ic: '🎓', name: '費曼十連', need: '費曼通過 10 章', c: 200, t: s => s.pass >= 10 },
  { id: 'st3', ic: '🔥', name: '三日不斷', need: '連續 3 天', c: 30, t: s => s.best >= 3 },
  { id: 'st7', ic: '🔥', name: '一週不斷', need: '連續 7 天', c: 80, t: s => s.best >= 7 },
  { id: 'st14', ic: '☄️', name: '兩週不斷', need: '連續 14 天', c: 150, t: s => s.best >= 14 },
  { id: 'st30', ic: '🌋', name: '一個月', need: '連續 30 天', c: 300, t: s => s.best >= 30 },
  { id: 'pf', ic: '🌟', name: '完美一天', need: '當天全部完成', c: 50, t: s => s.full >= 1 },
  { id: 'h10', ic: '⏳', name: '十小時', need: '累計專注 10 小時', c: 40, t: s => s.min >= 600 },
  { id: 'h100', ic: '🕰️', name: '百小時', need: '累計專注 100 小時', c: 300, t: s => s.min >= 6000 },
  { id: 'mk1', ic: '⏱️', name: '上考場', need: '完成 1 場模考', c: 50, t: s => s.mocks >= 1 },
  { id: 'clip', ic: '🎬', name: '影片全收', need: '看完全部短片', c: 50, t: s => s.clipsAll },
  { id: 'lv10', ic: '🪜', name: 'Lv 10', need: '升到 10 級', c: 100, t: s => s.lvl >= 10 },
  { id: 'sr1', ic: '⭐', name: '第一顆星', need: '闖關拿到 1 顆星', c: 10, t: s => s.stars >= 1 },
  { id: 'sr10', ic: '🌠', name: '十顆星', need: '闖關拿到 10 顆星', c: 60, t: s => s.stars >= 10 },
  { id: 'sr30', ic: '🌌', name: '星海', need: '闖關拿到 30 顆星', c: 150, t: s => s.stars >= 30 },
  { id: 'sr3c', ic: '👹', name: '打倒魔王', need: '一章拿滿 3 顆星', c: 40, t: s => s.star3 >= 1 },
  { id: 'srsub', ic: '👑', name: '一科稱王', need: '一整科每章都 3 顆星', c: 300, t: s => s.starSubj },
];

const Rewards = {
  st() {
    const r = S.st.rw || (S.st.rw = { init: 0, xp0: null, lvl: null, bonus: 0, spent: 0, chests: [], freezes: 0, ach: {}, steps: {}, redeem: [], best: 0, shop: null, agent: [] });
    if (!r.shop) r.shop = RW_SHOP.map(x => Object.assign({}, x));
    return r;
  },
  totals() {
    const t = { q: 0, c: 0, cards: 0, min: 0, full: 0, ci: 0, blurt: 0, mocks: 0, read: 0, sub: 0, pass: 0, self: 0, clips: Object.keys(S.st.clipSeen || {}).length };
    for (const L of Object.values(S.st.log)) {
      t.q += L.q || 0; t.c += L.c || 0; t.cards += L.cards || 0; t.min += L.min || 0; t.mocks += (L.mocks || []).length; if (L.blurt) t.blurt++;
      if (L.checkin) { if (L.checkin.full) t.full++; else if (L.checkin.min) t.ci++; }
    }
    for (const ls of Object.values(S.st.lessons)) {
      if (ls.read) t.read++;
      if (ls.submitted || ['pending', 'pass', 'self', 'revise'].includes(ls.gate)) t.sub++;
      if (ls.gate === 'pass') t.pass++; else if (ls.gate === 'self') t.self++;
    }
    return t;
  },
  xp(t = this.totals()) {
    const X = RW_XP;
    return Math.floor(t.c * X.ok + (t.q - t.c) * X.bad + t.cards * X.card + t.min * X.min + t.full * X.full + t.ci * X.min_ci + t.blurt * X.blurt + t.mocks * X.mock + t.read * X.read + t.sub * X.sub + t.pass * X.pass + t.self * X.self + t.clips * X.clip);
  },
  need(n) { return 50 * (n - 1) * n; },
  level(xp) { let n = 1; while (this.need(n + 1) <= xp) n++; return n; },
  title(n) { let s = RW_TITLES[0][1]; for (const [l, x] of RW_TITLES) if (n >= l) s = x; return s; },
  coins() { const r = this.st(); return Math.floor(this.xp() / 10) + (r.bonus || 0) - (r.spent || 0); },
  info() { const xp = this.xp(), lv = this.level(xp), a = this.need(lv), b = this.need(lv + 1); return { xp, lv, title: this.title(lv), cur: xp - a, span: b - a, pct: (xp - a) / (b - a), coins: this.coins(), r: this.st() }; },

  /* ---------- 連勝凍結卡：昨天沒打卡、但前天還在連勝，就自動用一張 ---------- */
  ok(d) { const L = S.st.log[d]; return !!(L && (L.frozen || (L.checkin && (L.checkin.full || L.checkin.min)))); },
  autoFreeze() {
    const r = this.st(); if (!r.freezes || !S.st.onboarded) return;
    const y = D.add(D.today(), -1);
    if (S.planDay(y) < 2 || this.ok(y) || !this.ok(D.add(y, -1))) return;
    S.day(y).frozen = true; r.freezes--; r.usedFreeze = D.today(); S.save();
  },

  /* ---------- 寶箱：每完成一步 35% 掉落；當天全部完成必掉金寶箱 ---------- */
  stepDrops() {
    const r = this.st(); if (!S.st.onboarded || typeof Auto === 'undefined') return 0;
    let steps; try { steps = Auto.list(); } catch (e) { return 0; }
    const d = D.today(), got = r.steps[d] || (r.steps[d] = []); let n = 0;
    for (const s of steps) if (s.done && !got.includes(s.id)) { got.push(s.id); if (r.init && Math.random() < .35) { this.dropOpen(this.tierOf('box')); n++; } }
    if (steps.length && steps.every(s => s.done) && !got.includes('*all')) { got.push('*all'); if (r.init) { this.dropOpen(S.day().minMode ? this.tierOf('box') : 'gold'); n++; } }
    for (const k of Object.keys(r.steps)) if (k < D.add(d, -3)) delete r.steps[k];
    return n;
  },
  tierOf(kind) { const x = Math.random(); return kind === 'gold' ? 'gold' : x < .05 ? 'epic' : x < .30 ? 'rare' : 'common'; },
  addChest(kind) { const tier = this.tierOf(kind); this.st().chests.push({ tier, d: D.today() }); return tier; },
  /* 掉落即開：不擋畫面、不用按 */
  q: [], qBusy: false,
  dropOpen(tier) { const res = this.roll(tier); this.q.push([tier, res]); if (!this.qBusy) this.showDrop(); },
  showDrop() {
    const it = this.q.shift(); if (!it) { this.qBusy = false; return; } this.qBusy = true;
    const [tier, res] = it, TN = { common: '寶箱', rare: '稀有寶箱', epic: '史詩寶箱', gold: '金寶箱' };
    const el = h('div', { class: 'rw-drop t-' + tier }); el.innerHTML = `<span class="rw-dc">🎁</span><span><small>${TN[tier]}</small><b>🪙 +${res.coins}${res.freeze ? '　🧊 +1' : ''}</b></span>`;
    document.body.appendChild(el); this.chime(tier === 'common' ? 'pop' : 'big'); if (tier !== 'common') this.confetti(tier === 'gold' ? 60 : 30);
    setTimeout(() => el.classList.add('open'), 450); setTimeout(() => el.classList.add('out'), 2400); setTimeout(() => { el.remove(); this.paintRail(); this.showDrop(); }, 2900);
  },
  roll(tier) {
    const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), r = this.st();
    const out = { coins: tier === 'gold' ? R(40, 80) : tier === 'epic' ? R(60, 100) : tier === 'rare' ? R(20, 40) : R(5, 15), freeze: 0 };
    if ((tier === 'epic' && Math.random() < .5) || (tier === 'gold' && Math.random() < .25)) { if (r.freezes < RW_FREEZE_MAX) { r.freezes++; out.freeze = 1; } }
    r.bonus += out.coins; return out;
  },
  openAll(done) {
    const r = this.st(); if (!r.chests.length) { done && done(); return; }
    const c = r.chests.shift(), res = this.roll(c.tier); S.save(); this.paintRail();
    const TN = { common: '寶箱', rare: '稀有寶箱', epic: '史詩寶箱', gold: '金寶箱' };
    const w = h('div', { class: 'nd-wrap rw-open', role: 'dialog', 'aria-modal': 'true' });
    w.innerHTML = `<div class="nd-box"><div class="rw-chest t-${c.tier}">🎁</div><div class="rw-tier t-${c.tier}">${TN[c.tier]}</div>
      <div class="rw-got" hidden><b>🪙 +${res.coins}</b>${res.freeze ? '<b>🧊 +1</b>' : ''}</div>
      <div class="row center"><button class="btn primary" id="rwNext" disabled>${r.chests.length ? `下一個（${r.chests.length}）` : '收下'}</button></div></div>`;
    document.body.appendChild(w);
    this.chime(c.tier === 'common' ? 'pop' : 'big');
    setTimeout(() => { const g = $('.rw-got', w); if (g) g.hidden = false; $('.rw-chest', w).classList.add('opened'); $('#rwNext', w).disabled = false; if (c.tier !== 'common') this.confetti(c.tier === 'gold' ? 70 : 40); }, 650);
    $('#rwNext', w).onclick = () => { w.remove(); if (r.chests.length) this.openAll(done); else { this.paintRail(); done && done(); } };
  },

  /* ---------- 成就 ---------- */
  checkAch(t) {
    const r = this.st(), out = [];
    const s = Object.assign({}, t, {
      best: r.best || 0, lvl: this.level(this.xp(t)),
      clipsAll: typeof Clips !== 'undefined' && Clips.list && t.clips >= Clips.list.length,
      subjDone: DATA.subjects.some(sb => DATA.lessons.filter(l => l.subject === sb.id).every(l => (S.st.lessons[l.id] || {}).read)),
      stars: Object.values(S.st.stars || {}).reduce((a, b) => a + (b || 0), 0),
      star3: Object.values(S.st.stars || {}).filter(v => v >= 3).length,
      starSubj: DATA.subjects.some(sb => DATA.lessons.filter(l => l.subject === sb.id).every(l => ((S.st.stars || {})[l.id] || 0) >= 3)),
    });
    for (const a of ACH) if (!r.ach[a.id] && a.t(s)) { r.ach[a.id] = D.today(); r.bonus += a.c; out.push(a); }
    return out;
  },

  /* ---------- 主同步：每次換頁、作答、每分鐘專注都呼叫 ---------- */
  sync(o = {}) {
    const r = this.st(); this.autoFreeze();
    r.best = Math.max(r.best || 0, S.streak());
    const t = this.totals(), xp = this.xp(t), lv = this.level(xp);
    const ach = this.checkAch(t), drops = this.stepDrops();
    const xq = xp - Math.floor(t.min);   // 專注分鐘的 XP 默默累積，不跳提示
    if (!r.init) { r.init = 1; r.xp0 = xq; r.lvl = lv; S.save(); this.paintRail(); return; }
    const dx = xq - (r.xp0 == null ? xq : r.xp0); r.xp0 = xq;
    if (dx > 0 && !o.quiet) this.float(`+${dx} XP`);
    let delay = 0;
    if (lv > (r.lvl || 1)) { r.lvl = lv; delay = 1; setTimeout(() => this.levelUp(lv), 350); }
    ach.forEach((a, i) => setTimeout(() => this.achToast(a), 500 + (delay + i) * 1100));
    if (lv < (r.lvl || 1)) r.lvl = lv;
    S.save(); this.paintRail();
  },

  /* ---------- 兌換：今天進度過半（或已打卡）才能換「玩樂」——先讀後玩 ---------- */
  unlocked() {
    const L = S.day(); if (L.checkin || !S.st.onboarded) return true;
    try { const l = Auto.list(); return l.length ? l.filter(s => s.done).length / l.length >= .5 : true; } catch (e) { return true; }
  },
  redeem(id) {
    const r = this.st(), it = r.shop.find(x => x.id === id); if (!it) return;
    if (this.coins() < it.price) { toast(`還差 🪙 ${it.price - this.coins()}`, 'bad'); return; }
    if (!this.unlocked()) { toast('🔒 今天進度過半解鎖', 'bad'); return; }
    Nudge.overlay(`<div class="nd-ic">${it.ic}</div><h2>${esc(it.name)}</h2><p class="muted">🪙 −${it.price}</p>`, [['兌換', () => {
      r.spent += it.price; r.redeem.push({ id: it.id, ic: it.ic, name: it.name, price: it.price, ts: new Date().toISOString() }); r.redeem = r.redeem.slice(-50);
      S.save(); this.chime('big'); this.confetti(36); route(); toast(`${it.ic} 去享受吧`, 'good');
    }, 'primary'], ['取消', () => { }]]);
  },
  buyFreeze() {
    const r = this.st();
    if (r.freezes >= RW_FREEZE_MAX) { toast(`最多持有 ${RW_FREEZE_MAX} 張`, ''); return; }
    if (this.coins() < RW_FREEZE) { toast(`還差 🪙 ${RW_FREEZE - this.coins()}`, 'bad'); return; }
    r.spent += RW_FREEZE; r.freezes++; S.save(); this.chime('pop'); route();
  },
  bonus(coins, text) {
    const r = this.st(), n = Math.max(0, Math.min(500, Math.round(+coins || 0))); if (!n) return;
    r.bonus += n; r.agent = (r.agent || []).concat([{ coins: n, text: String(text || ''), ts: new Date().toISOString() }]).slice(-30); S.save();
    this.chime('big'); this.confetti(30); toast(`Agent 獎勵 🪙 +${n}${text ? '：' + String(text).slice(0, 30) : ''}`, 'good'); this.paintRail();
  },

  /* ---------- 呈現 ---------- */
  railHtml() {
    const i = this.info(), n = i.r.chests.length;
    return `<a class="rw-rail" id="rwRail" href="#rewards" title="${esc(i.title)}"><span class="lv">Lv ${i.lv}</span><span class="bar"><i style="width:${Math.round(i.pct * 100)}%"></i></span><span class="cn">🪙 ${i.coins}</span>${typeof Practice !== 'undefined' ? `<span class="cn" title="闖關星數">⭐ ${Object.values(S.st.stars || {}).reduce((a, b) => a + (b || 0), 0)}/${DATA.lessons.length * 3}</span>` : ''}${n ? `<span class="ch">🎁${n}</span>` : ''}</a>`;
  },
  paintRail() { const el = $('#rwRail'); if (el) el.outerHTML = this.railHtml(); },
  float(text, cls = '') {
    const el = h('div', { class: 'rw-float ' + cls }); el.textContent = text; document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  },
  achToast(a) {
    const el = h('div', { class: 'rw-ach-t' }); el.innerHTML = `<span class="ic">${a.ic}</span><span><b>${esc(a.name)}</b><small>🪙 +${a.c}</small></span>`;
    document.body.appendChild(el); this.chime('pop'); setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3200);
  },
  levelUp(lv) {   // 不擋畫面：2.6 秒自己消失
    this.chime('big'); this.confetti(80);
    const el = h('div', { class: 'rw-lvban', 'aria-live': 'polite' }); el.innerHTML = `<div class="rw-lvup"><small>LEVEL UP</small><b>Lv ${lv}</b><span>${esc(this.title(lv))}</span></div>`;
    document.body.appendChild(el); setTimeout(() => el.classList.add('out'), 2300); setTimeout(() => el.remove(), 2900);
  },
  confetti(n = 50) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = h('div', { class: 'rw-confetti', 'aria-hidden': 'true' }), cols = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#ec4899'];
    for (let i = 0; i < n; i++) { const s = h('i'); s.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % cols.length]};animation-delay:${Math.random() * .35}s;animation-duration:${1.2 + Math.random() * .9}s;transform:rotate(${Math.random() * 360}deg)`; box.appendChild(s); }
    document.body.appendChild(box); setTimeout(() => box.remove(), 2600);
  },
  chime(kind) {
    if (S.st.settings.rwSound === false || typeof Sound === 'undefined') return;
    try {
      Sound.init(); if (!Sound.ac) return; Sound.ac.resume(); const t = Sound.ac.currentTime + .01, F = Sound.fx;
      if (kind === 'pop') { Sound.osc('sine', 660, t, .12, .22, F); Sound.osc('sine', 990, t + .07, .16, .18, F); }
      else [523, 659, 784, 1047, 1319].forEach((f, i) => Sound.osc('triangle', f, t + i * .08, .32, .2, F));
    } catch (e) { }
  },
};

/* 作答後即時給 XP 回饋 */
(() => { const orig = S.answer; S.answer = function (...a) { const r = orig.apply(this, a); try { Rewards.sync(); } catch (e) { } return r; }; })();

function viewRewards() {
  const i = Rewards.info(), r = i.r, n = r.chests.length, open = Rewards.unlocked(), got = ACH.filter(a => r.ach[a.id]).length;
  const recent = r.redeem.slice(-5).reverse();
  main().innerHTML = `
  <header class="page-head"><h1>獎勵</h1></header>
  <section class="card rw-hero">
    <div class="rw-lvbig"><small>Lv</small><b>${i.lv}</b></div>
    <div class="rw-meta"><div class="rw-title">${esc(i.title)}</div><div class="progress"><i style="width:${Math.round(i.pct * 100)}%"></i></div><div class="muted small">${i.cur} / ${i.span} XP</div></div>
    <div class="rw-wallet"><span>🪙 <b>${i.coins}</b></span><span title="連勝凍結卡">🧊 <b>${r.freezes}</b></span></div>
  </section>
  ${n ? `<section class="card rw-chests"><span class="rw-cic">🎁</span><b>× ${n}</b><button class="btn primary" id="rwOpen">打開</button></section>` : ''}
  <div class="sec-h"><h2>兌換</h2>${open ? '' : '<span class="muted small">🔒 今天進度過半解鎖</span>'}</div>
  <div class="rw-shop">
    ${r.shop.map(it => `<div class="rw-item ${i.coins >= it.price ? '' : 'poor'}"><span class="ic">${it.ic}</span><b>${esc(it.name)}</b><span class="pr">🪙 ${it.price}</span><button class="btn sm ${i.coins >= it.price && open ? 'primary' : ''}" data-buy="${esc(it.id)}">${open ? '兌換' : '🔒'}</button><button class="x" data-del="${esc(it.id)}" aria-label="刪除">×</button></div>`).join('')}
    <div class="rw-item frz ${i.coins >= RW_FREEZE ? '' : 'poor'}"><span class="ic">🧊</span><b>連勝凍結卡</b><span class="pr">🪙 ${RW_FREEZE}</span><button class="btn sm" id="rwFreeze" ${r.freezes >= RW_FREEZE_MAX ? 'disabled' : ''}>${r.freezes}/${RW_FREEZE_MAX}</button></div>
    <form class="rw-item rw-add" id="rwAdd"><input id="rwIc" maxlength="2" placeholder="🎁" aria-label="圖示"><input id="rwName" placeholder="自訂獎勵" maxlength="20" aria-label="獎勵名稱"><input id="rwPrice" type="number" min="10" step="10" placeholder="🪙" aria-label="價格"><button class="btn sm">新增</button></form>
  </div>
  ${recent.length ? `<ul class="rw-log">${recent.map(x => `<li>${x.ic} ${esc(x.name)}<span class="muted small">${D.fmt(new Date(x.ts)).slice(5)}　−${x.price}</span></li>`).join('')}</ul>` : ''}
  <div class="sec-h"><h2>成就</h2><span class="muted small">${got} / ${ACH.length}</span></div>
  <div class="rw-ach">${ACH.map(a => `<div class="ach ${r.ach[a.id] ? 'on' : ''}"><span class="ic">${a.ic}</span><b>${esc(a.name)}</b><small>${esc(a.need)}</small></div>`).join('')}</div>
  <details class="rw-how"><summary>怎麼賺</summary><p class="small muted">答對 10・答錯 4・卡片 2・專注每分鐘 1・讀完一章 50・交費曼 40・通過 +80・打卡 100（保底 30）・白紙回憶 20・模考 150・短片 5｜10 XP = 🪙 1｜完成一步 35% 掉寶箱，全部完成必掉金寶箱｜沒打卡的那天自動用一張 🧊 保住連勝</p></details>`;
  if ($('#rwOpen')) $('#rwOpen').onclick = () => Rewards.openAll(() => route());
  $$('[data-buy]').forEach(b => b.onclick = () => Rewards.redeem(b.dataset.buy));
  $$('[data-del]').forEach(b => b.onclick = () => { r.shop = r.shop.filter(x => x.id !== b.dataset.del); S.save(); route(); });
  $('#rwFreeze').onclick = () => Rewards.buyFreeze();
  $('#rwAdd').onsubmit = e => {
    e.preventDefault(); const name = $('#rwName').value.trim(), price = Math.max(10, Math.round(+$('#rwPrice').value || 0)); if (!name || !+$('#rwPrice').value) return;
    r.shop.push({ id: 'u' + Date.now().toString(36), ic: $('#rwIc').value.trim() || '🎁', name, price }); r.shop.sort((a, b) => a.price - b.price); S.save(); route();
  };
}
