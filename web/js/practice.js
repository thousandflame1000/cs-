/* 資工所衝刺站 — 練習引擎：章節練習、交錯練習、錯題複習、Agent 出題、隨機題、模擬考 */
'use strict';

function normAns(s) {
  return String(s).trim().toLowerCase()
    .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[\s　]/g, '').replace(/[，、；;]/g, ',').replace(/（/g, '(').replace(/）/g, ')').replace(/－/g, '-')
    .replace(/^[\[{(]/, '').replace(/[\]})]$/, '').replace(/,+$/, '');
}
function numVal(s) {
  if (/^-?\d+(\.\d+)?(e[-+]?\d+)?$/i.test(s)) return parseFloat(s);
  const m = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/); if (m) return parseFloat(m[1]) / parseFloat(m[2]);
  return null;
}
function fillCorrect(input, answers) {
  const a = normAns(input); if (!a) return false;
  return answers.some(x => {
    const b = normAns(x); if (a === b) return true;
    const na = numVal(a), nb = numVal(b);
    if (na != null && nb != null) return Math.abs(na - nb) <= 1e-6 + 1e-3 * Math.abs(nb);
    return false;
  });
}
const LETTERS = 'ABCDEFGH';

/* ---------- 多個答案的填空（2026-11-11 學生：「|A∪B| 和 |A△B|」只有一個框、不知道怎麼填）----------
   題目寫 `?? 欄名1,欄名2` 而且欄數跟答案一樣時，分成好幾個有名字的框；逗號在 $…$ 或括號裡不算分隔。
   沒有欄名、答案又是好幾個值（例如一串位置），維持一個框，但明講「用逗號隔開」。 */
function splitTop(s) {
  const out = []; let d = 0, m = false, cur = '';
  for (const c of String(s)) {
    if (c === '$') m = !m;
    if (!m) { if ('([{（'.includes(c)) d++; else if (')]}）'.includes(c)) d = Math.max(0, d - 1); }
    if ((c === ',' || c === '，') && !m && !d) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur); return out.map(x => x.trim());
}
const ansParts = q => splitTop(String((q.ans || [])[0] || '').replace(/[、；;]/g, ',')).length;
function fillParts(q) { if (!q || !q.fmt) return null; const L = splitTop(q.fmt); return L.length >= 2 && L.length === ansParts(q) ? L : null; }
function fillHint(q) {
  if (q.fmt && !fillParts(q)) return q.fmt;
  return ansParts(q) >= 2 ? '答案不只一個值：照題目問的順序，用逗號隔開' : '在這裡輸入答案';   // 不寫有幾個值（像 Jordan 區塊有幾塊，個數本身就是答案）
}
function fillHtml(q, cls, val, disabled, idAttr) {
  const L = fillParts(q), dis = disabled ? ' disabled' : '';
  if (!L) return `<input class="${cls}"${idAttr || ''} type="text" autocomplete="off" spellcheck="false" placeholder="${esc(fillHint(q))}" value="${esc(val || '')}"${dis}>`;
  const v = splitTop(val || '');
  return `<div class="fill-multi"><input class="${cls}"${idAttr || ''} type="hidden" value="${esc(val || '')}"${dis}>${L.map((l, i) =>
    `<label class="fill-part"><span class="fill-lab">${mdLine(l)}</span><input class="fill-pi" type="text" autocomplete="off" spellcheck="false" value="${esc(v[i] || '')}"${dis}></label>`).join('')}</div>`;
}
function wireFillParts() { }   // 已改成下面整頁共用的處理，留著讓舊的呼叫不出錯
/* 多欄框整頁共用：任何頁面（知識點、練習、模擬考）畫出來的 .fill-pi 都會自動接好 */
document.addEventListener('input', e => {
  const p = e.target; if (!p.classList || !p.classList.contains('fill-pi')) return;
  const w = p.closest('.fill-multi'), h = w.querySelector('input[type=hidden]');
  h.value = [...w.querySelectorAll('.fill-pi')].map(x => x.value.trim()).join(','); h.dispatchEvent(new Event('input', { bubbles: true }));
});
document.addEventListener('keydown', e => {   // Enter：跳下一格；最後一格交給原本的送出
  const p = e.target; if (e.key !== 'Enter' || !p.classList || !p.classList.contains('fill-pi')) return;
  e.preventDefault(); e.stopPropagation();
  const w = p.closest('.fill-multi'), ps = [...w.querySelectorAll('.fill-pi')], i = ps.indexOf(p);
  if (i < ps.length - 1) ps[i + 1].focus(); else w.querySelector('input[type=hidden]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
}, true);

const Practice = {
  sess: null,
  persist() {
    if (this.sess) this.sess.paperMode = this.paperOn();
    S.st.practiceDraft = { updated: Date.now(), sessionId: this.sess?.t0 ?? S.st.practiceDraft?.sessionId ?? null, session: this.sess };
    if (!S.saveNow()) {
      if (!this.storageWarned) toast('本機空間不足或無法存取，這一回可能無法續做', 'bad');
      this.storageWarned = true;
    }
  },
  restore() {
    const s = S.st.practiceDraft?.session;
    this.sess = s && Array.isArray(s.ids) && Array.isArray(s.results) && s.opts && Number.isInteger(s.i) ? s : null;
  },
  leaveSummary() {
    this.sess = null;
    this.persist();
  },
  applyDraft(root, q, draft = {}, name = 'opt') {
    if (Array.isArray(draft.choice)) {
      $$(`input[name="${name}"]`, root).forEach(input => { input.checked = draft.choice.includes(+input.value); });
    }
    const field = $(`#${name}-${q.type === 'fill' ? 'fill' : 'essay'}`, root);
    if (field) field.value = draft.text || '';
    $$('.fill-pi', root).forEach((input, i) => { input.value = (draft.parts || [])[i] || ''; });
    const reason = $('#reasonText', root);
    if (reason) { reason.value = draft.reason || ''; if (reason.value) reason.closest('details').open = true; }
  },
  saveDraft(root, q, name = 'opt') {
    const draft = this.sess.draft || (this.sess.draft = {});
    if (q.type === 'single' || q.type === 'multi') draft.choice = this.readResponse(q, root, name) || [];
    else {
      draft.text = $(`#${name}-${q.type === 'fill' ? 'fill' : 'essay'}`, root).value;
      draft.parts = $$('.fill-pi', root).map(input => input.value);
    }
    const reason = $('#reasonText', root);
    if (reason) draft.reason = reason.value;
    this.persist();
  },

  getQ(id) { return id.startsWith('gen:') ? this.genQ(id) : QBANK.get(id); },
  genQ(id) { const [, gid, seed] = id.split(':'); try { return Gen.make(gid, +seed); } catch (e) { return null; } },

  start(ids, opts = {}) {
    ids = ids.filter(id => this.getQ(id));
    if (opts.shuffle) ids = rng(Date.now() & 0xffffffff).shuffle(ids);
    if (opts.limit) ids = ids.slice(0, opts.limit);
    if (!ids.length) { toast('沒有可以練的題目', ''); return; }
    if (!this.canReplace()) return;
    if (window.__fromAuto && Date.now() - window.__fromAuto < 3000) { opts = Object.assign({}, opts, { auto: true }); window.__fromAuto = 0; }
    if (!(opts.review || opts.pretest || opts.base || opts.fix || opts.ex || opts.mock || opts.ramp === false)) { ids = this.rampSort(ids); opts = Object.assign({}, opts, { ramp: true }); }
    this.sess = { ids, i: 0, opts, results: [], t0: Date.now(), state: 'ask' };
    this.persist();
    if (location.hash === '#practice') route(); else location.hash = '#practice';
  },

  canReplace() {
    if (!this.sess && !this.restoreChecked) { this.restoreChecked = true; this.restore(); }
    const s = this.sess;
    if (!s || s.i >= s.ids.length || s.mock?.done) return true;
    return !(s.mock || s.i > 0 || s.feedback || s.draft) || confirm('開始新一回會結束目前這回。已送出的答案會保留。要開始嗎？');
  },

  /* 關卡制：小怪（★）→ 菁英（★★）→ 魔王（★★★），由簡入難，不一上來就開大 */
  STAGE: { 1: { ic: 'star', name: '小怪', sub: '先熱身，一步就想得出來' }, 2: { ic: 'sword', name: '菁英', sub: '要多想幾步' }, 3: { ic: 'crown', name: '魔王', sub: '台大難度，慢慢寫沒關係' } },
  /* 推薦：不用自己挑，依序推「快忘的 → 有漏的 → 下一顆星 → 新章 → 卡片」 */
  recs() {
    const out = [], today = D.today();
    const due = S.dueReviews(); if (due.length >= 3) out.push({ k: 'due', ic: 'review', t: '快忘的題目', sub: `${Math.min(due.length, 15)} 題`, go: () => this.start(this.rampSort(due).slice(0, 15), { title: '到期複習', review: true }) });
    this.dictRedo().slice(0, 1).forEach(x => out.push({ k: 'dict:' + x.ch, ic: 'pen', t: LESSON[x.ch].title, sub: `重默 · 上次 ${x.hit}/${x.total}`, go: () => this.renderDictate(x.ch) }));
    const pd = S.planDay(), planned = []; (DATA.plan || []).forEach(p => { if (p.day <= Math.max(1, pd)) (p.lessons || []).forEach(x => planned.includes(x) || planned.push(x)); });
    const read = DATA.lessons.filter(l => (S.st.lessons[l.id] || {}).read).map(l => l.id);
    let pool = [...new Set([...read, ...planned])].filter(id => LESSON[id]); if (!pool.length) pool = [DATA.lessons[0].id];
    const order = id => { const i = planned.indexOf(id); return i < 0 ? 999 : i; };
    pool.map(id => ({ id, st: this.starGet(id) })).filter(x => x.st < 3).sort((a, b) => a.st - b.st || (this.examF(b.id) - this.examF(a.id)) || order(a.id) - order(b.id)).slice(0, 3).forEach(x => {
      const d = x.st + 1, ids = QBANK.all().filter(q => q.ch === x.id && q.type !== 'essay' && q.src !== 'agent' && (q.diff || 2) === d).map(q => q.id); if (!ids.length) return;
      out.push({ k: 'st:' + x.id, ic: this.STAGE[d].ic, t: LESSON[x.id].title, sub: `${this.STAGE[d].name}關 · ${ids.length} 題`, stars: x.id, go: () => this.start(ids, { title: LESSON[x.id].title, ch: x.id, direct: true }) });
    });
    const nx = planned.find(id => !(S.st.lessons[id] || {}).read) || DATA.lessons.map(l => l.id).find(id => !(S.st.lessons[id] || {}).read);
    if (nx) out.push({ k: 'read:' + nx, ic: 'book', t: LESSON[nx].title, sub: '新章', go: () => { this.sess = null; location.hash = '#' + nx; } });
    const cd = Learn.cardDue().length; if (cd) out.push({ k: 'cards', ic: 'cards', t: '必背卡', sub: `${cd} 張`, go: () => { this.sess = null; location.hash = '#cards'; } });
    return out;
  },
  feedHtml() {
    const r = this.recs(); if (!r.length) return '';
    const i = (this.fi || 0) % r.length, c = r[i], rest = r.filter((_, k) => k !== i).slice(0, 3);
    const ts = S.day().stars || 0, goal = this.DAILY_STARS;
    return `<section class="feed-hero">
      <div class="fh-daily" title="每天拿 ${goal} 顆星開寶箱">${ts >= goal ? '今天的寶箱已開' : `今天 ${ICON('star', 'on')} ${ts} / ${goal}`}</div>
      <h2>${esc(c.t)}</h2>
      <div class="fh-sub">${esc(c.sub)}${c.stars ? this.starHtml(c.stars) : ''}</div>
      <button class="go-start" id="fhGo">開打</button>
      ${r.length > 1 ? '<button class="btn ghost sm" id="fhSkip">換一個</button>' : ''}
      ${rest.length ? `<div class="fh-next">${rest.map(x => `<button class="fh-n" data-rk="${esc(x.k)}">${esc(x.t.length > 12 ? x.t.slice(0, 12) + '…' : x.t)}</button>`).join('')}</div>` : ''}
    </section>`;
  },
  wireFeed() {
    const r = this.recs(); if (!r.length) return; const i = (this.fi || 0) % r.length;
    const go = $('#fhGo'); if (go) go.onclick = () => r[i].go();
    const sk = $('#fhSkip'); if (sk) sk.onclick = () => { this.fi = i + 1; this.view(); };
    $$('[data-rk]').forEach(b => b.onclick = () => { const x = r.find(y => y.k === b.dataset.rk); if (x) x.go(); });
  },
  /* 考古題考頻（content/exams/meta.md → DATA.examFreq，各章占比）；沒有資料時大家一樣重 */
  examF(ch) { return (DATA.examFreq || {})[ch] || 0; },
  hasExam() { return !!Object.keys(DATA.examFreq || {}).length; },
  dOf(id) { return ((this.getQ(id) || {}).diff) || 2; },
  headHtml(q) {
    const s = this.sess, total = s.opts.adaptive ? s.opts.limit : s.ids.length;
    if (!s.opts.ramp) return `<header class="page-head slim"><div class="eyebrow">${esc(s.opts.title || '練習')}｜第 ${s.i + 1} / ${total} 題</div>
      <div class="progress"><i style="width:${(s.i / total) * 100}%"></i></div></header>`;
    const d = q.diff || 2, st = this.STAGE[d], n = s.ids.filter(id => this.dOf(id) === d).length;
    const hit = s.results.filter(r => !r.skipped && r.ok && this.dOf(r.qid) === d).length, hp = Math.max(0, n - hit);
    return `<header class="page-head slim"><div class="eyebrow">${esc(s.opts.title || '練習')}｜第 ${s.i + 1} / ${total} 題</div>
      <div class="boss"><span class="boss-n">${st.name}</span><span class="hp" title="怪物血量"><i style="width:${hp / n * 100}%"></i></span><span class="hp-n">${hp}/${n}</span>${(s.combo || 0) >= 2 ? `<span class="combo">${ICON('bolt')}×${s.combo}</span>` : ''}</div></header>`;
  },
  hit(ok, q) {
    const s = this.sess; s.combo = ok ? (s.combo || 0) + 1 : 0;
    if (ok && s.combo >= 3 && typeof Rewards !== 'undefined') Rewards.float(s.combo + ' 連擊', 'combo');
    const h = $('.page-head.slim', main()); if (h && s.opts.ramp) { h.outerHTML = this.headHtml(q); const b = $('.boss .hp i', main()); if (b && ok) { b.parentElement.classList.add('hurt'); } }
  },
  store(k, lsKey) {
    if (!S.st[k]) { let o = {}; try { o = JSON.parse(localStorage.getItem(lsKey) || '{}') || {}; } catch (e) { } S.st[k] = o; if (Object.keys(o).length) S.save(); }
    return S.st[k];
  },
  /* 星等：每章小怪／菁英／魔王三關，該關答對 ≥ 60% 就拿到那顆星 */
  DAILY_STARS: 3,
  starGet(ch) { return this.store('stars', 'chStars')[ch] || 0; },
  starHtml(ch) { const n = this.starGet(ch); return `<span class="stars3" title="${n}/3 星">${ICON('star', 'on').repeat(n)}${ICON('star', 'off').repeat(3 - n)}</span>`; },
  stageClear(d, res) {
    const s = this.sess, ch = s.opts.ch; if (!ch || !res.length) return false;
    const ok = res.filter(r => r.ok).length / res.length >= .6; if (!ok) return false;
    const o = this.store('stars', 'chStars'); if ((o[ch] || 0) < d) {
      o[ch] = d; const L = S.day(); L.stars = (L.stars || 0) + 1; S.save();
      if (L.stars === this.DAILY_STARS && typeof Rewards !== 'undefined') setTimeout(() => { Rewards.dropOpen('gold'); S.save(); }, 900);
      return true;
    }
    return false;
  },
  rampSort(ids) { const d = id => { const q = this.getQ(id); return (q && q.diff) || 2; }; return ids.map((id, i) => [id, i]).sort((a, b) => d(a[0]) - d(b[0]) || a[1] - b[1]).map(x => x[0]); },
  renderStage(qid) {
    const s = this.sess, d = this.getQ(qid).diff || 2, st = this.STAGE[d] || this.STAGE[2];
    const n = s.ids.filter(id => ((this.getQ(id) || {}).diff || 2) === d).length;
    const kinds = [...new Set(s.ids.map(id => (this.getQ(id) || {}).diff || 2))].sort();
    const pd = s.stage, prevRes = pd ? s.results.filter(r => !r.skipped && ((this.getQ(r.qid) || {}).diff || 2) === pd) : [];
    const pOk = prevRes.filter(r => r.ok).length, weak = prevRes.length >= 2 && pOk / prevRes.length < .5;
    const prevCh = pd && (this.getQ(s.ids[s.i - 1]) || {}).ch;
    const gotStar = prevRes.length && !weak && this.stageClear(pd, prevRes);
    s.stage = d;
    s.stagePending = true;
    this.persist();
    main().innerHTML = `
    <header class="page-head slim"><div class="eyebrow">${esc(s.opts.title || '練習')}</div></header>
    <section class="card stage-card">
      ${prevRes.length ? `<div class="stage-clear ${weak ? 'weak' : ''}">${weak ? ICON('close') : ICON('check')} ${this.STAGE[pd].name}關 ${pOk}/${prevRes.length}${gotStar ? '　' + ICON('star') + ' +1' : ''}</div>` : ''}
      ${weak && prevCh && LESSON[prevCh] ? `<div class="row"><button class="btn" id="stBack">${ICON('book')} 先回教材補血</button></div>` : ''}
      <div class="stage-trail">${kinds.map(k => `<span class="st-dot${k < d ? ' done' : ''}${k === d ? ' now' : ''}">${icHtml(this.STAGE[k].ic)}</span>`).join('<i></i>')}</div>
      <div class="stage-ic" aria-hidden="true">${icHtml(st.ic)}</div>
      <h2>${st.name}關</h2>
      <p class="muted">${n} 題</p>
      <div class="row end"><button class="btn primary big" id="stGo">開打</button></div>
    </section>
    <div class="row end"><button class="btn ghost" id="qQuit">結束這回</button></div>`;
    $('#stGo').onclick = () => { s.stagePending = false; this.persist(); this.renderCard(); };
    if ($('#stBack')) $('#stBack').onclick = () => { this.sess = null; location.hash = '#' + prevCh; };
    if (prevRes.length && !weak && typeof Rewards !== 'undefined') { Rewards.chime('big'); Rewards.confetti(40); }
    $('#qQuit').onclick = () => { s.ids = s.ids.slice(0, s.i); this.view(); };
  },
  startAdaptive(only, options = {}) {
    const first = Learn.pick(new Set(), null, only);
    if (!first) { toast(only ? '這章還沒有題目' : '先上完一堂課：練習只從你學過的章出題', ''); return; }
    if (!this.canReplace()) return;
    const m0 = {}; DATA.lessons.forEach(l => m0[l.id] = Learn.mastery(l.id));
    this.sess = { ids: [first.id], i: 0, opts: { title: only ? '自適應練習：' + LESSON[only].title : '自適應練習', adaptive: true, limit: 15, only, ...options }, results: [], t0: Date.now(), state: 'ask', m0 };
    this.persist();
    if (location.hash === '#practice') route(); else location.hash = '#practice';
  },
  advance() {
    const s = this.sess; s.i++;
    delete s.draft;
    delete s.feedback;
    s.state = 'ask';
    s.hint = 0;
    if (s.opts.adaptive && s.i >= s.ids.length && s.ids.length < s.opts.limit) { const prev = (this.getQ(s.ids[s.i - 1]) || {}).ch; const nx = Learn.pick(new Set(s.ids), prev, s.opts.only); if (nx) s.ids.push(nx.id); }
    this.view();
  },
  finishRound() {
    const s = this.sess;
    const answeredCurrent = s.feedback && s.results[s.results.length - 1]?.qid === s.ids[s.i];
    s.ids = s.ids.slice(0, s.i + (answeredCurrent ? 1 : 0));
    s.i = s.ids.length;
    this.view();
  },

  /* ---------- home ---------- */
  view() {
    if (!this.sess && !this.restoreChecked) { this.restoreChecked = true; this.restore(); }
    if (this.sess && this.sess.mock) return this.renderMock();
    if (this.sess) this.persist();
    if (this.sess) return this.sess.i >= this.sess.ids.length ? this.renderSummary() : this.renderCard();
    const studied = DATA.lessons.filter(l => (S.st.lessons[l.id] || {}).read).map(l => l.id);
    const due = S.dueReviews();
    const agq = S.st.agentQuiz.filter(q => !S.st.answers[q.id]);
    main().innerHTML = `
    ${this.feedHtml()}
    <details class="self-pick" ${this.pickOpen ? 'open' : ''}><summary>自己挑</summary>
    <div class="mode-grid">
      <button class="mode hot" id="mAdapt"><b>自適應練習</b><span>15 題</span></button>
      ${due.length ? `<button class="mode" id="mDue"><b>到期複習</b><span>${due.length} 題</span></button>` : ''}
      <button class="mode" id="mInter"><b>混合練習</b><span>20 題</span></button>
      ${agq.length ? `<button class="mode" id="mAgent"><b>Agent 出題</b><span>${agq.length} 題</span></button>` : ''}
      <button class="mode" id="mHard"><b>難題</b><span>15 題</span></button>
      <a class="mode" href="#gen"><b>隨機計算題</b><span>∞</span></a>
      <button class="mode" id="mAll"><b>全題庫</b><span>不受解鎖限制 · 20 題</span></button>
    </div>
    <div class="chips" style="margin:8px 0 4px">${DATA.subjects.map(sb => `<button class="chip sm" data-all="${sb.id}">全題庫：${esc(sb.short || sb.name)}</button>`).join('')}</div>
    <div class="row wrap"><label for="practiceChapter">按章刷題</label><select id="practiceChapter">${DATA.subjects.map(sb => `<optgroup label="${esc(sb.name)}">${DATA.lessons.filter(l => l.subject === sb.id).map(l => `<option value="${esc(l.id)}" ${this.pickedChapter === l.id ? 'selected' : ''}>${esc(l.title)}</option>`).join('')}</optgroup>`).join('')}</select><button class="btn" id="practiceChapterStart">開始 20 題</button></div>
    <p class="muted small">題庫：固定 ${QBANK.all().filter(q => q.src !== 'agent').length} 題＋${Gen.list.length} 種隨機題型（數字每次不同，答案由程式算）。題庫答案尚未全面覆核。</p>
    <h2 class="sec">題庫計時練習</h2>
    <div class="mode-grid">${GROUPS.map(g => `<button class="mode mock" data-mock="${g.id}"><b>${g.name}</b><span>${g.mins} 分鐘</span></button>`).join('')}</div>
    <h2 class="sec">章節</h2>
    <div class="subj-tabs" role="tablist">${DATA.subjects.map(sb => `<button class="stab${sb.id === this.sj ? ' on' : ''}" data-sj="${sb.id}" style="--sc:var(--s-${sb.id})"><span class="sdot"></span>${esc(sb.short || sb.name)}</button>`).join('')}</div>
    <div id="chList" class="ch-list"></div></details>`;
    // 只出學會的知識點（課程規格 H10）
    const pool = () => QBANK.all().filter(q => q.src !== 'agent' && q.kp && KP.learned(q.kp));
    // 參數化隨機題：知識點學會了，那一型就解鎖；每次給新數字
    const gpool = (f = () => true) => Gen.forKP(k => KP.learned(k)).filter(f);
    const mixIds = (qs, gs, n) => rng(Date.now() & 0xffffffff).shuffle([...qs.map(q => q.id), ...gs.flatMap(g => [Gen.fresh(g), Gen.fresh(g)])]).slice(0, n);
    $('#mInter').onclick = () => {
      const src = pool(), gs = gpool(); if (!src.length && !gs.length) { toast('先學會一個知識點：練習只出你學會的', ''); return; }
      this.start(mixIds(src, gs, 20), { title: '交錯混合練習' });
    };
    $('#mAll').onclick = () => this.start(mixIds(QBANK.all().filter(q => q.src !== 'agent' && q.type !== 'essay'), Gen.list.filter(g => g.kp), 20), { title: '全題庫（不受解鎖限制）' });
    $('.self-pick').ontoggle = event => { this.pickOpen = event.target.open; };
    $('#practiceChapterStart').onclick = () => {
      const chapter = $('#practiceChapter').value;
      this.pickedChapter = chapter;
      const qs = QBANK.all().filter(q => q.ch === chapter && q.src !== 'agent' && q.type !== 'essay');
      const unseen = qs.filter(q => !S.st.answers[q.id]);
      const random = rng(Date.now() & 0xffffffff);
      const candidates = random.shuffle(unseen).concat(random.shuffle(qs.filter(q => S.st.answers[q.id])));
      this.start(candidates.map(q => q.id), { title: LESSON[chapter].title, limit: 20, ramp: false });
    };
    $$('[data-all]').forEach(b => b.onclick = () => { const sj = b.dataset.all; this.start(mixIds(QBANK.all().filter(q => q.src !== 'agent' && q.type !== 'essay' && q.subject === sj), Gen.list.filter(g => g.kp && g.subject === sj), 20), { title: '全題庫：' + b.textContent.replace('全題庫：', '') }); });
    if ($('#mDue')) $('#mDue').onclick = () => this.start(due, { title: '到期複習', review: true });
    $('#mAdapt').onclick = () => this.startAdaptive();
    if ($('#mAgent')) $('#mAgent').onclick = () => this.start(agq.map(q => q.id), { title: 'Agent 出題' });
    $('#mHard').onclick = () => {
      let src = pool().filter(q => q.diff >= 3); const st = src.filter(q => studied.includes(q.ch));
      this.start(mixIds(st.length >= 10 ? st : src, gpool(g => (g.diff || 2) >= 3), 15), { title: '台大難度題' });
    };
    $$('[data-mock]').forEach(b => b.onclick = () => this.startMock(b.dataset.mock));
    this.wireFeed();
    const drawCh = () => {
      $$('.stab').forEach(b => b.classList.toggle('on', b.dataset.sj === this.sj));
      $('#chList').innerHTML = DATA.lessons.filter(l => l.subject === this.sj).map(l => { const cs = chapterStats(l.id), d = this.dictGet(l.id), nl = pool().filter(q => q.ch === l.id).length + 2 * gpool(g => g.ch === l.id).length; return `<div class="ch-row"><div class="ch-t">${esc(l.title)}${this.starHtml(l.id)}</div><div class="ch-act"><button class="btn sm" data-ch="${l.id}" ${nl ? '' : 'disabled'} title="${nl ? '' : '這章還沒有學會的知識點'}">做題 <small>${cs.att}/${cs.n}${cs.acc != null ? '・' + Math.round(cs.acc * 100) + '%' : ''}</small></button>${(l.rubric || []).length ? `<button class="btn sm" data-dict="${l.id}">${ICON('pen')} 默寫 <small>${d ? d.hit + '/' + d.total : '—'}</small></button>` : ''}</div></div>`; }).join('');
      $$('[data-ch]').forEach(b => b.onclick = () => this.start([...pool().filter(q => q.ch === b.dataset.ch).map(q => q.id), ...gpool(g => g.ch === b.dataset.ch).flatMap(g => [Gen.fresh(g), Gen.fresh(g)])], { title: LESSON[b.dataset.ch].title, ch: b.dataset.ch }));
      $$('[data-dict]').forEach(b => b.onclick = () => this.renderDictate(b.dataset.dict));
    };
    if (!this.sj) { const rd0 = this.dictRedo()[0]; this.sj = rd0 ? LESSON[rd0.ch].subject : DATA.subjects[0].id; }
    $$('.stab').forEach(b => b.onclick = () => { this.sj = b.dataset.sj; drawCh(); });
    drawCh();
  },

  /* ---------- question card ---------- */
  answerUI(q, name = 'opt') {
    if (q.type === 'single' || q.type === 'multi') {
      return `<div class="opts" role="${q.type === 'single' ? 'radiogroup' : 'group'}">${q.opts.map((o, k) => `<label class="opt"><input type="${q.type === 'single' ? 'radio' : 'checkbox'}" name="${name}" value="${k}"><span class="ol">${LETTERS[k]}</span><span class="ot">${md(o).replace(/^<p>|<\/p>$/g, '')}</span></label>`).join('')}</div>${q.type === 'multi' && name === 'opt' ? '<p class="muted small">複選題須全對才算答對，解析另列判對的選項數。</p>' : ''}`;
    }
    if (q.type === 'fill') return `<div class="fill">${fillHtml(q, 'fill-in', '', false, ` id="${name}-fill"`)}</div>`;
    return `<textarea id="${name}-essay" rows="9" placeholder="寫出完整推理或證明。每一步都要有理由。"></textarea>`;
  },
  readResponse(q, root, name = 'opt') {
    if (q.type === 'single') { const r = $(`input[name="${name}"]:checked`, root); return r ? [+r.value] : null; }
    if (q.type === 'multi') { const r = $$(`input[name="${name}"]:checked`, root).map(x => +x.value); return r.length ? r : null; }
    if (q.type === 'fill') { const v = $(`#${name}-fill`, root).value.trim(); return v || null; }
    const v = $(`#${name}-essay`, root).value.trim(); return v || null;
  },
  isCorrect(q, resp) {
    if (resp == null) return false;
    if (q.type === 'single' || q.type === 'multi') { const a = [...q.ans].sort().join(','), b = [...resp].sort().join(','); return a === b; }
    if (q.type === 'fill') return fillCorrect(resp, q.ans);
    return null;
  },
  /* 台大資演、計結作業系統的複選題：每個選項單獨計分，判對（該勾的勾、不該勾的沒勾）一個得 1 分；整題不作答 0 分 */
  ntuScore(q, resp) {
    if (q.type !== 'multi') return null;
    const n = q.opts.length; if (resp == null || !resp.length) return { got: 0, n };
    let got = 0; for (let k = 0; k < n; k++) if (q.ans.includes(k) === resp.includes(k)) got++;
    return { got, n };
  },
  ntuTag(q, resp) { const t = this.ntuScore(q, resp); return t ? `<span>判對選項：<b>${t.got}/${t.n}</b></span>` : ''; },
  fmtAns(q) {
    if (q.type === 'single' || q.type === 'multi') return q.ans.map(k => LETTERS[k]).join('、');
    if (q.type === 'fill') return q.ans[0];
    return '見詳解';
  },
  fmtResp(q, r) {
    if (r == null) return '（未作答）';
    if (q.type === 'single' || q.type === 'multi') return r.map(k => LETTERS[k]).join('、');
    return String(r);
  },
  metaLine(q) {
    const ch = LESSON[q.ch];
    return `<span class="chip sm" style="--sc:var(--s-${q.subject})"><span class="sdot"></span>${esc(ch ? ch.title : (q.chTitle || q.ch))}</span>
      <span class="stars" title="難度">${'★'.repeat(q.diff || 2)}${'☆'.repeat(3 - (q.diff || 2))}</span>
      ${q.type === 'multi' ? '<span class="muted small">複選</span>' : ''}`;
  },

  /* ---------- 作答卡（2026-11-14 重寫）：題目＋選項永遠可以點，手寫草稿紙在旁邊（寬螢幕右欄、手機在選項下面），
     一顆主按鈕「送出答案」；把握度是可選的小切換（鍵盤 1／2／3 直接用那個把握度送出）。
     舊的「紙筆模式＋三選一自評」只留給：還原舊草稿裡已翻答案的紙筆題（feedback.kind === 'paper'）。 ---------- */
  wide() { return !!(window.matchMedia && matchMedia('(min-width: 1180px)').matches); },
  renderCard() {
    const s = this.sess; const qid = s.ids[s.i]; const q = this.getQ(qid); if (typeof Notes !== 'undefined') Notes.setCtx({ k: q && q.kp, q: qid });
    if (!q) return this.advance();
    if ((s.opts.ex || []).includes(qid)) return this.renderExample(q, qid);
    if (s.opts.ramp && (s.stagePending || s.stage !== (q.diff || 2))) { if (s.opts.direct && s.stage == null) s.stage = q.diff || 2; else return this.renderStage(qid); }
    const feedback = s.feedback;
    s.state = 'ask'; s.conf = feedback?.conf ?? null; s.p = Learn.pOf(q);
    const verifying = s.opts.correction?.verification, pre = !!s.opts.pretest;
    if (feedback && (feedback.kind === 'paper' || (feedback.kind === 'nobase' && feedback.paper && !feedback.v2))) return this.renderPaper(q, qid);
    const wide = this._wide = this.wide(), padOpen = wide || this.paperOn();
    const tb = (pt, ic, t, on) => `<button type="button" class="pq-tb${on ? ' on' : ''}" data-pt="${pt}" aria-label="${t}" title="${t}">${ICON(ic)}</button>`;
    const pad = `<div class="pq-pad${padOpen ? '' : ' shut'}" id="pqPad">
        <div class="pq-pad-h"><button type="button" class="pq-pad-t" id="pqPadT" aria-expanded="${padOpen}"><b>${ICON('pen')} 草稿紙</b><span class="pq-pad-st">${padOpen ? '收起' : '打開'}</span></button>
          <span class="pad-tools pq-tools">${tb('pen', 'pen', '筆', true)}${tb('eraser', 'eraser', '橡皮擦')}${tb('clear', 'trash', '全清')}<span class="pad-sep"></span><button type="button" class="pq-tb" id="padCam" aria-label="拍紙本" title="拍紙本">${ICON('camera')}</button><label class="pq-tb pad-file" title="選照片" aria-label="選照片">${ICON('image')}<input type="file" accept="image/*" id="padFile" hidden></label></span></div>
        <div class="pad-wrap"><canvas id="pad" aria-label="草稿紙：用滑鼠、觸控筆或手指寫"></canvas></div>
        <div class="pad-photo" id="padPhoto" hidden><img alt="拍下的紙本作答"><button class="btn sm ghost" id="padPhotoDel" type="button">刪掉照片</button></div></div>`;
    const conf = pre ? '' : `<div class="pq-conf" role="radiogroup" aria-label="把握度"><span class="pq-conf-l">把握</span>${[[1, '猜的'], [2, '有把握'], [3, '很確定']].map(([v, t]) => `<button type="button" role="radio" class="pq-c" data-conf="${v}" aria-checked="false"><kbd>${v}</kbd>${t}</button>`).join('')}</div>`;
    const m = main();
    m.innerHTML = `
    <div class="pq-top">${this.headHtml(q)}<button class="btn ghost sm pq-quit" id="qQuit">結束這回</button></div>
    <div class="pq${wide ? ' pq-wide' : ''}">
      <section class="card qcard pq-q">
        <div class="q-meta">${this.metaLine(q)}</div>
        <div class="q-stem prose">${md(q.stem)}</div>
        ${verifying ? '' : this.hintHtml(q)}
        <div id="ansArea">${this.answerUI(q)}</div>
        ${wide ? '' : pad}
        ${q.type !== 'essay' && !pre ? `<details class="reason"><summary>寫下思考鏈（可不寫）</summary><textarea id="reasonText" rows="3"></textarea></details>` : ''}
        <div class="q-act pq-act">${conf}<span class="pq-act-r">${pre ? '' : '<button class="btn ghost nb-btn" id="qNoBase" title="完全不會（0）">完全不會</button>'}<button class="btn ghost" id="qSkip">跳過</button><button class="btn primary" id="qSubmit">${q.type === 'essay' ? '對答案' : '送出答案'}</button></span></div>
        <div id="feedback"></div>
      </section>
      ${wide ? `<aside class="pq-side">${pad}</aside>` : ''}
    </div>`;
    this.initPad(m, wide ? Math.max(320, Math.min(620, innerHeight - 230)) : 0); this.wirePhoto(m);
    $('#pqPadT').onclick = () => { const box = $('#pqPad'), open = box.classList.contains('shut'); box.classList.toggle('shut', !open); $('#pqPadT').setAttribute('aria-expanded', open); $('.pq-pad-st', box).textContent = open ? '收起' : '打開'; if (!this._wide) this.paperSet(open); if (open && !$('#pad').dataset.ready) this.initPad(m, 0); };
    this.applyDraft(m, q, s.draft);
    $('#ansArea').addEventListener('input', () => this.saveDraft(m, q));
    $('#reasonText')?.addEventListener('input', () => this.saveDraft(m, q));
    this.wireHints(q);
    $('#qQuit').onclick = () => this.finishRound();
    if (feedback) return this.restoreFeedback(q, qid);
    const paintConf = () => $$('[data-conf]', m).forEach(b => { const on = +b.dataset.conf === s.conf; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    $$('[data-conf]', m).forEach(b => b.onclick = () => { s.conf = s.conf === +b.dataset.conf ? null : +b.dataset.conf; paintConf(); });
    this._conf = v => { s.conf = v; paintConf(); this.submit(q, qid); };
    $('#qSkip').onclick = () => { s.results.push({ qid, skipped: true }); this.advance(); };
    if ($('#qNoBase')) $('#qNoBase').onclick = () => this.noBase(q, qid);
    $('#qSubmit').onclick = () => this.submit(q, qid);
    wireFillParts(main()); { const p0 = $('.fill-pi'); if (p0) setTimeout(() => p0.focus({ preventScroll: true }), 0); }
    const fi = $('#opt-fill'); if (fi) { fi.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); this.submit(q, qid); } }); setTimeout(() => fi.focus({ preventScroll: true }), 30); }
  },

  /* ---------- 紙筆模式：先自己寫出來，再翻答案、對照自評（考場是手寫） ---------- */
  paperOn() {
    if (typeof this.sess?.paperMode === 'boolean') return this.sess.paperMode;
    try { return localStorage.getItem('paperMode') !== '0'; } catch (e) { return true; }
  },
  paperSet(v) {
    if (this.sess) this.sess.paperMode = v;
    try { localStorage.setItem('paperMode', v ? '1' : '0'); } catch (e) { }
    this.persist();
  },

  initPad(root, hgt) {
    const cv = $('#pad', root); if (!cv) return;
    const dpr = window.devicePixelRatio || 1, w = cv.parentElement.clientWidth || 600, h = hgt || Math.round(Math.min(380, Math.max(260, w * 0.55)));
    if (!cv.parentElement.clientWidth) return;   // 收起的草稿紙：打開時再初始化
    cv.width = w * dpr; cv.height = h * dpr; cv.style.height = h + 'px';
    const g = cv.getContext('2d'); g.scale(dpr, dpr); g.lineCap = 'round'; g.lineJoin = 'round'; this._padDirty = false; this._photo = null; cv.dataset.ready = '1';
    const s = this.sess;
    const keepPad = () => {
      if (s !== this.sess || !cv.isConnected) return;
      const draft = s.draft || (s.draft = {});
      draft.pad = this._padDirty ? cv.toDataURL() : '';
      this.persist();
    };
    if (s.draft?.pad) {
      const bitmap = new Image();
      bitmap.onload = () => { if (cv.isConnected && !this._padDirty) { g.drawImage(bitmap, 0, 0, w, h); this._padDirty = true; } };
      bitmap.src = s.draft.pad;
    }
    let tool = 'pen', down = false, last = null;
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', e => { down = true; last = pos(e); cv.setPointerCapture(e.pointerId); e.preventDefault(); });
    cv.addEventListener('pointermove', e => {
      if (!down) return; const p = pos(e);
      g.globalCompositeOperation = tool === 'pen' ? 'source-over' : 'destination-out';
      g.strokeStyle = '#18202c'; g.lineWidth = tool === 'pen' ? (e.pressure && e.pointerType === 'pen' ? 1 + e.pressure * 3 : 2.2) : 18;
      g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke(); last = p; e.preventDefault(); if (tool === 'pen') this._padDirty = true;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => cv.addEventListener(t, () => { if (down) { down = false; keepPad(); } }));
    $$('[data-pt]', root).forEach(b => b.onclick = () => {
      if (b.dataset.pt === 'clear') { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.restore(); this._padDirty = false; keepPad(); return; }
      tool = b.dataset.pt; $$('[data-pt]', root).forEach(x => x.classList.toggle('on', x.dataset.pt === tool));
    });
  },

  /* 紙本作答拍照：筆電鏡頭（localhost 才能開）或選一張照片；之後可以送 Claude 批改 */
  wirePhoto(root) {
    const box = $('#padPhoto', root), img = box && $('img', box); if (!box) return;
    const s = this.sess, idx = s.i;
    const show = async blob => {
      try {
        const bitmap = await createImageBitmap(blob);
        if (s !== this.sess || idx !== s.i) { bitmap.close(); return; }
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 1440 / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const draft = s.draft || (s.draft = {});
        draft.photo = canvas.toDataURL('image/jpeg', .88);
        this.persist();
        if (box.isConnected) restorePhoto();
      } catch (error) { toast('讀不到照片，請換一張重試', 'bad'); }
    };
    const restorePhoto = () => {
      const photo = s.draft?.photo;
      box.hidden = !photo;
      if (!photo) { this._photo = null; img.removeAttribute('src'); return; }
      img.src = photo;
      const bytes = Uint8Array.from(atob(photo.split(',')[1]), ch => ch.charCodeAt(0));
      this._photo = new Blob([bytes], { type: 'image/jpeg' });
    };
    restorePhoto();
    const f = $('#padFile', root); if (f) f.onchange = () => { const x = f.files && f.files[0]; if (x) show(x); f.value = ''; };
    const del = $('#padPhotoDel', root); if (del) del.onclick = () => { if (s.draft) delete s.draft.photo; restorePhoto(); this.persist(); };
    const cam = $('#padCam', root);
    if (cam) cam.onclick = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('這個瀏覽器不能開鏡頭，改用「選照片」', 'bad'); return; }
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }); }
      catch (e) { toast('鏡頭打不開：' + (e && e.name === 'NotAllowedError' ? '瀏覽器沒有允許使用鏡頭' : '找不到鏡頭'), 'bad'); return; }
      const wrap = h('div', { class: 'cam-wrap' }); wrap.innerHTML = '<div class="cam-box"><video autoplay playsinline muted></video><div class="row end"><button class="btn ghost" data-c="no">取消</button><button class="btn primary" data-c="ok">拍下</button></div></div>';
      document.body.appendChild(wrap); const v = $('video', wrap); v.srcObject = stream;
      const close = () => { stream.getTracks().forEach(t => t.stop()); wrap.remove(); };
      $('[data-c=no]', wrap).onclick = close;
      $('[data-c=ok]', wrap).onclick = () => {
        const c = document.createElement('canvas'); c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        c.toBlob(b => { if (b) show(b); close(); }, 'image/jpeg', .88);
      };
    };
  },
  /** 要送去批改的圖：有照片用照片，沒有就把手寫板疊在白底上 */
  workBlob() {
    if (this._photo) return Promise.resolve(this._photo);
    const cv = $('#pad'); if (!cv || !this._padDirty) return Promise.resolve(null);
    const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(cv, 0, 0);
    return new Promise(ok => c.toBlob(ok, 'image/png'));
  },
  async sendWork(q, qid, btn) {
    if (Bridge.mode === 'offline') { toast('要用 start.bat 打開網站才能送出', 'bad'); return; }
    if (Bridge.mode === 'cloud') { toast('線上版還不能送圖片，請用電腦版（start.bat）', 'bad'); return; }
    const blob = await this.workBlob(); if (!blob) { toast('先在手寫板寫，或拍一張紙本', 'bad'); return; }
    btn.disabled = true; const old = btn.textContent; btn.textContent = '送出中…';
    try {
      const pe = $('[data-pe].on'); const self = pe ? pe.textContent.replace(/\d$/, '').trim() : '';
      await Bridge.sendWork(blob, { qid, title: (q.chTitle || (LESSON[q.ch] || {}).title || '') + '｜手寫批改', stem: q.stem, options: q.opts || [], answer: this.fmtAns(q), explanation: q.expl || '', self });
      btn.textContent = '已送出：批改會出現在「' + agName() + '」頁';
    } catch (e) { btn.disabled = false; btn.textContent = old; toast('沒送出去：' + (e && e.message || e), 'bad'); }
  },

  renderPaper(q, qid) {
    const s = this.sess; const total = s.opts.adaptive ? s.opts.limit : s.ids.length;
    const m = main();
    m.innerHTML = `
    ${this.headHtml(q)}
    <section class="card qcard paper">
      <div class="q-meta">${this.metaLine(q)}<button class="btn ghost sm paper-tg" id="toKey" title="改回點選／打字">改用點選</button></div>
      <div class="q-stem prose">${md(q.stem)}</div>
      ${q.type === 'single' || q.type === 'multi' ? `<div class="paper-opts">${q.opts.map((o, k) => `<div class="po"><span class="ol">${LETTERS[k]}</span><span>${md(o).replace(/^<p>|<\/p>$/g, '')}</span></div>`).join('')}</div>` : ''}
      ${this.hintHtml(q)}
      <div id="ansArea" class="pad-wrap">
        <canvas id="pad"></canvas>
        <div class="pad-tools"><button class="btn sm on" data-pt="pen">筆</button><button class="btn sm" data-pt="eraser">橡皮擦</button><button class="btn sm" data-pt="clear"> 全清</button><span class="pad-sep"></span><button class="btn sm" id="padCam" type="button">拍紙本</button><label class="btn sm pad-file">選照片<input type="file" accept="image/*" id="padFile" hidden></label></div>
        <div class="pad-photo" id="padPhoto" hidden><img alt="拍下的紙本作答"><button class="btn sm ghost" id="padPhotoDel" type="button">刪掉照片</button></div></div>
      <div class="row end q-act"><button class="btn ghost nb-btn" id="qNoBase" title="完全不會（0）">完全不會</button><button class="btn ghost" id="qSkip">跳過</button><button class="btn primary" id="paperDone">對答案</button></div>
      <div id="feedback"></div>
    </section>
    <div class="row end"><button class="btn ghost" id="qQuit">結束這回</button></div>`;
    this.initPad(m); this.wirePhoto(m); this.wireHints(q);
    $('#qQuit').onclick = () => this.finishRound();
    if (s.feedback) return this.restoreFeedback(q, qid);
    $('#toKey').onclick = () => { this.paperSet(false); this.renderCard(); };
    $('#qSkip').onclick = () => { s.results.push({ qid, skipped: true }); this.advance(); };
    $('#qNoBase').onclick = () => this.noBase(q, qid);
    $('#paperDone').onclick = () => this.paperReveal(q, qid);
  },

  /* 提示階梯：沒底子就一層一層打開（觀念 → 30 秒影片 → 第一步），熟的人直接作答、完全不會被擋。
     卡住 25 秒提示鈕輕輕亮一下；H 鍵打開下一層。用過幾層提示記在作答紀錄裡。 */
  hints(q) {
    const out = [], l = LESSON[q.ch];
    const sp = typeof lessonSpot === 'function' ? lessonSpot(q) : null;
    if (l) {
      const secs = String(l.body || '').split(/^## /m).slice(1), sec = sp && sp.i >= 0 ? secs[sp.i] : null;
      const gm = sec && sec.match(/> \[!(?:先記住|要點)\][^\n]*\n((?:>.*\n?)+)/);
      const gist = gm ? gm[1].replace(/^>\s?/gm, '').trim() : (String(l.intuit || '').match(/\*\*一句話\*\*[\s\u3000]*([^\n]+)/) || [])[1];
      if (gist) out.push({ k: '觀念', html: `<div class="hint-t">${esc(sp && sp.title ? sp.title : l.title.split(/[：（]/)[0])}</div><div class="prose">${md(gist)}</div>` });
    }
    const clip = typeof Clips !== 'undefined' ? Clips.list.find(c => c.lesson === q.ch && Clips.videoOf && Clips.videoOf(c.id)) : null;
    if (clip) out.push({ k: '影片', clip: clip.id });
    const ex = fmtExpl(q.expl || '').split(/\n+/).map(x => x.trim()).filter(Boolean)[0];
    if (ex) { const first = (ex.match(/^(.+?[。；;])/) || [, ex])[1]; out.push({ k: '第一步', html: `<div class="prose">${md(first)}</div>` }); }
    return out;
  },
  hintHtml(q) {
    const hs = this.hints(q); if (!hs.length) return '';
    return `<div class="hint" id="hint"><button type="button" class="btn sm ghost hint-btn" id="hintBtn">提示 <span class="hint-n">0 / ${hs.length}</span></button><div class="hint-steps" id="hintSteps"></div></div>`;
  },
  wireHints(q) {
    const btn = $('#hintBtn'); if (!btn) return; const hs = this.hints(q), host = $('#hintSteps'), s = this.sess; let k = 0;
    const open = () => {
      if (k >= hs.length) return; const h0 = hs[k++], el = document.createElement('div'); el.className = 'hint-step';
      el.innerHTML = `<div class="hint-k">${h0.k}</div>`; const body = document.createElement('div'); body.className = 'hint-b'; el.appendChild(body); host.appendChild(el);
      if (h0.clip) { const box = document.createElement('div'); box.className = 'hint-vid'; body.appendChild(box); Clips.player(box, h0.clip, {}); } else body.innerHTML = h0.html;
      $('.hint-n', btn).textContent = k + ' / ' + hs.length; if (k >= hs.length) btn.disabled = true;
      btn.classList.remove('pulse'); if (s) s.hint = Math.max(s.hint || 0, k);
    };
    const shown = Math.min(s?.hint || 0, hs.length);
    for (let i = 0; i < shown; i++) open();
    btn.onclick = () => { open(); this.persist(); }; this._hintOpen = btn.onclick;
    clearTimeout(this._hintT); this._hintT = setTimeout(() => { if (k === 0 && btn.isConnected && s && s.state === 'ask') btn.classList.add('pulse'); }, 25000);
  },
  paperReveal(q, qid) {
    const s = this.sess; if (s.state !== 'ask') return; s.state = 'done';
    s.feedback = s.feedback || { kind: 'paper' };
    this.persist();
    const m = main(); $$('.q-act', m).forEach(x => x.remove()); $$('.pad-tools button', m).forEach(x => x.disabled = true);
    const cv = $('#pad', m); if (cv) cv.style.pointerEvents = 'none';
    $$('#toKey, #padFile, #padPhotoDel', m).forEach(x => x.disabled = true);
    $('#feedback').innerHTML = `
      ${q.type !== 'essay' ? `<div class="fb neutral"><div class="fb-top"><b>標準答案</b></div><div class="fb-ans"><span><b>${esc(this.fmtAns(q))}</b></span></div></div>` : ''}
      <div class="expl-box"><div class="expl-h">解法</div><div class="prose expl">${md(fmtExpl(q.expl || ''))}</div></div>
      <div class="selfeval"><span>紙筆自評</span>
        <button class="btn" data-pe="full">全對，過程也通<kbd>1</kbd></button><button class="btn" data-pe="part">答案對，過程有洞<kbd>2</kbd></button><button class="btn" data-pe="none">答案或方法錯<kbd>3</kbd></button></div>
      <div class="row work-row"><button class="btn ghost" id="sendWork" type="button">送 ${agName()} 批改這份手寫</button></div>
      <div id="afterFb"></div>`;
    const sw = $('#sendWork', m); if (sw) sw.onclick = () => this.sendWork(q, qid, sw);
    $$('[data-pe]', m).forEach(b => b.onclick = () => {
      const v = b.dataset.pe, ok = v === 'full'; $$('[data-pe]', m).forEach(x => x.disabled = true); b.classList.add('on');
      s.conf = v === 'none' ? 1 : 2;
      S.answer(qid, ok, { conf: s.conf, q, source: 'self' }); if (q.src === 'gen') S.day().gens++;
      s.results.push({ qid, ok, conf: s.conf, resp: null, self: v }); this.hit(ok, q);
      this.persist();
      if (!ok) this.causeUI(qid, $('#afterFb'), q, null, ''); else this.nextBtn($('#afterFb'), q, qid, null, '');
    });
    $('#feedback').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  /* ---------- 整頁默寫（自由回想）：寫完對照要點，漏的就是該補的 ---------- */
  dictGet(ch) { return this.store('dict', 'dictate')[ch] || null; },
  dictRedo() { return Object.entries(this.store('dict', 'dictate')).filter(([ch, d]) => LESSON[ch] && d && d.hit < d.total && d.date < D.today()).map(([ch, d]) => ({ ch, hit: d.hit, total: d.total })); },
  dictSet(ch, hit, total, miss) { this.store('dict', 'dictate')[ch] = { date: D.today(), hit, total, miss }; S.save(); },
  renderDictate(ch) {
    const l = LESSON[ch]; const m = main();
    m.innerHTML = `
    <header class="page-head slim"><div class="eyebrow">整頁默寫</div><h1>${esc(l.title)}</h1></header>
    <section class="card qcard paper">
      <div class="pad-hint">只看題目，把這章記得的全部寫出來</div>
      <ol class="dict-q">${(l.recall || []).map(r => `<li>${md(r).replace(/^<p>|<\/p>$/g, '')}</li>`).join('')}</ol>
      <div id="ansArea" class="pad-wrap"><canvas id="pad"></canvas>
        <div class="pad-tools"><button class="btn sm on" data-pt="pen">${ICON('pen')} 筆</button><button class="btn sm" data-pt="eraser">橡皮擦</button><button class="btn sm" data-pt="clear">全清</button></div></div>
      <div class="row end q-act"><button class="btn ghost" id="dQuit">回練習</button><button class="btn primary" id="dDone">寫好了，對照要點</button></div>
      <div id="feedback"></div>
    </section>`;
    this.initPad(m);
    $('#dQuit').onclick = () => { this.sess = null; this.view(); };
    $('#dDone').onclick = () => {
      $$('.q-act', m).forEach(x => x.remove()); const cv = $('#pad', m); cv.style.pointerEvents = 'none'; $$('.pad-tools button', m).forEach(x => x.disabled = true);
      const keys = DATA.cards.filter(c => c.kind === 'key' && c.ch === ch);
      $('#feedback').innerHTML = `
        <div class="expl-box"><div class="expl-h"><span class="h-ic" aria-hidden="true">${ICON('check')}</span>你寫到的打勾</div>
          <ul class="dict-rub">${(l.rubric || []).map((r, i) => `<li><label><input type="checkbox" data-ri="${i}"><span>${md(r).replace(/^<p>|<\/p>$/g, '')}</span></label></li>`).join('')}</ul></div>
        ${keys.length ? `<details class="reason"><summary>這章的必背重點（${keys.length}）</summary>${keys.map(k => `<div class="dict-key"><b>${esc(k.front)}</b><div class="prose">${md(k.back)}</div></div>`).join('')}</details>` : ''}
        <div class="row end"><button class="btn primary" id="dSave">存起來</button></div><div id="dAfter"></div>`;
      $('#dSave').onclick = () => {
        const boxes = $$('[data-ri]', m), hit = boxes.filter(b => b.checked).length, miss = boxes.filter(b => !b.checked).map(b => +b.dataset.ri);
        this.dictSet(ch, hit, boxes.length, miss); $('#dSave').disabled = true;
        $('#dAfter').innerHTML = `<div class="fb ${hit === boxes.length ? 'good' : 'neutral'}"><div class="fb-top"><span class="fb-ic" aria-hidden="true">${hit === boxes.length ? ICON('trophy') : ICON('eye')}</span><b>${hit} / ${boxes.length} 條</b></div></div>
          <div class="row end"><button class="btn ghost" id="dLesson">回教材</button><button class="btn primary" id="dBack">回練習</button></div>`;
        $('#dLesson').onclick = () => { location.hash = '#' + ch; };
        $('#dBack').onclick = () => { this.sess = null; this.view(); };
      };
      $('#feedback').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  },

  restoreFeedback(q, qid) {
    const s = this.sess, f = s.feedback, result = s.results[s.results.length - 1];
    if (f.kind === 'paper') {
      this.paperReveal(q, qid);
      if (result?.qid === qid && result.self) {
        $$('[data-pe]').forEach(b => { b.disabled = true; b.classList.toggle('on', b.dataset.pe === result.self); });
        if (result.ok) this.nextBtn($('#afterFb'), q, qid, null, '');
        else this.causeUI(qid, $('#afterFb'), q, null, '');
      }
      return;
    }
    if (f.kind === 'digital' && q.type === 'essay' && result?.qid !== qid) return this.submit(q, qid);
    s.state = 'done';
    const m = main();
    $$('.q-act', m).forEach(x => x.remove());
    $$('input, textarea, #toPaper, #toKey, .pad-tools button, #padPhotoDel', m).forEach(x => x.disabled = true);
    const pad = $('#pad', m);
    if (pad) pad.style.pointerEvents = 'none';
    const resp = result?.resp ?? null;
    const label = f.kind === 'nobase' ? '先看懂' : result?.ok ? '答對了' : '再想一下';
    $('#feedback').innerHTML = `<div class="fb neutral"><b>${label}</b>${q.type !== 'essay' ? `　正解：${esc(this.fmtAns(q))}` : ''}</div>
      ${resp != null ? `<p>你的答案：${esc(this.fmtResp(q, resp))}</p>` : ''}
      <div class="prose expl">${md(fmtExpl(q.expl || ''))}</div><div id="afterFb"></div>`;
    const reasoning = s.draft?.reason || '';
    if (f.kind !== 'nobase' && !result?.ok && !s.opts.pretest) this.causeUI(qid, $('#afterFb'), q, resp, reasoning);
    else this.nextBtn($('#afterFb'), q, qid, resp, reasoning);
    if (f.kind === 'nobase') $('#askThis')?.remove();
  },
  submit(q, qid) {
    const s = this.sess; if (s.state !== 'ask') return;
    const m = main();
    let resp = this.readResponse(q, m);
    if (resp == null && q.type === 'essay' && (this._padDirty || this._photo)) resp = '（手寫作答，見草稿紙）';
    if (resp == null) { toast(q.type === 'single' || q.type === 'multi' ? '先選一個答案' : '先寫答案', 'bad'); return; }
    if (!s.conf && !s.opts.pretest) s.conf = 2;
    s.state = 'done';
    this.saveDraft(m, q);
    s.feedback = { kind: 'digital', conf: s.conf };
    this.persist();
    const paperSwitch = $('#toPaper');
    if (paperSwitch) paperSwitch.disabled = true;
    const reasoning = ($('#reasonText') || {}).value || '';
    $$('.q-act', m).forEach(x => x.remove());
    $$('input, textarea', $('#ansArea')).forEach(x => x.disabled = true);
    const fb = $('#feedback');
    if (q.type === 'essay') {
      fb.innerHTML = `<div class="fb neutral"><b>參考解答</b></div><div class="prose expl">${md(fmtExpl(q.expl))}</div>
      <div class="selfeval"><span>自評</span>
      <button class="btn" data-se="full">完整涵蓋</button><button class="btn" data-se="part">部分</button><button class="btn" data-se="none">不會</button></div>
      <div class="row">${resp.startsWith('（手寫') ? '' : `<button class="btn" id="sendEssay">送 ${agName()} 批改</button>`}${this._padDirty || this._photo ? `<button class="btn ghost" id="sendWork" type="button">送 ${agName()} 批改這份手寫</button>` : ''}</div><div id="afterSE"></div>`;
      { const sw = $('#sendWork', fb); if (sw) sw.onclick = () => this.sendWork(q, qid, sw); }
      $$('[data-se]', fb).forEach(b => b.onclick = () => {
        const ok = b.dataset.se === 'full';
        S.answer(qid, ok, { conf: s.conf, q, source: 'self' });
        s.results.push({ qid, ok, conf: s.conf, resp, self: b.dataset.se }); this.hit(ok, q);
        this.persist();
        $$('[data-se]', fb).forEach(x => x.disabled = true);
        const pm = S.st.msgs.filter(m => m.dir === 'out' && m.type === 'essay' && m.ctx && m.ctx.qid === qid && !m.verdict).slice(-1)[0]; if (pm) { pm.selfDone = true; S.save(); }
        if (!ok) this.causeUI(qid, $('#afterSE'), q, resp, reasoning); else this.nextBtn($('#afterSE'), q, qid, resp, reasoning);
      });
      if ($('#sendEssay')) $('#sendEssay').onclick = async () => {
        const rec = await Bridge.send({ type: 'essay', text: resp, ctx: { qid, chapter: q.ch, stem: q.stem, reference: q.expl } });
        if (rec && s.results.some(r => r.qid === qid)) { rec.selfDone = true; S.save(); }
        toast('已送 Agent 批改', 'good'); $('#sendEssay').disabled = true;
      };
      return;
    }
    const ok = this.isCorrect(q, resp);
    if (s.opts.pretest) {
      s.results.push({ qid, ok, conf: s.conf, resp });
      this.persist();
      if (q.type !== 'fill') $$('.opt', m).forEach((el, k) => { if (q.ans.includes(k)) el.classList.add('right'); else if (resp.includes(k)) el.classList.add('wrong'); });
      fb.innerHTML = `<div class="fb neutral"><b>${ok ? '✓' : '✗'}</b>　正解：${esc(this.fmtAns(q))} ${this.ntuTag(q, resp)}</div><div id="afterFb"></div>`;
      this.nextBtn($('#afterFb'), q, qid, resp, reasoning); return;
    }
    const a = S.answer(qid, ok, { conf: s.conf, q });
    if (q.src === 'gen') S.day().gens++;
    s.results.push({ qid, ok, conf: s.conf, resp }); this.hit(ok, q);
    this.persist();
    // mark options
    if (q.type !== 'fill') $$('.opt', m).forEach((el, k) => { if (q.ans.includes(k)) el.classList.add('right'); else if (resp.includes(k)) el.classList.add('wrong'); });
    fb.innerHTML = `<div class="fb ${ok ? 'good' : 'bad'}"><div class="fb-top"><span class="fb-ic" aria-hidden="true">${ok ? ICON('check') : ICON('close')}</span><b>${ok ? '答對了' : '再想一下'}</b></div><div class="fb-ans"><span>正解：<b>${esc(this.fmtAns(q))}</b></span>${ok ? '' : `<span>你選：${esc(this.fmtResp(q, resp))}</span>`}${this.ntuTag(q, resp)}</div>
      ${!ok && s.conf === 3 ? '<div class="hcw">很確定卻答錯：這題最值得弄懂</div>' : ''}</div>
      <div class="expl-box"><div class="expl-h"><span class="h-ic" aria-hidden="true">${ICON('book')}</span>為什麼</div><div class="prose expl">${md(fmtExpl(q.expl || ''))}</div></div>
      ${this._padDirty || this._photo ? `<div class="row work-row"><button class="btn ghost sm" id="sendWork" type="button">送 ${agName()} 看我的草稿</button></div>` : ''}<div id="afterFb"></div>`;
    { const sw = $('#sendWork', fb); if (sw) sw.onclick = () => this.sendWork(q, qid, sw); }
    if (!ok) this.causeUI(qid, $('#afterFb'), q, resp, reasoning);
    else this.nextBtn($('#afterFb'), q, qid, resp, reasoning);
  },

  /* 🆘 完全不會：記為不會、直接看完整解答，下一題換同類型的讓你照著做 */
  noBase(q, qid) {
    const s = this.sess; if (s.state !== 'ask') return; s.state = 'done';
    const m = main(); $$('.q-act', m).forEach(x => x.remove()); $$('input, textarea', $('#ansArea')).forEach(x => x.disabled = true);
    S.answer(qid, false, { conf: 1, q, cause: '沒基礎' }); s.results.push({ qid, ok: false, conf: 1, nobase: true });
    const nx = Rescue.similar(q, qid, new Set(s.ids)); if (nx) { s.ids.splice(s.i + 1, 0, nx); if (s.opts.limit && s.opts.adaptive) s.opts.limit++; }
    s.feedback = { kind: 'nobase', paper: !!$('#pad', m) && !$('.pq', m), v2: !!$('.pq', m) };
    this.persist();
    $('#toPaper, #toKey')?.setAttribute('disabled', '');
    Rescue.flag(q.ch, 'question', q.stem);
    $('#feedback').innerHTML = `<div class="fb neutral"><b>先看懂</b>${q.type !== 'essay' ? `　正解：${esc(this.fmtAns(q))}` : ''}</div><div class="prose expl">${md(fmtExpl(q.expl || ''))}</div>${nx ? '<p class="muted small">下一題同類型，換你做</p>' : ''}<div id="afterFb"></div>`;
    this.nextBtn($('#afterFb'), q, qid, null, ''); const ak = $('#askThis'); if (ak) ak.remove();
  },
  /* 打底的範例題：直接給解答，看懂了再換你做 */
  renderExample(q, qid) {
    const s = this.sess; s.state = 'example';
    main().innerHTML = `
    <header class="page-head slim"><div class="eyebrow">${esc(s.opts.title || '')}｜${s.i + 1} / ${s.ids.length}</div><div class="progress"><i style="width:${s.i / s.ids.length * 100}%"></i></div></header>
    <section class="card qcard ex-card"><div class="q-meta"><span class="tag ex-tag">範例</span>${this.metaLine(q)}</div>
      <div class="q-stem prose">${md(q.stem)}</div>
      ${q.type !== 'essay' ? `<div class="fb neutral"><b>答案</b>　${esc(this.fmtAns(q))}</div>` : ''}
      <div class="prose expl">${md(fmtExpl(q.expl || ''))}</div>
      <div class="row end"><button class="btn primary" id="qNext">看懂了，換我做 →</button></div></section>
    <div class="row end"><button class="btn ghost" id="qQuit">結束這回</button></div>`;
    $('#qNext').onclick = () => this.advance();
    $('#qQuit').onclick = () => { s.ids = s.ids.slice(0, s.i); this.view(); };
  },

  causeUI(qid, host, q, resp, reasoning) {
    const sp = typeof lessonSpot === 'function' ? lessonSpot(q) : null;
    host.innerHTML = `${sp ? `<div class="row"><button class="btn spot-btn" id="goSpot">${ICON('book')} 回教材：${sp.i >= 0 ? `第 ${sp.i + 1} 段「${esc(sp.title)}」` : esc(sp.title)}</button></div>` : ''}<div class="cause"><b>錯因</b>
      <div class="row wrap">${CAUSES.map(c => `<button class="cf" data-cause="${c}">${c}</button>`).join('')}</div>
      <details class="cn-d" ${S.st.wrongNotes[qid] ? 'open' : ''}><summary>筆記</summary><textarea id="causeNote" rows="3" placeholder="我原本以為……但其實……">${esc(S.st.wrongNotes[qid] || '')}</textarea></details></div><div id="nb"></div>`;
    if (sp) $('#goSpot', host).onclick = () => goSpot(sp);
    const note = $('#causeNote', host);
    note.oninput = () => {
      if (note.value.trim()) S.st.wrongNotes[qid] = note.value;
      else delete S.st.wrongNotes[qid];
      S.save();
    };
    const buttons = $$('[data-cause]', host);
    const paint = () => buttons.forEach(b => {
      const selected = S.st.answers[qid]?.cause === b.dataset.cause;
      b.classList.toggle('on', selected);
      b.setAttribute('aria-pressed', String(selected));
    });
    buttons.forEach(b => b.onclick = () => {
      const answer = S.st.answers[qid];
      if (answer) { answer.cause = b.dataset.cause; S.saveNow(); }
      paint();
    });
    paint();
    this.nextBtn($('#nb'), q, qid, resp, reasoning);
  },

  nextBtn(host, q, qid, resp, reasoning, guard) {
    const s = this.sess;
    host.insertAdjacentHTML('beforeend', `<div class="row end"><button class="btn ghost" id="askThis">${Bridge.mode === 'cloud' && typeof CloudAgent !== 'undefined' && CloudAgent.ready() ? '換個說法講解' : '問 Agent'}</button><button class="btn primary" id="qNext">${s.i + 1 >= s.ids.length ? '看結果' : '下一題'}</button></div>`);
    $('#askThis').onclick = async () => {
      if (guard && !guard()) return;
      const note = S.st.wrongNotes[qid] || '';
      await Bridge.send({ type: 'ask', text: `請講解這題，特別是我錯的那一步。${note ? '\n我的錯因筆記：' + note : ''}${reasoning ? '\n我的思考鏈：' + reasoning : ''}`, ctx: { qid, chapter: q.ch, stem: q.stem, options: q.opts, myAnswer: this.fmtResp(q, resp), answer: this.fmtAns(q), explanation: q.expl } });
      toast('已送出', 'good'); $('#askThis').disabled = true;
    };
    $('#qNext').onclick = () => { if (guard && !guard()) return; this.advance(); };
  },

  renderSummary() {
    const s = this.sess; const res = s.results.filter(r => !r.skipped);
    const ok = res.filter(r => r.ok).length; const hcw = res.filter(r => !r.ok && r.conf === 3).length;
    const lucky = res.filter(r => r.ok && r.conf === 1).length;
    const mins = Math.round((Date.now() - s.t0) / 60000);
    if (s.opts.base) { S.lesson(s.opts.base).baseDone = D.today(); S.save(); }
    if (s.opts.fix && res.length >= Math.min(3, s.ids.length)) Personal.markFixed(s.opts.fix);
    if (s.opts.correction && !s.correctionRecorded && res.length >= 3) {
      Papers.recordCorrection(s.opts.correction, res);
      s.correctionRecorded = true;
      this.persist();
    }
    if (s.opts.weakTask && res.length >= Math.min(3, s.opts.limit)) {
      const L = S.day();
      L.weakDone = [...new Set([...(L.weakDone || []), s.opts.weakTask])];
      S.save();
    }
    if (s.opts.recallDay) { S.day().blurt = { ts: new Date().toISOString(), quiz: true, ok, n: res.length, kps: s.opts.recallDay }; S.save(); }
    if (s.opts.pretest) { const ls = S.lesson(s.opts.pretest); ls.pre = D.today(); S.save();
      main().innerHTML = `<header class="page-head"><h1>${ok} / ${res.length}</h1></header>
      <div class="row">${NextAuto.html()}</div>`; this.leaveSummary(); NextAuto.wire(false); return; }
    let starLine = '';
    if (s.opts.ramp && s.opts.ch) { const ld = s.stage, lr = res.filter(r => this.dOf(r.qid) === ld); const got = this.stageClear(ld, lr); starLine = `<div class="sum-stars">${this.starHtml(s.opts.ch)}${got ? '<span class="good-t">　新星！</span>' : ''}</div>`; if (got && typeof Rewards !== 'undefined') { Rewards.chime('big'); Rewards.confetti(70); } }
    const touched = s.opts.adaptive ? [...new Set(res.map(r => (this.getQ(r.qid) || {}).ch).filter(Boolean))] : [];
    main().innerHTML = `
    <header class="page-head"><div class="eyebrow">${esc(s.opts.title || '練習')}｜${mins} 分鐘</div><h1>${res.length ? Math.round(ok / res.length * 100) : 0}%　<small>${ok} / ${res.length} 題</small></h1>
    ${starLine}${hcw ? `<p class="bad-t">高信心答錯 ${hcw} 題</p>` : ''}</header>
    <section class="card"><div class="res-dots" aria-label="每題結果">${s.results.map(r => `<span class="rd ${r.skipped ? 'skip' : r.ok ? 'ok' : 'no'}"></span>`).join('')}</div>
    <details class="res-more"><summary>看每一題</summary><ul class="res">${s.results.map(r => { const q = this.getQ(r.qid); return `<li class="${r.skipped ? 'skip' : r.ok ? 'ok' : 'no'}"><span>${r.skipped ? '跳過' : r.ok ? '✓' : '✗'}${r.self ? ' 自評' : ''}</span><span>${esc(String(q?.stem || r.qid).replace(/[#*`$>|=\\]/g, '').slice(0, 70))}…</span><span class="muted small">${r.conf ? ['', '猜', '有把握', '很確定'][r.conf] : ''}</span></li>`; }).join('')}</ul></details>
    <div class="row end"><button class="btn" id="again">再練錯的</button>${s.opts.correction ? '<button class="btn primary" id="goNextRec">回原卷訂正</button>' : s.opts.auto && S.st.onboarded && Auto.current() ? `<button class="btn" id="goNextRec">返回練習</button>${NextAuto.html()}` : '<button class="btn primary" id="goNextRec">返回練習</button>'}</div></section>
    ${touched.length ? `<section class="card"><div class="card-h"><h2>掌握度估計</h2></div><ul class="mdelta">${touched.map(ch => { const a0 = s.m0[ch], a1 = Learn.mastery(ch); const d = a0 == null ? null : a1 - a0; return `<li><span>${esc(LESSON[ch] ? LESSON[ch].title : ch)}</span><b>${a0 == null ? '新' : Math.round(a0 * 100) + '%'} → ${Math.round(a1 * 100)}%</b>${d == null ? '' : `<span class="${d >= 0 ? 'good-t' : 'bad-t'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(d * 100))}</span>`}</li>`; }).join('')}</ul></section>` : ''}`;
    const wrongIds = res.filter(r => !r.ok).map(r => r.qid);
    if (!wrongIds.length) $('#again').remove(); else $('#again').onclick = () => this.start(wrongIds, { title: '重練錯題', review: true });
    $('#goNextRec').onclick = () => {
      NextAuto.cancel(); this.leaveSummary();
      if (s.opts.correction) location.hash = '#papers/' + s.opts.correction.paperId + '/' + s.opts.correction.runId;
      else this.view();
    };
    if ($('#nextGo')) {
      $('#nextGo').addEventListener('click', () => this.leaveSummary(), { once: true, capture: true });
      NextAuto.wire(false);
    }
  },

  /* ---------- 模擬考 ---------- */
  startMock(gid) {
    if (!this.canReplace()) return;
    const g = GROUPS.find(x => x.id === gid);
    const r = rng(Date.now() & 0xffffffff);
    const bank = QBANK.all().filter(q => g.subs.includes(q.subject) && q.src !== 'agent');
    const wshuf = arr => this.hasExam() ? arr.map(q => [q, -Math.log(1 - r()) / (0.05 + this.examF(q.ch) * 10)]).sort((a, b) => a[1] - b[1]).map(x => x[0]) : r.shuffle(arr);
    const obj = wshuf(bank.filter(q => q.type !== 'essay'));
    const ess = wshuf(bank.filter(q => q.type === 'essay'));
    // balance the two subjects
    const pickBal = (arr, n) => { const out = []; const by = g.subs.map(sid => arr.filter(q => q.subject === sid)); let k = 0; while (out.length < n && by.some(b => b.length)) { const b = by[k++ % by.length]; if (b.length) out.push(b.shift()); } return out; };
    // 參數化題：同一張卷的兩科（含跨科綜合題）各抽幾型，數字每次不同
    const gt = r.shuffle(Gen.list.filter(x => x.kp && x.paper === gid));
    const gpick = []; g.subs.forEach(sid => gpick.push(...gt.filter(x => x.subject === sid).slice(0, 3))); gpick.push(...gt.filter(x => x.also && !gpick.includes(x)).slice(0, 2));
    const ids = pickBal(obj, 10).map(q => q.id).concat(gpick.map(x => Gen.fresh(x))).concat(pickBal(ess, 4).map(q => q.id));
    this.sess = { mock: { gid, end: Date.now() + g.mins * 60000, resp: {} }, ids, i: 0, opts: { title: '題庫計時練習：' + g.name }, results: [], t0: Date.now() };
    this.persist();
    if (location.hash === '#practice') route(); else location.hash = '#practice';
  },
  renderMock() {
    const s = this.sess; const g = GROUPS.find(x => x.id === s.mock.gid);
    if (s.mock.done) return this.renderMockResult();
    if (Date.now() >= s.mock.end) return this.handIn();
    const m = main();
    m.innerHTML = `<header class="page-head slim exam-head"><div class="eyebrow">${esc(g.name)}｜${s.ids.length} 題</div>
      <div class="row"><b class="exam-clock" id="examClock">--:--</b><button class="btn primary" id="handIn">交卷</button></div>
      <div class="boss"><span class="boss-n">大魔王</span><span class="hp"><i id="mockHp" style="width:100%"></i></span><span class="hp-n" id="mockHpN">${s.ids.length}/${s.ids.length}</span></div></header>
      <ol class="exam">${s.ids.map((id, k) => { const q = this.getQ(id); return `<li class="card qcard" id="eq-${k}"><div class="q-meta">${this.metaLine(q)}</div><div class="q-stem prose">${md(q.stem)}</div>${this.answerUI(q, 'e' + k)}</li>`; }).join('')}</ol>
      <div class="row end"><button class="btn primary" id="handIn2">交卷</button></div>`;
    const tick = () => {
      const left = Math.max(0, s.mock.end - Date.now()); const el = $('#examClock'); if (!el || this.sess !== s) { clearInterval(this.mockTimer); return; }
      el.textContent = String(Math.floor(left / 60000)).padStart(2, '0') + ':' + String(Math.floor(left / 1000) % 60).padStart(2, '0');
      if (left <= 0) { toast('時間到，自動交卷', 'bad'); this.handIn(); }
    };
    clearInterval(this.mockTimer); this.mockTimer = setInterval(tick, 1000);
    $('#handIn').onclick = () => this.handIn(); $('#handIn2').onclick = () => this.handIn();
    // 血條：每答一題扣一格（只看有沒有作答，不看對錯）
    const hp = () => { const n = s.ids.length, done = s.ids.filter((id, k) => { const q = this.getQ(id), li = $('#eq-' + k); try { return li && this.readResponse(q, li, 'e' + k) != null; } catch (e) { return false; } }).length;
      const left = n - done, b = $('#mockHp'), t = $('#mockHpN'); if (b) b.style.width = (left / n * 100) + '%'; if (t) t.textContent = left + '/' + n; };
    const exam = $('.exam', m);
    s.ids.forEach((id, k) => this.applyDraft($('#eq-' + k), this.getQ(id), s.mock.resp[id] || {}, 'e' + k));
    exam.oninput = event => {
      if (Date.now() >= s.mock.end) { this.handIn(); return; }
      const row = event.target.closest('li.qcard');
      if (!row) return;
      const k = +row.id.slice(3), id = s.ids[k], q = this.getQ(id);
      const answer = this.readResponse(q, row, 'e' + k);
      s.mock.resp[id] = Array.isArray(answer) ? { choice: answer }
        : { text: answer || '', parts: $$('.fill-pi', row).map(input => input.value) };
      this.persist(); hp();
    };
    hp(); tick();
  },
  handIn() {
    const s = this.sess;
    if (s.mock.done) return;
    clearInterval(this.mockTimer);
    s.ids.forEach(id => {
      const q = this.getQ(id), draft = s.mock.resp[id] || {};
      const resp = draft.choice || draft.text || null;
      if (q.type !== 'essay') { const ok = this.isCorrect(q, resp); S.answer(id, ok, { conf: null, q }); s.results.push({ qid: id, ok, resp }); }
      else s.results.push({ qid: id, ok: null, resp });
    });
    s.mock.done = true; s.mock.mins = Math.round((Math.min(Date.now(), s.mock.end) - s.t0) / 60000);
    const L = S.day(); L.mocks = (L.mocks || []); if (!L.mocks.includes(s.mock.gid)) L.mocks.push(s.mock.gid); S.save();
    this.persist();
    this.renderMockResult();
  },
  renderMockResult() {
    const s = this.sess; const g = GROUPS.find(x => x.id === s.mock.gid);
    const objR = s.results.filter(r => r.ok !== null); const ok = objR.filter(r => r.ok).length;
    const ntu = s.results.map(r => this.ntuScore(this.getQ(r.qid), r.resp)).filter(Boolean);
    const ntuLine = ntu.length ? `<p class="muted">複選共 ${ntu.reduce((a, t) => a + t.got, 0)} / ${ntu.reduce((a, t) => a + t.n, 0)} 個選項判對</p>` : '';
    const written = s.results.filter(r => r.ok === null && r.resp);
    main().innerHTML = `<header class="page-head"><div class="eyebrow">題庫計時練習｜${esc(g.name)}｜用時 ${s.mock.mins} 分</div>
      <h1>${ok} / ${objR.length}</h1>${ntuLine}</header>
      <ol class="exam">${s.results.map((r, ri) => { const q = this.getQ(r.qid); return `<li class="card qcard ${r.ok === true ? 'ok' : r.ok === false ? 'no' : ''}"><div class="q-meta">${this.metaLine(q)}<b data-mlab="${ri}">${r.ok === true ? '✓' : r.ok === false ? '✗' : '待批改'}</b></div><div class="q-stem prose">${md(q.stem)}</div>
        <div class="muted">你的答案：${esc(this.fmtResp(q, r.resp))}｜正解：${esc(this.fmtAns(q))} ${this.ntuTag(q, r.resp)}</div><details class="sol" ${r.ok === null ? 'open' : ''}><summary>詳解</summary><div class="prose">${md(fmtExpl(q.expl || ''))}</div></details>
        ${r.ok === null ? `<div class="selfeval" data-mri="${ri}"><span>對照詳解自評</span>${[['full', '完整涵蓋'], ['part', '部分'], ['none', '不會']].map(([id, label]) => `<button class="btn${r.self === id ? ' on' : ''}" data-ms="${id}" ${r.self ? 'disabled' : ''}>${label}</button>`).join('')}</div>` : ''}</li>`; }).join('')}</ol>
      ${wrapperHtml(s.mock.gid, `${ok}/${objR.length}`)}
      <div class="row end">${written.length && !s.mock.sent ? '<button class="btn" id="mockGrade">送非選題批改</button>' : ''}<button class="btn" id="mockBack">回練習</button><a class="btn" href="#wrong">錯題本</a>${NextAuto.html()}</div>`;
    const res = s.results, gid = s.mock.gid;
    $$('[data-mri]').forEach(box => {
      const ri = +box.dataset.mri, r = res[ri], q = this.getQ(r.qid);
      $$('[data-ms]', box).forEach(b => b.onclick = () => {
        const v = b.dataset.ms, okv = v === 'full';
        S.answer(r.qid, okv, { conf: v === 'none' ? 1 : 2, q, source: 'self' }); r.self = v;
        $$('[data-ms]', box).forEach(x => x.disabled = true); b.classList.add('on');
        const lab = $(`[data-mlab="${ri}"]`); if (lab) lab.textContent = '自評：' + { full: '完整', part: '部分', none: '不會' }[v];
        if (res.every(x => x.ok !== null || x.self)) { const pm = S.st.msgs.filter(m => m.dir === 'out' && m.type === 'essay' && m.ctx && m.ctx.mock === gid && !m.verdict).slice(-1)[0]; if (pm) pm.selfDone = true; }
        S.save(); this.persist();
      });
    });
    wireWrapper(s.mock.gid, `${ok}/${objR.length}`); NextAuto.wire(false);
    $('#mockBack').onclick = () => { this.leaveSummary(); this.view(); };
    $('#nextGo').addEventListener('click', () => this.leaveSummary(), { once: true, capture: true });
    const grade = $('#mockGrade');
    if (grade) grade.onclick = async () => {
      grade.disabled = true;
      try {
        await Bridge.send({ type: 'essay', text: written.map(r => `${this.getQ(r.qid).stem}\n\n我的作答：\n${r.resp}`).join('\n\n'),
          ctx: { mock: gid, objective: `${ok}/${objR.length}`, minutes: s.mock.mins, qids: written.map(r => r.qid) } });
        s.mock.sent = true; if (this.sess === s) this.persist();
        grade.textContent = '已送批改';
      } catch (error) { grade.disabled = false; toast('送出失敗，請重試', 'bad'); }
    };
  },

  /* ---------- 無限隨機題 ---------- */
  viewGen() {
    main().innerHTML = `<header class="page-head"><h1>隨機計算題</h1>
      <div class="row"><button class="btn primary" id="genMix">混合 20 題</button></div></header>
      ${DATA.subjects.map(sb => { const gs = Gen.list.filter(x => x.subject === sb.id); if (!gs.length) return ''; return `<h2 class="lab-sec" style="--sc:var(--s-${sb.id})"><span class="sdot"></span>${esc(sb.name)}</h2><div class="lab-grid">${gs.map(x => { const st = genStats(x.id); return `<button class="lab-card" data-gen="${x.id}" style="--sc:var(--s-${x.subject})"><b>${esc(x.title)}</b><span>${esc(x.desc || '')}</span><span class="muted small">${st.n ? `${st.n} 題・${Math.round(st.c / st.n * 100)}%` : ''}</span></button>`; }).join('')}</div>`; }).join('')}`;
    const seed = () => Math.floor(Math.random() * 1e9);
    $('#genMix').onclick = () => this.start(Array.from({ length: 20 }, () => `gen:${rng(seed()).pick(Gen.list).id}:${seed()}`), { title: '隨機混合 20 題' });
    $$('[data-gen]').forEach(b => b.onclick = () => this.start(Array.from({ length: 10 }, () => `gen:${b.dataset.gen}:${seed()}`), { title: Gen.get(b.dataset.gen).title + '｜10 題' }));
  },
};
function genStats(gid) {
  let n = 0, c = 0;
  for (const [id, a] of Object.entries(S.st.answers)) if (id.startsWith('gen:' + gid + ':')) { n += a.n; c += a.c; }
  return { n, c };
}

/* 鍵盤連刷：A–E 選項、1/2/3 = 用該信心提交、Enter = 提交／下一題 */
document.addEventListener('keydown', e => {
  if ((e.key === 'h' || e.key === 'H') && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '') && $('#hintBtn') && !$('#hintBtn').disabled && Practice._hintOpen) { e.preventDefault(); Practice._hintOpen(); return; }
  if (e.key === 'Enter' && location.hash === '#practice' && !Practice.sess && !(e.target.closest && e.target.closest('textarea, input, button'))) { const b = $('#goNextRec') || $('#fhGo'); if (b) { e.preventDefault(); b.click(); return; } }
  const s = Practice.sess; if (!s || location.hash !== '#practice' || e.ctrlKey || e.metaKey || e.altKey || $('.nd-wrap,.modal-wrap')) return;
  const typing = e.target.closest && e.target.closest('textarea, input[type="text"], input:not([type]), input[type="number"]');
  if (typing) return;
  // 關卡卡：Enter 開打
  if (e.key === 'Enter' && $('#stGo')) { e.preventDefault(); $('#stGo').click(); return; }
  // 紙筆模式：Enter = 寫好了；翻開後 1／2／3 = 全對／有洞／錯
  if (s.state === 'ask' && $('#paperDone')) { if (e.key === 'Enter') { e.preventDefault(); $('#paperDone').click(); } else if (e.key === '0') { const b = $('#qNoBase'); if (b) { e.preventDefault(); b.click(); } } return; }
  if (s.state === 'done' && $('[data-pe]:not(:disabled)')) { const m = { 1: 'full', 2: 'part', 3: 'none' }[e.key]; if (m) { e.preventDefault(); $(`[data-pe="${m}"]`).click(); return; } }
  if (s.state === 'ask') {
    const k = e.key.toLowerCase(), idx = 'abcde'.indexOf(k);
    if (idx >= 0 && k.length === 1) { const inp = $$('#ansArea input[name="opt"]')[idx]; if (inp) { e.preventDefault(); inp.checked = inp.type === 'radio' ? true : !inp.checked; inp.dispatchEvent(new Event('input', { bubbles: true })); } return; }
    if (/^[123]$/.test(e.key)) { const b = $(`[data-conf="${e.key}"]`); if (b && Practice._conf) { e.preventDefault(); Practice._conf(+e.key); } return; }
    if (e.key === '0') { const b = $('#qNoBase'); if (b) { e.preventDefault(); b.click(); } return; }
    if (e.key === 'Enter') { const b = $('#qSubmit') || $('[data-conf="2"]'); if (b) { e.preventDefault(); b.click(); } }
  } else if (s.i >= s.ids.length && e.key === 'Enter' && !e.target.closest?.('button, a, summary')) {
    const next = $('#nextGo') || $('#goNextRec');
    if (next) { e.preventDefault(); next.click(); }
  } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
    const n = $('#qNext'); if (n && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); n.click(); }
  }
});

/* 寬窄切換（跨 1180px）時重畫作答卡：草稿紙要搬到右欄／選項下面（手寫內容存在 draft.pad，會畫回來） */
addEventListener('resize', () => { clearTimeout(Practice._rz); Practice._rz = setTimeout(() => { const P = Practice; if (P.sess && location.hash === '#practice' && $('#main .pq') && P.wide() !== P._wide) P.renderCard(); }, 250); });
