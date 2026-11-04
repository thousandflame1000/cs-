/* 資工所衝刺站 — Agent 橋接（土法：用檔案溝通）
 *  學生 → Agent : bridge/inbox.jsonl   （網頁追加，一行一則 JSON）
 *  Agent → 學生 : bridge/outbox.jsonl  （Agent 追加；純文字行也可以）
 *  進度摘要     : bridge/progress.json （網頁覆寫，給 Agent 讀）
 *  完整備份     : bridge/state.json
 *  Agent 心跳   : bridge/heartbeat.json（Agent 監聽時寫入）
 *  三種連線：http（python server.py）/ fs（Chrome/Edge 直接授權資料夾）/ offline（複製貼上）
 */
'use strict';

/* 手機掃 QR code 打開時網址帶著 #k=金鑰：存起來、從網址拿掉 */
(() => { try { const m = location.hash.match(/(?:^#|&)k=([\w-]+)/); if (m) { localStorage.setItem('csgrad.lankey', m[1]); history.replaceState(null, '', location.pathname + location.search + '#go'); } } catch (e) { } })();

const Bridge = {
  mode: 'offline',
  dir: null,
  needsRegrant: false,
  hb: null,
  unread: 0,
  pollTimer: null,

  /* ---------- IndexedDB for FS handle ---------- */
  _idb(op, key, val) {
    return new Promise((res) => {
      try {
        const rq = indexedDB.open('csgrad', 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
        rq.onerror = () => res(null);
        rq.onsuccess = () => {
          const tx = rq.result.transaction('kv', op === 'get' ? 'readonly' : 'readwrite');
          const st = tx.objectStore('kv');
          const r2 = op === 'get' ? st.get(key) : st.put(val, key);
          r2.onsuccess = () => res(op === 'get' ? r2.result : true);
          r2.onerror = () => res(null);
        };
      } catch (e) { res(null); }
    });
  },

  /* 呼叫 server.py 的 API（手機要帶金鑰） */
  api(path, opt = {}) {
    let key = ''; try { key = localStorage.getItem('csgrad.lankey') || ''; } catch (e) { }
    const headers = Object.assign({}, opt.headers || {}, key ? { 'X-Key': key } : {});
    return fetch('api/' + path, Object.assign({ cache: 'no-store' }, opt, { headers }));
  },
  local: true,
  async init() {
    if (location.protocol.startsWith('http')) {
      try {
        const r = await this.api('ping');
        if (r.ok) { const j = await r.json(); this.local = j.local !== false; if (j && j.ok) this.mode = 'http'; else if (j && j.auth === false) setTimeout(() => toast('這台裝置還沒配對：在電腦的「設定 → 手機也能用」掃 QR code 打開', 'bad'), 800); }
      } catch (e) { /* not served by server.py */ }
    }
    if (this.mode === 'offline' && window.showDirectoryPicker) {
      const handle = await this._idb('get', 'bridgeDir');
      if (handle) {
        try {
          const perm = await handle.queryPermission({ mode: 'readwrite' });
          if (perm === 'granted') { this.dir = handle; this.mode = 'fs'; }
          else { this.dir = handle; this.needsRegrant = true; }
        } catch (e) { /* ignore */ }
      }
    }
    if (this.mode === 'offline' && typeof Cloud !== 'undefined' && window.claude && typeof window.claude.use === 'function') {
      Cloud.init().then(async on => { if (on && this.mode === 'offline') { this.mode = 'cloud'; await this.afterConnect(); try { route(); } catch (e) { } } });
      this.render(); return;
    }
    if (this.mode !== 'offline') await this.afterConnect();
    else if (location.protocol.startsWith('http') && !this.retryT) this.retryT = setInterval(async () => {
      if (this.mode !== 'offline') { clearInterval(this.retryT); this.retryT = null; return; }
      try { const r = await this.api('ping'); const j = r.ok ? await r.json() : null; if (j && j.ok) { clearInterval(this.retryT); this.retryT = null; this.mode = 'http'; this.local = j.local !== false; toast('已連上 server，進度開始同步', 'good'); await this.afterConnect(); } } catch (e) { }
    }, 20000);
    this.render();
  },

  async afterConnect() {
    if (typeof Sync !== 'undefined') await Sync.onConnect(); else await this.maybeRestore();
    if (this.mode === 'cloud') {
      Cloud.watch(); this.queueSync(); this.render();
      // 之前沒送成的訊息：只在學生允許過 Claude 之後補送，一次最多兩則
      if (CloudAgent.ready() && S.st.aiOK) { let k = 0; for (const m of S.st.msgs) if (m.dir === 'out' && m.queued && k < 2) { k++; m.queued = false; this._deliver(m).catch(() => { m.queued = true; }); } S.save(); }
      setTimeout(() => CloudAgent.daily(), 1500);
      return;
    }
    await this.flushQueued();
    this.queueSync();
    this.startPolling();
    this.render();
  },

  async connectFS() {
    if (!window.showDirectoryPicker) { toast('這個瀏覽器不支援直接存取資料夾，請改用 start.bat（python server.py）', 'bad'); return; }
    try {
      if (this.dir && this.needsRegrant) {
        const p = await this.dir.requestPermission({ mode: 'readwrite' });
        if (p !== 'granted') return;
      } else {
        const d = await window.showDirectoryPicker({ id: 'csgrad-bridge', mode: 'readwrite' });
        this.dir = d;
        await this._idb('put', 'bridgeDir', d);
      }
      this.needsRegrant = false; this.mode = 'fs';
      toast('已連接 bridge 資料夾：' + this.dir.name, 'good');
      await this.afterConnect();
    } catch (e) { if (e && e.name !== 'AbortError') toast('連接失敗：' + e.message, 'bad'); }
  },

  /* ---------- low-level IO ---------- */
  async fsRead(name) {
    try { const fh = await this.dir.getFileHandle(name); const f = await fh.getFile(); return await f.text(); } catch (e) { return ''; }
  },
  async fsWrite(name, text) {
    const fh = await this.dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable(); await w.write(text); await w.close();
  },
  async fsAppend(name, line) {
    const fh = await this.dir.getFileHandle(name, { create: true });
    const f = await fh.getFile();
    const w = await fh.createWritable({ keepExistingData: true });
    await w.seek(f.size); await w.write(line); await w.close();
  },
  async readOutbox() {
    if (this.mode === 'cloud') return '';
    if (this.mode === 'http') { const r = await this.api('outbox'); return r.ok ? await r.text() : ''; }
    if (this.mode === 'fs') return await this.fsRead('outbox.jsonl');
    return '';
  },
  async readHeartbeat() {
    try {
      let txt = '';
      if (this.mode === 'http') { const r = await this.api('heartbeat'); txt = r.ok ? await r.text() : ''; }
      else if (this.mode === 'fs') txt = await this.fsRead('heartbeat.json');
      this.hb = txt ? JSON.parse(txt) : null;
    } catch (e) { this.hb = null; }
  },

  /* ---------- outgoing ---------- */
  async send(msg) {
    msg.id = msg.id || uid('in');
    msg.ts = msg.ts || new Date().toISOString();
    msg.from = 'student';
    const rec = Object.assign({ dir: 'out' }, msg);
    S.st.msgs.push(rec);
    S.save();
    try {
      await this._deliver(msg);
      rec.queued = false;
    } catch (e) { rec.queued = true; }
    S.save();
    window.dispatchEvent(new CustomEvent('bridge:change'));
    return rec;
  },
  async _deliver(msg) {
    const clean = Object.assign({}, msg); delete clean.dir; delete clean.queued;
    const line = JSON.stringify(clean) + '\n';
    if (this.mode === 'http') {
      const r = await this.api('inbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: line });
      if (!r.ok) throw new Error('server ' + r.status);
    } else if (this.mode === 'fs') {
      await this.fsAppend('inbox.jsonl', line);
    } else if (this.mode === 'cloud' && CloudAgent.ready()) {
      // Claude 直接在網頁裡處理；失敗就標成「還沒送」，下次再補
      CloudAgent.process(clean).catch(e => { const r = S.st.msgs.find(x => x.id === clean.id); if (r && !(e && e.code === 'cancelled')) { r.queued = true; S.save(); } });
    } else throw new Error('offline');
  },
  async flushQueued() {
    for (const m of S.st.msgs) if (m.dir === 'out' && m.queued) { try { await this._deliver(m); m.queued = false; } catch (e) { break; } }
    S.save();
  },

  /* ---------- incoming ---------- */
  parseLines(txt) {
    const out = [];
    txt.split(/\r?\n/).forEach((line, idx) => {
      const s = line.trim(); if (!s) return;
      let m = null;
      if (s.startsWith('{')) { try { m = JSON.parse(s); } catch (e) { m = null; } }
      if (!m) m = { type: 'note', text: s, id: 'txt-' + idx + '-' + hashStr(s) };
      if (!m.id) m.id = 'auto-' + idx + '-' + hashStr(s);
      out.push(m);
    });
    return out;
  },
  async poll() {
    if (this.mode === 'offline') return;
    if (typeof Sync !== 'undefined' && !document.hidden) await Sync.pullForeign();
    try {
      const txt = await this.readOutbox();
      const msgs = this.parseLines(txt);
      let n = 0;
      for (const m of msgs) {
        if (S.st.seen[m.id]) continue;
        S.st.seen[m.id] = 1; n++;
        this.handle(m);
      }
      if (n) { S.save(); window.dispatchEvent(new CustomEvent('bridge:change')); }
      await this.readHeartbeat();
      this.render();
    } catch (e) { /* transient */ }
  },
  startPolling() {
    clearInterval(this.pollTimer);
    this.poll();
    this.pollTimer = setInterval(() => this.poll(), 3000);
  },
  handle(m) {
    const rec = Object.assign({ dir: 'in', ts: m.ts || new Date().toISOString() }, m);
    S.st.msgs.push(rec);
    this.unread++;
    const today = D.today();
    const type = m.type || 'note';
    if (type === 'grade' && m.replyTo) {
      const target = S.st.msgs.find(x => x.id === m.replyTo);
      if (target) {
        target.verdict = m.verdict; target.score = m.score; target.gradeText = m.text;
        if (target.type === 'feynman' && target.ctx && target.ctx.lesson) {
          const L = S.lesson(target.ctx.lesson);
          L.gate = m.verdict === 'pass' ? 'pass' : 'revise';
          L.score = m.score; L.feedback = m.text; L.gradedAt = today;
          if (m.verdict === 'pass') { L.reviewDue = D.add(today, 3); L.reviews = 0; }
        }
        if (target.type === 'essay' && target.ctx && target.ctx.qid) {
          const a = S.st.answers[target.ctx.qid];
          if (a) { a.agent = m.verdict; a.ok = m.verdict === 'pass'; if (!a.ok) { a.everWrong = true; a.box = 0; a.due = D.add(today, 1); } }
        }
      }
      toast(m.verdict === 'pass' ? agName() + '：通過 ✓' : agName() + '：退回，請補強思考鏈', m.verdict === 'pass' ? 'good' : 'bad');
    } else if ((type === 'plan' || type === 'supervise') && Array.isArray(m.tasks) && m.tasks.length) {
      const d = m.date || today;
      S.st.agentTasks[d] = m.tasks.map(t => ({ text: typeof t === 'string' ? t : t.text, done: false }));
      toast(type === 'supervise' ? '收到今日督導' : '收到 Agent 指派任務', 'good');
    } else if (type === 'bonus') {
      if (typeof Rewards !== 'undefined') Rewards.bonus(m.coins, m.text);
    } else if (type === 'quiz' && Array.isArray(m.questions)) {
      let k = 0;
      for (const q of m.questions) {
        const nq = normalizeAgentQ(q, m.id, k++);
        if (nq && !S.st.agentQuiz.find(x => x.id === nq.id)) S.st.agentQuiz.push(nq);
      }
      QBANK.build();
      toast(`${agName()} 出了 ${k} 題，去「練習 → Agent 出題」作答`, 'good');
    } else {
      toast(agName() + '：' + String(m.text || '').replace(/[*_`$#>]/g, '').slice(0, 40), '');
    }
  },

  /* ---------- progress sync ---------- */
  queueSync: null,
  /* 明天的第一步（給早上的推播與督導）；同一天、同一份進度只算一次 */
  forecast() {
    try {
      const t = D.add(D.today(), 1), key = t + '|' + (typeof Sync !== 'undefined' ? Sync.fp(S.st) : '');
      if (this._fc && this._fc.key === key) return this._fc.v;
      const l = Auto.preview(t), main = l.filter(x => !/^(blurt|checkin)$/.test(x.id));
      const v = { date: t, firstStep: (main[0] || l[0] || {}).title || null, steps: l.length, mins: l.reduce((a, x) => a + (x.mins || 0), 0), list: l.map(x => x.title).slice(0, 8) };
      this._fc = { key, v }; return v;
    } catch (e) { return null; }
  },
  /* bridge/state.json 若是別台裝置寫的（而且還沒合併過這一版），回傳它；否則 null */
  async foreignState() {
    if (this.mode === 'offline' || typeof Sync === 'undefined') return null;
    if (this.mode === 'cloud') { const o = await Cloud.foreign(); if (o) Sync.seenTs = 0; return o; }
    try {
      let ts = 0, dev = null, txt = '';
      if (this.mode === 'http') {
        const r = await this.api('statemeta'); if (!r.ok) return null; const m = await r.json(); ts = m.ts; dev = m.device;
        if (!ts || !dev || dev === S.st.device || ts === Sync.seenTs) return null;
        const r2 = await this.api('state'); txt = r2.ok ? await r2.text() : '';
      } else {
        const f = await (await this.dir.getFileHandle('state.json')).getFile(); ts = f.lastModified;
        if (!ts || ts === Sync.seenTs) return null; txt = await f.text();
      }
      Sync.seenTs = ts;
      const o = txt && txt.trim().startsWith('{') ? JSON.parse(txt) : null;
      return o && o.v === 1 && o.device && o.device !== S.st.device ? o : null;
    } catch (e) { return null; }
  },
  async syncNow() {
    if (this.mode === 'offline') return;
    if (this.mode === 'cloud') { await Sync.pullForeign(); return Cloud.save(); }
    if (typeof Sync !== 'undefined') await Sync.pullForeign();
    const progress = buildProgress();
    try {
      if (this.mode === 'http') {
        await this.api('progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ progress, state: S.st }) });
      } else if (this.mode === 'fs') {
        await this.fsWrite('progress.json', JSON.stringify(progress, null, 2));
        await this.fsWrite('state.json', JSON.stringify(S.st));
        if (typeof Sync !== 'undefined') await Sync.dailyBackup();
      }
    } catch (e) { /* retry next change */ }
  },
  async maybeRestore() {
    const fresh = !Object.keys(S.st.answers).length && !Object.keys(S.st.log).length;
    if (!fresh) return;
    try {
      let txt = '';
      if (this.mode === 'http') { const r = await this.api('state'); txt = r.ok ? await r.text() : ''; }
      else if (this.mode === 'fs') txt = await this.fsRead('state.json');
      if (txt && txt.trim().startsWith('{')) {
        const st = JSON.parse(txt);
        if (st && st.v === 1) { S.st = Object.assign(defaultState(), st); S.saveNow(); QBANK.build(); toast('已從 bridge/state.json 還原進度', 'good'); }
      }
    } catch (e) { /* ignore */ }
  },

  /* ---------- status UI ---------- */
  status() {
    const age = this.hb && this.hb.ts ? Math.round((Date.now() - Date.parse(this.hb.ts)) / 1000) : null;
    const watching = age != null && age < 120;
    if (this.mode === 'offline') return { cls: 'off', text: this.needsRegrant ? '需重新授權資料夾' : '離線模式', sub: '訊息先存在本機' };
    if (this.mode === 'cloud') return { cls: 'on', text: CloudAgent.busy ? 'Claude 回答中…' : Cloud.db ? '雲端同步' : 'Claude 家教', sub: (Cloud.db ? '進度存在雲端：同一個 Claude 帳號的每台裝置都同步' : '進度只存在這個瀏覽器') + (CloudAgent.ready() ? '｜Claude 直接在網頁裡批改與回答' : '') };
    return {
      cls: watching ? 'on' : 'wait',
      text: watching ? 'Agent 監聽中' : 'Agent 未監聽',
      sub: (this.mode === 'http' ? '檔案橋接（server）' : '檔案橋接（資料夾）') + (age != null ? `｜心跳 ${fmtAge(age)}前` : ''),
    };
  },
  render() {
    const st = this.status();
    $$('.bridge-pill').forEach(el => {
      el.className = 'bridge-pill ' + st.cls;
      el.innerHTML = `<span class="dot"></span><span>${esc(st.text)}</span>`;
      el.title = st.sub;
      if (el.dataset.auto) el.hidden = st.cls === 'off' && !this.needsRegrant && !this.unread;
    });
    $$('.unread-badge').forEach(el => { el.textContent = this.unread ? String(this.unread) : ''; el.hidden = !this.unread; });
  },

  /* offline helper: build a prompt the student can paste to any AI */
  offlinePrompt() {
    const q = S.st.msgs.filter(m => m.dir === 'out' && m.queued);
    const head = '你是我的資工所（目標台大）家教兼督導。以下是我從學習網站送出的訊息（JSON），請依 AGENTS.md 的規則逐則回覆；費曼關卡請嚴格審查思考鏈，最後給 PASS 或 REVISE。\n\n';
    return head + q.map(m => JSON.stringify(Object.assign({}, m, { dir: undefined, queued: undefined }))).join('\n') + '\n\n我的進度摘要：\n' + JSON.stringify(buildProgress(), null, 1).slice(0, 6000);
  },
};
Bridge.queueSync = () => { if (Bridge._syncT) return; Bridge._syncT = setTimeout(() => { Bridge._syncT = null; Bridge.syncNow(); }, Bridge.mode === 'cloud' ? 6000 : 2500); };

function agName() { return Bridge.mode === 'cloud' ? 'Claude' : 'Agent'; }
function hashStr(s) { let h1 = 5381; for (let i = 0; i < s.length; i++) h1 = ((h1 << 5) + h1 + s.charCodeAt(i)) | 0; return (h1 >>> 0).toString(36); }
function fmtAge(sec) { if (sec < 60) return sec + ' 秒'; if (sec < 3600) return Math.round(sec / 60) + ' 分'; if (sec < 86400) return Math.round(sec / 3600) + ' 小時'; return Math.round(sec / 86400) + ' 天'; }

function normalizeAgentQ(q, msgId, k) {
  if (!q || !(q.stem || q.q)) return null;
  const opts = q.options || q.opts || [];
  let type = q.type;
  let ans = q.answer;
  if (!type) type = opts.length ? (Array.isArray(ans) && ans.length > 1 ? 'multi' : 'single') : (ans != null ? 'fill' : 'essay');
  const ch = q.chapter || q.ch || 'agent';
  return {
    id: q.id ? 'ag-' + String(q.id).replace(/[^\w-]/g, '') : `ag-${hashStr(msgId)}-${k}`,
    ch, subject: (LESSON[ch] && LESSON[ch].subject) || q.subject || 'agent', diff: q.diff || q.difficulty || 3, type,
    stem: q.stem || q.q, opts: opts.map(String),
    ans: type === 'fill' ? [].concat(ans).map(String) : type === 'essay' ? [] : [].concat(ans).map(x => typeof x === 'number' ? x : opts.indexOf(x)).filter(x => x >= 0),
    expl: q.explanation || q.expl || '', src: 'agent',
  };
}

/* summary the agent reads (bridge/progress.json) */
function buildProgress() {
  const st = S.st, today = D.today();
  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = D.add(today, -i); const L = st.log[d];
    last14.push({ date: d, minutes: L ? Math.round(L.min) : 0, questions: L ? L.q : 0, correct: L ? L.c : 0, checkin: !!(L && L.checkin), lessons: L ? L.lessons : [] });
  }
  const subjects = {};
  for (const s of DATA.subjects) subjects[s.id] = Object.assign({ name: s.name }, subjectStats(s.id));
  const chapters = {};
  for (const l of DATA.lessons) {
    const ls = st.lessons[l.id] || {}; const cs = chapterStats(l.id);
    chapters[l.id] = { title: l.title, read: ls.read || null, gate: ls.gate || 'none', score: ls.score ?? null, quizN: cs.n, attempted: cs.att, acc: cs.acc == null ? null : +cs.acc.toFixed(2) };
  }
  const recentWrong = Object.entries(st.answers).filter(([id, a]) => a.ok === false).sort((a, b) => (b[1].last || '').localeCompare(a[1].last || '')).slice(0, 25).map(([id, a]) => {
    const q = id.startsWith('gen:') ? null : QBANK.get(id);
    return { qid: id, chapter: q ? q.ch : id.split(':')[1], stem: q ? String(q.stem).slice(0, 160) : '(隨機產生題)', conf: a.conf ?? null, cause: a.cause || null, note: st.wrongNotes[id] || null, date: a.last };
  });
  const weak = Object.entries(chapters).filter(([id, c]) => c.attempted >= 3 && c.acc != null && c.acc < 0.6).map(([id, c]) => ({ id, title: c.title, acc: c.acc }));
  const plan = (DATA.plan || []).find(p => p.day === S.planDay()) || null;
  const t = todayTasks();
  return {
    updated: (() => { const d = new Date(), o = -d.getTimezoneOffset(), z = n => String(Math.abs(n)).padStart(2, '0'); return D.today() + 'T' + d.toTimeString().slice(0, 8) + (o >= 0 ? '+' : '-') + z(Math.floor(Math.abs(o) / 60)) + ':' + z(Math.abs(o) % 60); })(), today: D.today(), student: st.settings.name || '', examDate: st.settings.examDate, daysLeft: S.daysLeft(),
    planDay: S.planDay(), todayPlan: plan, todayTasks: t.map(x => ({ id: x.id, text: x.text, done: x.done })), tasksDone: t.filter(x => x.done).length, tasksTotal: t.length,
    streak: S.streak(), dailyMinutesGoal: st.settings.dailyMinutes, last14, subjects, chapters, weakChapters: weak,
    highConfidenceWrong: Object.entries(st.answers).filter(([id, a]) => (a.hcw || 0) > 0).map(([id]) => id).slice(0, 20),
    dueReviews: S.dueReviews().length, recentWrong,
    pendingGates: st.msgs.filter(m => m.dir === 'out' && (m.type === 'feynman' || m.type === 'essay') && !m.verdict).map(m => ({ id: m.id, type: m.type, ctx: m.ctx })),
    todayCheckin: (st.log[today] && st.log[today].checkin) || null,
    mastery: Object.fromEntries(DATA.lessons.map(l => { const e = (st.elo || {})[l.id]; return [l.id, e && e.n ? { p: +Learn.mastery(l.id).toFixed(2), n: e.n } : null]; })),
    memory: (() => { const f = Learn.forecast(); return { items: f.n, retentionNow: f.now == null ? null : +f.now.toFixed(2), retentionAtExamIfStop: f.atExam == null ? null : +f.atExam.toFixed(2), dueToday: f.due, target: Learn.ret() }; })(),
    calibration: Learn.calibration().map(x => ({ conf: ['', 'guess', 'somewhat', 'sure'][x.conf], n: x.n, acc: x.acc == null ? null : +x.acc.toFixed(2) })),
    cards: { total: Learn.cards().length, learned: Learn.cards().filter(c => (st.srs || {})[c.id]).length, due: Learn.cardDue().length },
    wrappers: (st.wrappers || []).slice(-3),
    rewards: (() => { try { const i = Rewards.info(), r = i.r; return { level: i.lv, title: i.title, xp: i.xp, coins: i.coins, freezes: r.freezes, unopenedChests: r.chests.length, achievements: Object.keys(r.ach).length + '/' + ACH.length, frozenDays: Object.keys(st.log).filter(d => st.log[d].frozen), recentRedeem: r.redeem.slice(-5).map(x => ({ name: x.name, price: x.price, date: x.ts ? D.fmt(new Date(x.ts)) : null })), agentBonusToday: (r.agent || []).filter(x => x.ts && D.fmt(new Date(x.ts)) === today).reduce((a, x) => a + x.coins, 0) }; } catch (e) { return null; } })(),
    habits: { studyStart: st.settings.studyStart || null, commitToday: (st.log[today] || {}).commit || st.settings.commitTime || null, stake: st.settings.stake || null, minModeToday: !!(st.log[today] || {}).minMode, missedYesterday: S.planDay() > 1 && !((st.log[D.add(today, -1)] || {}).checkin), autopilot: (() => { try { const l = Auto.list(); return { done: l.filter(x => x.done).length, total: l.length, next: (l.find(x => !x.done && !x.skipped) || {}).title || null, skipped: l.filter(x => x.skipped).map(x => x.title) }; } catch (e) { return null; } })(), pace: (() => { try { return Auto.pace(); } catch (e) { return null; } })() },
    forecast: Bridge.forecast(),
  };
}
