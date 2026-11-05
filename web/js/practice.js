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

const Practice = {
  sess: null,

  getQ(id) { return id.startsWith('gen:') ? this.genQ(id) : QBANK.get(id); },
  genQ(id) { const [, gid, seed] = id.split(':'); try { return Gen.make(gid, +seed); } catch (e) { return null; } },

  start(ids, opts = {}) {
    ids = ids.filter(id => this.getQ(id));
    if (opts.shuffle) ids = rng(Date.now() & 0xffffffff).shuffle(ids);
    if (opts.limit) ids = ids.slice(0, opts.limit);
    if (!ids.length) { toast('沒有可以練的題目', ''); return; }
    if (window.__fromAuto && Date.now() - window.__fromAuto < 3000) { opts = Object.assign({}, opts, { auto: true }); window.__fromAuto = 0; }
    if (!(opts.review || opts.pretest || opts.base || opts.fix || opts.ex || opts.mock || opts.ramp === false)) { ids = this.rampSort(ids); opts = Object.assign({}, opts, { ramp: true }); }
    this.sess = { ids, i: 0, opts, results: [], t0: Date.now(), state: 'ask' };
    if (location.hash === '#practice') route(); else location.hash = '#practice';
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
  goNext() { const r = this.recs(); this.fi = 0; if (r.length) r[0].go(); else { this.sess = null; this.view(); } },
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
    $('#stGo').onclick = () => this.renderCard();
    if ($('#stBack')) $('#stBack').onclick = () => { this.sess = null; location.hash = '#' + prevCh; };
    if (prevRes.length && !weak && typeof Rewards !== 'undefined') { Rewards.chime('big'); Rewards.confetti(40); }
    $('#qQuit').onclick = () => { s.ids = s.ids.slice(0, s.i); this.view(); };
  },
  startAdaptive(only) {
    const first = Learn.pick(new Set(), null, only);
    if (!first) { toast('沒有可以練的題目', ''); return; }
    const m0 = {}; DATA.lessons.forEach(l => m0[l.id] = Learn.mastery(l.id));
    this.sess = { ids: [first.id], i: 0, opts: { title: only ? '自適應練習：' + LESSON[only].title : '自適應練習', adaptive: true, limit: 15, only }, results: [], t0: Date.now(), state: 'ask', m0 };
    if (location.hash === '#practice') route(); else location.hash = '#practice';
  },
  advance() {
    const s = this.sess; s.i++;
    if (s.opts.adaptive && s.i >= s.ids.length && s.ids.length < s.opts.limit) { const prev = (this.getQ(s.ids[s.i - 1]) || {}).ch; const nx = Learn.pick(new Set(s.ids), prev, s.opts.only); if (nx) s.ids.push(nx.id); }
    this.view();
  },

  /* ---------- home ---------- */
  view() {
    if (this.sess && this.sess.mock) return this.renderMock();
    if (this.sess) return this.sess.i >= this.sess.ids.length ? this.renderSummary() : this.renderCard();
    const studied = DATA.lessons.filter(l => (S.st.lessons[l.id] || {}).read).map(l => l.id);
    const due = S.dueReviews();
    const agq = S.st.agentQuiz.filter(q => !S.st.answers[q.id]);
    main().innerHTML = `
    ${this.feedHtml()}
    <details class="self-pick"><summary>自己挑</summary>
    <div class="mode-grid">
      <button class="mode hot" id="mAdapt"><b>自適應練習</b><span>15 題</span></button>
      ${due.length ? `<button class="mode" id="mDue"><b>到期複習</b><span>${due.length} 題</span></button>` : ''}
      <button class="mode" id="mInter"><b>混合練習</b><span>20 題</span></button>
      ${agq.length ? `<button class="mode" id="mAgent"><b>Agent 出題</b><span>${agq.length} 題</span></button>` : ''}
      <button class="mode" id="mHard"><b>難題</b><span>15 題</span></button>
      <a class="mode" href="#gen"><b>隨機計算題</b><span>∞</span></a>
    </div>
    <h2 class="sec">模考</h2>
    <div class="mode-grid">${GROUPS.map(g => `<button class="mode mock" data-mock="${g.id}"><b>${g.name}</b><span>${g.mins} 分鐘</span></button>`).join('')}</div>
    <h2 class="sec">章節</h2>
    <div class="subj-tabs" role="tablist">${DATA.subjects.map(sb => `<button class="stab${sb.id === this.sj ? ' on' : ''}" data-sj="${sb.id}" style="--sc:var(--s-${sb.id})"><span class="sdot"></span>${esc(sb.short || sb.name)}</button>`).join('')}</div>
    <div id="chList" class="ch-list"></div></details>`;
    const pool = () => QBANK.all().filter(q => q.src !== 'agent');
    $('#mInter').onclick = () => {
      const src = studied.length ? pool().filter(q => studied.includes(q.ch)) : pool();
      this.start(src.map(q => q.id), { title: '交錯混合練習', shuffle: true, limit: 20 });
    };
    if ($('#mDue')) $('#mDue').onclick = () => this.start(due, { title: '到期複習', review: true });
    $('#mAdapt').onclick = () => this.startAdaptive();
    if ($('#mAgent')) $('#mAgent').onclick = () => this.start(agq.map(q => q.id), { title: 'Agent 出題' });
    $('#mHard').onclick = () => {
      let src = pool().filter(q => q.diff >= 3); const st = src.filter(q => studied.includes(q.ch));
      this.start((st.length >= 10 ? st : src).map(q => q.id), { title: '台大難度題', shuffle: true, limit: 15 });
    };
    $$('[data-mock]').forEach(b => b.onclick = () => this.startMock(b.dataset.mock));
    this.wireFeed();
    const drawCh = () => {
      $$('.stab').forEach(b => b.classList.toggle('on', b.dataset.sj === this.sj));
      $('#chList').innerHTML = DATA.lessons.filter(l => l.subject === this.sj).map(l => { const cs = chapterStats(l.id), d = this.dictGet(l.id); return `<div class="ch-row"><div class="ch-t">${esc(l.title)}${this.starHtml(l.id)}</div><div class="ch-act"><button class="btn sm" data-ch="${l.id}" ${cs.n ? '' : 'disabled'}>做題 <small>${cs.att}/${cs.n}${cs.acc != null ? '・' + Math.round(cs.acc * 100) + '%' : ''}</small></button>${(l.rubric || []).length ? `<button class="btn sm" data-dict="${l.id}">${ICON('pen')} 默寫 <small>${d ? d.hit + '/' + d.total : '—'}</small></button>` : ''}</div></div>`; }).join('');
      $$('[data-ch]').forEach(b => b.onclick = () => this.start(QBANK.all().filter(q => q.ch === b.dataset.ch).map(q => q.id), { title: LESSON[b.dataset.ch].title, ch: b.dataset.ch }));
      $$('[data-dict]').forEach(b => b.onclick = () => this.renderDictate(b.dataset.dict));
    };
    if (!this.sj) { const rd0 = this.dictRedo()[0]; this.sj = rd0 ? LESSON[rd0.ch].subject : DATA.subjects[0].id; }
    $$('.stab').forEach(b => b.onclick = () => { this.sj = b.dataset.sj; drawCh(); });
    drawCh();
  },

  /* ---------- question card ---------- */
  answerUI(q, name = 'opt') {
    if (q.type === 'single' || q.type === 'multi') {
      return `<div class="opts" role="${q.type === 'single' ? 'radiogroup' : 'group'}">${q.opts.map((o, k) => `<label class="opt"><input type="${q.type === 'single' ? 'radio' : 'checkbox'}" name="${name}" value="${k}"><span class="ol">${LETTERS[k]}</span><span class="ot">${md(o).replace(/^<p>|<\/p>$/g, '')}</span></label>`).join('')}</div>${q.type === 'multi' ? '<p class="muted small">複選題：全對才給分（台大常見）。</p>' : ''}`;
    }
    if (q.type === 'fill') return `<div class="fill"><input id="${name}-fill" autocomplete="off" placeholder="${esc(q.fmt || '答案')}"></div>`;
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

  renderCard() {
    const s = this.sess; const qid = s.ids[s.i]; const q = this.getQ(qid);
    if (!q) { s.i++; return this.view(); }
    if ((s.opts.ex || []).includes(qid)) return this.renderExample(q, qid);
    if (s.opts.ramp && s.stage !== (q.diff || 2)) { if (s.opts.direct && s.stage == null) s.stage = q.diff || 2; else return this.renderStage(qid); }
    s.state = 'ask'; s.conf = null; s.p = Learn.pOf(q);
    if (!s.opts.pretest && this.paperOn()) return this.renderPaper(q, qid);
    const m = main();
    m.innerHTML = `
    ${this.headHtml(q)}
    <section class="card qcard">
      <div class="q-meta">${this.metaLine(q)}<button class="btn ghost sm paper-tg" id="toPaper" title="考場是手寫，用紙筆練">改用紙筆</button></div>
      <div class="q-stem prose">${md(q.stem)}</div>
      ${this.hintHtml(q)}
      <div id="ansArea">${this.answerUI(q)}</div>
      ${q.type !== 'essay' ? `<details class="reason"><summary>思考鏈</summary><textarea id="reasonText" rows="4"></textarea></details>` : ''}
      <div class="row end q-act">${s.opts.pretest ? '' : '<button class="btn ghost nb-btn" id="qNoBase" title="完全不會（0）">完全不會</button>'}<button class="btn ghost" id="qSkip">跳過</button>${s.opts.pretest ? '<button class="btn primary" id="qSubmit">提交</button>'
        : `<span class="cs-l">提交</span>${[[1, '猜的'], [2, '有把握'], [3, '很確定']].map(([v, t]) => `<button class="btn cs ${v === 2 ? 'primary' : ''}" data-conf="${v}"><kbd>${v}</kbd>${t}</button>`).join('')}`}</div>
      <div id="feedback"></div>
    </section>
    <div class="row end"><button class="btn ghost" id="qQuit">結束這回</button></div>`;
    this.wireHints(q); s.hint = 0;
    $$('[data-conf]', m).forEach(b => b.onclick = () => { s.conf = +b.dataset.conf; this.submit(q, qid); });
    if ($('#toPaper')) $('#toPaper').onclick = () => { this.paperSet(true); this.renderCard(); };
    $('#qSkip').onclick = () => { s.results.push({ qid, skipped: true }); this.advance(); };
    if ($('#qNoBase')) $('#qNoBase').onclick = () => this.noBase(q, qid);
    $('#qQuit').onclick = () => { s.ids = s.ids.slice(0, s.i); this.view(); };
    if ($('#qSubmit')) $('#qSubmit').onclick = () => this.submit(q, qid);
    const fi = $('#opt-fill'); if (fi) { fi.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (!s.conf) s.conf = 2; this.submit(q, qid); } }); setTimeout(() => fi.focus({ preventScroll: true }), 30); }
  },

  /* ---------- 紙筆模式：先自己寫出來，再翻答案、對照自評（考場是手寫） ---------- */
  paperOn() { try { return localStorage.getItem('paperMode') !== '0'; } catch (e) { return true; } },
  paperSet(v) { try { localStorage.setItem('paperMode', v ? '1' : '0'); } catch (e) {} },

  initPad(root) {
    const cv = $('#pad', root); if (!cv) return;
    const dpr = window.devicePixelRatio || 1, w = cv.parentElement.clientWidth || 600, h = Math.round(Math.min(380, Math.max(260, w * 0.55)));
    cv.width = w * dpr; cv.height = h * dpr; cv.style.height = h + 'px';
    const g = cv.getContext('2d'); g.scale(dpr, dpr); g.lineCap = 'round'; g.lineJoin = 'round';
    let tool = 'pen', down = false, last = null;
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', e => { down = true; last = pos(e); cv.setPointerCapture(e.pointerId); e.preventDefault(); });
    cv.addEventListener('pointermove', e => {
      if (!down) return; const p = pos(e);
      g.globalCompositeOperation = tool === 'pen' ? 'source-over' : 'destination-out';
      g.strokeStyle = '#18202c'; g.lineWidth = tool === 'pen' ? (e.pressure && e.pointerType === 'pen' ? 1 + e.pressure * 3 : 2.2) : 18;
      g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke(); last = p; e.preventDefault();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => cv.addEventListener(t, () => { down = false; }));
    $$('[data-pt]', root).forEach(b => b.onclick = () => {
      if (b.dataset.pt === 'clear') { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.restore(); return; }
      tool = b.dataset.pt; $$('[data-pt]', root).forEach(x => x.classList.toggle('on', x.dataset.pt === tool));
    });
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
        <div class="pad-tools"><button class="btn sm on" data-pt="pen">筆</button><button class="btn sm" data-pt="eraser">橡皮擦</button><button class="btn sm" data-pt="clear"> 全清</button></div></div>
      <div class="row end q-act"><button class="btn ghost nb-btn" id="qNoBase" title="完全不會（0）">完全不會</button><button class="btn ghost" id="qSkip">跳過</button><button class="btn primary" id="paperDone">對答案</button></div>
      <div id="feedback"></div>
    </section>
    <div class="row end"><button class="btn ghost" id="qQuit">結束這回</button></div>`;
    this.initPad(m); this.wireHints(q); s.hint = 0;
    $('#toKey').onclick = () => { this.paperSet(false); this.renderCard(); };
    $('#qSkip').onclick = () => { s.results.push({ qid, skipped: true }); this.advance(); };
    $('#qNoBase').onclick = () => this.noBase(q, qid);
    $('#qQuit').onclick = () => { s.ids = s.ids.slice(0, s.i); this.view(); };
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
    btn.onclick = open; this._hintOpen = open;
    clearTimeout(this._hintT); this._hintT = setTimeout(() => { if (k === 0 && btn.isConnected && s && s.state === 'ask') btn.classList.add('pulse'); }, 25000);
  },
  paperReveal(q, qid) {
    const s = this.sess; if (s.state !== 'ask') return; s.state = 'done';
    const m = main(); $$('.q-act', m).forEach(x => x.remove()); $$('.pad-tools button', m).forEach(x => x.disabled = true);
    const cv = $('#pad', m); if (cv) cv.style.pointerEvents = 'none';
    $('#feedback').innerHTML = `
      ${q.type !== 'essay' ? `<div class="fb neutral"><div class="fb-top"><b>標準答案</b></div><div class="fb-ans"><span><b>${esc(this.fmtAns(q))}</b></span></div></div>` : ''}
      <div class="expl-box"><div class="expl-h">解法</div><div class="prose expl">${md(fmtExpl(q.expl || ''))}</div></div>
      <div class="selfeval">
        <button class="btn" data-pe="full">全對，過程也通<kbd>1</kbd></button><button class="btn" data-pe="part">答案對，過程有洞<kbd>2</kbd></button><button class="btn" data-pe="none">答案或方法錯<kbd>3</kbd></button></div>
      <div id="afterFb"></div>`;
    $$('[data-pe]', m).forEach(b => b.onclick = () => {
      const v = b.dataset.pe, ok = v === 'full'; $$('[data-pe]', m).forEach(x => x.disabled = true);
      s.conf = v === 'none' ? 1 : 2;
      S.answer(qid, ok, { conf: s.conf, q }); if (q.src === 'gen') S.day().gens++;
      s.results.push({ qid, ok, conf: s.conf, resp: null }); this.hit(ok, q);
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

  submit(q, qid) {
    const s = this.sess; if (s.state !== 'ask') return;
    const m = main();
    const resp = this.readResponse(q, m);
    if (resp == null) { s.conf = null; toast('先作答', 'bad'); return; }
    if (!s.conf && !s.opts.pretest) s.conf = 2;
    s.state = 'done';
    const reasoning = ($('#reasonText') || {}).value || '';
    $$('.q-act', m).forEach(x => x.remove());
    $$('input, textarea', $('#ansArea')).forEach(x => x.disabled = true);
    const fb = $('#feedback');
    if (q.type === 'essay') {
      fb.innerHTML = `<div class="fb neutral"><b>參考解答</b></div><div class="prose expl">${md(fmtExpl(q.expl))}</div>
      <div class="selfeval"><span>自評</span>
      <button class="btn" data-se="full">完整涵蓋</button><button class="btn" data-se="part">部分</button><button class="btn" data-se="none">不會</button></div>
      <div class="row"><button class="btn" id="sendEssay">送 Agent 批改</button></div><div id="afterSE"></div>`;
      $$('[data-se]', fb).forEach(b => b.onclick = () => {
        const ok = b.dataset.se === 'full';
        S.answer(qid, ok, { conf: s.conf, q });
        s.results.push({ qid, ok, conf: s.conf, resp }); this.hit(ok, q);
        $$('[data-se]', fb).forEach(x => x.disabled = true);
        if (!ok) this.causeUI(qid, $('#afterSE'), q, resp, reasoning); else this.nextBtn($('#afterSE'), q, qid, resp, reasoning);
      });
      $('#sendEssay').onclick = async () => {
        await Bridge.send({ type: 'essay', text: resp, ctx: { qid, chapter: q.ch, stem: q.stem, reference: q.expl } });
        toast('已送 Agent 批改', 'good'); $('#sendEssay').disabled = true;
      };
      return;
    }
    const ok = this.isCorrect(q, resp);
    if (s.opts.pretest) {
      s.results.push({ qid, ok, conf: s.conf, resp });
      if (q.type !== 'fill') $$('.opt', m).forEach((el, k) => { if (q.ans.includes(k)) el.classList.add('right'); else if (resp.includes(k)) el.classList.add('wrong'); });
      fb.innerHTML = `<div class="fb neutral"><b>${ok ? '✓' : '✗'}</b>　正解：${esc(this.fmtAns(q))}</div><div id="afterFb"></div>`;
      this.nextBtn($('#afterFb'), q, qid, resp, reasoning); return;
    }
    const a = S.answer(qid, ok, { conf: s.conf, q });
    if (q.src === 'gen') S.day().gens++;
    s.results.push({ qid, ok, conf: s.conf, resp }); this.hit(ok, q);
    // mark options
    if (q.type !== 'fill') $$('.opt', m).forEach((el, k) => { if (q.ans.includes(k)) el.classList.add('right'); else if (resp.includes(k)) el.classList.add('wrong'); });
    fb.innerHTML = `<div class="fb ${ok ? 'good' : 'bad'}"><div class="fb-top"><span class="fb-ic" aria-hidden="true">${ok ? ICON('check') : ICON('close')}</span><b>${ok ? '答對了' : '再想一下'}</b></div><div class="fb-ans"><span>正解：<b>${esc(this.fmtAns(q))}</b></span>${ok ? '' : `<span>你選：${esc(this.fmtResp(q, resp))}</span>`}</div>
      ${!ok && s.conf === 3 ? '<div class="hcw">很確定卻答錯：這題最值得弄懂</div>' : ''}</div>
      <div class="expl-box"><div class="expl-h"><span class="h-ic" aria-hidden="true">${ICON('book')}</span>為什麼</div><div class="prose expl">${md(fmtExpl(q.expl || ''))}</div></div><div id="afterFb"></div>`;
    if (!ok) this.causeUI(qid, $('#afterFb'), q, resp, reasoning);
    else this.nextBtn($('#afterFb'), q, qid, resp, reasoning);
  },

  /* 🆘 完全不會：記為不會、直接看完整解答，下一題換同類型的讓你照著做 */
  noBase(q, qid) {
    const s = this.sess; if (s.state !== 'ask') return; s.state = 'done';
    const m = main(); $$('.q-act', m).forEach(x => x.remove()); $$('input, textarea', $('#ansArea')).forEach(x => x.disabled = true);
    S.answer(qid, false, { conf: 1, q, cause: '沒基礎' }); s.results.push({ qid, ok: false, conf: 1, nobase: true });
    const nx = Rescue.similar(q, qid, new Set(s.ids)); if (nx) { s.ids.splice(s.i + 1, 0, nx); if (s.opts.limit && s.opts.adaptive) s.opts.limit++; }
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
    if (sp) $('#goSpot', host).onclick = () => { const s = this.sess; if (s) { s.ids = s.ids.slice(0, s.i + 1); } goSpot(sp); };
    let cause = null;
    const keep = () => { const note = $('#causeNote').value.trim(), a = S.st.answers[qid]; if (cause) a.cause = cause; if (note) S.st.wrongNotes[qid] = note; S.save(); return true; };
    $$('[data-cause]', host).forEach(b => b.onclick = () => { cause = b.dataset.cause; keep(); this.advance(); });
    this.nextBtn($('#nb'), q, qid, resp, reasoning, keep);
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
    if (s.opts.fix) Personal.markFixed(s.opts.fix);
    if (s.opts.pretest) { const ls = S.lesson(s.opts.pretest); ls.pre = D.today(); S.save();
      main().innerHTML = `<header class="page-head"><h1>${ok} / ${res.length}</h1></header>
      <div class="row">${NextAuto.html()}</div>`; this.sess = null; NextAuto.wire(); return; }
    let starLine = '';
    if (s.opts.ramp && s.opts.ch) { const ld = s.stage, lr = res.filter(r => this.dOf(r.qid) === ld); const got = this.stageClear(ld, lr); starLine = `<div class="sum-stars">${this.starHtml(s.opts.ch)}${got ? '<span class="good-t">　新星！</span>' : ''}</div>`; if (got && typeof Rewards !== 'undefined') { Rewards.chime('big'); Rewards.confetti(70); } }
    const touched = s.opts.adaptive ? [...new Set(res.map(r => (this.getQ(r.qid) || {}).ch).filter(Boolean))] : [];
    main().innerHTML = `
    <header class="page-head"><div class="eyebrow">${esc(s.opts.title || '練習')}｜${mins} 分鐘</div><h1>${res.length ? Math.round(ok / res.length * 100) : 0}%　<small>${ok} / ${res.length} 題</small></h1>
    ${starLine}${hcw ? `<p class="bad-t">高信心答錯 ${hcw} 題</p>` : ''}</header>
    <section class="card"><div class="res-dots" aria-label="每題結果">${s.results.map(r => `<span class="rd ${r.skipped ? 'skip' : r.ok ? 'ok' : 'no'}"></span>`).join('')}</div>
    <details class="res-more"><summary>看每一題</summary><ul class="res">${s.results.map(r => { const q = this.getQ(r.qid); return `<li class="${r.skipped ? 'skip' : r.ok ? 'ok' : 'no'}"><span>${r.skipped ? '跳過' : r.ok ? '✓' : '✗'}</span><span>${esc(String(q.stem).replace(/[#*`$>|=\\]/g, '').slice(0, 70))}…</span><span class="muted small">${r.conf ? ['', '猜', '有把握', '很確定'][r.conf] : ''}</span></li>`; }).join('')}</ul></details>
    <div class="row end"><button class="btn" id="again">再練錯的</button>${s.opts.auto && S.st.onboarded && Auto.current() ? `<button class="btn" id="goNextRec">▶ 下一關</button>${NextAuto.html()}` : '<button class="btn primary big" id="goNextRec">▶ 下一關</button>'}</div></section>
    ${touched.length ? `<section class="card"><div class="card-h"><h2>掌握度</h2></div><ul class="mdelta">${touched.map(ch => { const a0 = s.m0[ch], a1 = Learn.mastery(ch); const d = a0 == null ? null : a1 - a0; return `<li><span>${esc(LESSON[ch] ? LESSON[ch].title : ch)}</span><b>${a0 == null ? '新' : Math.round(a0 * 100) + '%'} → ${Math.round(a1 * 100)}%</b>${d == null ? '' : `<span class="${d >= 0 ? 'good-t' : 'bad-t'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(d * 100))}</span>`}</li>`; }).join('')}</ul></section>` : ''}`;
    const wrongIds = res.filter(r => !r.ok).map(r => r.qid);
    if (!wrongIds.length) $('#again').remove(); else $('#again').onclick = () => this.start(wrongIds, { title: '重練錯題', review: true });
    const viaAuto = !!$('#nextGo');
    this.sess = null; const nb = $('#goNextRec'); nb.onclick = () => { stop(); NextAuto.cancel(); this.goNext(); };
    if (viaAuto) { nb.onclick = () => { NextAuto.cancel(); this.goNext(); }; NextAuto.wire(); return; }
    // 懶人模式：5 秒後自動進下一關；碰一下畫面就取消
    let left = 5, tm = null; const stop = () => { if (tm) { clearInterval(tm); tm = null; nb.textContent = '▶ 下一關'; } ['pointerdown', 'keydown', 'wheel'].forEach(t => document.removeEventListener(t, cancel, true)); };
    const cancel = e => { if (e.target === nb) return; stop(); };
    if (this.recs().length) {
      nb.textContent = `▶ 下一關 ${left}`;
      tm = setInterval(() => { if (!document.body.contains(nb)) return stop(); left--; if (left <= 0) { stop(); this.goNext(); } else nb.textContent = `▶ 下一關 ${left}`; }, 1000);
      ['pointerdown', 'keydown', 'wheel'].forEach(t => document.addEventListener(t, cancel, true));
    }
  },

  /* ---------- 模擬考 ---------- */
  startMock(gid) {
    const g = GROUPS.find(x => x.id === gid);
    const r = rng(Date.now() & 0xffffffff);
    const bank = QBANK.all().filter(q => g.subs.includes(q.subject) && q.src !== 'agent');
    const wshuf = arr => this.hasExam() ? arr.map(q => [q, -Math.log(1 - r()) / (0.05 + this.examF(q.ch) * 10)]).sort((a, b) => a[1] - b[1]).map(x => x[0]) : r.shuffle(arr);
    const obj = wshuf(bank.filter(q => q.type !== 'essay'));
    const ess = wshuf(bank.filter(q => q.type === 'essay'));
    // balance the two subjects
    const pickBal = (arr, n) => { const out = []; const by = g.subs.map(sid => arr.filter(q => q.subject === sid)); let k = 0; while (out.length < n && by.some(b => b.length)) { const b = by[k++ % by.length]; if (b.length) out.push(b.shift()); } return out; };
    const ids = pickBal(obj, 16).concat(pickBal(ess, 4)).map(q => q.id);
    this.sess = { mock: { gid, end: Date.now() + g.mins * 60000, resp: {} }, ids, i: 0, opts: { title: '模擬考：' + g.name }, results: [], t0: Date.now() };
    if (location.hash === '#practice') route(); else location.hash = '#practice';
  },
  renderMock() {
    const s = this.sess; const g = GROUPS.find(x => x.id === s.mock.gid);
    if (s.mock.done) return this.renderMockResult();
    const m = main();
    m.innerHTML = `<header class="page-head slim exam-head"><div class="eyebrow">${esc(g.name)}｜${s.ids.length} 題</div>
      <div class="row"><b class="exam-clock" id="examClock">--:--</b><button class="btn primary" id="handIn">交卷</button></div>
      <div class="boss"><span class="boss-n">大魔王</span><span class="hp"><i id="mockHp" style="width:100%"></i></span><span class="hp-n" id="mockHpN">${s.ids.length}/${s.ids.length}</span></div></header>
      <ol class="exam">${s.ids.map((id, k) => { const q = this.getQ(id); return `<li class="card qcard" id="eq-${k}"><div class="q-meta">${this.metaLine(q)}</div><div class="q-stem prose">${md(q.stem)}</div>${this.answerUI(q, 'e' + k)}</li>`; }).join('')}</ol>
      <div class="row end"><button class="btn primary" id="handIn2">交卷</button></div>`;
    const tick = () => {
      const left = Math.max(0, s.mock.end - Date.now()); const el = $('#examClock'); if (!el) { clearInterval(s.mock.timer); return; }
      el.textContent = String(Math.floor(left / 60000)).padStart(2, '0') + ':' + String(Math.floor(left / 1000) % 60).padStart(2, '0');
      if (left <= 0) { clearInterval(s.mock.timer); toast('時間到，自動交卷', 'bad'); this.handIn(); }
    };
    clearInterval(s.mock.timer); s.mock.timer = setInterval(tick, 1000); tick();
    $('#handIn').onclick = () => this.handIn(); $('#handIn2').onclick = () => this.handIn();
    // 血條：每答一題扣一格（只看有沒有作答，不看對錯）
    const hp = () => { const n = s.ids.length, done = s.ids.filter((id, k) => { const q = this.getQ(id), li = $('#eq-' + k); try { return li && this.readResponse(q, li, 'e' + k) != null; } catch (e) { return false; } }).length;
      const left = n - done, b = $('#mockHp'), t = $('#mockHpN'); if (b) b.style.width = (left / n * 100) + '%'; if (t) t.textContent = left + '/' + n; };
    m.addEventListener('change', hp); m.addEventListener('input', debounce(hp, 300)); hp();
  },
  handIn() {
    const s = this.sess; const m = main(); clearInterval(s.mock.timer);
    s.ids.forEach((id, k) => {
      const q = this.getQ(id); const root = $('#eq-' + k, m);
      const resp = root ? this.readResponse(q, root, 'e' + k) : null;
      s.mock.resp[id] = resp;
      if (q.type !== 'essay') { const ok = this.isCorrect(q, resp); S.answer(id, ok, { conf: null, q }); s.results.push({ qid: id, ok, resp }); }
      else s.results.push({ qid: id, ok: null, resp });
    });
    s.mock.done = true; s.mock.mins = Math.round((Date.now() - s.t0) / 60000);
    const L = S.day(); L.mocks = (L.mocks || []); if (!L.mocks.includes(s.mock.gid)) L.mocks.push(s.mock.gid); S.save();
    const objR = s.results.filter(r => r.ok !== null);
    Bridge.send({ type: 'essay', text: s.results.filter(r => r.ok === null).map((r, i) => `【第 ${i + 1} 題】${String(this.getQ(r.qid).stem).slice(0, 200)}\n我的作答：\n${r.resp || '（空白）'}`).join('\n\n'), ctx: { mock: s.mock.gid, objective: `${objR.filter(r => r.ok).length}/${objR.length}`, minutes: s.mock.mins, qids: s.results.filter(r => r.ok === null).map(r => r.qid) } });
    this.renderMockResult();
  },
  renderMockResult() {
    const s = this.sess; const g = GROUPS.find(x => x.id === s.mock.gid);
    const objR = s.results.filter(r => r.ok !== null); const ok = objR.filter(r => r.ok).length;
    main().innerHTML = `<header class="page-head"><div class="eyebrow">模擬考成績｜${esc(g.name)}｜用時 ${s.mock.mins} 分</div>
      <h1>${ok} / ${objR.length}</h1></header>
      <ol class="exam">${s.results.map((r) => { const q = this.getQ(r.qid); return `<li class="card qcard ${r.ok === true ? 'ok' : r.ok === false ? 'no' : ''}"><div class="q-meta">${this.metaLine(q)}<b>${r.ok === true ? '✓' : r.ok === false ? '✗' : '待批改'}</b></div><div class="q-stem prose">${md(q.stem)}</div>
        <div class="muted">你的答案：${esc(this.fmtResp(q, r.resp))}｜正解：${esc(this.fmtAns(q))}</div><details class="sol"><summary>詳解</summary><div class="prose">${md(fmtExpl(q.expl || ''))}</div></details></li>`; }).join('')}</ol>
      ${wrapperHtml(s.mock.gid, `${ok}/${objR.length}`)}
      <div class="row end"><a class="btn" href="#wrong">錯題本</a>${NextAuto.html()}</div>`;
    wireWrapper(s.mock.gid, `${ok}/${objR.length}`); NextAuto.wire(false);
    this.sess = null;
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
    if (idx >= 0 && k.length === 1) { const inp = $$('#ansArea input[name="opt"]')[idx]; if (inp) { e.preventDefault(); inp.checked = inp.type === 'radio' ? true : !inp.checked; } return; }
    if (/^[123]$/.test(e.key)) { const b = $(`[data-conf="${e.key}"]`); if (b) { e.preventDefault(); b.click(); } return; }
    if (e.key === '0') { const b = $('#qNoBase'); if (b) { e.preventDefault(); b.click(); } return; }
    if (e.key === 'Enter') { const b = $('#qSubmit') || $('[data-conf="2"]'); if (b) { e.preventDefault(); b.click(); } }
  } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
    const n = $('#qNext'); if (n && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); n.click(); }
  }
});
