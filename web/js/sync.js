/* 資工所衝刺站 — 備份與多裝置合併
 *  合併規則：重複合併同一份不會重複計算（取較新／較多，不相加）；兩邊各自的新紀錄都會保留。
 *  - 每天自動備份：http 模式由 server.py 寫 bridge/backups/；fs 模式由網頁寫；離線模式 7 天提醒一次下載。
 *  - 連上 bridge 時，若 bridge/state.json 來自另一台裝置（OneDrive 同步過來），自動合併。
 */
'use strict';

const Sync = {
  GATE: { none: 0, revise: 1, pending: 2, self: 3, pass: 4 },
  later(a, b, k) { return String((a || {})[k] || '') >= String((b || {})[k] || '') ? a : b; },
  minDate(a, b) { return a && b ? (a < b ? a : b) : (a || b || null); },
  byId(a, b, key = 'id') { const m = new Map(); [...(a || []), ...(b || [])].forEach(x => { const k = typeof key === 'function' ? key(x) : x && x[key]; if (k != null && !m.has(k)) m.set(k, x); }); return [...m.values()]; },

  /* 把 o（另一台裝置的狀態）合併進 s（本機），回傳新狀態；本機設定保留 */
  merge(s, o) {
    if (!o || o.v !== 1) throw new Error('不是有效的進度檔');
    const r = JSON.parse(JSON.stringify(s));
    // 作答：同一題取最後作答較新的那份（同日取作答次數多的）
    for (const [q, b] of Object.entries(o.answers || {})) {
      const a = r.answers[q];
      if (!a) { r.answers[q] = b; continue; }
      const pick = (b.last || '') > (a.last || '') || ((b.last || '') === (a.last || '') && (b.n || 0) > (a.n || 0)) ? b : a;
      const m = Object.assign({}, pick), hc = Math.max(a.hcw || 0, b.hcw || 0), cz = pick.cause || a.cause || b.cause;
      if (a.everWrong || b.everWrong) m.everWrong = true; if (hc) m.hcw = hc; if (cz) m.cause = cz;
      r.answers[q] = m;
    }
    // 記憶卡：取最後複習較新、或次數較多的
    r.srs = r.srs || {};
    for (const [k, b] of Object.entries(o.srs || {})) { const a = r.srs[k]; r.srs[k] = !a ? b : ((b.last || '') > (a.last || '') || ((b.last || '') === (a.last || '') && (b.reps || 0) > (a.reps || 0)) ? b : a); }
    r.elo = r.elo || {};
    for (const [k, b] of Object.entries(o.elo || {})) { const a = r.elo[k]; r.elo[k] = !a || (b.n || 0) > (a.n || 0) ? b : a; }
    // 每日紀錄：數字取大、清單取聯集、打卡取有的
    for (const [d, b] of Object.entries(o.log || {})) {
      const a = r.log[d]; if (!a) { r.log[d] = b; continue; }
      for (const k of ['min', 'q', 'c', 'cards', 'newCards', 'gens', 'stars']) if (b[k] != null) a[k] = Math.max(a[k] || 0, b[k]);
      for (const k of ['lessons', 'labs', 'feyn', 'mocks', 'weakDone']) if (b[k]) a[k] = [...new Set([...(a[k] || []), ...b[k]])];
      if (b.checkin && (!a.checkin || (b.checkin.full && !a.checkin.full))) a.checkin = b.checkin;
      for (const k of ['blurt', 'frozen', 'commit', 'minMode']) if (b[k] && !a[k]) a[k] = b[k];
    }
    // 章節：讀完取最早、費曼關卡取較前進的
    for (const [id, b] of Object.entries(o.lessons || {})) {
      const a = r.lessons[id]; if (!a) { r.lessons[id] = b; continue; }
      const ga = this.GATE[a.gate || 'none'] || 0, gb = this.GATE[b.gate || 'none'] || 0;
      const base = gb > ga ? Object.assign({}, a, b) : Object.assign({}, b, a);
      for (const k of ['read', 'pre']) { const v = this.minDate(a[k], b[k]); if (v) base[k] = v; }
      if (a.baseDone || b.baseDone) base.baseDone = a.baseDone || b.baseDone;
      if (b.draft && b.draft.length > (a.draft || '').length) base.draft = b.draft;
      r.lessons[id] = base;
    }
    r.msgs = this.byId(r.msgs, o.msgs).sort((x, y) => String(x.ts).localeCompare(String(y.ts)));
    // 已審的回覆要套回去
    for (const m of r.msgs) { const om = (o.msgs || []).find(x => x.id === m.id); if (om && om.verdict && !m.verdict) Object.assign(m, { verdict: om.verdict, score: om.score, gradeText: om.gradeText }); }
    r.agentQuiz = this.byId(r.agentQuiz, o.agentQuiz);
    r.wrappers = this.byId(r.wrappers, o.wrappers, x => x.date + ':' + (x.gid || ''));
    r.wrongNotes = Object.assign({}, o.wrongNotes || {}, r.wrongNotes || {});
    // 星等取大；整頁默寫取日期較新的那次
    r.stars = Object.assign({}, r.stars || {}); for (const [k, v] of Object.entries(o.stars || {})) r.stars[k] = Math.max(r.stars[k] || 0, v || 0);
    r.dict = Object.assign({}, r.dict || {}); for (const [k, v] of Object.entries(o.dict || {})) { const a = r.dict[k]; if (!a || (v && (v.date || '') > (a.date || ''))) r.dict[k] = v; }
    for (const [k, v] of Object.entries(o.wrongNotes || {})) if (v && v.length > (r.wrongNotes[k] || '').length) r.wrongNotes[k] = v;
    r.clipSeen = Object.assign({}, o.clipSeen || {}, r.clipSeen || {});
    r.seen = Object.assign({}, o.seen || {}, r.seen || {});
    for (const [d, list] of Object.entries(o.agentTasks || {})) if (!r.agentTasks[d]) r.agentTasks[d] = list; else list.forEach((t, i) => { if (t.done && r.agentTasks[d][i]) r.agentTasks[d][i].done = true; });
    // 獎勵：兌換紀錄聯集，花費取兩邊與紀錄總和的最大值
    if (o.rw) {
      const a = r.rw || {}, b = o.rw;
      const redeem = this.byId(a.redeem, b.redeem, x => x.ts + x.id);
      r.rw = Object.assign({}, b, a, {
        bonus: Math.max(a.bonus || 0, b.bonus || 0),
        spent: Math.max(a.spent || 0, b.spent || 0, redeem.reduce((t, x) => t + (x.price || 0), 0)),
        redeem, ach: Object.assign({}, b.ach || {}, a.ach || {}), best: Math.max(a.best || 0, b.best || 0),
        freezes: Math.max(a.freezes || 0, b.freezes || 0), agent: this.byId(a.agent, b.agent, x => x.ts),
        shop: this.byId(a.shop, b.shop), chests: (a.chests || []).length >= (b.chests || []).length ? a.chests : b.chests,
      });
    }
    r.onboarded = !!(s.onboarded || o.onboarded);
    r.device = s.device; r.mergedFrom = [...new Set([...(s.mergedFrom || []), o.device].filter(Boolean))];
    return r;
  },

  apply(o, label) {
    const before = Object.keys(S.st.answers).length;
    S.st = Object.assign(defaultState(), this.merge(S.st, o)); S.saveNow(); QBANK.build();
    const gained = Object.keys(S.st.answers).length - before;
    toast(`${label}：已合併${gained > 0 ? `（多了 ${gained} 題紀錄）` : ''}`, 'good');
  },

  /* ---------- 檔案 ---------- */
  fileName() { return `資工所衝刺-進度-${D.today()}.json`; },
  download() {
    const blob = new Blob([JSON.stringify(S.st)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: this.fileName() }); document.body.appendChild(a); a.click(); a.remove();
    S.st.lastExport = D.today(); S.save(); toast('已下載備份檔', 'good');
  },
  pick(cb) {
    const inp = h('input', { type: 'file', accept: '.json,application/json' });
    inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try { cb(JSON.parse(await f.text())); } catch (e) { toast('讀不到這個檔案：' + e.message, 'bad'); } };
    inp.click();
  },

  /* ---------- 自動 ---------- */
  ensureDevice() { if (!S.st.device) { S.st.device = 'd' + Math.random().toString(36).slice(2, 8); S.save(); } },
  /* 連上 bridge 時：state.json 是另一台裝置寫的 → 合併 */
  async onConnect() {
    this.ensureDevice();
    let txt = '', o = null;
    try {
      if (Bridge.mode === 'cloud') { const r = await Cloud.load(); if (r) { Cloud.lastH = Object.assign({}, r.ok); o = r.st; } }
      else if (Bridge.mode === 'http') { const r = await Bridge.api('state'); txt = r.ok ? await r.text() : ''; }
      else if (Bridge.mode === 'fs') txt = await Bridge.fsRead('state.json');
    } catch (e) { return; }
    if (!o) { if (!txt || !txt.trim().startsWith('{')) return; try { o = JSON.parse(txt); } catch (e) { return; } }
    if (!o || o.v !== 1) return;
    const fresh = !Object.keys(S.st.answers).length && !Object.keys(S.st.log).length;
    if (fresh) { S.st = Object.assign(defaultState(), o, { device: null }); this.ensureDevice(); S.saveNow(); QBANK.build(); toast('已從 bridge 還原進度', 'good'); return; }
    if (o.device && o.device !== S.st.device) this.apply(o, '另一台裝置的進度');
  },
  /* 指紋：用來判斷「合併後是否比對方多東西」，多了才寫回，避免兩台裝置互相覆寫個沒完 */
  fp(st) {
    const A = Object.values(st.answers || {}), L = Object.values(st.log || {}), R = Object.values(st.srs || {}), Ls = Object.values(st.lessons || {});
    return [A.length, A.reduce((t, a) => t + (a.n || 0), 0), R.length, R.reduce((t, a) => t + (a.reps || 0), 0), L.length, L.reduce((t, d) => t + (d.q || 0) + (d.min || 0) + (d.cards || 0), 0),
      Ls.filter(x => x.read).length, Ls.reduce((t, x) => t + (this.GATE[x.gate || 'none'] || 0), 0), (st.msgs || []).length, (st.agentQuiz || []).length, (st.rw || {}).spent || 0].join('|');
  },
  seenTs: 0, pulling: false,
  /* 手機和電腦輪流用：發現 bridge 上是另一台裝置的新進度就合併進來（安靜地） */
  async pullForeign() {
    if (this.pulling) return; this.pulling = true;
    try {
      const o = await Bridge.foreignState(); if (!o) return;
      const before = this.fp(S.st), merged = this.merge(S.st, o);
      S.st = Object.assign(defaultState(), merged); S.saveNow(); QBANK.build();
      if (this.fp(S.st) !== before) { toast('已合併另一台裝置的進度', 'good'); const r = location.hash.slice(1) || 'go'; if (['go', 'stats', 'today', 'rewards', 'cards', 'feed', 'wrong'].includes(r) && !document.querySelector('.modal')) try { route(); } catch (e) { } }
      if (this.fp(S.st) !== this.fp(o)) Bridge.queueSync();
    } catch (e) { /* 下次再試 */ } finally { this.pulling = false; }
  },
  /* fs 模式自己寫每日備份（http 模式由 server.py 寫） */
  async dailyBackup() {
    if (Bridge.mode !== 'fs' || S.st.lastBackup === D.today()) return;
    try {
      const dir = await Bridge.dir.getDirectoryHandle('backups', { create: true });
      const fh = await dir.getFileHandle(`state-${D.today()}.json`, { create: true });
      const w = await fh.createWritable(); await w.write(JSON.stringify(S.st)); await w.close();
      S.st.lastBackup = D.today(); S.save();
    } catch (e) { /* 下次再試 */ }
  },
  /* 離線模式：7 天沒下載備份就提醒（在帶我讀頁顯示一行） */
  needNudge() { if (Bridge.mode !== 'offline' || !S.st.onboarded) return false; const last = S.st.lastExport || S.st.settings.startDate; return D.diff(last, D.today()) >= 7 && Object.keys(S.st.answers).length > 20; },
};
