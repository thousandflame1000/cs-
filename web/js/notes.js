/* 筆記（學生 2026-11-10：「沒辦法放大以及做筆記」「給我做筆記的頁面」「看影片的時候旁邊也可以打開」
   「用 default 歸檔分類：我現在寫離散 xx 單元的題目，直接歸檔到那部分」「os 等等也是」）
   - 側邊欄：知識點頁、影片、寫題目時都能打開；新筆記預設歸到「現在這一頁的知識點」（題目用題目本身標的知識點），
     沒有的話歸到目前學習進度的知識點。可以打字、手寫，看影片時自動記下影片時間，點時間跳回那一刻。
   - #notes：分科、分單元看全部；每個單元附「重點筆記」（知識點的 notes，整理好的考試重點）。
   - 存在 S.st.notes（id → 筆記），跟著進度一起同步；刪除留墓碑 {del:true}，合併時不會復活。 */
'use strict';
const Notes = (() => {
  const N = () => (DATA.kp && DATA.kp.nodes) || {};
  const ORD = () => (DATA.kp && DATA.kp.order) || Object.keys(N());
  const store = () => S.st.notes || (S.st.notes = {});
  const live = () => Object.values(store()).filter(x => x && !x.del);
  const subjOf = k => (N()[k] || {}).subject || '';
  const subjName = s => s === 'f' ? '地基' : (((DATA.subjects || []).find(x => x.id === s) || {}).short || s || '未分類');
  const title = k => k && N()[k] ? N()[k].title : '未分類';
  const fmtT = t => { t = Math.max(0, Math.round(t || 0)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  const when = ms => { const d = new Date(ms); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const clipKP = clip => { const v = (DATA.kp && DATA.kp.vids) || {}; for (const k of ORD()) if ((v[k] || []).some(x => x.clip === clip)) return k; return null; };

  let ctx = null, panelK = null, tab = 'mine', ink = null, editing = null, last = null, pending = null, delArm = null;
  const focusK = () => (ctx && ctx.k && N()[ctx.k]) ? ctx.k : (typeof KP !== 'undefined' && KP.current ? KP.current() : null);
  const isOpen = () => document.body.classList.contains('notes-open');
  const dirty = () => { const t = $('#npText'); return !!((t && t.value.trim()) || (ink && ink.s.length) || editing); };
  const curVideo = () => last && document.contains(last.v) ? last : null;

  /* ---------- 共用：一則筆記 ---------- */
  const inkSvg = o => !o || !o.s || !o.s.length ? '' : `<svg class="np-ink-img" viewBox="0 0 1000 ${o.h}" aria-label="手寫筆記">${o.s.map(p => `<polyline points="${p.join(' ')}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;
  const item = (x, showK) => `<div class="np-item" data-id="${x.id}">
    <div class="np-meta">${x.clip && x.t != null ? `<button type="button" class="chip np-jump" data-jump="${x.id}">▶ ${fmtT(x.t)}</button>` : ''}${showK ? `<a class="small" href="#k/${encodeURIComponent(x.k)}">${esc(title(x.k))}</a>` : ''}<span class="muted small">${when(x.at)}</span>
      <span class="np-acts"><button type="button" class="linkish" data-edit="${x.id}">改</button><button type="button" class="linkish" data-del="${x.id}">刪</button></span></div>
    ${x.text ? `<div class="prose np-text">${md(x.text)}</div>` : ''}${inkSvg(x.ink)}</div>`;
  const mineOf = k => live().filter(x => (x.k || '') === (k || '')).sort((a, b) => b.at - a.at);

  function unitOptions(sel) {
    const by = {}; ORD().forEach(k => (by[subjOf(k)] = by[subjOf(k)] || []).push(k));
    return `<option value=""${sel ? '' : ' selected'}>未分類</option>` + Object.entries(by).map(([s, ks]) =>
      `<optgroup label="${esc(subjName(s))}">${ks.map(k => `<option value="${esc(k)}"${k === sel ? ' selected' : ''}>${esc(title(k))}</option>`).join('')}</optgroup>`).join('');
  }

  /* ---------- 側邊欄 ---------- */
  function panel() { let el = $('#notesPanel'); if (!el) { el = document.createElement('aside'); el.id = 'notesPanel'; el.className = 'np'; el.setAttribute('aria-label', '筆記'); document.body.appendChild(el); } return el; }
  function open(k, opt = {}) {
    panelK = k !== undefined ? k : focusK(); if (opt.tab) tab = opt.tab;
    document.body.classList.add('notes-open'); draw();
    if (opt.edit) startEdit(opt.edit); else setTimeout(() => { const t = $('#npText'); if (t && !opt.noFocus) t.focus(); }, 30);
  }
  function close() { document.body.classList.remove('notes-open'); panel().innerHTML = ''; ink = null; editing = null; }
  function toggle() { isOpen() ? close() : open(); }
  function draw() {
    const el = panel(), k = panelK, n = N()[k], mine = mineOf(k), key = tab === 'key' && n && n.notes, vid = curVideo();
    el.innerHTML = `<div class="np-head"><b>筆記</b><select id="npUnit" aria-label="這則筆記歸到哪個單元">${unitOptions(k)}</select><button type="button" class="btn ghost sm" id="npClose">關閉</button></div>
      <div class="np-tabs"><button type="button" class="chip ${key ? '' : 'on'}" data-nt="mine">我的筆記${mine.length ? ' ' + mine.length : ''}</button>${n && n.notes ? `<button type="button" class="chip ${key ? 'on' : ''}" data-nt="key">重點筆記</button>` : ''}<a class="np-all small" href="#notes${k ? '/' + encodeURIComponent(k) : ''}">全部筆記</a></div>
      <div class="np-body">${key ? `<div class="prose np-key">${md(n.notes)}</div>` : `<div class="np-new">
        <textarea id="npText" rows="3" placeholder="寫下來…（Ctrl＋Enter 存）"></textarea>
        ${ink ? '<div class="np-ink-wrap"><canvas id="npInk"></canvas></div>' : ''}
        <div class="np-row"><button type="button" class="chip ${ink ? 'on' : ''}" id="npPen">手寫</button>${ink ? '<button type="button" class="chip" id="npInkClr">清掉手寫</button>' : ''}
          ${vid ? `<label class="np-stamp small"><input type="checkbox" id="npStamp" checked> 記下影片時間 <b id="npT">${fmtT(vid.v.currentTime)}</b></label>` : ''}
          <button type="button" class="btn sm np-save" id="npSave">${editing ? '存修改' : '存'}</button></div></div>
        ${mine.length ? mine.map(x => item(x)).join('') : `<p class="muted small">這個單元還沒有筆記。寫下來的會自動歸到「${esc(title(k))}」。</p>`}`}</div>`;
    $('#npClose').onclick = close;
    $('#npUnit').onchange = e => { const t = $('#npText'), keep = t ? t.value : ''; panelK = e.target.value; draw(); const t2 = $('#npText'); if (t2) t2.value = keep; };
    $$('[data-nt]', el).forEach(b => b.onclick = () => { tab = b.dataset.nt; draw(); });
    const ta = $('#npText'); if (ta) ta.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); } e.stopPropagation(); };
    const pen = $('#npPen'); if (pen) pen.onclick = () => { const keep = $('#npText').value; ink = ink ? null : { h: 550, s: [] }; draw(); $('#npText').value = keep; };
    const clr = $('#npInkClr'); if (clr) clr.onclick = () => { ink.s = []; setupInk(); };
    const sv = $('#npSave'); if (sv) sv.onclick = save;
    setupInk(); wireList(el);
  }
  function setupInk() {
    const cv = $('#npInk'); if (!cv || !ink) return;
    const W = cv.parentElement.clientWidth || 360, H = Math.round(W * ink.h / 1000), dpr = window.devicePixelRatio || 1, sc = W / 1000;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineCap = g.lineJoin = 'round'; g.lineWidth = 2.4; g.strokeStyle = getComputedStyle(cv).color;
    g.clearRect(0, 0, W, H); ink.s.forEach(p => { g.beginPath(); for (let i = 0; i < p.length; i += 2) i ? g.lineTo(p[i] * sc, p[i + 1] * sc) : g.moveTo(p[i] * sc, p[i + 1] * sc); g.stroke(); });
    let cur = null;
    const pt = e => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / sc), Math.round((e.clientY - r.top) / sc)]; };
    cv.onpointerdown = e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) { } cur = pt(e); ink.s.push(cur); };
    cv.onpointermove = e => { if (!cur) return; const [x, y] = pt(e), n = cur.length; if (Math.abs(x - cur[n - 2]) + Math.abs(y - cur[n - 1]) < 3) return;
      g.beginPath(); g.moveTo(cur[n - 2] * sc, cur[n - 1] * sc); g.lineTo(x * sc, y * sc); g.stroke(); cur.push(x, y); };
    cv.onpointerup = cv.onpointercancel = () => { if (cur && cur.length === 2) cur.push(cur[0] + 1, cur[1]); cur = null; };
  }
  function save() {
    const ta = $('#npText'), text = ((ta && ta.value) || '').trim(), strokes = ink && ink.s.length ? { h: ink.h, s: ink.s } : null;
    if (!text && !strokes && !editing) { toast('先寫點東西'); return; }
    const k = $('#npUnit').value || '', vid = curVideo(), now = Date.now();
    const o = editing && store()[editing] ? store()[editing] : { id: uid(), at: now };
    Object.assign(o, { k, subj: subjOf(k), text, up: now }); if (strokes) o.ink = strokes;
    if (!editing) { if (vid && $('#npStamp') && $('#npStamp').checked) { o.clip = vid.clip; o.t = Math.round(vid.v.currentTime * 10) / 10; } if (ctx && ctx.q) o.q = ctx.q; }
    if (!o.text && !o.ink) o.del = true;
    store()[o.id] = o; editing = null; ink = ink ? { h: ink.h, s: [] } : null; panelK = k; S.save(); draw(); toast(o.del ? '刪掉了' : `存到「${title(k)}」`, 'good');
    if (/^#notes/.test(location.hash)) view(decodeURIComponent(location.hash.slice(7)));
  }
  function startEdit(id) {
    const o = store()[id]; if (!o) return; if (!isOpen() || panelK !== (o.k || '')) { panelK = o.k || ''; tab = 'mine'; document.body.classList.add('notes-open'); }
    editing = id; ink = null; draw(); const t = $('#npText'); t.value = o.text || ''; t.focus();
  }
  function del(id, btn) {
    if (delArm !== id) { delArm = id; btn.textContent = '確定刪？'; setTimeout(() => { if (delArm === id) { delArm = null; btn.textContent = '刪'; } }, 3000); return; }
    delArm = null; const o = store()[id]; if (!o) return; store()[id] = { id, del: true, up: Date.now() }; S.save(); toast('刪掉了');
    if (isOpen()) draw(); if (/^#notes/.test(location.hash)) view(decodeURIComponent(location.hash.slice(7)));
  }
  function jump(id) {
    const o = store()[id]; if (!o || !o.clip) return;
    const boxes = $$(`.kpv[data-clip="${CSS.escape(o.clip)}"]`), box = boxes.find(b => o.t >= (+b.dataset.a || 0) - .5 && (!+b.dataset.b || o.t <= +b.dataset.b + .5));
    if (box && box._api) { const v = box._api.video; box.scrollIntoView({ block: 'center', behavior: 'smooth' }); v.currentTime = o.t; box._api.play(); return; }
    const k = o.k || clipKP(o.clip); if (!k) return toast('找不到這支影片在哪個單元');
    pending = { clip: o.clip, t: o.t }; location.hash = '#k/' + encodeURIComponent(k);
  }
  function wireList(root) {
    $$('[data-jump]', root).forEach(b => b.onclick = () => jump(b.dataset.jump));
    $$('[data-edit]', root).forEach(b => b.onclick = () => startEdit(b.dataset.edit));
    $$('[data-del]', root).forEach(b => b.onclick = () => del(b.dataset.del, b));
  }

  /* ---------- 筆記頁 #notes ---------- */
  const st = { sj: null, q: '', mine: false };
  function view(arg) {
    const focus = arg && N()[arg] ? arg : null, all = live(), subs = [...new Set(ORD().map(subjOf))];
    if (focus) st.sj = subjOf(focus); if (!st.sj || (st.sj !== '_' && !subs.includes(st.sj))) st.sj = subjOf(focusK() || '') || subs[0];
    const cnt = s => all.filter(x => (s === '_' ? !x.k || !N()[x.k] : subjOf(x.k) === s)).length;
    const q = st.q.trim().toLowerCase();
    let body;
    if (q) {
      const hit = all.filter(x => (x.text || '').toLowerCase().includes(q) || title(x.k).toLowerCase().includes(q)).sort((a, b) => b.at - a.at);
      body = hit.length ? hit.map(x => item(x, true)).join('') : '<p class="muted">沒有符合的筆記。</p>';
    } else if (st.sj === '_') {
      const u = all.filter(x => !x.k || !N()[x.k]).sort((a, b) => b.at - a.at);
      body = u.length ? u.map(x => item(x)).join('') : '<p class="muted">沒有未分類的筆記。</p>';
    } else {
      const ks = ORD().filter(k => subjOf(k) === st.sj && (!st.mine || mineOf(k).length));
      body = ks.map(k => { const mine = mineOf(k), n = N()[k]; return `<div class="nt-sec${k === focus ? ' nt-focus' : ''}" id="nt-${esc(k.replace(/[^\w-]/g, '_'))}">
        <div class="nt-h"><a href="#k/${encodeURIComponent(k)}">${esc(title(k))}</a>${mine.length ? `<span class="muted small">${mine.length} 則</span>` : ''}<button type="button" class="linkish" data-add="${esc(k)}">寫一則</button></div>
        ${mine.map(x => item(x)).join('')}
        ${n && n.notes ? `<details class="nt-key" data-key="${esc(k)}"${k === focus ? ' open' : ''}><summary>重點筆記</summary><div class="prose"></div></details>` : ''}</div>`; }).join('') || '<p class="muted">這一科還沒有你的筆記。</p>';
    }
    const m = main();
    m.innerHTML = `<section class="notes-page"><h1>筆記</h1>
      <div class="nt-bar"><input id="ntQ" type="search" placeholder="搜尋我的筆記" value="${esc(st.q)}" aria-label="搜尋我的筆記"><button type="button" class="btn" id="ntNew">寫一則</button></div>
      <div class="np-tabs nt-subs">${subs.map(s => `<button type="button" class="chip ${s === st.sj && !q ? 'on' : ''}" data-sj="${s}">${esc(subjName(s))}${cnt(s) ? ' ' + cnt(s) : ''}</button>`).join('')}<button type="button" class="chip ${st.sj === '_' && !q ? 'on' : ''}" data-sj="_">未分類${cnt('_') ? ' ' + cnt('_') : ''}</button>
        <label class="small nt-mine"><input type="checkbox" id="ntMine"${st.mine ? ' checked' : ''}> 只看有我筆記的單元</label></div>
      <div id="ntList">${body}</div></section>`;
    const fill = d => { const p = $('.prose', d); if (!p.innerHTML) p.innerHTML = md(N()[d.dataset.key].notes); };
    $$('.nt-key', m).forEach(d => { if (d.open) fill(d); d.addEventListener('toggle', () => d.open && fill(d)); });
    $$('[data-sj]', m).forEach(b => b.onclick = () => { st.sj = b.dataset.sj; st.q = ''; view(); });
    $$('[data-add]', m).forEach(b => b.onclick = () => open(b.dataset.add, { tab: 'mine' }));
    $('#ntNew').onclick = () => open(focusK(), { tab: 'mine' });
    $('#ntMine').onchange = e => { st.mine = e.target.checked; view(arg); };
    const qi = $('#ntQ'); qi.oninput = debounce(() => { st.q = qi.value; view(arg); const q2 = $('#ntQ'); q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); }, 250);
    wireList(m);
    if (focus) { const s = $('#nt-' + focus.replace(/[^\w-]/g, '_')); if (s) setTimeout(() => s.scrollIntoView({ block: 'start' }), 30); }
  }

  /* ---------- 跟其他頁面接起來 ---------- */
  function route(h) {   // views.js route() 一開始呼叫
    ctx = h.startsWith('k/') ? { k: h.slice(2) } : h.startsWith('notes/') ? { k: h.slice(6) } : h.startsWith('video-') ? { k: clipKP(h.slice(6)) } : null;
    if (isOpen() && !dirty()) { panelK = focusK(); draw(); }
  }
  function setCtx(c) { ctx = c; if (isOpen() && !dirty() && c && c.k && c.k !== panelK) { panelK = c.k; draw(); } }
  function seen(clip, v) { last = { clip, v }; const t = $('#npT'); if (t) t.textContent = fmtT(v.currentTime); }
  function claim(box, api) {   // 從筆記跳回影片：知識點頁畫好影片時，對到那一段就跳過去
    if (!pending || box.dataset.clip !== pending.clip) return;
    const a = +box.dataset.a || 0, b = +box.dataset.b || 0, t = pending.t; if (t < a - .5 || (b && t > b + .5)) return;
    pending = null; const v = api.video, go = () => { v.currentTime = t; box.scrollIntoView({ block: 'center' }); };
    v.readyState >= 1 ? go() : v.addEventListener('loadedmetadata', go, { once: true });
  }
  setInterval(() => { const v = curVideo(), t = $('#npT'); if (v && t && !v.v.paused) t.textContent = fmtT(v.v.currentTime); }, 1000);
  document.addEventListener('DOMContentLoaded', () => { const b = $('#notesBtn'); if (b) b.onclick = toggle; });
  return { view, open, close, toggle, route, setCtx, seen, claim, _store: store };
})();
