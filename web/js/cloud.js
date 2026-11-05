/* 資工所衝刺站 — 雲端模式（只在 claude.ai 的線上版生效）
 *  1. 進度存在雲端資料庫：手機、電腦、學校電腦登入同一個 Claude 帳號，看到同一份進度
 *  2. Claude 直接在網頁裡批改費曼、回答問題、出題、督導——不用開電腦、不用等排程
 *  在 start.bat（本機）或 file:// 打開時，window.claude 不存在，這個檔案什麼都不做。 */
'use strict';

/* 學生設定：完全沒有底子、很懶 → 每個回答都照這個寫 */
const AI_WHO = '學生的程度：幾乎沒有基礎、很懶、注意力很短，請把他當小學生。寫法：先講結論；句子短；每個新名詞第一次出現就用白話解釋；一定給一個很小的數字例子；不要長篇大論。內容要對準台大資工所考試，不能講錯。一律用繁體中文（台灣用語），數學式用 $…$。';

const Cloud = {
  on: false, db: null, uid: null, ai: null, aiDead: false,
  lastH: {}, seenVer: null, foreignPending: false, saving: false, again: false, progH: null, unsub: null,
  CH: 60000,                      // 每塊最多 6 萬字元（中文 3 bytes → 約 180 KB < 256 KiB）
  SKIP: { timer: 1 },             // 只屬於這台裝置的東西不上雲

  async init() {
    if (!(window.claude && typeof window.claude.use === 'function')) return false;
    let db = null, user = null, ai = null;
    try { [db, user, ai] = await Promise.all([claude.use('db'), claude.use('user'), claude.use('sample')]); } catch (e) { }
    if (db && user) { try { this.uid = await user.id(); } catch (e) { } if (this.uid) this.db = db; }
    this.ai = ai || null;
    this.on = !!(this.db || this.ai);
    return this.on;
  },
  col() { return this.db.collection('data/users/' + this.uid); },
  err(e, where) {
    const c = e && e.code;
    if (c === 'quota_exceeded') toast('雲端空間滿了：到「設定」下載備份檔', 'bad');
    else if (c === 'revoked' || c === 'not_granted') { this.db = null; }
    if (window.console) console.warn('cloud', where || '', c || e);
  },

  /* ---------- 讀：整份進度（分塊存，每個欄位一組） ---------- */
  async load() {
    if (!this.db) return null;
    let snap; try { snap = await this.col().get(); } catch (e) { this.err(e, 'load'); return null; }
    const by = {}; snap.docs.forEach(d => { if (d.exists) by[d.id] = d.data(); });
    const meta = by.meta; if (!meta || !meta.keys) return null;
    const st = { v: 1, device: meta.device }; const ok = {};
    for (const [k, info] of Object.entries(meta.keys)) {
      let s = '', good = true;
      for (let i = 0; i < info.n; i++) { const c = by['k_' + k + '_' + i]; if (!c || c.h !== info.h) { good = false; break; } s += c.s; }
      if (!good) continue;
      try { st[k] = JSON.parse(s); ok[k] = info; } catch (e) { }
    }
    this.seenVer = meta.ver;
    return { st, meta, ok };
  },
  /* ---------- 寫：只寫有變的欄位；最後寫 meta ---------- */
  async save() {
    if (!this.db) return;
    if (this.saving) { this.again = true; return; }
    this.saving = true;
    try {
      const st = S.st, keys = {}; let changed = false;
      for (const k of Object.keys(st)) {
        if (this.SKIP[k]) continue;
        const s = JSON.stringify(st[k] === undefined ? null : st[k]), h = hashStr(s) + '.' + s.length, n = Math.max(1, Math.ceil(s.length / this.CH));
        keys[k] = { n, h };
        const old = this.lastH[k];
        if (old && old.h === h) continue;
        for (let i = 0; i < n; i++) await this.col().doc('k_' + k + '_' + i).set({ h, s: s.slice(i * this.CH, (i + 1) * this.CH) });
        if (old && old.n > n) for (let i = n; i < old.n; i++) await this.col().doc('k_' + k + '_' + i).delete();
        this.lastH[k] = { n, h }; changed = true;
      }
      if (changed) {
        const ver = (st.device || 'd') + ':' + Date.now(); this.seenVer = ver;
        await this.col().doc('meta').set({ v: 1, ver, device: st.device || null, ts: Date.now(), keys });
      }
      // 給 Claude（排程或對話）讀的進度摘要
      const p = buildProgress(), ps = JSON.stringify(Object.assign({}, p, { updated: '', forecast: null })), ph = hashStr(ps);
      if (ph !== this.progH) { this.progH = ph; await this.col().doc('progress').set({ json: JSON.stringify(p), ts: Date.now() }); }
    } catch (e) { this.err(e, 'save'); } finally {
      this.saving = false;
      if (this.again) { this.again = false; Bridge.queueSync(); }
    }
  },
  /* ---------- 另一台裝置寫了新版：記下來，讓 Sync.pullForeign 合併 ---------- */
  watch() {
    if (!this.db || this.unsub) return;
    try {
      this.unsub = this.col().doc('meta').onSnapshot(snap => {
        const m = snap.exists ? snap.data() : null;
        if (m && m.ver && m.ver !== this.seenVer && m.device && m.device !== S.st.device) { this.foreignPending = true; Sync.pullForeign(); }
      }, e => { this.unsub = null; this.err(e, 'watch'); });
    } catch (e) { this.err(e, 'watch'); }
  },
  async foreign() {
    if (!this.foreignPending) return null;
    this.foreignPending = false;
    const r = await this.load(); if (!r || !r.meta.device || r.meta.device === S.st.device) return null;
    this.lastH = Object.assign({}, r.ok);
    return r.st;
  },
};

/* ======================= 網頁裡的 Claude 助教 ======================= */
const CloudAgent = {
  busy: 0,
  ready() { return !!(Cloud.ai && !Cloud.aiDead); },
  /* 共用：呼叫 Claude；失敗時告訴學生該怎麼辦，不自動重試 */
  async call(input, opt = {}, json = false) {
    if (!this.ready()) throw { code: 'not_granted' };
    this.busy++; this.pill();
    try {
      const r = json ? await Cloud.ai.json(input, opt) : await Cloud.ai(input, opt);
      if (!S.st.aiOK) { S.st.aiOK = D.today(); S.save(); }
      return r;
    } catch (e) {
      const c = e && e.code;
      if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(c)) { Cloud.aiDead = true; toast('Claude 沒有被允許使用：訊息先存著，可以到 Agent 頁「複製給 AI」', 'bad'); }
      else if (c === 'rate_limited') toast('Claude 現在太忙或額度用完了，等一下再按一次', 'bad');
      else if (c === 'session_expired') toast('請重新登入 Claude', 'bad');
      else if (c !== 'cancelled') toast('Claude 這次沒回成功，再按一次試試', 'bad');
      throw e;
    } finally { this.busy--; this.pill(); }
  },
  pill() { try { Bridge.render(); } catch (e) { } },
  /* 回覆包成跟 bridge/outbox 一樣的訊息，交給原本的流程（評分、任務、題目、獎勵都照舊） */
  emit(m) {
    m.id = m.id || 'ai-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    m.ts = m.ts || new Date().toISOString(); m.from = 'agent';
    S.st.seen[m.id] = 1; Bridge.handle(m); S.save();
    window.dispatchEvent(new CustomEvent('bridge:change'));
    return m;
  },
  lessonText(id, n = 4000) {
    const l = LESSON[id]; if (!l) return '';
    return `【章節】${l.title}\n【直覺版】\n${(l.intuit || '').slice(0, 1500)}\n【教材節錄】\n${(l.body || '').slice(0, n)}`;
  },
  brief() {
    try {
      const p = buildProgress();
      return JSON.stringify({ 距考試天數: p.daysLeft, 計畫第幾天: p.planDay, 近三天: (p.last14 || []).slice(-3), 今天: p.habits && p.habits.autopilot, 明天預排: p.forecast && p.forecast.list, 弱點章節: (p.weakChapters || []).slice(0, 4), 到期複習: p.memory && p.memory.dueToday, 信心校準: p.calibration, 費曼退回: Object.entries(p.chapters || {}).filter(([, c]) => c.gate === 'revise').map(([k]) => k), 最近錯題: (p.recentWrong || []).slice(0, 5).map(w => ({ 章: w.chapter, 錯因: w.cause })) }).slice(0, 5000);
    } catch (e) { return '{}'; }
  },
  quizSpec(chs, n, extra = '') {
    return `出 ${n} 題選擇題（台大考試會考的觀念，但第一題要簡單到看完講解一定會）。章節 id 只能用：${chs.join('、')}。${extra}\n回覆只要一個 JSON 陣列，例如：[{"chapter":"${chs[0]}","diff":1,"stem":"題目","options":["A","B","C","D"],"answer":[1],"explanation":"為什麼對、其他選項錯在哪（白話）"}]。answer 是正確選項的索引（從 0 開始）。`;
  },

  /* ---------- 學生送出的訊息 → Claude 處理 ---------- */
  async process(msg) {
    const t = msg.type, c = msg.ctx || {};
    if (t === 'feynman') return this.grade(msg, `你是台大資工所考試的家教，正在審查學生的「費曼解釋」。${AI_WHO}
${this.lessonText(c.lesson, 6000)}
【費曼題目】${c.prompt}
【必須涵蓋的關鍵點】\n${(c.rubric || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}
【學生的解釋（第 ${c.attempt || 1} 次）】\n"""${msg.text}"""
評分：(1) 關鍵點都有 (2) 每一步有因果、沒跳步 (3) 至少一個具體例子或數字 (4) 說得出何時不成立 (5) 沒有觀念錯誤。五項都滿足才 pass（80 分以上），否則 revise。
回覆只要一個 JSON：{"verdict":"pass 或 revise","score":0到100的整數,"text":"Markdown 評語"}
評語格式：第一行「**判定：通過（N 分）**」或「**判定：退回（N 分）**」；接著逐點 ✓ 或 ✗（一句話）；「思考鏈斷在：…」；退回時給 2 個很簡單的追問，**不要寫出完整答案**；通過時給一個更難一點的延伸問題。`);
    if (t === 'essay') return this.grade(msg, `你是台大資工所考試的閱卷老師。${AI_WHO}
${c.mock ? `【模擬考申論題】\n${(c.qids || []).map(id => { const q = QBANK.get ? QBANK.get(id) : null; return q ? `題目：${q.stem}\n參考解答：${q.expl}` : ''; }).join('\n\n').slice(0, 8000)}` : `【題目】${c.stem}\n【參考解答】${c.reference}`}
【學生作答】\n"""${msg.text}"""
關鍵步驟都有、沒有實質錯誤才 pass。回覆只要一個 JSON：{"verdict":"pass 或 revise","score":0到100,"text":"Markdown：先一句結論，再列缺少的步驟與錯誤，最後一句下一步要練什麼"}`);
    if (t === 'ask') {
      const base = c.nobase ? `學生按了「完全不會」：從零教他。先列 2～4 個前置概念，每個一句白話＋一個最小的數字例子；再用一個具體例子把這章最核心的想法走一遍。可以用 \`\`\`fig 圖解（tree、array、graph、bits、lanes、timeline、bars、venn、plane、matrix、flow）。`
        : c.qid ? `學生做錯了這題，先指出他的想法錯在哪一步，再一步一步給正確推理，最後出一個一句話的小問題讓他確認自己懂了。` : `分步驟回答，附一個具體例子，最後出一個一句話的小問題讓他確認自己懂了。`;
      const ctxText = c.qid ? `【題目】${c.stem}\n${(c.options || []).map((o, i) => `${'ABCDEFGH'[i]}. ${o}`).join('\n')}\n【他的答案】${c.myAnswer}\n【正解】${c.answer}\n【詳解】${c.explanation || ''}` : (c.lesson ? this.lessonText(c.lesson) : '');
      const prompt = `你是台大資工所考試的家教。${AI_WHO}\n${base}\n${ctxText}\n【學生說】${msg.text}`;
      const text = await this.stream(c.nobase ? '從零開始' : 'Claude 回答', prompt, !c.nobase);
      this.emit({ type: 'reply', replyTo: msg.id, text });
      if (c.nobase && c.lesson) await this.quiz(msg, [c.lesson], 3, '三題由淺入深（diff 1、1、2）。', true);
      return;
    }
    if (t === 'blurt') {
      const text = await this.stream('白紙回憶的回饋', `你是台大資工所考試的家教。${AI_WHO}\n學生不看書，寫下他記得的昨天讀的章節。\n${(c.lessons || []).map(id => this.lessonText(id, 2500)).join('\n\n')}\n【學生寫的】\n"""${msg.text}"""\n請列出：(1) 寫對的重點（一句一個）；(2) **漏掉的重點**（最重要，一句一個）；(3) 寫錯的觀念；(4) 三個今天要回答的回想問題。`, false);
      return this.emit({ type: 'reply', replyTo: msg.id, text });
    }
    if (t === 'reflect') {
      const text = await this.stream('模考反思的回饋', `你是台大資工所考試的督導。${AI_WHO}\n學生寫了模考反思單。\n【他的進度】${this.brief()}\n【反思】\n"""${msg.text}"""\n請：(1) 對照進度看他的自我診斷準不準；(2) 把他的「下次要改變」改成一個可以驗證的行為（如果……就……）；(3) 給 2～4 件明天就能做的事。`, false);
      return this.emit({ type: 'reply', replyTo: msg.id, text });
    }
    if (t === 'checkin') return this.supervise(msg, D.add(c.date || D.today(), 1), `學生剛打完晚間卡：${c.full ? '達標' : '未達標'}（${c.done}/${c.total} 項），專注 ${c.minutes} 分、做題 ${c.questions} 題對 ${c.correct} 題。\n他的反省："""${msg.text}"""\n先肯定做到的、點出沒做到的與原因，再排明天。`);
    if (t === 'request') {
      if (c.request === 'quizreq') return this.quiz(msg, this.pickChs(msg.text), 5, `學生的要求：${msg.text}`);
      return this.supervise(msg, D.add(D.today(), 1), `學生請你幫他排明天：${msg.text}`);
    }
    // 其他：當一般問題
    const text = await this.stream('Claude 回答', `你是台大資工所考試的家教。${AI_WHO}\n【學生說】${msg.text}`, true);
    this.emit({ type: 'reply', replyTo: msg.id, text });
  },
  pickChs(text) {
    const hit = DATA.lessons.filter(l => text && (text.includes(l.id) || text.includes(l.title.split(/[：（、]/)[0])));
    if (hit.length) return hit.slice(0, 3).map(l => l.id);
    const w = (typeof Learn !== 'undefined' && Learn.weakest) ? Learn.weakest(3).map(x => x.id) : [];
    return w.length ? w : DATA.lessons.slice(0, 3).map(l => l.id);
  },
  async grade(msg, prompt) {
    toast('Claude 批改中…（大約半分鐘）', '');
    const r = await this.call(prompt, { modelTier: 'default' }, true);
    const verdict = r && r.verdict === 'pass' ? 'pass' : 'revise', score = Math.max(0, Math.min(100, Math.round(+r.score || 0)));
    this.emit({ type: 'grade', replyTo: msg.id, verdict, score, text: String((r && r.text) || '') });
  },
  async supervise(msg, date, situation) {
    const r = await this.call(`你是台大資工所考試的督導，語氣具體、短、不說教，用數字說話。${AI_WHO}\n【學生進度】${this.brief()}\n【情況】${situation}\n回覆只要一個 JSON：{"text":"Markdown 評語（3～6 句）","tasks":["任務1","任務2"]}。tasks 3～5 項，每項具體到章節名與題數或分鐘，第一項要是 5 分鐘內就能開始的小動作。`, {}, true);
    const tasks = Array.isArray(r && r.tasks) ? r.tasks.map(String).filter(Boolean).slice(0, 6) : [];
    this.emit({ type: 'supervise', replyTo: msg && msg.id, date, tasks, text: String((r && r.text) || '') });
  },
  async quiz(msg, chs, n, extra, quiet) {
    if (!quiet) toast('Claude 出題中…', '');
    const qs = await this.call(`你是台大資工所考試的出題老師。${AI_WHO}\n${chs.map(id => this.lessonText(id, 2000)).join('\n\n')}\n${this.quizSpec(chs, n, extra)}`, {}, true);
    const ok = (Array.isArray(qs) ? qs : (qs && qs.questions) || []).filter(q => q && q.stem && Array.isArray(q.options) && q.options.length >= 2);
    if (ok.length) this.emit({ type: 'quiz', replyTo: msg && msg.id, questions: ok, text: `Claude 出了 ${ok.length} 題` });
  },
  /* 每天第一次打開：Claude 看進度，排今天的督導（只在學生之前允許過 Claude 之後才自動做） */
  async daily() {
    const today = D.today();
    if (!this.ready() || !S.st.aiOK || S.st.aiSup === today || (S.st.agentTasks || {})[today] || !S.st.onboarded) return;
    S.st.aiSup = today; S.save();
    try { await this.supervise(null, today, '早上第一次打開網站。根據進度給今天的督導，第一項任務要等於「今天」裡的下一步。'); } catch (e) { }
  },

  /* ---------- 會一個字一個字跑出來的回答框 ---------- */
  /* 白話講這段：讀不懂的那一段，用小學生的話重講（同一段 5 分鐘內再按不會重複花額度） */
  kid(l, src) {
    return this.stream('換個說法', `你是台大資工所考試的家教。${AI_WHO}
學生讀到下面這一段讀不懂。請用小學生聽得懂的方式重講，照這個順序：
1. 一句話：這段在說什麼。
2. 一個生活比喻。
3. 一個很小的數字例子，一步一步走一遍。
4. 一句「考試會怎麼考」。
可以用 \`\`\`fig 圖解（tree、array、graph、bits、lanes、timeline、bars、venn、plane、matrix、flow）。總長度不要超過 300 字。
【章節】${l.title}
【這一段】
${String(src).slice(0, 5000)}`, true, { cache: true });
  },
  stream(title, prompt, show, extra = {}) {
    if (!show) return this.call(prompt, Object.assign({ cache: false }, extra)).then(r => r.text);
    const wrap = h('div', { class: 'modal-wrap', role: 'dialog', 'aria-modal': 'true' });
    wrap.innerHTML = `<div class="modal ai-sheet"><h2>${esc(title)}</h2><div class="prose ai-out"><p class="muted">Claude 思考中…（大約 10～30 秒）</p></div><div class="row end"><button class="btn" data-x>關閉</button></div></div>`;
    document.body.appendChild(wrap);
    const out = $('.ai-out', wrap), ctl = new AbortController(); let raf = 0, last = '';
    const paint = () => { raf = 0; out.innerHTML = md(last, { br: true }); };
    $('[data-x]', wrap).onclick = () => { wrap.remove(); };
    return this.call(prompt, Object.assign({ cache: false }, extra, { signal: ctl.signal, onText: ({ text }) => { last = text; if (!raf) raf = requestAnimationFrame(paint); } }))
      .then(r => { last = r.text; paint(); return r.text; })
      .catch(e => { if (e && e.text) { last = e.text; paint(); } else wrap.remove(); throw e; });
  },

  /* ---------- 聊天：Claude 一次只問一個小問題，學生只要回一兩句（費曼關卡、晨間回想共用） ---------- */
  chat({ title, rules, done, onDone, after }) {
    const turns = [{ role: 'user', content: rules + '\n\n（開始。請問第一個問題。）' }], said = [];
    const wrap = h('div', { class: 'modal-wrap', role: 'dialog', 'aria-modal': 'true' });
    wrap.innerHTML = `<div class="modal ai-sheet chat"><h2>${esc(title)}</h2><div class="chat-log"></div>
      <div class="chat-in"><textarea rows="2" placeholder="用一兩句話回答就好；不會就打「不會」"></textarea><button class="btn primary" data-send>送出</button></div>
      <div class="row end"><button class="btn ghost" data-x>先不要</button></div></div>`;
    document.body.appendChild(wrap);
    const log = $('.chat-log', wrap), ta = $('textarea', wrap), send = $('[data-send]', wrap);
    const bubble = (who, text) => { const b = h('div', { class: 'bub ' + who }); b.innerHTML = md(text, { br: true }); log.appendChild(b); log.scrollTop = log.scrollHeight; return b; };
    let ctl = null, finished = false;
    const ask = async () => {
      send.disabled = true; ta.disabled = true;
      const b = bubble('ai', '…'); ctl = new AbortController();
      try {
        const hist = turns.length > 25 ? [turns[0]].concat(turns.slice(-24)) : turns;
        const r = await this.call(hist, { cache: false, signal: ctl.signal, onText: ({ text }) => { b.innerHTML = md(text, { br: true }); log.scrollTop = log.scrollHeight; } });
        turns.push({ role: 'assistant', content: r.text }); b.innerHTML = md(r.text, { br: true });
        if (done.test(r.text)) {
          finished = true; onDone(r.text.replace(done, '').trim(), said);
          send.parentElement.remove(); const x = $('[data-x]', wrap); x.textContent = '完成，下一步'; x.className = 'btn primary';
          return;
        }
      } catch (e) { b.remove(); if (e && e.code === 'cancelled') return; }
      send.disabled = false; ta.disabled = false; ta.focus();
    };
    send.onclick = () => { const v = ta.value.trim(); if (!v) return; ta.value = ''; said.push(v); bubble('me', v); turns.push({ role: 'user', content: v }); ask(); };
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send.onclick(); } });
    $('[data-x]', wrap).onclick = () => { if (ctl) ctl.abort(); wrap.remove(); if (after) after(finished); };
    ask();
  },

  /* 費曼關卡：所有關鍵點都由他自己說出來才算過 */
  feynChat(l) {
    this.chat({
      title: '聊天過關：' + l.title.split(/[：（]/)[0],
      rules: `你在用「費曼學習法」帶學生過關，主題是「${l.title}」。${AI_WHO}
【關卡題目】${l.feynman}
【他必須自己說出來的關鍵點】\n${(l.rubric || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}
${this.lessonText(l.id, 3000)}
規則：
- 你每次只問**一個很小的問題**（一句話），讓他用一兩句回答。從最簡單的那個關鍵點開始。
- 他答對：說「對！」再往下一個關鍵點。答錯或含糊：用更簡單的話、或一個數字例子提示，再問一次。不要直接把答案講完。
- 他說「不知道／不會」：先用最白話的方式講那一點（3 句內），再換個角度問他一次。
- 每則訊息最多 3 句。
- 所有關鍵點都由他自己說出來之後，最後一則訊息第一行只寫「【通過】」，第二行用兩句話總結他講對了什麼，第三行給一個更難一點的延伸問題。`,
      done: /【通過】\s*/,
      onDone: (text, said) => {
        const ls = S.lesson(l.id);
        const rec = { id: uid('in'), ts: new Date().toISOString(), from: 'student', dir: 'out', type: 'feynman', text: '（聊天過關）\n' + said.join('\n'), ctx: { lesson: l.id, title: l.title, prompt: l.feynman, rubric: l.rubric, attempt: 1, chat: true } };
        S.st.msgs.push(rec); if (!ls.read) { ls.read = D.today(); const L = S.day(); if (!L.lessons.includes(l.id)) L.lessons.push(l.id); }
        S.day().feyn.push(l.id);
        this.emit({ type: 'grade', replyTo: rec.id, verdict: 'pass', score: 85, text: '**判定：通過（聊天過關）**\n\n' + text });
      },
      after: ok => { if (ok && S.st.onboarded && Auto.current()) nextStep(); else route(); },
    });
  },

  /* 晨間回想：不用打 120 字，Claude 問 4 個小問題 */
  blurtChat(chs) {
    this.chat({
      title: '回想昨天：' + (chs.map(id => LESSON[id] ? LESSON[id].title.split(/[：（]/)[0] : id).join('、') || '昨天的內容'),
      rules: `你在幫學生做「不看書的回想」（提取練習），內容是他昨天讀的章節。${AI_WHO}
${chs.map(id => this.lessonText(id, 2000)).join('\n\n')}
規則：
- 一共問 4 個問題，一次只問一個（一句話），從最核心、最簡單的開始。他用一兩句回答。
- 答對就說「對！」然後下一題；答錯或說不會：用 2 句話把正確的講清楚，再下一題。不要讓他卡住。
- 第 4 題回完後，最後一則訊息第一行只寫「【完成】」，接著列：記得的（一句）、漏掉的（最多 3 點）、今天要再看一次的段落。`,
      done: /【完成】\s*/,
      onDone: (text, said) => {
        S.day().blurt = { ts: new Date().toISOString(), text: '（聊天回想）\n' + said.join('\n'), chat: true };
        const rec = { id: uid('in'), ts: new Date().toISOString(), from: 'student', dir: 'out', type: 'blurt', text: '（聊天回想）\n' + said.join('\n'), ctx: { lessons: chs, date: D.today(), chat: true } };
        S.st.msgs.push(rec); this.emit({ type: 'reply', replyTo: rec.id, text });
      },
      after: ok => { if (ok && S.st.onboarded && (location.hash.slice(1) || 'go') === 'go') nextStep(); else route(); },
    });
  },
};
