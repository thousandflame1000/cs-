/* 資工所衝刺站 — 個人化：用你自己的複習紀錄校正記憶模型、考前衝刺、錯因自動補救 */
'use strict';

const Personal = {
  MIN_EVENTS: 300,
  /* 把每張卡的複習歷史整理成 [[日期, 評分], …] 序列 */
  sequences() { return Object.values(S.st.srs || {}).map(c => (c.hist || []).slice().sort((a, b) => a[0].localeCompare(b[0]))).filter(h => h.length >= 2); },
  events(seqs) { let n = 0; for (const h of seqs) for (let i = 1; i < h.length; i++) if (D.diff(h[i - 1][0], h[i][0]) > 0) n++; return n; },
  /* 用權重 w 重播所有歷史，算「記得機率」預測的平均 log loss */
  loss(w, seqs) {
    const keep = FSRS.w; FSRS.w = w; let L = 0, n = 0;
    try {
      for (const h of seqs) {
        let c = null;
        for (let i = 0; i < h.length; i++) {
          const [d, g] = h[i];
          if (c) { const t = D.diff(c.last, d); if (t > 0) { const p = Math.min(.99, Math.max(.01, FSRS.R(t, c.s))); L -= g > 1 ? Math.log(p) : Math.log(1 - p); n++; } }
          c = FSRS.next(c, g, d);
        }
      }
    } finally { FSRS.w = keep; }
    return n ? L / n : 0;
  },
  /* 座標搜尋（對數尺度），並把權重拉向預設值避免過度擬合 */
  fit(force) {
    const seqs = this.sequences(), n = this.events(seqs), st = S.st.fsrs || {};
    if (n < this.MIN_EVENTS) return { n, need: this.MIN_EVENTS };
    if (!force && st.date && D.diff(st.date, D.today()) < 7) return st;
    const W0 = FSRS.W0 || (FSRS.W0 = FSRS.w.slice()), idx = [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const lam = .02 * Math.min(1, this.MIN_EVENTS / n);
    const obj = w => this.loss(w, seqs) + lam * idx.reduce((a, i) => a + Math.log(w[i] / W0[i]) ** 2, 0);
    let w = W0.slice(), best = obj(w); const before = this.loss(W0, seqs);
    for (let round = 0; round < 4; round++) {
      let moved = false;
      for (const i of idx) for (const m of [.6, .8, 1.25, 1.6]) {
        const c = w.slice(); c[i] = Math.min(W0[i] * 8, Math.max(W0[i] / 8, c[i] * m)); const v = obj(c);
        if (v < best - 1e-6) { best = v; w = c; moved = true; }
      }
      if (!moved) break;
    }
    const after = this.loss(w, seqs), use = after < before * .99;
    S.st.fsrs = { w: use ? w : null, n, before, after, date: D.today(), used: use }; S.save();
    this.apply(); return S.st.fsrs;
  },
  apply() { if (!FSRS.W0) FSRS.W0 = FSRS.w.slice(); const p = S.st.fsrs; FSRS.w = p && p.w && p.w.length === FSRS.W0.length ? p.w.slice() : FSRS.W0.slice(); },
  status() {
    const p = S.st.fsrs, n = this.events(this.sequences());
    if (p && p.used) return `記憶模型已用你的 ${p.n} 次複習校正（預測誤差 −${Math.round((1 - p.after / p.before) * 100)}%）`;
    if (n < this.MIN_EVENTS) return `累積 ${this.MIN_EVENTS} 次複習後自動校正記憶模型（目前 ${n}）`;
    return '';
  },

  /* ---------- 考前衝刺 ---------- */
  cram() { const d = S.daysLeft(); return d > 0 && d <= 14; },

  /* ---------- 錯因補救：最近 7 天同一種錯因 ≥ 3 題 ---------- */
  causes() {
    const since = D.add(D.today(), -7), m = {};
    for (const [qid, a] of Object.entries(S.st.answers || {})) if (a.cause && a.last && a.last >= since && a.ok === false) (m[a.cause] = m[a.cause] || []).push(qid);
    return m;
  },
  fixDue() {
    const fixed = S.st.fixed || {}, out = [];
    for (const [c, ids] of Object.entries(this.causes())) if (ids.length >= 3 && !(fixed[c] && D.diff(fixed[c], D.today()) < 3)) out.push(c);
    return out.sort((a, b) => this.causes()[b].length - this.causes()[a].length).slice(0, 2);
  },
  topChapter(ids) { const m = {}; ids.forEach(id => { const q = Practice.getQ(id); if (q && q.ch) m[q.ch] = (m[q.ch] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]).map(x => x[0]); },
  startFix(cause) {
    const ids = (this.causes()[cause] || []).filter(id => !id.startsWith('gen:') || Practice.getQ(id)), chs = this.topChapter(ids);
    if (cause === '沒背熟' && chs.length) { startCards({ chs, title: '補救：' + cause, fix: cause, max: 40 }); return; }
    if ((cause === '觀念不清' || cause === '沒基礎') && chs[0]) { const w = Rescue.warm(chs[0]); if (w.ids.length) { Practice.start(w.ids, { title: '補救：' + cause, ex: w.ex, fix: cause }); return; } }
    if (cause === '計算失誤') { const gs = Gen.list.filter(g => chs.includes(g.ch)); if (gs.length) { Practice.start(Array.from({ length: 10 }, (_, k) => `gen:${gs[k % gs.length].id}:${Rescue.seed()}`), { title: '補救：' + cause, fix: cause }); return; } }
    Practice.start(ids, { title: '補救：' + cause, review: true, fix: cause, limit: 15 });
  },
  markFixed(cause) { (S.st.fixed = S.st.fixed || {})[cause] = D.today(); S.save(); },
};
