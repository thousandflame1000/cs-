/* 資工所衝刺站 — 學習引擎：FSRS 記憶排程、章節掌握度（Elo）、自適應選題、保留率預測、必背卡佇列 */
'use strict';

/* ---------- FSRS-4.5：每張卡記住「穩定度 S」與「難度 D」，在記得機率掉到目標保留率時排下一次 ---------- */
const FSRS = {
  w: [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755],
  F: 19 / 81, DEC: -0.5,
  R(t, s) { return Math.pow(1 + this.F * Math.max(0, t) / Math.max(s, .01), this.DEC); },
  ivl(s, r) { return s / this.F * (Math.pow(r, 1 / this.DEC) - 1); },
  d0(g) { return Math.min(10, Math.max(1, this.w[4] - (g - 3) * this.w[5])); },
  /* 回傳複習後的新狀態（不改原物件） */
  next(c, g, day) {
    const w = this.w, n = Object.assign({}, c || {});
    if (!c || !c.reps) { n.s = w[g - 1]; n.d = this.d0(g); n.reps = 1; n.lapses = g === 1 ? 1 : 0; }
    else {
      const t = Math.max(0, D.diff(c.last, day)), r = this.R(t, c.s);
      if (g === 1) { n.s = Math.min(c.s, w[11] * Math.pow(c.d, -w[12]) * (Math.pow(c.s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r))); n.lapses = (c.lapses || 0) + 1; }
      else n.s = c.s * (1 + Math.exp(w[8]) * (11 - c.d) * Math.pow(c.s, -w[9]) * (Math.exp(w[10] * (1 - r)) - 1) * (g === 2 ? w[15] : 1) * (g === 4 ? w[16] : 1));
      const dd = c.d - w[6] * (g - 3); n.d = Math.min(10, Math.max(1, w[7] * this.d0(3) + (1 - w[7]) * dd));
      n.reps = (c.reps || 0) + 1;
    }
    n.s = Math.max(.1, n.s); n.last = day; n.g = g;
    return n;
  },
};

const Learn = {
  GRADES: ['', '忘了', '困難', '記得', '輕鬆'],
  ret() { return +(S.st.settings.retention || .9); },
  maxIvl() { const left = S.daysLeft(); return left > 2 ? left - 1 : 365; },
  daysFor(s) { return Math.max(1, Math.min(this.maxIvl(), Math.round(FSRS.ivl(s, this.ret())))); },
  keyOf(qid) { return qid.startsWith('gen:') ? 'g:' + qid.split(':')[1] : qid; },
  gradeOf(ok, conf) { if (!ok) return 1; if (conf === 1) return 2; if (conf === 3) return 4; return 3; },
  card(key) { return (S.st.srs || {})[key]; },
  review(key, g, day = D.today()) {
    const srs = S.st.srs || (S.st.srs = {});
    const n = FSRS.next(srs[key], g, day);
    n.due = D.add(day, g === 1 ? 1 : this.daysFor(n.s));
    n.hist = ((srs[key] && srs[key].hist) || []).concat([[day, g]]).slice(-12);
    srs[key] = n; return n;
  },
  /* 四個按鈕各自會排到幾天後（給必背卡的按鈕顯示用） */
  preview(key) { const c = this.card(key), day = D.today(); return [1, 2, 3, 4].map(g => g === 1 ? 1 : this.daysFor(FSRS.next(c, g, day).s)); },
  Rnow(c, day = D.today()) { return c && c.last ? FSRS.R(D.diff(c.last, day), c.s) : null; },
  isDue(c, day = D.today()) { return c && c.due && c.due <= day; },

  /* ---------- 章節掌握度：Elo／Rasch 模型，P(答對) = σ(θ_章 − b_題) ---------- */
  bOf(q) { return ((q && q.diff) || 2) - 2; },
  sig(x) { return 1 / (1 + Math.exp(-x)); },
  elo(qid, ok, q) {
    q = q || (qid.startsWith('gen:') ? Practice.genQ(qid) : QBANK.get(qid)); if (!q || !q.ch) return;
    const E = S.st.elo || (S.st.elo = {}); const e = E[q.ch] || (E[q.ch] = { t: 0, n: 0 });
    const p = this.sig(e.t - this.bOf(q)), K = Math.max(.15, .7 / (1 + e.n * .05));
    e.t = Math.max(-4, Math.min(4, e.t + K * ((ok ? 1 : 0) - p))); e.n++;
  },
  mastery(ch) { const e = (S.st.elo || {})[ch]; return e && e.n ? this.sig(e.t) : null; },
  pOf(q) { const e = (S.st.elo || {})[q.ch]; return this.sig((e ? e.t : 0) - this.bOf(q)); },

  /* ---------- 舊紀錄遷移：把 Leitner 時代的作答歷史重播進 FSRS 與 Elo ---------- */
  migrate() {
    if (S.st.srs && S.st.elo) return;
    S.st.srs = S.st.srs || {}; S.st.elo = S.st.elo || {};
    const ev = [];
    for (const [qid, a] of Object.entries(S.st.answers || {})) for (const h of (a.hist || [])) ev.push([h.d, qid, h.ok, h.conf]);
    ev.sort((x, y) => x[0].localeCompare(y[0]));
    for (const [d, qid, ok, conf] of ev) { const c = this.review(this.keyOf(qid), this.gradeOf(ok, conf), d); if (!qid.startsWith('gen:') && S.st.answers[qid]) S.st.answers[qid].due = c.due; try { this.elo(qid, ok); } catch (e) { } }
  },

  /* ---------- 到期清單 ---------- */
  dueQuestions(day = D.today()) { return Object.entries(S.st.srs || {}).filter(([k, c]) => this.isDue(c, day) && QBANK.get(k)).map(([k]) => k); },
  dueGens(day = D.today()) { return Object.entries(S.st.srs || {}).filter(([k, c]) => k.startsWith('g:') && this.isDue(c, day) && Gen.get(k.slice(2))).map(([k]) => k.slice(2)); },
  freshGen(gid) { return `gen:${gid}:${Math.floor(Math.random() * 1e9)}`; },

  /* ---------- 必背卡 ---------- */
  cards() { return DATA.cards || []; },
  cardDue(day = D.today(), filt = () => true) { return this.cards().filter(c => filt(c) && this.isDue(this.card(c.id), day)); },
  newCards(filt = () => true, limit) {
    const day = S.planDay(), seen = S.st.srs || {};
    const planOrder = {}; (DATA.plan || []).forEach(p => (p.lessons || []).forEach(l => { if (!(l in planOrder)) planOrder[l] = p.day; }));
    // 只從你學會的知識點出新卡（課程規格 H10）；卡片記得它在哪一節（build.py 的 kp 欄）
    const unlocked = c => c.kp && KP.N[c.kp] ? KP.learned(c.kp) : !!(S.st.lessons[c.ch] || {}).read;
    let pool = this.cards().filter(c => filt(c) && !seen[c.id] && unlocked(c));
    const kindOrder = { tf: 0, key: 1, recall: 2 };
    pool.sort((a, b) => (planOrder[a.ch] || 99) - (planOrder[b.ch] || 99) || kindOrder[a.kind] - kindOrder[b.kind]);
    return limit == null ? pool : pool.slice(0, Math.max(0, limit));
  },
  newLeft() { return Math.max(0, (S.st.settings.newCards || 20) - (S.day().newCards || 0)); },

  /* ---------- 保留率預測：每張已學卡用 FSRS 算「今天」與「考試那天（若從此不複習）」記得的機率 ---------- */
  forecast() {
    const today = D.today(), ex = S.st.settings.examDate; let n = 0, now = 0, atExam = 0, due = 0;
    for (const [k, c] of Object.entries(S.st.srs || {})) { if (!c.last) continue; n++; now += FSRS.R(D.diff(c.last, today), c.s); atExam += FSRS.R(D.diff(c.last, ex), c.s); if (c.due <= today) due++; }
    return { n, now: n ? now / n : null, atExam: n ? atExam / n : null, due };
  },

  /* ---------- 校準：你說的信心 vs 實際答對率 ---------- */
  calibration() {
    const b = { 1: [0, 0], 2: [0, 0], 3: [0, 0] };
    for (const a of Object.values(S.st.answers || {})) for (const h of (a.hist || [])) if (h.conf && b[h.conf]) { b[h.conf][0]++; if (h.ok) b[h.conf][1]++; }
    return [1, 2, 3].map(k => ({ conf: k, n: b[k][0], acc: b[k][0] ? b[k][1] / b[k][0] : null }));
  },

  /* ---------- 自適應選題：讓預測答對率落在 80–85%，同時偏向弱章、避免連續同一章 ---------- */
  TARGET: .82,
  pick(done, prevCh, only) {
    const today = D.today();
    // 只從你學會的知識點出題（課程規格 H10）：題目看主知識點 q.kp；隨機計算題要整章學會才出
    const ok = q => q.kp && KP.N[q.kp] ? KP.learned(q.kp) : (KP.ORDER.some(k => KP.N[k].ch === q.ch) && KP.ORDER.filter(k => KP.N[k].ch === q.ch).every(KP.learned));
    const fullCh = ch => KP.ORDER.some(k => KP.N[k].ch === ch) && KP.ORDER.filter(k => KP.N[k].ch === ch).every(KP.learned);
    const cand = [];
    const due = new Set(this.dueQuestions());
    for (const q of QBANK.all()) { if ((only && q.ch !== only) || !ok(q) || q.type === 'essay' || done.has(q.id)) continue; const a = S.st.answers[q.id]; cand.push({ id: q.id, q, ch: q.ch, today: a && a.last === today, due: due.has(q.id), fresh: !a }); }
    for (const g of Gen.list) { if ((only && g.ch !== only) || !fullCh(g.ch)) continue; const k = 'g:' + g.id, c = this.card(k); cand.push({ id: this.freshGen(g.id), q: { ch: g.ch, diff: g.diff || 2 }, ch: g.ch, gen: true, due: this.isDue(c, today), fresh: !c, today: [...done].some(x => x.startsWith('gen:' + g.id + ':')) }); }
    if (!cand.length) return null;
    const r = Math.random;
    let best = null, bs = 1e9;
    for (const c of cand) {
      const p = this.pOf(c.q), m = this.mastery(c.ch);
      let sc = Math.abs(p - this.TARGET) * 2 + (m == null ? .15 : m * .6) + (c.ch === prevCh ? .7 : 0) + (c.today ? .9 : 0) - (c.due ? .45 : 0) - (c.fresh ? .1 : 0) + (c.gen ? .08 : 0) + r() * .25 + ((c.q.diff || 2) > 1 && done.size < 4 ? ((c.q.diff || 2) - 1) * .5 : 0) + ((c.q.diff || 2) > 2 && done.size < 8 ? .5 : 0);
      if (sc < bs) { bs = sc; best = c; }
    }
    return best;
  },
  /* 學過的章（讀完的）：記憶系統、練習、卡片都只從這裡出 */
  learned() { return [...new Set(KP.M().map(k => KP.N[k].ch).filter(Boolean))]; },
  /* 最弱的幾章（有做過題目的） */
  weakest(k = 3) { return DATA.lessons.map(l => ({ id: l.id, m: this.mastery(l.id), n: ((S.st.elo || {})[l.id] || {}).n || 0 })).filter(x => x.m != null && x.n >= 3).sort((a, b) => a.m - b.m).slice(0, k); },
};
