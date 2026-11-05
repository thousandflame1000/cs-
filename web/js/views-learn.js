/* 資工所衝刺站 — 學習法升級：必背卡（FSRS）、學習儀表板（校準／掌握度／遺忘曲線）、讀前預測驗、模考反思 */
'use strict';

const KIND_ZH = { tf: '陷阱判斷', key: '考點', recall: '回想' };
const pct = x => x == null ? '—' : Math.round(x * 100) + '%';

/* ======================= 必背卡 ======================= */
let CardSess = null;
function cardFilter(sub, kind) { return c => (!sub || sub === 'all' || c.subject === sub) && (!kind || kind === 'all' || c.kind === kind); }
function interleave(arr) { // 同一章不要連著出
  const by = {}; arr.forEach(c => (by[c.ch] = by[c.ch] || []).push(c)); const keys = rng(Date.now() & 0xffff).shuffle(Object.keys(by)); const out = [];
  while (out.length < arr.length) for (const k of keys) if (by[k].length) out.push(by[k].shift());
  return out;
}
function startCards(opts = {}) {
  const f0 = cardFilter(opts.sub, opts.kind), f = c => f0(c) && (!opts.chs || opts.chs.includes(c.ch));
  const due = rng(Date.now() & 0xffffffff).shuffle(Learn.cardDue(D.today(), f));
  const fresh = opts.noNew ? [] : Learn.newCards(f, opts.newLimit ?? Learn.newLeft());
  const list = interleave(due.concat(fresh)).slice(0, opts.max || 120);
  if (!list.length) { toast(opts.kind === 'tf' ? '今天沒有到期的陷阱卡，也沒有新卡可開（先讀新的章節）' : '今天的卡片都做完了', 'good'); return; }
  CardSess = { list, i: 0, t0: Date.now(), res: [], requeue: {}, title: opts.title || '今日必背卡', state: 'front', fix: opts.fix };
  if (location.hash === '#cards') route(); else location.hash = '#cards';
}
/* 考前總複習：記得機率最低的 40 張 */
function startCram() {
  const srs = S.st.srs || {}, list = Learn.cards().filter(c => srs[c.id]).sort((a, b) => Learn.Rnow(srs[a.id]) - Learn.Rnow(srs[b.id])).slice(0, 40);
  if (!list.length) { S.day().cramDone = true; S.save(); toast('還沒有學過的卡片', ''); return; }
  CardSess = { list: interleave(list), i: 0, t0: Date.now(), res: [], requeue: {}, title: '考前總複習', state: 'front', cram: true };
  if (location.hash === '#cards') route(); else location.hash = '#cards';
}
function viewCards() {
  if (CardSess) return CardSess.i >= CardSess.list.length ? cardSummary() : renderCardItem();
  const all = Learn.cards(), srs = S.st.srs || {}, today = D.today();
  const due = Learn.cardDue(today).length, newN = Math.min(Learn.newLeft(), Learn.newCards().length), learned = all.filter(c => srs[c.id]).length;
  main().innerHTML = `
  ${due + newN ? `<section class="feed-hero"><div class="fh-ic" aria-hidden="true">🃏</div><h2>今日卡片</h2><div class="fh-sub">${due ? `快忘的 ${due} 張` : ''}${due && newN ? ' · ' : ''}${newN ? `新的 ${newN} 張` : ''}</div><button class="go-start" id="cToday">▶ 開始</button></section>`
    : `<section class="feed-hero"><div class="fh-ic" aria-hidden="true">✅</div><h2>今天的卡片清空了</h2><button class="go-start" id="cTf">▶ 陷阱判斷</button></section>`}
  <details class="self-pick"><summary>自己挑</summary>
  <section class="kpis kpis3">
    <div class="kpi"><span class="k">${due}</span><span class="l">到期</span></div>
    <div class="kpi"><span class="k">${newN}</span><span class="l">新卡</span></div>
    <div class="kpi"><span class="k">${learned}<small>/${all.length}</small></span><span class="l">已學</span></div>
  </section>
  <div class="mode-grid">
    ${due + newN ? '<button class="mode" id="cTf"><b>陷阱判斷</b><span>✓ / ✗</span></button>' : ''}
    ${learned ? `<button class="mode" id="cCram"><b>總複習</b><span>${Math.min(40, learned)} 張</span></button>` : ''}
  </div>
  <div class="deck-grid sec">${DATA.subjects.map(s => { const cs = all.filter(c => c.subject === s.id); const l = cs.filter(c => srs[c.id]).length, d = cs.filter(c => Learn.isDue(srs[c.id], today)).length;
    return `<button class="deck" data-sub="${s.id}" style="--sc:var(--s-${s.id})"><span class="sdot"></span><b>${esc(s.name)}</b><span class="muted small">${l}/${cs.length}${d ? `｜到期 ${d}` : ''}</span><span class="bar"><i style="width:${cs.length ? l / cs.length * 100 : 0}%"></i></span></button>`; }).join('')}</div></details>`;
  if ($('#cToday')) $('#cToday').onclick = () => startCards({ title: '今日必背卡' });
  if ($('#cTf')) $('#cTf').onclick = () => startCards({ kind: 'tf', title: '陷阱判斷快問快答' });
  if ($('#cCram')) $('#cCram').onclick = () => startCram();
  $$('[data-sub]').forEach(b => b.onclick = () => startCards({ sub: b.dataset.sub, title: SUBJ[b.dataset.sub].name + '｜必背卡' }));
}
function renderCardItem() {
  const s = CardSess, c = s.list[s.i], l = LESSON[c.ch], srs = Learn.card(c.id); s.state = 'front'; s.pick = null; s.grade = null;
  const isNew = !srs, R = Learn.Rnow(srs);
  main().innerHTML = `
  <header class="page-head slim"><div class="eyebrow">${s.i + 1} / ${s.list.length}</div><div class="progress"><i style="width:${s.i / s.list.length * 100}%"></i></div></header>
  <section class="card fcard k-${c.kind}" style="--sc:var(--s-${c.subject})">
    <div class="q-meta"><span class="chip sm" style="--sc:var(--s-${c.subject})"><span class="sdot"></span>${esc(l ? l.title : c.ch)}</span></div>
    <div class="f-front prose"><div class="f-kind"><span class="f-kind-ic" aria-hidden="true">${({ key: '🎯', tf: '⚖️', recall: '💭' })[c.kind] || '🃏'}</span>${({ key: '考點：想一下答案再翻面', tf: '對還是錯？', recall: '先在心裡講一遍，再翻面' })[c.kind] || ''}</div><div class="f-q">${md(c.front)}</div></div>
    <div id="fAct">${c.kind === 'tf' ? `<div class="tf-btns"><button class="btn tf no" data-tf="0">✗ <kbd>←</kbd></button><button class="btn tf yes" data-tf="1">✓ <kbd>→</kbd></button></div>` : `<div class="row center"><button class="btn primary" id="flip">翻面 <kbd>空白</kbd></button></div>`}</div>
    <div id="fBack"></div>
  </section>
  <div class="row end"><button class="btn ghost" id="cQuit">結束這回</button></div>`;
  $$('[data-tf]').forEach(b => b.onclick = () => cardTF(b.dataset.tf === '1'));
  const fl = $('#flip'); if (fl) fl.onclick = cardFlip;
  $('#cQuit').onclick = () => { s.list = s.list.slice(0, s.i); route(); };
}
function backHtml(c) {
  const l = LESSON[c.ch], pic = l && l.intuit ? `<button class="btn sm ghost intu-btn" data-intu="${c.ch}">📖 這章圖解</button>` : '';
  return `${c.back ? `<div class="prose f-b">${md(c.back)}</div>` : ''}<div class="f-more">${pic}<a class="small muted" href="#${c.ch}">${esc(l ? l.title : c.ch)}</a></div>`;
}
/* 任何地方都能叫出某章的「先懂直覺」圖解 */
function showIntu(ch) {
  const l = LESSON[ch]; if (!l || !l.intuit) return;
  const w = h('div', { class: 'modal-wrap intu-wrap' });
  w.innerHTML = `<div class="modal intu-sheet"><div class="card-h"><h2>${esc(l.title.split(/[：（]/)[0])}</h2><button class="btn ghost" data-x>✕</button></div><div class="prose">${md(l.intuit)}</div></div>`;
  document.body.appendChild(w); if (typeof intuLabels === 'function') intuLabels($('.prose', w));
  const close = () => { w.remove(); document.removeEventListener('keydown', esc1, true); };
  const esc1 = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  document.addEventListener('keydown', esc1, true);
  w.onclick = e => { if (e.target === w || e.target.closest('[data-x]')) close(); };
}
document.addEventListener('click', e => { const b = e.target.closest('[data-intu]'); if (b) { e.preventDefault(); showIntu(b.dataset.intu); } });
function rateBtns(c, def) {
  const iv = Learn.preview(c.id), lab = d => d < 1.5 ? '明天' : d < 30 ? `${d} 天` : `${(d / 30).toFixed(1)} 月`;
  return `<div class="rate">${[1, 2, 3, 4].map(g => `<button class="btn rt r${g} ${def === g ? 'on' : ''}" data-g="${g}"><b>${Learn.GRADES[g]}</b><small>${lab(iv[g - 1])}</small><kbd>${g}</kbd></button>`).join('')}</div>`;
}
function cardTF(pick) {
  const s = CardSess; if (s.state !== 'front') return; s.state = 'back'; const c = s.list[s.i], ok = pick === c.ans; s.pick = pick;
  $$('[data-tf]').forEach(b => { b.disabled = true; if ((b.dataset.tf === '1') === c.ans) b.classList.add('right'); else if ((b.dataset.tf === '1') === pick) b.classList.add('wrong'); });
  const fc = $('.fcard'); if (fc) fc.classList.add('flipped');
  $('#fBack').innerHTML = `<div class="fb ${ok ? 'good' : 'bad'}"><div class="fb-top"><span class="fb-ic" aria-hidden="true">${ok ? '✅' : '❌'}</span><b>${ok ? '答對了' : '答錯了'}：這句是「${c.ans ? '對' : '錯'}」的</b></div></div>${backHtml(c)}${rateBtns(c, ok ? 3 : 1)}`;
  wireRate(ok ? 3 : 1);
}
function cardFlip() {
  const s = CardSess; if (s.state !== 'front') return; s.state = 'back'; const c = s.list[s.i];
  const fc = $('.fcard'); if (fc) fc.classList.add('flipped');
  $('#fAct').innerHTML = ''; $('#fBack').innerHTML = `${backHtml(c)}${rateBtns(c)}`; wireRate(null);
}
function wireRate(def) { CardSess.def = def; $$('[data-g]').forEach(b => b.onclick = () => cardRate(+b.dataset.g)); }
function cardRate(g) {
  const s = CardSess; if (s.state !== 'back') return; s.state = 'done'; const c = s.list[s.i], isNew = !Learn.card(c.id);
  Learn.review(c.id, g); const L = S.day(); L.cards = (L.cards || 0) + 1; if (isNew) L.newCards = (L.newCards || 0) + 1; S.save();
  const ok = c.kind === 'tf' ? s.pick === c.ans : g > 1; s.res.push({ id: c.id, g, ok });
  s.combo = ok ? (s.combo || 0) + 1 : 0; if (s.combo >= 3 && typeof Rewards !== 'undefined') Rewards.float('🔥 ' + s.combo + ' 連擊', 'combo');
  if (g === 1 && (s.requeue[c.id] || 0) < 2) { s.requeue[c.id] = (s.requeue[c.id] || 0) + 1; s.list.splice(Math.min(s.list.length, s.i + 6), 0, c); }
  s.i++; route();
}
function cardSummary() {
  if (CardSess.fix) Personal.markFixed(CardSess.fix);
  if (CardSess.cram) { S.day().cramDone = true; S.save(); }
  const s = CardSess, n = s.res.length, ok = s.res.filter(r => r.ok).length, mins = Math.max(1, Math.round((Date.now() - s.t0) / 60000));
  const tom = Learn.cardDue(D.add(D.today(), 1)).length;
  main().innerHTML = `<header class="page-head"><h1>${n} 張　<small>${n ? Math.round(ok / n * 100) : 0}%</small></h1><p class="muted">${mins} 分鐘｜明天到期 ${tom} 張</p></header>
  <div class="row">${NextAuto.html()}<button class="btn" id="cMore">再開一回</button></div>`;
  CardSess = null; $('#cMore').onclick = () => startCards({ title: '今日必背卡' }); NextAuto.wire();
}
document.addEventListener('keydown', e => {
  if (!CardSess || (location.hash.slice(1) || '') !== 'cards' || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
  const s = CardSess, c = s.list[s.i]; if (!c) return;
  if (s.state === 'front') { if (c.kind === 'tf' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); cardTF(e.key === 'ArrowRight'); } else if (c.kind !== 'tf' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); cardFlip(); } }
  else if (s.state === 'back') { if (/^[1-4]$/.test(e.key)) { e.preventDefault(); cardRate(+e.key); } else if ((e.key === ' ' || e.key === 'Enter') && s.def) { e.preventDefault(); cardRate(s.def); } }
});

/* ======================= 學習儀表板 ======================= */
function viewStats() {
  const fc = Learn.forecast(), cal = Learn.calibration(), today = D.today(), srs = S.st.srs || {};
  const causes = {}; Object.values(S.st.answers).forEach(a => { if (a.cause) causes[a.cause] = (causes[a.cause] || 0) + 1; });
  const cTot = Object.values(causes).reduce((a, b) => a + b, 0);
  // 遺忘曲線：若從今天起完全不複習，未來 60 天平均記得機率
  const pts = []; const ents = Object.values(srs).filter(c => c.last);
  for (let d = 0; d <= 60; d += 2) { let s = 0; ents.forEach(c => s += FSRS.R(D.diff(c.last, today) + d, c.s)); pts.push(ents.length ? s / ents.length : null); }
  const exD = S.daysLeft(); const W2 = 640, H2 = 180;
  const path = pts.map((v, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1) * W2).toFixed(1)},${(H2 - (v ?? 0) * H2).toFixed(1)}`).join(' ');
  const last14 = Array.from({ length: 14 }, (_, i) => { const d = D.add(today, i - 13), L = S.st.log[d]; return { d, q: L ? L.q : 0, c: L ? L.c : 0 }; }); const mq = Math.max(10, ...last14.map(x => x.q));
  const calMsg = (() => { const c3 = cal[2], c1 = cal[0]; if (c3.n >= 5 && c3.acc < .85) return `<p class="bad-t">過度自信</p>`; if (c1.n >= 5 && c1.acc > .65) return `<p class="muted">信心不足</p>`; return ''; })();
  const calN = cal.reduce((a, x) => a + x.n, 0), anyQ = last14.some(x => x.q), anyM = DATA.lessons.some(l => Learn.mastery(l.id) != null);
  const curve = ents.length ? `<section class="card"><div class="card-h"><h2>遺忘曲線</h2></div><svg viewBox="-46 -12 ${W2 + 96} ${H2 + 44}" class="fcurve" role="img" aria-label="遺忘曲線">
        ${[0, .5, 1].map(v => `<line x1="0" x2="${W2}" y1="${H2 - v * H2}" y2="${H2 - v * H2}" class="gl"/><text x="-8" y="${H2 - v * H2 + 4}" text-anchor="end">${v * 100}%</text>`).join('')}
        <line x1="0" x2="${W2}" y1="${H2 - Learn.ret() * H2}" y2="${H2 - Learn.ret() * H2}" class="tg"/>
        ${exD > 0 && exD <= 60 ? `<line x1="${exD / 60 * W2}" x2="${exD / 60 * W2}" y1="0" y2="${H2}" class="ex"/><text x="${exD / 60 * W2}" y="${H2 + 26}" text-anchor="middle" class="ext">考試</text>` : ''}
        <path d="${path}" class="fc"/>${[0, 30, 60].map(d => `<text x="${d / 60 * W2}" y="${H2 + 16}" text-anchor="middle">+${d} 天</text>`).join('')}</svg></section>` : '';
  const calib = calN >= 5 ? `<section class="card"><div class="card-h"><h2>信心 vs 答對率</h2></div>
      <div class="calib">${cal.map(x => `<div class="cb"><span class="cl">${['', '用猜的', '有點把握', '非常確定'][x.conf]}</span><span class="bar"><i style="width:${x.acc == null ? 0 : x.acc * 100}%"></i><em style="left:${[0, 35, 70, 95][x.conf]}%"></em></span><span class="cv">${pct(x.acc)}<small>（${x.n}）</small></span></div>`).join('')}</div>${calMsg}</section>` : '';
  const causeC = cTot ? `<section class="card"><div class="card-h"><h2>錯因</h2><span class="muted small">${cTot} 題</span></div><div class="calib">${Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="cb"><span class="cl">${esc(k)}</span><span class="bar"><i style="width:${v / cTot * 100}%;background:var(--bad)"></i></span><span class="cv">${v}</span></div>`).join('')}</div></section>` : '';
  const daysC = anyQ ? `<section class="card"><div class="card-h"><h2>近 14 天</h2></div><div class="qbars">${last14.map(x => `<div class="qb" title="${x.d}：${x.q} 題，對 ${x.c}"><i style="height:${Math.max(2, x.q / mq * 132)}px"><b style="height:${x.q ? x.c / x.q * 100 : 0}%"></b></i><span>${x.d.slice(8)}</span></div>`).join('')}</div></section>` : '';
  const pair = (x, y) => x && y ? `<div class="grid2">${x}${y}</div>` : (x || y);
  if (!ents.length && !anyQ && !anyM) {
    main().innerHTML = `<header class="page-head"><h1>儀表板</h1></header><section class="card empty-c"><p class="muted">還沒有資料</p><button class="btn primary" id="stGo">做 15 題</button></section>`;
    $('#stGo').onclick = () => Practice.startAdaptive(); return;
  }
  main().innerHTML = `
  <header class="page-head"><h1>儀表板</h1></header>
  ${Personal.status() ? `<p class="muted small">${Personal.status()}</p>` : ''}
  <section class="kpis kpis3">
    <div class="kpi"><span class="k">${ents.length ? pct(fc.now) : '—'}</span><span class="l">現在記得</span></div>
    <div class="kpi"><span class="k ${fc.n >= 10 && fc.atExam < .6 ? 'bad-t' : ''}">${fc.n >= 10 ? pct(fc.atExam) : '—'}</span><span class="l">考試日記得</span></div>
    <div class="kpi"><span class="k">${fc.due}</span><span class="l">今天到期</span></div>
  </section>
  ${pair(curve, calib)}
  <section class="card"><div class="card-h"><h2>章節掌握度</h2></div>
    <div class="mgrid">${DATA.subjects.map(sb => `<div class="mrow"><span class="ms" style="--sc:var(--s-${sb.id})"><span class="sdot"></span>${esc(sb.short)}</span>${DATA.lessons.filter(l => l.subject === sb.id).map(l => { const m = Learn.mastery(l.id), n = ((S.st.elo || {})[l.id] || {}).n || 0; const lv = m == null ? 'na' : m < .5 ? 'm0' : m < .7 ? 'm1' : m < .85 ? 'm2' : 'm3'; return `<button class="mc ${lv}" data-adapt="${l.id}" title="${esc(l.title)}｜${m == null ? '還沒做題' : pct(m) + '（' + n + ' 題）'}"><span>${esc(l.title.split(/[：、，（ ]/)[0].slice(0, 6))}</span><b>${m == null ? '' : Math.round(m * 100)}</b></button>`; }).join('')}</div>`).join('')}</div>
  </section>
  ${pair(causeC, daysC)}`;
  $$('[data-adapt]').forEach(b => b.onclick = () => Practice.startAdaptive(b.dataset.adapt));
}

/* ======================= 讀前預測驗 ======================= */
function pretestHtml(l) {
  const ls = S.st.lessons[l.id] || {}; if (ls.read || ls.pre) return '';
  const n = QBANK.all().filter(q => q.ch === l.id && q.type !== 'essay' && q.src !== 'agent').length; if (n < 2) return '';
  return `<div class="pretest row"><button class="btn" id="btnPre">課前測驗 3 題</button></div>`;
}
function wirePretest(l) {
  const b = $('#btnPre'); if (!b) return;
  b.onclick = () => { const ids = rng(Date.now() & 0xffffffff).shuffle(QBANK.all().filter(q => q.ch === l.id && q.type !== 'essay' && q.src !== 'agent').map(q => q.id)).slice(0, 3); Practice.start(ids, { title: '讀前預測驗：' + l.title, pretest: l.id }); };
}

/* ======================= 模考反思單（exam wrapper） ======================= */
const WRAP_CAUSES = ['觀念沒讀到', '觀念不清', '計算失誤', '題意誤讀', '時間不夠', '粗心', '證明寫不出來'];
function wrapperHtml(gid, score) {
  return `<section class="card wrapper" id="wrapCard"><div class="card-h"><h2>考後反思</h2></div>
    <p><b>失分原因</b></p><div class="row wrap">${WRAP_CAUSES.map(c => `<button class="cf" data-wc="${c}">${c}</button>`).join('')}</div>
    <label for="wSlow">最花時間的題</label><textarea id="wSlow" rows="2"></textarea>
    <label for="wPrep">哪種準備有用／沒用</label><textarea id="wPrep" rows="2"></textarea>
    <label for="wChange"><b>下次改變的一件事</b></label><textarea id="wChange" rows="2" placeholder="例：如果一題計算超過 8 分鐘，就先跳過，最後再回來。"></textarea>
    <div class="row end"><button class="btn primary" id="wSave">送出</button></div></section>`;
}
function wireWrapper(gid, score) {
  const host = $('#wrapCard'); if (!host) return; const pick = new Set();
  $$('[data-wc]', host).forEach(b => b.onclick = () => { b.classList.toggle('on'); pick.has(b.dataset.wc) ? pick.delete(b.dataset.wc) : pick.add(b.dataset.wc); });
  $('#wSave').onclick = async () => {
    const change = $('#wChange').value.trim(); if (!pick.size || change.length < 12) { toast('選原因並寫下要改變的事', 'bad'); return; }
    const w = { date: D.today(), gid, score, causes: [...pick], slow: $('#wSlow').value.trim(), prep: $('#wPrep').value.trim(), change };
    (S.st.wrappers = S.st.wrappers || []).push(w); S.save();
    await Bridge.send({ type: 'reflect', text: `模考反思（${(GROUPS.find(g => g.id === gid) || {}).name || gid}，客觀題 ${score}）\n失分原因：${w.causes.join('、')}\n最花時間：${w.slow || '—'}\n準備方式：${w.prep || '—'}\n下次要改變：${change}`, ctx: w });
    host.innerHTML = `<div class="fb good"><b>已記錄</b></div>`;
  };
}
