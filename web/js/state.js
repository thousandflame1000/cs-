/* 資工所衝刺站 — 狀態：每小時讀了多少、一鍵記錄睡眠／飲食／身體／心情、找出作息失序
   資料：S.st.act[日期] = 24 格（每小時活躍分鐘）；S.st.daily[日期] = { sleep, eat, body, mood, ts }
   規則都用最近 7～14 天的實際數字說話；不做診斷。線上版可以請 Claude 看兩週的摘要。 */
'use strict';

const StateLog = {
  Q: [
    { k: 'sleep', t: '昨晚幾點睡', o: [['early', '12 點前'], ['mid', '12–2 點'], ['late', '2 點後'], ['none', '沒睡']] },
    { k: 'eat', t: '今天吃得', o: [['ok', '正常'], ['mess', '亂吃'], ['skip', '沒怎麼吃']] },
    { k: 'body', t: '身體', o: [['ok', '好'], ['meh', '普通'], ['sick', '不舒服']] },
    { k: 'mood', t: '心情', o: [['5', '很好'], ['4', '好'], ['3', '普通'], ['2', '低'], ['1', '很低']] },
  ],
  lastAct: Date.now(),
  /* 每分鐘：最近 60 秒有操作、畫面在前景 → 這個小時 +1 分 */
  tick() {
    if (document.hidden || Date.now() - this.lastAct > 60000 || typeof S === 'undefined' || !S.st) return;
    const d = new Date(), k = D.fmt(d), A = S.st.act || (S.st.act = {}), row = A[k] || (A[k] = Array(24).fill(0));
    row[d.getHours()] = Math.min(60, (row[d.getHours()] || 0) + 1); S.save();
  },
  get(d = D.today()) { return (S.st.daily || {})[d] || {}; },
  set(k, v) { const L = S.st.daily || (S.st.daily = {}), r = L[D.today()] || (L[D.today()] = {}); r[k] = v; r.ts = Date.now(); S.save(); },
  days(n) { const out = []; for (let i = n - 1; i >= 0; i--) out.push(D.add(D.today(), -i)); return out; },
  row(d) { return ((S.st.act || {})[d]) || Array(24).fill(0); },

  /* ---------- 今天頁的一題一題問（一次只問一題，答完就收起來） ---------- */
  checkinHtml() {
    const cur = this.get(), q = this.Q.find(x => cur[x.k] == null); if (!q) return '';
    const n = this.Q.indexOf(q) + 1;
    return `<section class="st-ask" id="stAsk"><span class="st-q">${q.t}</span><div class="st-opts">${q.o.map(([v, t]) => `<button type="button" class="chip" data-sk="${q.k}" data-sv="${v}">${t}</button>`).join('')}</div><span class="st-n">${n} / ${this.Q.length}</span></section>`;
  },
  wireCheckin(root = document) {
    $$('[data-sk]', root).forEach(b => b.onclick = () => {
      this.set(b.dataset.sk, b.dataset.sv);
      const box = $('#stAsk'); if (!box) return; const html = this.checkinHtml();
      if (html) { box.outerHTML = html; this.wireCheckin(); } else { box.classList.add('st-done'); box.innerHTML = '<span class="st-q">記下了</span>'; setTimeout(() => box.remove(), 1200); }
    });
  },

  /* ---------- 找模式 ---------- */
  stats() {
    const d14 = this.days(14), d7 = d14.slice(7), p7 = d14.slice(0, 7);
    const mins = d => this.row(d).reduce((a, b) => a + b, 0);
    const night = d => this.row(d).slice(1, 5).reduce((a, b) => a + b, 0);
    const first = d => { const r = this.row(d), i = r.findIndex(x => x >= 3); return i < 0 ? null : i; };
    const avg = a => { const v = a.filter(x => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
    const byHour = Array(24).fill(0); this.days(28).forEach(d => this.row(d).forEach((m, h) => { byHour[h] += m; }));
    const dl = d7.map(d => this.get(d));
    return { d7, mins: d7.map(mins), night: d7.map(night), first7: avg(d7.map(first)), firstP7: avg(p7.map(first)), byHour, daily: dl, moods: d14.map(d => +this.get(d).mood || null).filter(Boolean) };
  },
  patterns() {
    const s = this.stats(), out = [], fmtH = h => (h == null ? '—' : Math.round(h) + ' 點');
    const nightDays = s.night.filter(m => m >= 20).length, nightSum = s.night.reduce((a, b) => a + b, 0), lateSleep = s.daily.filter(x => x.sleep === 'late' || x.sleep === 'none').length;
    if (nightDays >= 3 || lateSleep >= 3) out.push({ lv: 'bad', t: '晝夜顛倒', why: `這 7 天有 ${Math.max(nightDays, lateSleep)} 天凌晨 1–5 點還醒著${nightSum ? `（在這裡讀了 ${nightSum} 分）` : ''}`, fix: '明天把開始時間提早 1 小時，晚上 12 點前收工' });
    if (s.first7 != null && s.firstP7 != null && s.first7 - s.firstP7 >= 2) out.push({ lv: 'warn', t: '開始越來越晚', why: `平均開始時間從 ${fmtH(s.firstP7)} 變成 ${fmtH(s.first7)}`, fix: '明天起床先做 5 分鐘的第一步，不用做完' });
    const mess = s.daily.filter(x => x.eat === 'mess' || x.eat === 'skip').length;
    if (mess >= 3) out.push({ lv: 'warn', t: '飲食不規律', why: `這 7 天有 ${mess} 天亂吃或沒怎麼吃`, fix: '先吃再讀：餓著讀，專注撐不到 20 分鐘' });
    const sick = this.days(2).filter(d => this.get(d).body === 'sick').length;
    if (sick) out.push({ lv: 'bad', t: '身體不舒服', why: sick > 1 ? '連續 2 天不舒服' : '今天不舒服', fix: '今天改保底：做 5 分鐘也算連續天數', act: 'min' });
    const m3 = s.moods.slice(-3), lowRun = m3.length >= 3 && m3.every(x => x <= 2), veryLow = s.moods.slice(-3).filter(x => x === 1).length >= 2;
    if (lowRun || veryLow) out.push({ lv: 'bad', t: '心情連續偏低', why: `最近 ${m3.length} 次都是「低」以下`, fix: '今天只做一件小事就好。悶太久找人聊聊，也可以打安心專線 1925（24 小時）', act: 'min' });
    const tot = s.byHour.reduce((a, b) => a + b, 0);
    if (tot >= 60) { let best = 0, bh = 0; for (let h = 0; h < 24; h++) { const w = s.byHour[h] + s.byHour[(h + 1) % 24]; if (w > best) { best = w; bh = h; } } out.push({ lv: 'ok', t: '最專注的時段', why: `你最常在 ${bh}–${bh + 2} 點讀書（佔 ${Math.round(best / tot * 100)}%）`, fix: '把最難的費曼、魔王關排在這個時段' }); }
    return out;
  },

  /* ---------- 狀態頁 ---------- */
  heatmap() {
    const ds = this.days(28), max = Math.max(10, ...ds.map(d => Math.max(...this.row(d))));
    const cells = ds.map(d => `<div class="hm-row"><span class="hm-d">${d.slice(5)}</span>${this.row(d).map((m, h) => `<i title="${d} ${h} 點：${m} 分" style="--a:${m ? (.15 + .85 * m / max).toFixed(2) : 0}"></i>`).join('')}</div>`).join('');
    return `<div class="hm" role="img" aria-label="最近 28 天每小時讀書分鐘數">${cells}<div class="hm-row hm-ax"><span class="hm-d"></span>${Array.from({ length: 24 }, (_, h) => `<b>${h % 6 === 0 ? h : ''}</b>`).join('')}</div></div>`;
  },
  view() {
    const m = main(), pats = this.patterns(), cur = this.get();
    m.innerHTML = `<header class="page-head"><h1>狀態</h1></header>
      <section class="card"><div class="card-h"><h2>今天</h2></div>
        <div class="st-grid">${this.Q.map(q => `<div class="st-line"><span class="st-q">${q.t}</span><div class="st-opts">${q.o.map(([v, t]) => `<button type="button" class="chip${String(cur[q.k]) === v ? ' on' : ''}" data-sk2="${q.k}" data-sv="${v}">${t}</button>`).join('')}</div></div>`).join('')}</div></section>
      <section class="card"><div class="card-h"><h2>這兩週</h2>${typeof CloudAgent !== 'undefined' && CloudAgent.ready() ? '<button class="btn sm" id="stAI">請 Claude 看看</button>' : ''}</div>
        ${pats.length ? `<div class="st-pats">${pats.map(p => `<div class="st-pat st-${p.lv}"><b>${p.t}</b><span>${esc(p.why)}</span><span class="st-fix">${esc(p.fix)}</span>${p.act === 'min' ? '<button class="btn sm" data-stmin>改保底</button>' : ''}</div>`).join('')}</div>` : '<p class="muted">再讀幾天，這裡會開始看出你的作息模式。</p>'}
      </section>
      <section class="card"><div class="card-h"><h2>每小時讀了多少</h2><span class="muted small">最近 28 天</span></div>${this.heatmap()}</section>`;
    $$('[data-sk2]', m).forEach(b => b.onclick = () => { this.set(b.dataset.sk2, b.dataset.sv); this.view(); });
    $$('[data-stmin]', m).forEach(b => b.onclick = () => { const L = S.day(); L.minMode = true; S.save(); toast('今天改成保底', 'good'); location.hash = '#go'; });
    const ai = $('#stAI', m); if (ai) ai.onclick = () => this.askAI();
  },
  askAI() {
    const s = this.stats(), rows = this.days(14).map(d => ({ d, min: this.row(d).reduce((a, b) => a + b, 0), night: this.row(d).slice(1, 5).reduce((a, b) => a + b, 0), first: (i => i < 0 ? null : i)(this.row(d).findIndex(x => x >= 3)), ...this.get(d) }));
    const prompt = `你是陪考生準備台大資工所的教練。下面是他最近 14 天的作息與讀書紀錄（min=當天讀書分鐘、night=凌晨1–5點讀書分鐘、first=第一個有在讀的小時、sleep/eat/body/mood=自評，mood 1–5）。
用繁體中文（台灣），最多 4 行：先講 1–2 個你看到的模式（要引用數字），再給明天就能做的 1 個具體調整。不要診斷疾病；如果心情連續很低，溫和提醒可以找人聊、或打安心專線 1925。
${JSON.stringify({ rows, peakHours: s.byHour })}`;
    CloudAgent.stream('作息觀察', prompt, true).catch(() => { });
  },
};
setInterval(() => StateLog.tick(), 60000);
['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => { StateLog.lastAct = Date.now(); }, { passive: true, capture: true }));
