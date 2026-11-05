/* 資工所衝刺站 — views: shell, 今日督導, 計畫, 教材, 錯題本, Agent, 學習法, 設定 */
'use strict';

const main = () => $('#main');
const GROUPS = [
  { id: 'dsa', name: '資料結構與演算法', subs: ['ds', 'al'], mins: 100 },
  { id: 'sys', name: '計算機結構與作業系統', subs: ['co', 'os'], mins: 100 },
  { id: 'math', name: '數學（線代＋離散）', subs: ['la', 'dm'], mins: 100 },
];

/* ======================= shell ======================= */
function renderRail() {
  const rail = $('#rail');
  const left = S.daysLeft();
  const cur = location.hash.slice(1) || 'go';
  const nav = [['go', '▶️', '帶我讀'], ['cards', '🃏', '必背卡'], ['practice', '⚔️', '闖關'], ['videos', '🎞', '影片'], ['wrong', '📕', '錯題本'], ['stats', '📊', '儀表板']];
  const more = [['rewards', '🎁', '獎勵'], ['today', '📋', '今日總覽'], ['plan', '🗓️', '30 天計畫'], ['gen', '🎲', '隨機題'], ['lab', '🧪', '動畫實驗室'], ['agent', '🤖', Bridge.mode === 'cloud' ? 'Claude' : 'Agent'], ['methods', '📚', '學習法'], ['setup', '⚙️', '設定']];
  const navA = ([id, ic, t]) => `<a href="#${id}" class="${cur === id || (id === 'lab' && cur.startsWith('lab-')) || (id === 'videos' && (cur.startsWith('feed') || cur.startsWith('video'))) ? 'cur' : ''}"><span class="nav-ic" aria-hidden="true">${ic}</span>${t}${id === 'agent' ? '<span class="unread-badge" hidden></span>' : ''}${id === 'wrong' ? `<span class="nav-count">${S.dueReviews().length || ''}</span>` : ''}${id === 'cards' ? `<span class="nav-count">${Learn.cardDue().length || ''}</span>` : ''}</a>`;
  const subjHtml = DATA.subjects.map(s => {
    const ls = DATA.lessons.filter(l => l.subject === s.id);
    const st = subjectStats(s.id);
    const open = ls.some(l => l.id === cur) || cur === 'subj-' + s.id;
    return `<details class="nav-subj" ${open ? 'open' : ''} style="--sc:var(--s-${s.id})">
      <summary><span class="sdot"></span>${esc(s.name)}<span class="nav-count">${st.pass}/${st.total}</span></summary>
      <a class="nav-ch ${cur === 'subj-' + s.id ? 'cur' : ''}" href="#subj-${s.id}">總覽</a>
      ${ls.map(l => { const g = (S.st.lessons[l.id] || {}); const cls = g.gate === 'pass' ? 'pass' : g.gate === 'revise' ? 'revise' : g.gate === 'pending' ? 'pending' : g.read ? 'read' : ''; return `<a class="nav-ch ${l.id === cur ? 'cur' : ''}" href="#${l.id}"><span class="st ${cls}"></span>${esc(l.title)}</a>`; }).join('')}
    </details>`;
  }).join('');
  rail.innerHTML = `
    <div class="brand"><a href="#go"><span class="b1">資工所</span><span class="b2">衝刺站</span></a>
      <button class="rail-close" id="railClose" aria-label="關閉選單">×</button></div>
    <div class="rail-line"><span>剩 <b>${left >= 0 ? left : 0}</b> 天</span><span>🔥 <b>${S.streak()}</b></span></div>
    ${Rewards.railHtml()}
    <a href="#agent" class="bridge-pill off" data-auto="1" hidden><span class="dot"></span><span>…</span></a>
    <nav class="nav-main">${nav.map(navA).join('')}<details class="nav-more" ${more.some(([id]) => cur === id || (id === 'lab' && cur.startsWith('lab-'))) ? 'open' : ''}><summary>更多</summary>${more.map(navA).join('')}</details></nav>
    <details class="nav-subjs" ${LESSON[cur] || cur.startsWith('subj-') ? 'open' : ''}><summary class="nav-label">教材 ▾</summary>${subjHtml}</details>`;
  $('#railClose').onclick = () => document.body.classList.remove('rail-open');
  Bridge.render();
}

function route() {
  const hsh = decodeURIComponent(location.hash.slice(1)) || 'go';
  document.body.classList.remove('rail-open');
  Labs.stopAll && Labs.stopAll();
  typeof Clips !== 'undefined' && Clips.stopAll();
  typeof Explain !== 'undefined' && Explain.stopAll();
  document.body.classList.toggle('feed-mode', hsh === 'feed' || hsh.startsWith('feed-'));
  renderRail();
  Rewards.sync();
  const m = main(); m.innerHTML = ''; m.scrollTop = 0; window.scrollTo(0, 0);
  if (hsh === 'go') viewGo();
  else if (hsh === 'today') viewToday();
  else if (hsh === 'plan') viewPlan();
  else if (LESSON[hsh]) viewLesson(hsh);
  else if (hsh.startsWith('subj-') && SUBJ[hsh.slice(5)]) viewSubject(hsh.slice(5));
  else if (hsh === 'practice') Practice.view();
  else if (hsh === 'gen') Practice.viewGen();
  else if (hsh === 'videos') viewVideos();
  else if (hsh.startsWith('video-')) viewVideo(hsh.slice(6));
  else if (hsh === 'feed' || hsh.startsWith('feed-')) viewFeed(hsh.slice(5));
  else if (hsh === 'lab') viewLabs();
  else if (hsh.startsWith('lab-')) viewLab(hsh.slice(4));
  else if (hsh === 'wrong') viewWrong();
  else if (hsh === 'cards') viewCards();
  else if (hsh === 'stats') viewStats();
  else if (hsh === 'agent') viewAgent();
  else if (hsh === 'methods') viewMethods();
  else if (hsh === 'setup') viewSetup();
  else if (hsh === 'rewards') viewRewards();
  else viewToday();
  renderGoPill(hsh);
}

/* ======================= tasks & timer ======================= */
function todayTasks(date = D.today()) {
  const day = S.planDay(date);
  const plan = (DATA.plan || []).find(p => p.day === day);
  const L = S.day(date);
  const set = S.st.settings;
  const tasks = [];
  if (day > 1) tasks.push({ id: 'blurt', text: '白紙回憶', done: !!L.blurt, act: 'blurt' });
  if (plan) {
    for (const lid of plan.lessons || []) {
      const l = LESSON[lid]; if (!l) continue;
      const ls = S.st.lessons[lid] || {};
      tasks.push({ id: 'read-' + lid, text: `讀：${l.title}`, done: !!ls.read, go: '#' + lid });
      tasks.push({ id: 'feyn-' + lid, text: `費曼：${l.title}`, done: ['pending', 'pass', 'self'].includes(ls.gate), go: '#' + lid + '', gate: ls.gate || 'none' });
    }
    for (const g of plan.mocks || []) {
      const grp = GROUPS.find(x => x.id === g);
      tasks.push({ id: 'mock-' + g, text: `模考：${grp.name}`, done: (L.mocks || []).includes(g), act: 'mock', arg: g });
    }
    if (plan.review) tasks.push({ id: 'revrd', text: '重交被退回的費曼', done: !DATA.lessons.some(l => (S.st.lessons[l.id] || {}).gate === 'revise'), go: '#plan' });
  }
  tasks.push({ id: 'quiz', text: `做題 ${L.q}/${set.dailyQuestions}`, done: L.q >= set.dailyQuestions, go: '#practice' });
  const due = S.dueReviews(date).length;
  tasks.push({ id: 'review', text: `到期複習 ${due} 題`, done: due === 0, go: '#wrong' });
  const cd = Learn.cardDue(date).length, cn = Math.min(Learn.newLeft(), Learn.newCards().length);
  tasks.push({ id: 'cards', text: `必背卡 ${cd + cn} 張`, done: cd === 0 && cn === 0, go: '#cards' });
  tasks.push({ id: 'minutes', text: `專注 ${Math.floor(L.min)}/${set.dailyMinutes} 分`, done: L.min >= set.dailyMinutes });
  for (const [i, t] of (S.st.agentTasks[date] || []).entries()) tasks.push({ id: 'ag-' + i, text: t.text, done: !!t.done, agent: i });
  return tasks;
}

const Timer = {
  tick() {
    const t = S.st.timer;
    if (!t.running) return;
    const now = Date.now();
    const dt = Math.min(now - (t.last || now), 120000);
    t.last = now;
    if (typeof Nudge !== 'undefined' && (Nudge.idleShown || Nudge.checkIdle())) { Timer.paint(); return; }
    if (document.visibilityState === 'visible' || t.bg) {
      S.day().min += dt / 60000;
      t.sessionMs = (t.sessionMs || 0) + dt;
      t.n = (t.n || 0) + 1;
      if (t.n % 60 === 0) Rewards.sync({ quiet: true });
      const target = (t.phase === 'break' ? S.st.settings.brk : S.st.settings.pomo) * 60000;
      if (t.sessionMs >= target && !t.alerted) {
        t.alerted = true;
        toast(t.phase === 'break' ? '休息結束，回來專注。' : `專注 ${S.st.settings.pomo} 分鐘完成，起來走動 ${S.st.settings.brk} 分鐘。`, 'good');
      }
    }
    if (t.n % 15 === 0) S.save();
    Timer.paint();
  },
  toggle() {
    const t = S.st.timer;
    t.running = !t.running; t.last = Date.now();
    if (t.running && !t.sessionMs) { t.phase = 'focus'; t.alerted = false; }
    S.save(); Timer.paint();
  },
  reset(phase = 'focus') { const t = S.st.timer; t.sessionMs = 0; t.phase = phase; t.alerted = false; t.last = Date.now(); S.save(); Timer.paint(); },
  paint() {
    const t = S.st.timer; const el = $('#timerFace'); if (!el) return;
    const ms = t.sessionMs || 0; const mm = Math.floor(ms / 60000), ss = Math.floor(ms / 1000) % 60;
    el.textContent = String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
    const btn = $('#timerBtn'); if (btn) btn.textContent = t.running ? '暫停' : '開始專注';
    const ph = $('#timerPhase'); if (ph) ph.textContent = t.running ? (t.phase === 'break' ? '休息中' : '專注中') : '';
    const today = $('#todayMin'); if (today) today.textContent = Math.floor(S.day().min);
  },
};

/* ======================= 今日督導 ======================= */
function supervisorAlerts() {
  const out = []; const st = S.st; const today = D.today(); const y = D.add(today, -1);
  const day = S.planDay();
  if (day > 1) {
    const ly = st.log[y];
    if (!ly || !ly.checkin) out.push({ lv: 'bad', t: '昨天沒有打卡。中斷一天就要用兩天補，今天先把昨天的費曼關卡補交。' });
    else if (!ly.checkin.full) out.push({ lv: 'warn', t: `昨天未達標（完成 ${ly.checkin.done}/${ly.checkin.total} 項）。` });
  }
  const behind = [];
  for (const p of DATA.plan || []) if (p.day < day) for (const lid of p.lessons || []) if (!(st.lessons[lid] || {}).read) behind.push(lid);
  if (behind.length) out.push({ lv: 'bad', t: `進度落後 ${behind.length} 章：${behind.slice(0, 4).map(id => LESSON[id].title).join('、')}${behind.length > 4 ? '…' : ''}`, go: '#' + behind[0] });
  const rev = DATA.lessons.filter(l => (st.lessons[l.id] || {}).gate === 'revise');
  if (rev.length) out.push({ lv: 'warn', t: `費曼關卡被退回 ${rev.length} 章，思考鏈還沒補齊：${rev.slice(0, 3).map(l => l.title).join('、')}`, go: '#' + rev[0].id });
  const hcw = Object.values(st.answers).filter(a => (a.hcw || 0) > 0 && a.ok === false).length;
  if (hcw) out.push({ lv: 'warn', t: `有 ${hcw} 題「很確定卻答錯」，這是最危險的迷思，優先複習。`, go: '#wrong' });
  for (const s of DATA.subjects) { const ss = subjectStats(s.id); if (ss.att >= 10 && ss.acc < 0.6) out.push({ lv: 'warn', t: `${s.name} 正確率只有 ${(ss.acc * 100).toFixed(0)}%（${ss.att} 題），台大錄取需要穩定 75% 以上。`, go: '#subj-' + s.id }); }
  const due = S.dueReviews().length; if (due > 15) out.push({ lv: 'warn', t: `到期複習累積 ${due} 題，今天先清複習再讀新章。`, go: '#wrong' });
  const cd = Learn.cardDue().length; if (cd > 60) out.push({ lv: 'warn', t: `必背卡積了 ${cd} 張到期。拖越久，記得的機率掉越多。`, go: '#cards' });
  const cal = Learn.calibration()[2]; if (cal.n >= 8 && cal.acc < .8) out.push({ lv: 'warn', t: `你說「非常確定」的題目只答對 ${Math.round(cal.acc * 100)}%：過度自信，考場上會漏檢查。`, go: '#stats' });
  const wk = Learn.weakest(3).filter(x => x.m < .55); if (wk.length) out.push({ lv: 'warn', t: `掌握度最低：${wk.map(x => `${LESSON[x.id].title}（${Math.round(x.m * 100)}%）`).join('、')}`, go: '#stats' });
  const fc = Learn.forecast(); if (fc.n >= 30 && fc.atExam != null && fc.atExam < .5) out.push({ lv: 'info', t: `照現在的記憶狀態，如果停止複習，考試那天只剩 ${Math.round(fc.atExam * 100)}% 記得。每天清到期項目就能把它維持在 ${Math.round(Learn.ret() * 100)}%。`, go: '#stats' });
  const left = S.daysLeft();
  if (left <= 30 && left >= 0) out.push({ lv: 'info', t: `距離考試 ${left} 天。每一天都要有可驗證的產出：費曼紀錄、題數、錯因。` });
  return out;
}

function viewToday() {
  const st = S.st; const today = D.today(); const L = S.day(); const day = S.planDay();
  const plan = (DATA.plan || []).find(p => p.day === day);
  const tasks = todayTasks();
  const done = tasks.filter(t => t.done).length;
  const alerts = supervisorAlerts();
  const sup = st.msgs.filter(m => m.dir === 'in' && m.type === 'supervise').slice(-1)[0];
  const acc = L.q ? Math.round(L.c / L.q * 100) : null;
  const m = main();
  m.innerHTML = `
  <header class="page-head">
    <div class="eyebrow">${today}（${D.wd(today)}）｜第 ${day} 天</div>
    <h1>${plan ? esc(plan.title) : '自主複習日'}</h1>
  </header>
  <section class="kpis kpis3">
    <div class="kpi"><span class="k">${done}/${tasks.length}</span><span class="l">任務</span></div>
    <div class="kpi"><span class="k"><span id="todayMin">${Math.floor(L.min)}</span><small>/${st.settings.dailyMinutes}</small></span><span class="l">專注分鐘</span></div>
    <div class="kpi"><span class="k">${L.q}${acc != null ? `<small> · ${acc}%</small>` : ''}</span><span class="l">題數</span></div>
  </section>
  ${(() => { const w = (st.wrappers || []).slice(-1)[0]; return w && D.diff(w.date, today) <= 14 ? `<aside class="callout c-key intent"><p>${esc(w.change)}</p></aside>` : ''; })()}
  <div class="${alerts.length || sup ? 'grid2' : ''}">
    <section class="card">
      <ul class="tasks">${tasks.map(t => `<li class="${t.done ? 'done' : ''}">
        ${t.agent != null ? `<input type="checkbox" id="agt-${t.agent}" data-agent="${t.agent}" ${t.done ? 'checked' : ''}>` : `<span class="tick" aria-hidden="true">${t.done ? '✓' : ''}</span>`}
        <label ${t.agent != null ? `for="agt-${t.agent}"` : ''}>${esc(t.text)}${t.gate && t.gate !== 'none' ? ` <span class="gate g-${t.gate}">${gateLabel(t.gate)}</span>` : ''}</label>
        ${t.go ? `<a class="go" href="${t.go}">前往</a>` : ''}${t.act === 'blurt' && !t.done ? '<button class="go" data-act="blurt">開始</button>' : ''}${t.act === 'mock' && !t.done ? `<button class="go" data-act="mock" data-arg="${t.arg}">開考</button>` : ''}
      </li>`).join('')}</ul>
      <div class="checkin">
        ${L.checkin ? `<div class="ok-note">今天已打卡（${D.hm(L.checkin.ts)}）${L.checkin.full ? '：達標 ✓' : `：未達標 ${L.checkin.done}/${L.checkin.total}`}</div>`
        : `<button class="btn primary" id="btnCheckin">打卡 ${done}/${tasks.length}</button>`}
      </div>
    </section>
    ${alerts.length || sup ? `<section class="card">
      ${alerts.length ? `<ul class="alerts">${alerts.map(a => `<li class="al-${a.lv}">${esc(a.t)}${a.go ? ` <a href="${a.go}">處理</a>` : ''}</li>`).join('')}</ul>` : ''}
      ${sup ? `<div class="card-h"><h3>Agent</h3></div><div class="msg-body">${md(sup.text || '')}</div><div class="muted small">${new Date(sup.ts).toLocaleString('zh-TW')}</div>` : ''}
    </section>` : ''}
  </div>
  <div class="grid2">
    <section class="card timer-card">
      <div class="card-h"><h2>專注計時</h2><span class="muted" id="timerPhase"></span></div>
      <div class="timer"><div id="timerFace" class="face">00:00</div>
        <div class="row"><button class="btn primary" id="timerBtn">開始專注</button><button class="btn" id="timerBreak">開始休息</button><button class="btn ghost" id="timerReset">重設</button></div>
</div>
    </section>
    <section class="card">
      <div class="card-h"><h2>近 12 週</h2></div>
      ${heatmap()}
      <div class="subj-bars">${DATA.subjects.map(s => { const ss = subjectStats(s.id); const pct = ss.acc == null ? 0 : Math.round(ss.acc * 100); return `<a class="sbar" href="#subj-${s.id}" style="--sc:var(--s-${s.id})"><span class="n">${esc(s.short)}</span><span class="bar"><i style="width:${pct}%"></i></span><span class="v">${ss.acc == null ? '—' : pct + '%'}</span><span class="v2">費曼 ${ss.pass}/${ss.total}</span></a>`; }).join('')}</div>
    </section>
  </div>
  `;
  $$('input[data-agent]', m).forEach(cb => cb.onchange = () => { const arr = S.st.agentTasks[today]; arr[+cb.dataset.agent].done = cb.checked; S.save(); viewTodayRefresh(); });
  $$('[data-act="blurt"]', m).forEach(b => b.onclick = blurtDialog);
  $$('[data-act="mock"]', m).forEach(b => b.onclick = () => Practice.startMock(b.dataset.arg));
  const ci = $('#btnCheckin'); if (ci) ci.onclick = () => checkinDialog(tasks);
  $('#timerBtn').onclick = Timer.toggle;
  $('#timerBreak').onclick = () => { Timer.reset('break'); if (!S.st.timer.running) Timer.toggle(); };
  $('#timerReset').onclick = () => Timer.reset('focus');
  Timer.paint(); Bridge.render();
}
const viewTodayRefresh = () => { const c = location.hash.slice(1) || 'go'; if (c === 'today' || c === 'go') route(); };

function gateLabel(g) { return { pass: 'Agent 通過', pending: '待 Agent 審', revise: '被退回', self: '自評通過', none: '未交' }[g] || g; }
function chapterChip(id) {
  const l = LESSON[id]; if (!l) return ''; const ls = S.st.lessons[id] || {};
  return `<a class="chip" href="#${id}" style="--sc:var(--s-${l.subject})"><span class="sdot"></span>${esc(l.title)}<span class="gate g-${ls.gate || 'none'}">${gateLabel(ls.gate || 'none')}</span></a>`;
}

function heatmap() {
  const today = D.today(); const start = D.add(today, -83 - D.parse(today).getDay());
  let cells = '';
  for (let i = 0; i < 84 + D.parse(today).getDay() + 1 && i < 91; i++) {
    const d = D.add(start, i); if (d > today) break;
    const L = S.st.log[d]; const mm = L ? L.min : 0;
    const lv = mm <= 0 ? 0 : mm < 60 ? 1 : mm < 180 ? 2 : mm < 300 ? 3 : 4;
    cells += `<i class="hm l${lv} ${L && L.checkin && L.checkin.full ? 'ck' : ''}" title="${d}：${Math.floor(mm)} 分${L ? `，${L.q} 題` : ''}"></i>`;
  }
  return `<div class="heat">${cells}</div>`;
}

function modal(title, bodyHtml, onOk, okText = '送出') {
  const wrap = h('div', { class: 'modal-wrap', role: 'dialog', 'aria-modal': 'true' });
  wrap.innerHTML = `<div class="modal"><h2>${esc(title)}</h2><div class="modal-body">${bodyHtml}</div><div class="row end"><button class="btn ghost" data-x>取消</button><button class="btn primary" data-ok>${esc(okText)}</button></div></div>`;
  document.body.appendChild(wrap);
  const close = () => wrap.remove();
  $('[data-x]', wrap).onclick = close;
  wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
  $('[data-ok]', wrap).onclick = async () => { const r = await onOk(wrap); if (r !== false) close(); };
  const f = $('textarea, input', wrap); if (f) f.focus();
  return wrap;
}

function blurtDialog() {
  const y = D.add(D.today(), -1);
  const plan = (DATA.plan || []).find(p => p.day === S.planDay(y));
  const chs = (plan && plan.lessons) || (S.st.log[y] && S.st.log[y].lessons) || [];
  const chatOK = typeof CloudAgent !== 'undefined' && CloudAgent.ready();
  modal('白紙回憶', `<p class="muted">${chs.map(id => LESSON[id] ? LESSON[id].title : id).join('、') || '昨天的內容'}</p>
    ${chatOK ? '<div class="row"><button class="btn primary" id="blurtChat" type="button">💬 讓 Claude 問我 4 題（不用打長文）</button></div><p class="muted small">或自己寫（至少 120 字）：</p>' : ''}
    <textarea id="blurtText" rows="12" placeholder=""></textarea>
`, async (w) => {
    const text = $('#blurtText', w).value.trim();
    if (text.length < 120) { toast('至少 120 字', 'bad'); return false; }
    S.day().blurt = { ts: new Date().toISOString(), text }; S.save();
    await Bridge.send({ type: 'blurt', text, ctx: { lessons: chs, date: D.today() } });
    toast('已送出 ✓', 'good'); if (S.st.onboarded && (location.hash.slice(1) || 'go') === 'go') setTimeout(nextStep, 80); else viewTodayRefresh();
  });
  const bc = $('#blurtChat'); if (bc) bc.onclick = () => { const w = bc.closest('.modal-wrap'); if (w) w.remove(); CloudAgent.blurtChat(chs); };
}

function checkinDialog(tasks) {
  const Ld = S.day(); if (Ld.minMode) tasks = Auto.list().filter(s => s.id !== 'checkin').map(s => ({ text: s.title, done: s.done }));
  const done = tasks.filter(t => t.done).length; const full = done === tasks.length && !Ld.minMode; const minOk = !!Ld.minMode && done === tasks.length;
  modal(full ? '打卡：達標' : minOk ? '打卡：保底' : '打卡：未達標', `
    <ul class="tasks compact">${tasks.map(t => `<li class="${t.done ? 'done' : ''}"><span class="tick">${t.done ? '✓' : '✗'}</span><label>${esc(t.text)}</label></li>`).join('')}</ul>
    <label for="ciText">最不清楚的一步、明天第一件事</label>
    <textarea id="ciText" rows="6"></textarea>`, async (w) => {
    const text = $('#ciText', w).value.trim();
    if (text.length < 30) { toast('至少 30 字', 'bad'); return false; }
    const L = S.day(); L.checkin = { ts: new Date().toISOString(), text, full, min: minOk, done, total: tasks.length }; S.save();
    await Bridge.send({ type: 'checkin', text, ctx: { date: D.today(), full, done, total: tasks.length, tasks: tasks.map(t => ({ text: t.text, done: t.done })), minutes: Math.floor(L.min), questions: L.q, correct: L.c } });
    toast(full ? '打卡完成，明天繼續。' : minOk ? '保底達標，連續天數保住了。' : '已誠實打卡。明天把缺的補上。', full || minOk ? 'good' : '');
    viewTodayRefresh();
  }, '打卡');
}

/* ======================= 30 天計畫 ======================= */
function viewPlan() {
  const day = S.planDay();
  main().innerHTML = `
  <header class="page-head"><div class="eyebrow">起始日 ${S.st.settings.startDate}｜考試日 ${S.st.settings.examDate}</div>
  <h1>30 天衝刺計畫</h1>
</header>
  <div class="plan">${(DATA.plan || []).map(p => {
    const date = D.add(S.st.settings.startDate, p.day - 1);
    const L = S.st.log[date];
    const status = L && L.checkin ? (L.checkin.full ? 'full' : 'part') : (p.day < day ? 'miss' : p.day === day ? 'now' : '');
    return `<article class="pday ${status}">
      <div class="pd-n"><b>D${p.day}</b><span>${date.slice(5)}（${D.wd(date)}）</span></div>
      <div class="pd-b"><h3>${esc(p.title)}</h3><p class="muted">${esc(p.goal || '')}</p>
      <div class="chips">${(p.lessons || []).map(chapterChip).join('')}${(p.mocks || []).map(g => `<span class="chip mock">模考：${GROUPS.find(x => x.id === g).name}</span>`).join('')}</div></div>
      <div class="pd-s">${status === 'full' ? '達標' : status === 'part' ? '未達標' : status === 'miss' ? '缺打卡' : status === 'now' ? '今天' : ''}</div>
    </article>`;
  }).join('')}</div>`;
}

/* ======================= 教材 ======================= */
function viewSubject(sid) {
  const s = SUBJ[sid]; const ls = DATA.lessons.filter(l => l.subject === sid); const ss = subjectStats(sid);
  main().innerHTML = `
  <header class="page-head" style="--sc:var(--s-${sid})"><div class="eyebrow subj-eb">${esc(s.exam)}</div><h1>${esc(s.name)}</h1>
  ${s.desc || s.intro ? `<details class="subj-about"><summary>關於這科</summary><p class="lede">${esc(s.desc || '')}</p>${s.intro ? `<div class="prose">${md(s.intro)}</div>` : ''}<p class="muted small">參考：${esc(s.refs || '')}</p></details>` : ''}
  <div class="row"><span class="pill">費曼通過 ${ss.pass}/${ss.total}</span><span class="pill">已讀 ${ss.read}/${ss.total}</span><span class="pill">正確率 ${ss.acc == null ? '—' : Math.round(ss.acc * 100) + '%'}（${ss.att} 題）</span>
  <button class="btn" id="subjQuiz">本科混合練習</button></div></header>
  <div class="ch-list">${ls.map((l, i) => { const cs = chapterStats(l.id); const g = (S.st.lessons[l.id] || {}).gate || 'none'; return `<a class="ch-row" href="#${l.id}" style="--sc:var(--s-${sid})"><span class="ch-i">${String(i + 1).padStart(2, '0')}</span><span class="ch-t">${esc(l.title)}${Practice.starHtml(l.id)}${Practice.examF(l.id) ? `<span class="exam-f sm">🏛️ ${Math.round(Practice.examF(l.id) * 100)}%</span>` : ''}<small>${esc(l.summary || '')}</small></span><span class="ch-dots" aria-label="本章進度">${routeSteps(l).map(x => `<span class="ch-dot${x.done ? ' done' : ''}" title="${x.t}${x.done ? '：完成' : ''}">${x.ic}</span>`).join('')}</span><span class="ch-m">${l.mins} 分｜${cs.n} 題${cs.acc != null ? '｜' + Math.round(cs.acc * 100) + '%' : ''}</span><span class="gate g-${g}">${gateLabel(g)}</span></a>`; }).join('')}</div>
`;
  $('#subjQuiz').onclick = () => Practice.start(QBANK.all().filter(q => q.subject === sid && q.src !== 'agent').map(q => q.id), { title: s.name + ' 混合練習', shuffle: true, limit: 15 });
}

function viewLesson(id) {
  const l = LESSON[id]; const s = SUBJ[l.subject]; const ls = S.lesson(id);
  const sibs = DATA.lessons.filter(x => x.subject === l.subject); const idx = sibs.findIndex(x => x.id === id);
  const prev = sibs[idx - 1], next = sibs[idx + 1];
  const cs = chapterStats(id);
  const m = main();
  m.innerHTML = `
  <article class="lesson ${S.st.recall ? 'recall' : ''}" style="--sc:var(--s-${l.subject})">
    <header class="page-head">
      <div class="eyebrow subj-eb"><a href="#subj-${l.subject}">${esc(s.name)}</a>｜第 ${idx + 1} 章｜${l.mins} 分</div>
      <h1>${esc(l.title)}</h1>
      ${l.summary ? `<p class="lede">${esc(l.summary)}</p>` : ''}
      <div class="row toolbar">
        <button class="btn" id="btnChQuiz" ${cs.n ? '' : 'disabled'}>本章練習 ${cs.n} 題</button>
        <button class="btn" id="btnRead">${ls.read ? '已讀 ✓（' + ls.read + '）' : '標記讀完'}</button>
        <details class="tb-more"><summary class="btn sm" aria-label="更多">⋯</summary><div class="tb-pop">
        <button class="btn ${S.st.recall ? 'on' : ''}" id="tgRecall" aria-pressed="${S.st.recall}">回想模式${S.st.recall ? '：開' : ''}</button>
        <button class="btn" id="tgSkim"></button><button class="btn sm" id="fsDown" aria-label="字小一點">A−</button><button class="btn sm" id="fsUp" aria-label="字大一點">A+</button></div></details>
        ${ls.gate && ls.gate !== 'none' ? `<span class="gate g-${ls.gate}">${gateLabel(ls.gate)}</span>` : ''}
        ${Practice.examF(id) ? `<span class="pill exam-f" title="近年考古題配分占比">🏛️ 考頻 ${Math.round(Practice.examF(id) * 100)}%</span>` : ''}
      </div>
    </header>
    ${routeHtml(l)}
    ${lessonXpHtml(id)}
    ${lessonClipsHtml(id)}
    ${playHtml(id)}
    ${l.intuit ? `<section class="card intu" id="intu"><div class="card-h"><h2>核心概念</h2></div><div class="prose">${md(l.intuit)}</div></section>` : ''}
    ${workedHtml(l)}
    ${pretestHtml(l)}
    ${l.recall && l.recall.length ? `<details class="callout c-feyn recall-box"><summary class="c-label">課前回想</summary><ol>${l.recall.map(x => `<li>${mdLine(x)}</li>`).join('')}</ol></details>` : ''}
    <div class="prose" id="lessonBody">${md(l.body)}</div>
    ${feynmanSection(l)}
    <section class="card ask-card">
      <div class="card-h"><h3>${Bridge.mode === 'cloud' ? '提問（Claude）' : '提問（Agent）'}</h3></div>
      <textarea id="askText" rows="3" placeholder="卡在哪一步？"></textarea>
      <div class="row end"><button class="btn primary" id="btnAsk">送出問題</button></div>
    </section>
    <nav class="pn">${prev ? `<a href="#${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#${next.id}">${esc(next.title)} →</a>` : '<span></span>'}</nav>
  </article>`;
  chunkLesson(l); intuLabels(); wireRoute(l); wireReading();
  mountPlay(id); compactIntu();
  Labs.mountEmbeds(m);
  mountLessonXp(id); mountLessonClips(id); wirePretest(l); wireWorked(l); kidButtons(l); if (typeof watchClipPast === 'function') watchClipPast(id);
  $$('mark.hl', m).forEach(mk => mk.addEventListener('click', () => mk.classList.add('shown')));
  $('#tgRecall').onclick = () => { S.st.recall = !S.st.recall; S.save(); route(); };
  $('#btnRead').onclick = () => {
    if (!ls.read) { ls.read = D.today(); const L = S.day(); if (!L.lessons.includes(id)) L.lessons.push(id); S.save(); if (S.st.onboarded) { toast('已讀 ✓', 'good'); nextStep(); } else { toast('已讀', 'good'); route(); setTimeout(() => { const f = $('#feyn'); if (f) f.scrollIntoView({ behavior: 'smooth' }); }, 50); } }
  };
  $('#btnChQuiz').onclick = () => Practice.start(QBANK.all().filter(q => q.ch === id).map(q => q.id), { title: l.title + '｜本章練習', ch: id });
  $('#btnAsk').onclick = async () => {
    const t = $('#askText').value.trim(); if (t.length < 10) { toast('把問題寫具體一點', 'bad'); return; }
    await Bridge.send({ type: 'ask', text: t, ctx: { lesson: id, title: l.title } });
    $('#askText').value = ''; toast(Bridge.mode === 'offline' ? '已存下，連線後送出（或到 Agent 頁複製）' : '已送出給 Agent', 'good');
  };
  wireFeynman(l);
  Bridge.render();
}

/* 本章路線：短片 → 直覺 → 跟著做 → 分段讀 → 費曼；做完打勾，現在該做的那格亮起來 */
function routeSteps(l) {
  const ls = S.st.lessons[l.id] || {}, out = [];
  const cs = typeof Clips !== 'undefined' ? Clips.list.filter(c => c.lesson === l.id) : [];
  const xs = typeof Explain !== 'undefined' ? Explain.forLesson(l.id) : [];
  if (xs.length) out.push({ k: 'xp', ic: '', t: '影片講解', done: xs.every(x => Explain.seen(x.id)), to: '#xpSec' });
  else if (cs.length) out.push({ k: 'clip', ic: '', t: '短片', done: cs.every(c => (S.st.clipSeen || {})[c.id]), to: '.clip-sec' });
  const lb = lessonLabs(l.id);
  if (lb.length) out.push({ k: 'play', ic: '', t: '互動實驗', done: lb.some(x => labTried(x.id)), to: '#play' });
  else if (l.intuit) out.push({ k: 'intu', ic: '', t: '核心概念', done: !!(ls.read || ls.sec || ls.wk), to: '#intu' });
  if (l.worked) { const n = l.worked.steps.length, k = ls.wk || 0; out.push({ k: 'wk', ic: '', t: '例題', sub: k > n ? '' : Math.min(k, n) + '/' + n, done: k > n, to: '#wk' }); }
  const N = (String(l.body || '').match(/^## /gm) || []).length;
  out.push({ k: 'read', ic: '', t: '教材', sub: ls.read || !N ? '' : Math.min((ls.sec || 0) + 1, N) + '/' + N, done: !!ls.read, to: '#lessonBody' });
  if (l.feynman) out.push({ k: 'feyn', ic: '', t: '費曼', done: ['pass', 'self', 'pending'].includes(ls.gate), to: '#feyn' });
  const now = out.findIndex(s => !s.done); if (now >= 0) out[now].now = true;
  return out;
}
function routeHtml(l) {
  const st = routeSteps(l);
  return `<nav class="route" aria-label="本章路線">${st.map((s, i) => `${i ? '<span class="route-arr" aria-hidden="true"></span>' : ''}<button type="button" class="route-st${s.done ? ' done' : ''}${s.now ? ' now' : ''}" data-to="${s.to}"><span class="route-ic" aria-hidden="true">${s.done ? '✓' : i + 1}</span><span class="route-t">${s.t}</span>${s.sub ? `<span class="route-sub">${s.sub}</span>` : ''}</button>`).join('')}</nav>`;
}
function wireRoute(l) {
  $$('.route-st').forEach(b => b.onclick = () => {
    const el = $(b.dataset.to); if (!el) return;
    if (b.dataset.to === '#lessonBody') { const d = $('details.sec[open]') || $('details.sec'); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; } }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
/* 🎮 動手玩：本章的互動實驗室直接放在影片下面（捲到才載入），正文裡同一個實驗室的入口就拿掉 */
function lessonLabs(id) { return typeof Labs === 'undefined' ? [] : Labs.list.filter(x => (x.lessons || []).includes(id)); }
function labTried(lid) { return Object.values(S.st.log || {}).some(L => (L.labs || []).includes(lid)); }
function playHtml(id) {
  const lb = lessonLabs(id); if (!lb.length) return '';
  const nm = x => esc(x.title.split(/[：（(]/)[0]);
  return `<section class="card play-sec" id="play"><div class="card-h"><h2>互動實驗</h2>${lb.length > 1 ? `<div class="play-tabs">${lb.map((x, i) => `<button type="button" class="chip${i ? '' : ' on'}" data-lab="${x.id}">${nm(x)}</button>`).join('')}</div>` : `<span class="play-name">${nm(lb[0])}</span>`}</div><div class="play-host" id="playHost"></div></section>`;
}
function mountPlay(id) {
  const host = $('#playHost'), lb = lessonLabs(id); if (!host || !lb.length) return;
  lb.forEach(x => $$(`#lessonBody .lab-embed[data-lab="${x.id}"]`).forEach(el => el.remove()));
  let cur = null;
  const mark = () => { const L = S.day(); if (cur && !L.labs.includes(cur)) { L.labs.push(cur); S.save(); const st = $('.route-st[data-to="#play"]'); if (st) { st.classList.add('done'); $('.route-ic', st).textContent = '✓'; } } };
  const show = lid => {
    cur = lid; host.innerHTML = ''; Labs.mount(lid, host, ''); $$('.play-tabs .chip').forEach(b => b.classList.toggle('on', b.dataset.lab === lid));
    // 先看動畫，輸入表單收進「換數字」；一進來就自動播
    const box = $('.lab', host), form = box && $('.lab-form', box); if (!form) return;
    const d = document.createElement('details'); d.className = 'lab-edit'; d.innerHTML = '<summary>✏️ 換數字</summary>'; d.appendChild(form);
    ['.lab-stage', '.lab-note', '.lab-ctrl', '.lab-presets'].forEach(q => { const el = $(q, box); if (el) box.appendChild(el); }); box.appendChild(d);
    const pb = $('.lab-ctrl [data-a="play"]', box); if (pb) setTimeout(() => pb.click(), 400);
  };
  $$('.play-tabs .chip').forEach(b => b.onclick = () => { show(b.dataset.lab); mark(); });
  host.addEventListener('pointerdown', mark);
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); if (!cur) show(lb[0].id); } }, { rootMargin: '300px' }); io.observe(host); } else show(lb[0].id);
}
/* 直覺卡只留「一句話」和圖，其餘收進「再多一點」 */
function compactIntu() {
  const dl = $('#intu .prose dl.kv'); if (!dl) return;
  const kids = [...dl.children]; const first = kids.find(el => el.classList.contains('kv-row'));
  const rest = kids.filter(el => el !== first && !el.classList.contains('kv-fig')); if (!rest.length) return;
  const d = document.createElement('details'); d.className = 'intu-more';
  d.innerHTML = '<summary>' + (rest.map(el => el.dataset.k).filter((x, i, a) => x && a.indexOf(x) === i).join('、') || '更多') + '</summary>';
  const inner = document.createElement('dl'); inner.className = 'kv'; rest.forEach(el => inner.appendChild(el)); d.appendChild(inner); dl.after(d);
}
/* 核心概念：直覺版的小標（一句話、想像一下…）換成正式名稱（要點、類比、估算、注意），排成「標籤｜內容」兩欄 */
function intuLabels(root) {
  const pr = root || $('#intu .prose'); if (!pr || pr.dataset.kv) return; pr.dataset.kv = 1;
  const MAP = { 一句話: '要點', 想像一下: '類比', 動手算一次: '估算', 小心: '注意', 近似: '近似' };
  const isFig = el => el.matches('figure, .fgw, .fg-row') || (el.tagName !== 'P' && !!el.querySelector('figure, svg'));
  const rows = []; let cur = null;
  [...pr.children].forEach(el => {
    if (isFig(el)) { rows.push({ fig: el }); cur = null; return; }
    const st = el.tagName === 'P' && el.firstElementChild && el.firstElementChild.tagName === 'STRONG' && el.firstChild === el.firstElementChild ? el.firstElementChild : null;
    if (st) {
      const t = st.textContent.trim(), k = MAP[t] || (/^為什麼/.test(t) ? '理由' : '補充');
      if (MAP[t]) { st.remove(); const nx = el.firstChild; if (nx && nx.nodeType === 3) nx.textContent = nx.textContent.replace(/^[\s　：:]+/, ''); }
      else st.classList.add('kv-lead');
      cur = { k, els: [el] }; rows.push(cur); return;
    }
    if (cur) cur.els.push(el); else { cur = { k: '要點', els: [el] }; rows.push(cur); }
  });
  const dl = document.createElement('dl'); dl.className = 'kv';
  rows.forEach(r => {
    if (r.fig) { const d = document.createElement('div'); d.className = 'kv-fig'; d.appendChild(r.fig); dl.appendChild(d); return; }
    const row = document.createElement('div'); row.className = 'kv-row'; row.dataset.k = r.k;
    const dt = document.createElement('dt'); dt.textContent = r.k; const dd = document.createElement('dd');
    r.els.forEach(e => { if (e.tagName === 'P' && !e.textContent.trim() && !e.children.length) return; dd.appendChild(e); });
    if (r.els[0] && r.els[0].tagName === 'P' && !r.els[0].textContent.trim()) r.els[0].remove();
    row.append(dt, dd); dl.appendChild(row);
  });
  pr.innerHTML = ''; pr.appendChild(dl);
}
/* 教材切成一段一段：一次只展開一段，讀完按「下一段」；記得讀到哪 */

/* 讀得舒服：只看重點（收起推導細節）＋字級 */
function wireReading() {
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
  const body = $('#lessonBody'); if (!body) return;
  const apply = () => {
    const skim = get('lessonSkim', '1') !== '0', fs = +get('lessonFs', '0') || 0;
    body.classList.toggle('skim', skim); body.style.fontSize = (17 + fs * 2) + 'px';
    const b = $('#tgSkim'); if (b) { b.textContent = skim ? '📖 看完整' : '👀 只看重點'; b.setAttribute('aria-pressed', skim); }
  };
  $('#tgSkim').onclick = () => { set('lessonSkim', get('lessonSkim', '1') !== '0' ? '0' : '1'); apply(); };
  $('#fsDown').onclick = () => { set('lessonFs', Math.max(-1, (+get('lessonFs', '0') || 0) - 1)); apply(); };
  $('#fsUp').onclick = () => { set('lessonFs', Math.min(4, (+get('lessonFs', '0') || 0) + 1)); apply(); };
  apply();
}

/* ⚔️ 每段讀完的過關小測：優先考這一段自己的對錯卡；沒有就考前面讀過的段落（隔段回想）；最後一段再加 ★ 單選題。不考還沒讀到的東西 */
/* 字詞重疊：把一段文字（題目、卡片）對到教材的第幾段；最高分夠高、而且明顯贏第二名才算數，否則 -1 */
function secGrams(t) { t = String(t).replace(/\$[^$]*\$/g, ' ').replace(/[\s，。、：；（）()「」？?！!\-—>|*`]/g, ' '); const g = new Set(); for (const w of t.split(/\s+/)) { if (/^[A-Za-z][A-Za-z0-9-]+$/.test(w)) { g.add(w.toLowerCase()); continue; } for (let i = 0; i < w.length - 1; i++) g.add(w.slice(i, i + 2)); } return g; }
function secIndex(l) { if (!l._sg) { const secs = String(l.body || '').split(/^## /m).slice(1); l._sg = { secs, SG: secs.map(secGrams), titles: secs.map(x => x.split('\n')[0].replace(/^\d+\.\s*/, '').trim()) }; } return l._sg; }
function secPlace(l, txt, loose) {
  const { SG } = secIndex(l), g = secGrams(txt); const sc = SG.map(sg => { let n = 0; g.forEach(x => { if (sg.has(x)) n++; }); return n / Math.max(1, g.size); });
  const o = sc.map((v, i) => [v, i]).sort((x, y) => y[0] - x[0]), [min, gap] = loose ? [.3, .03] : [.5, .1];
  return o[0] && o[0][0] >= min && o[0][0] - ((o[1] || [0])[0]) >= gap ? o[0][1] : -1;
}
function secQuizPlan(l) {
  if (l._sq) return l._sq;
  const secs = secIndex(l).secs, norm = t => String(t).replace(/\s+/g, '');
  const place = txt => secPlace(l, txt);
  const tf = DATA.cards.filter(c => c.kind === 'tf' && c.ch === l.id).map(c => { const k = norm(c.front).slice(0, 14); return { c, at: secs.findIndex(t => norm(t).includes(k)) }; });
  const rc = DATA.cards.filter(c => c.kind === 'recall' && c.ch === l.id).map(c => ({ c, rc: true, at: place(c.front) })).filter(x => x.at >= 0);
  const sq = QBANK.all().filter(q => q.ch === l.id && q.type === 'single' && (q.diff || 2) === 1 && q.src !== 'agent').map(q => ({ q, at: place(q.stem + ' ' + (q.opts || []).join(' ')) }));
  const n = secs.length, used = new Set(), plan = [], free = x => !used.has(x);
  for (let i = 0; i < n; i++) {
    let it = tf.find(x => x.at === i && free(x)) || rc.find(x => x.at === i && free(x)) || sq.find(x => x.at === i && free(x))
      || [...tf, ...rc, ...sq].filter(x => x.at >= 0 && x.at < i && free(x)).sort((x, y) => y.at - x.at)[0];
    if (!it && i === n - 1) it = tf.find(free) || sq.find(free);
    if (it) used.add(it); plan.push(it || null);
  }
  return (l._sq = plan);
}
function secQuiz(l, i) {
  const it = secQuizPlan(l)[i]; if (!it) return null;
  const box = document.createElement('div'); box.className = 'sec-quiz';
  const front = it.c ? md(it.c.front) : md(it.q.stem);
  if (it.rc) {
    box.innerHTML = `<div class="sq-h">回想</div><div class="sq-q prose">${md(it.c.front)}</div><div class="sq-opts"><button class="btn sq-flip">翻答案</button></div><div class="sq-fb"></div>`;
    $('.sq-flip', box).onclick = () => {
      $('.sq-opts', box).innerHTML = `<div class="prose expl sq-ans">${md(it.c.back || '')}</div><div class="sq-opts tf"><button class="btn sq-o" data-r="3">✅ 記得</button><button class="btn sq-o" data-r="1">❌ 忘了</button></div>`;
      $$('[data-r]', box).forEach(b => b.onclick = () => { if (box.dataset.done) return; box.dataset.done = 1; const g = +b.dataset.r; Learn.review(it.c.id, g); const L = S.day(); L.cards = (L.cards || 0) + 1; S.save(); $$('[data-r]', box).forEach(x => x.disabled = true); b.classList.add(g > 1 ? 'right' : 'wrong'); if (g > 1 && typeof Rewards !== 'undefined') Rewards.chime('pop'); });
    };
    return box;
  }
  const opts = it.c ? `<button class="btn sq-o" data-v="1">✓ 對</button><button class="btn sq-o" data-v="0">✗ 錯</button>`
    : it.q.opts.map((o, k) => `<button class="btn sq-o" data-v="${k}"><span class="ol">${LETTERS[k]}</span>${mdLine(o)}</button>`).join('');
  box.innerHTML = `<div class="sq-h">小測</div><div class="sq-q prose">${front}</div><div class="sq-opts${it.c ? ' tf' : ''}">${opts}</div><div class="sq-fb"></div>`;
  $$('.sq-o', box).forEach(b => b.onclick = () => {
    if (box.dataset.done) return; box.dataset.done = 1;
    const v = +b.dataset.v, ok = it.c ? (v === 1) === !!it.c.ans : it.q.ans.includes(v);
    $$('.sq-o', box).forEach(x => { x.disabled = true; const xv = +x.dataset.v; if (it.c ? (xv === 1) === !!it.c.ans : it.q.ans.includes(xv)) x.classList.add('right'); });
    if (!ok) b.classList.add('wrong');
    if (it.c) { Learn.review(it.c.id, ok ? 3 : 1); const L = S.day(); L.cards = (L.cards || 0) + 1; S.save(); }
    else S.answer(it.q.id, ok, { conf: 2, q: it.q });
    const why = it.c ? it.c.back : it.q.expl;
    $('.sq-fb', box).innerHTML = `<div class="fb ${ok ? 'good' : 'bad'}"><div class="fb-top"><span class="fb-ic" aria-hidden="true">${ok ? '✅' : '❌'}</span><b>${ok ? '過關' : '再看一次'}</b></div>${why ? `<div class="prose expl">${md(fmtExpl(why))}</div>` : ''}</div>`;
    if (ok && typeof Rewards !== 'undefined') { Rewards.chime('pop'); Rewards.sync && Rewards.sync(); }
  });
  return box;
}
/* 答錯時用：題目對到教材哪一段，回傳 {ch, i, title} 或 null */
function lessonSpot(q) { const l = q && LESSON[q.ch]; if (!l) return null; const i = secPlace(l, String(q.stem || '') + ' ' + (q.opts || []).join(' ') + ' ' + String(q.expl || '').slice(0, 200), true); return i >= 0 ? { ch: l.id, i, title: secIndex(l).titles[i] } : { ch: l.id, i: -1, title: l.title }; }
function goSpot(sp) { window.__openSec = sp.i >= 0 ? { ch: sp.ch, i: sp.i } : null; if (typeof Practice !== 'undefined') Practice.sess = null; if (location.hash === '#' + sp.ch) route(); else location.hash = '#' + sp.ch; }
function chunkLesson(l) {
  const body = $('#lessonBody'); if (!body) return;
  const groups = []; let cur = null;
  for (const el of [...body.children]) { if (el.tagName === 'H3') { cur = { h: el, els: [] }; groups.push(cur); } else if (cur) cur.els.push(el); }
  if (groups.length < 2) return;
  const ls = S.lesson(l.id), last = groups.length - 1, want = window.__openSec && window.__openSec.ch === l.id ? window.__openSec.i : null, at = want != null ? want : ls.read ? -1 : Math.min(ls.sec || 0, last), ds = [];
  if (want != null) { window.__openSec = null; setTimeout(() => { const d = ds[want]; if (d) { d.scrollIntoView({ behavior: 'smooth', block: 'start' }); d.classList.add('flash'); setTimeout(() => d.classList.remove('flash'), 1600); } }, 120); }
  groups.forEach((g, i) => {
    const d = document.createElement('details'); d.className = 'sec'; if (i === at) d.open = true;
    const s = document.createElement('summary'); s.className = 'sec-h';
    const n = document.createElement('span'); n.className = 'sec-n'; n.textContent = (i + 1) + '/' + groups.length;
    const t0 = g.h.firstChild; if (t0 && t0.nodeType === 3) t0.textContent = t0.textContent.replace(/^\s*\d+\.\s*/, '');
    body.insertBefore(d, g.h); d.appendChild(s); s.appendChild(n); s.appendChild(g.h); g.els.forEach(e => d.appendChild(e));
    const qz = secQuiz(l, i); if (qz) d.appendChild(qz);
    const nav = document.createElement('div'); nav.className = 'row end sec-nav';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + (i < last || !ls.read ? 'primary' : '');
    b.textContent = i < last ? '下一段 →' : ls.read ? '已讀完 ✓' : '讀完了 ✓';
    b.onclick = () => {
      if (i < last) { d.open = false; ds[i + 1].open = true; ls.sec = i + 1; S.save(); ds[i + 1].scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else { const r = $('#btnRead'); if (r && !ls.read) r.click(); }
    };
    nav.appendChild(b); d.appendChild(nav); ds.push(d);
  });
  ds.forEach((d, i) => d.addEventListener('toggle', () => { if (d.open && i > (ls.sec || 0) && !ls.read) { ls.sec = i; S.save(); } }));
}
/* 線上版：每一大段旁邊放「🧒 白話講這段」，讀不懂就按 */
function kidButtons(l) {
  if (typeof CloudAgent === 'undefined' || !CloudAgent.ready()) return;
  const secs = String(l.body || '').split(/^## /m).slice(1);
  $$('#lessonBody h3').forEach((h3, i) => {
    const src = secs[i]; if (!src) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm ghost kid-btn'; b.textContent = '換個說法';
    b.onclick = e => { e.preventDefault(); e.stopPropagation(); CloudAgent.kid(l, '## ' + src).catch(() => { }); };
    h3.appendChild(b);
  });
}
/* 跟著做一題：一次只亮一步——先看提示自己想，再按「看做法」；最後才看答案與常錯 */
const BRK = { br: true };
function workedHtml(l) {
  const w = l.worked; if (!w) return '';
  const k = (S.lesson(l.id).wk || 0), n = w.steps.length, done = k > n;
  return `<section class="card wk" id="wk"><div class="card-h"><h2>例題演練</h2><span class="muted small" id="wkProg">${Math.min(k, n)}/${n}</span></div>
    <div class="prose wk-q">${md(w.q, BRK)}</div>
    <ol class="wk-steps">${w.steps.map((s, i) => `<li class="wk-s${i < k ? ' open' : ''}${i === k ? ' cur' : ''}"${i > k ? ' hidden' : ''}><div class="wk-t">${mdLine(s.t)}</div><div class="prose wk-b"${i < k ? '' : ' hidden'}>${md(s.b, BRK)}</div></li>`).join('')}</ol>
    <div class="wk-end"${done ? '' : ' hidden'}><div class="callout c-key"><div class="c-label"><span class="c-ic" aria-hidden="true">✅</span>答案</div>${md(w.ans, BRK)}</div>${w.err ? `<div class="callout c-trap"><div class="c-label"><span class="c-ic" aria-hidden="true">⚠️</span>常錯</div>${md(w.err)}</div>` : ''}</div>
    <div class="row end"${done ? ' hidden' : ''}><button class="btn primary" id="wkNext">${k < n ? '寫好了，看做法' : '寫好了，看答案'}</button></div>
  </section>`;
}
function wireWorked(l) {
  const sec = $('#wk'), b = $('#wkNext'); if (!sec || !b) return;
  const ls = S.lesson(l.id), n = l.worked.steps.length, li = $$('.wk-s', sec);
  b.onclick = () => {
    const k = ls.wk || 0;
    if (k < n) {
      li[k].classList.toggle('cur', false); li[k].classList.add('open'); li[k].querySelector('.wk-b').hidden = false;
      if (li[k + 1]) { li[k + 1].hidden = false; li[k + 1].classList.add('cur'); }
      b.textContent = k + 1 < n ? '寫好了，看做法' : '寫好了，看答案';
    } else {
      $('.wk-end', sec).hidden = false; b.parentElement.hidden = true;
    }
    ls.wk = k + 1; S.save(); $('#wkProg').textContent = Math.min(k + 1, n) + '/' + n;
    (k < n ? li[k] : $('.wk-end', sec)).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
}
function feynmanSection(l) {
  if (!l.feynman) return '';
  const ls = S.lesson(l.id);
  const last = S.st.msgs.filter(x => x.type === 'feynman' && x.ctx && x.ctx.lesson === l.id).slice(-1)[0];
  return `<section class="card feyn" id="feyn">
    <div class="card-h"><h2>費曼檢核</h2><span class="gate g-${ls.gate}">${gateLabel(ls.gate)}</span></div>
    <p class="feyn-prompt">${md(l.feynman)}</p>
    ${typeof CloudAgent !== 'undefined' && CloudAgent.ready() && !['pass', 'pending'].includes(ls.gate) ? `<div class="row"><button class="btn primary" id="btnFeynChat">💬 用聊天過關（一次回一兩句就好）</button></div><p class="muted small">或寫完整版：≥ 200 字｜每步寫因果｜一個例子｜何時不成立</p>` : '<p class="muted small">≥ 200 字｜每步寫因果｜一個例子｜何時不成立</p>'}
    ${last && last.gradeText ? `<div class="grade ${last.verdict}"><b>${last.verdict === 'pass' ? '通過' : '退回'}${last.score != null ? `｜${last.score} 分` : ''}</b>${md(last.gradeText)}</div>` : ''}
    ${(window.SpeechRecognition || window.webkitSpeechRecognition) && !['pass', 'pending'].includes(ls.gate) ? '<div class="row"><button class="btn" id="btnMic" type="button">🎤 用講的</button></div>' : ''}
    <textarea id="feynText" rows="10" placeholder="用自己的話完整推導……">${esc(ls.draft || '')}</textarea>
    <div class="row end"><span class="muted small" id="feynCount"></span>${['pass', 'pending'].includes(ls.gate) ? '' : '<button class="btn ghost nb-btn" id="btnFeynNB">🆘 寫不出來</button>'}<button class="btn primary" id="btnFeyn">${ls.gate === 'revise' ? '補強後重交' : '送 Agent 審查'}</button></div>
    ${['pending', 'pass', 'revise', 'self'].includes(ls.gate) ? `<details class="sol" ${ls.gate === 'revise' ? 'open' : ''}><summary>關鍵點</summary><ol class="rubric">${l.rubric.map(r => `<li>${mdLine(r)}</li>`).join('')}</ol>
      ${Bridge.mode === 'offline' && ls.gate !== 'pass' ? '<div class="row"><button class="btn" id="btnSelfPass">自評通過</button></div>' : ''}</details>` : ''}
  </section>`;
}
function wireFeynman(l) {
  const ta = $('#feynText'); if (!ta) return;
  const ls = S.lesson(l.id);
  const cnt = () => { const c = $('#feynCount'); if (c) c.textContent = ta.value.trim().length + ' 字（至少 200）'; };
  ta.addEventListener('input', debounce(() => { ls.draft = ta.value; S.save(); cnt(); }, 300)); cnt();
  const mic = $('#btnMic');
  if (mic) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; let rec = null;
    mic.onclick = () => {
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = 'zh-TW'; rec.continuous = true; rec.interimResults = false;
      rec.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) ta.value += (ta.value && !/\s$/.test(ta.value) ? '' : '') + e.results[i][0].transcript; ta.dispatchEvent(new Event('input')); };
      rec.onerror = () => { toast('麥克風無法使用（要允許權限，且用 Chrome）', 'bad'); };
      rec.onend = () => { rec = null; mic.textContent = '🎤 用講的'; mic.classList.remove('primary'); };
      try { rec.start(); mic.textContent = '⏹ 講完了（按一下停止）'; mic.classList.add('primary'); } catch (e) { rec = null; }
    };
  }
  $('#btnFeyn').onclick = async () => {
    const text = ta.value.trim();
    if (text.length < 200) { toast('至少 200 字', 'bad'); return; }
    if (!ls.read) { ls.read = D.today(); const L = S.day(); if (!L.lessons.includes(l.id)) L.lessons.push(l.id); }
    ls.gate = 'pending'; ls.submitted = D.today();
    S.day().feyn.push(l.id);
    await Bridge.send({ type: 'feynman', text, ctx: { lesson: l.id, title: l.title, prompt: l.feynman, rubric: l.rubric, attempt: S.st.msgs.filter(x => x.type === 'feynman' && x.ctx && x.ctx.lesson === l.id).length + 1 } });
    S.save(); toast('已送出 ✓', 'good'); if (S.st.onboarded && Auto.current()) nextStep(); else route();
  };
  const sp = $('#btnSelfPass'); if (sp) sp.onclick = () => { ls.gate = 'self'; S.save(); route(); };
  const nb = $('#btnFeynNB'); if (nb) nb.onclick = () => feynScaffold(l);
  const fc = $('#btnFeynChat'); if (fc) fc.onclick = () => CloudAgent.feynChat(l);
}
/* 🆘 寫不出來：把關鍵步驟當骨架攤開，逐步用自己的話改寫；完整版明天再挑戰 */
function feynScaffold(l) {
  const ls = S.lesson(l.id), sec = $('#feyn'); if (!sec) return;
  Rescue.flag(l.id, 'feyn', l.feynman);
  const old = (ls.scaffold && ls.scaffold.parts) || [];
  sec.innerHTML = `<div class="card-h"><h2>費曼骨架</h2></div>
    <p class="feyn-prompt">${md(l.feynman)}</p>
    <ol class="scaf">${l.rubric.map((r, i) => `<li><div class="sc-h">${mdLine(r)}</div><textarea data-sc="${i}" rows="2" placeholder="用自己的話寫這一步：為什麼成立？">${esc(old[i] || '')}</textarea></li>`).join('')}</ol>
    <div class="row end"><button class="btn primary" id="scDone">存下來，明天寫完整版</button></div>`;
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#scDone').onclick = () => {
    const parts = $$('[data-sc]', sec).map(t => t.value.trim());
    if (parts.filter(Boolean).length < Math.ceil(l.rubric.length / 2)) { toast(`至少寫 ${Math.ceil(l.rubric.length / 2)} 步`, 'bad'); return; }
    ls.scaffold = { date: D.today(), parts }; ls.feynLater = D.add(D.today(), 1); S.save();
    toast('已存 ✓ 明天再挑戰', 'good'); if (S.st.onboarded && Auto.current()) nextStep(); else route();
  };
}

/* ======================= 錯題本 ======================= */
const CAUSES = ['觀念不清', '推理跳步', '計算失誤', '題意誤讀', '粗心', '沒背熟'];
function viewWrong() {
  const st = S.st; const due = S.dueReviews();
  const items = Object.entries(st.answers).filter(([id, a]) => a.everWrong).map(([id, a]) => ({ id, a, q: id.startsWith('gen:') ? Practice.genQ(id) : QBANK.get(id) })).filter(x => x.q);
  const foes = items.filter(x => !x.a.ok).map(x => x.id);
  main().innerHTML = `
  ${foes.length ? `<section class="feed-hero"><div class="fh-ic" aria-hidden="true">⚔️</div><h2>復仇戰</h2><div class="fh-sub">還沒打贏的 ${foes.length} 題</div><button class="go-start" id="btnRevenge">▶ 開打</button></section>` : ''}
  <header class="page-head"><h1>錯題本</h1>
  ${items.length ? `<div class="row">${due.length ? `<button class="btn primary" id="btnDue">到期 ${due.length} 題</button>` : ''}<button class="btn" id="btnWeak">練弱章</button>
  ${items.some(x => x.a.hcw) ? '<button class="btn" id="btnHcw">高信心答錯</button>' : ''}</div>` : ''}</header>
  ${items.length ? `<div class="wrong-list">${items.sort((x, y) => ((Learn.card(Learn.keyOf(x.id)) || {}).due || '9').localeCompare((Learn.card(Learn.keyOf(y.id)) || {}).due || '9')).map(({ id, a, q }) => `
    <article class="wrong ${a.ok ? 'healed' : ''}">
      <div class="w-h"><span class="chip sm" style="--sc:var(--s-${q.subject})"><span class="sdot"></span>${esc(LESSON[q.ch] ? LESSON[q.ch].title : (q.chTitle || q.ch))}</span>
      <span class="muted small">${a.c}/${a.n}${(() => { const c = Learn.card(Learn.keyOf(id)); return c ? `｜記得 ${Math.round(Learn.Rnow(c) * 100)}%｜下次 ${c.due.slice(5)}` : ''; })()}${a.hcw ? '｜<b class="bad-t">高信心答錯</b>' : ''}${a.cause ? '｜' + esc(a.cause) : ''}</span></div>
      <div class="w-stem">${md(String(q.stem).length > 420 ? String(q.stem).slice(0, 420) + '…' : q.stem)}</div>
      ${st.wrongNotes[id] ? `<div class="w-note">${esc(st.wrongNotes[id])}</div>` : ''}
      <div class="row"><button class="btn sm" data-redo="${esc(id)}">重做</button></div>
    </article>`).join('')}</div>` : '<p class="muted">沒有錯題</p>'}`;
  const rv = $('#btnRevenge'); if (rv) rv.onclick = () => Practice.start(Practice.rampSort(foes).slice(0, 10), { title: '復仇戰', review: true });
  const b = $('#btnDue'); if (b) b.onclick = () => Practice.start(due, { title: '到期複習', review: true });
  if ($('#btnWeak')) $('#btnWeak').onclick = () => { const w = Learn.weakest(1)[0]; Practice.startAdaptive(w ? w.id : undefined); };
  if ($('#btnHcw')) $('#btnHcw').onclick = () => { const ids = items.filter(x => x.a.hcw).map(x => x.id); if (!ids.length) { toast('目前沒有高信心答錯的題目', ''); return; } Practice.start(ids, { title: '高信心答錯', review: true }); };
  $$('[data-redo]').forEach(x => x.onclick = () => Practice.start([x.dataset.redo], { title: '重做', review: true }));
}

/* ======================= Agent ======================= */
function viewAgent() {
  Bridge.unread = 0; Bridge.render();
  const st = Bridge.status();
  const msgs = S.st.msgs.slice(-80);
  main().innerHTML = `
  <header class="page-head"><h1>Agent</h1></header>
  <div class="grid2">
    <section class="card">
      <div class="card-h"><h2>連線</h2><span class="bridge-pill off"><span class="dot"></span><span>…</span></span></div>
      ${Bridge.mode === 'cloud' ? (CloudAgent.ready() ? '' : '<p class="muted">Claude 目前沒有被允許使用；訊息會先存著。</p>')
      : Bridge.mode === 'offline' ? `
        <ol class="steps"><li>最穩：雙擊資料夾裡的 <code>start.bat</code>（需要 Python），網頁會自動連上。</li>
        <li>沒有 Python：用 Chrome 或 Edge 開 <code>web/index.html</code>，按下方按鈕選 <code>bridge</code> 資料夾。</li>
        <li>都不行：按「複製給 AI」，把文字貼給任何 AI，再把回覆貼回來。</li></ol>
        <div class="row"><button class="btn primary" id="btnFS">${Bridge.needsRegrant ? '重新授權 bridge 資料夾' : '連接 bridge 資料夾'}</button><button class="btn" id="btnCopy">複製給 AI</button><button class="btn" id="btnPaste">貼上 AI 回覆</button></div>`
      : `<p>叫你的 Agent（Claude Code、Codex 或這個對話裡的 Claude）在專案資料夾執行：</p>
        <pre class="code"><code>python agent.py watch</code></pre>
        <p class="muted small">它會監聽 <code>bridge/inbox.jsonl</code>，有新訊息就印出來；Agent 用 <code>python agent.py reply &lt;id&gt; --text "…"</code> 或 <code>grade</code> 回覆，寫進 <code>bridge/outbox.jsonl</code>，網頁每 3 秒讀一次。最土的方式：直接在 outbox.jsonl 加一行文字，也會顯示。</p>`}
    </section>
    <section class="card">
      <div class="card-h"><h2>直接問</h2></div>
      <select id="askType"><option value="ask">一般問題</option><option value="plan">請 Agent 幫我排明天</option><option value="quizreq">請 Agent 出題（指定章節或弱點）</option></select>
      <textarea id="agText" rows="5" placeholder="想問什麼？"></textarea>
      <div class="row end"><button class="btn primary" id="agSend">送出</button></div>
    </section>
  </div>
  <section class="card"><div class="card-h"><h2>訊息紀錄</h2><span class="muted">${S.st.msgs.length} 則</span></div>
  <div class="chat">${msgs.length ? msgs.map(msgHtml).join('') : '<p class="muted">還沒有訊息。</p>'}</div></section>`;
  const fs = $('#btnFS'); if (fs) fs.onclick = () => Bridge.connectFS().then(route);
  const cp = $('#btnCopy'); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(Bridge.offlinePrompt()); toast('已複製', 'good'); } catch (e) { modal('複製這段文字', `<textarea rows="14">${esc(Bridge.offlinePrompt())}</textarea>`, () => true, '關閉'); } };
  const ps = $('#btnPaste'); if (ps) ps.onclick = () => modal('貼上 AI 的回覆', `<p class="muted">若是在審費曼關卡，選擇結果：</p><select id="pv"><option value="">一般回覆</option>${S.st.msgs.filter(m => m.type === 'feynman' && !m.verdict).map(m => `<option value="${m.id}">費曼：${esc(m.ctx.title)}</option>`).join('')}</select>
    <select id="pvv"><option value="pass">通過</option><option value="revise">退回</option></select><textarea id="pt" rows="10"></textarea>`, (w) => {
    const text = $('#pt', w).value.trim(); if (!text) return false;
    const target = $('#pv', w).value;
    const m = target ? { id: uid('paste'), type: 'grade', replyTo: target, verdict: $('#pvv', w).value, text } : { id: uid('paste'), type: 'note', text };
    S.st.seen[m.id] = 1; Bridge.handle(m); S.save(); route();
  });
  $('#agSend').onclick = async () => {
    const t = $('#agText').value.trim(); if (!t) return;
    const kind = $('#askType').value;
    await Bridge.send({ type: kind === 'ask' ? 'ask' : 'request', text: t, ctx: { request: kind } });
    route();
  };
  Bridge.render();
}
function msgHtml(m) {
  const who = m.dir === 'out' ? '我' : 'Agent';
  const label = { reflect: '模考反思', ask: '提問', feynman: '費曼關卡', essay: '申論作答', blurt: '白紙回憶', checkin: '打卡', request: '請求', reply: '回覆', grade: '審查', supervise: '每日督導', plan: '指派任務', quiz: '出題', note: '訊息' }[m.type] || m.type;
  let extra = '';
  if (m.type === 'feynman' && m.ctx) extra = `<div class="muted small">章節：${esc(m.ctx.title)}｜第 ${m.ctx.attempt || 1} 次${m.verdict ? '｜' + (m.verdict === 'pass' ? '通過' : '退回') : '｜待審'}</div>`;
  if (m.type === 'grade') extra = `<div class="verdict ${m.verdict}">${m.verdict === 'pass' ? '通過' : '退回'}${m.score != null ? '｜' + m.score + ' 分' : ''}</div>`;
  if (m.tasks) extra += `<ul>${m.tasks.map(t => `<li>${esc(typeof t === 'string' ? t : t.text)}</li>`).join('')}</ul>`;
  if (m.type === 'quiz') extra += `<div class="muted small">${(m.questions || []).length} 題已加入「練習 → Agent 出題」</div>`;
  return `<div class="bubble ${m.dir}"><div class="b-h"><b>${who}</b><span class="tag">${label}</span><span class="muted small">${new Date(m.ts).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}${m.queued ? '｜尚未送出' : ''}</span></div>${extra}<div class="msg-body">${m.dir === 'out' ? esc(String(m.text || '')).replace(/\n/g, '<br>') : md(String(m.text || ''))}</div></div>`;
}

/* ======================= 學習法 ======================= */
function viewMethods() {
  main().innerHTML = `
  <header class="page-head"><h1>學習法</h1></header>
  <div class="prose">${md(DATA.methods || '')}</div>`;
}

/* ======================= 設定 ======================= */
function viewSetup() {
  const s = S.st.settings;
  main().innerHTML = `
  <header class="page-head"><h1>設定</h1></header>
  <section class="card form">
    <label for="fName">名字（督導訊息會用）</label><input id="fName" value="${esc(s.name)}">
    <label for="fExam">考試日</label><input id="fExam" type="date" value="${s.examDate}">
    <label for="fStart">30 天計畫起始日</label><input id="fStart" type="date" value="${s.startDate}">
    <label for="fMin">每日專注目標（分鐘）</label><input id="fMin" type="number" min="30" max="900" value="${s.dailyMinutes}">
    <label for="fQ">每日題數目標</label><input id="fQ" type="number" min="5" max="200" value="${s.dailyQuestions}">
    <label for="fRwS">獎勵音效</label><select id="fRwS"><option value="1" ${s.rwSound !== false ? 'selected' : ''}>開</option><option value="0" ${s.rwSound === false ? 'selected' : ''}>關</option></select>
    <label for="fRet">目標保留率（FSRS）</label><select id="fRet">${[[.85, '85%：複習較少，適合時間很緊'], [.9, '90%：建議'], [.95, '95%：考前衝刺，複習次數多約 2 倍']].map(([v, t]) => `<option value="${v}" ${+s.retention === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <label for="fNew">每天新開必背卡（張）</label><input id="fNew" type="number" min="0" max="100" value="${s.newCards || 20}">
    <label for="fSS">每天開始讀書的時間（到點提醒）</label><input id="fSS" type="time" value="${s.studyStart || '09:00'}">
    <label for="fCT">預設打卡時間（前一小時提醒）</label><input id="fCT" type="time" value="${s.commitTime || '22:00'}">
    <label for="fStake">沒打卡的代價（自己定）</label><input id="fStake" value="${esc(s.stake || '')}" placeholder="例：隔天多做 30 題">
    <label for="fPomo">番茄鐘專注／休息（分鐘）</label><div class="row"><input id="fPomo" type="number" min="10" max="120" value="${s.pomo}"><input id="fBrk" type="number" min="3" max="30" value="${s.brk}"></div>
    <div class="row end"><button class="btn primary" id="saveSet">儲存</button></div>
  </section>
  ${App.card()}
  <section class="card"><div class="card-h"><h2>備份</h2></div>
    <p class="muted small">${Bridge.mode === 'cloud' ? '進度自動存在雲端：同一個 Claude 帳號的每台裝置都同步。想跟電腦上的版本合併，就在電腦版「下載備份檔」，再到這裡按「合併另一台的進度檔」。' : Bridge.mode === 'offline' ? '這個瀏覽器沒有連到專案資料夾：進度只存在這裡，請定期下載備份。' : '進度每天自動備份到 <code>bridge/backups/</code>；另一台電腦（OneDrive 同步）打開時會自動合併。'}${S.st.lastExport ? `　上次下載：${S.st.lastExport}` : ''}</p>
    <div class="row wrap"><button class="btn primary" id="exp">💾 下載備份檔</button><button class="btn" id="mrg">合併另一台的進度檔</button><button class="btn" id="imp">用檔案覆蓋</button><button class="btn danger" id="rst">全部重來</button></div></section>`;
  $('#saveSet').onclick = () => {
    s.name = $('#fName').value.trim(); s.examDate = $('#fExam').value || s.examDate; s.startDate = $('#fStart').value || s.startDate;
    s.dailyMinutes = +$('#fMin').value || 360; s.dailyQuestions = +$('#fQ').value || 30; s.pomo = +$('#fPomo').value || 50; s.brk = +$('#fBrk').value || 10; s.retention = +$('#fRet').value || .9; s.studyStart = $('#fSS').value || s.studyStart; s.commitTime = $('#fCT').value || s.commitTime; s.stake = $('#fStake').value.trim(); s.newCards = Math.max(0, +$('#fNew').value || 0); s.rwSound = $('#fRwS').value === '1';
    S.save(); toast('已儲存', 'good'); route();
  };
  App.wire();
  $('#exp').onclick = () => { Sync.download(); route(); };
  $('#mrg').onclick = () => Sync.pick(o => { try { Sync.apply(o, '進度檔'); route(); } catch (e) { toast(e.message, 'bad'); } });
  $('#imp').onclick = () => Sync.pick(o => { if (!o || o.v !== 1) { toast('不是有效的進度檔', 'bad'); return; } modal('用這個檔案覆蓋？', '<p>這台的進度會被檔案內容取代。想保留兩邊，請改用「合併」。</p>', () => { S.st = Object.assign(defaultState(), o); S.saveNow(); QBANK.build(); toast('已覆蓋', 'good'); route(); }, '覆蓋'); });
  $('#rst').onclick = () => modal('確定全部重來？', '<p>所有作答紀錄、打卡、費曼紀錄都會清掉（bridge 資料夾裡的檔案不會刪）。</p>', () => { S.st = defaultState(); S.saveNow(); QBANK.build(); route(); }, '清除');
}

/* ======================= labs list ======================= */
function viewLabs() {
  main().innerHTML = `<header class="page-head"><h1>動畫實驗室</h1></header>
  ${DATA.subjects.map(s => { const labs = Labs.list.filter(x => x.subject === s.id); if (!labs.length) return ''; return `<h2 class="lab-sec" style="--sc:var(--s-${s.id})"><span class="sdot"></span>${esc(s.name)}</h2><div class="lab-grid">${labs.map(x => `<a class="lab-card" href="#lab-${x.id}" style="--sc:var(--s-${x.subject})"><b>${esc(x.title)}</b><span>${esc(x.desc)}</span></a>`).join('')}</div>`; }).join('')}`;
}
function viewLab(id) {
  const lab = Labs.get(id);
  if (!lab) { viewLabs(); return; }
  main().innerHTML = `<header class="page-head" style="--sc:var(--s-${lab.subject})"><div class="eyebrow subj-eb"><a href="#lab">動畫實驗室</a>｜${esc(SUBJ[lab.subject].name)}</div><h1>${esc(lab.title)}</h1><p class="lede">${esc(lab.desc)}</p></header><div id="labHost"></div>
  ${lab.lessons ? `<p class="muted">相關章節：${lab.lessons.map(chapterChip).join(' ')}</p>` : ''}`;
  Labs.mount(id, $('#labHost'), '', true);
  const L = S.day(); if (!L.labs.includes(id)) { L.labs.push(id); S.save(); }
}

/* ======================= boot ======================= */
async function boot() {
  if (window.SELFTEST) return;   // 自我檢查頁：不連 bridge、不跑計時，由 selftest.js 接手
  S.load(); QBANK.build(); Learn.migrate(); Personal.apply(); S.save(); App.init();
  setTimeout(() => { try { Personal.fit(); } catch (e) { } }, 5000);
  document.addEventListener('click', e => { const t = e.target.closest('#menuBtn'); if (t) document.body.classList.toggle('rail-open'); });
  window.addEventListener('hashchange', route);
  window.addEventListener('bridge:change', () => {
    const cur = location.hash.slice(1) || 'go';
    const typing = document.activeElement && /TEXTAREA|INPUT/.test(document.activeElement.tagName) && document.activeElement.value;
    if (!typing && !$('.modal-wrap') && (cur === 'agent' || cur === 'today' || cur === 'go')) route();
    else {
      renderRail();
      const f = $('#feyn');
      if (LESSON[cur] && f && !(document.activeElement && document.activeElement.id === 'feynText')) {
        const tmp = h('div', { html: feynmanSection(LESSON[cur]) }); f.replaceWith(tmp.firstElementChild); wireFeynman(LESSON[cur]);
      }
    }
  });
  route();
  Nudge.init();
  setInterval(Timer.tick, 1000);
  document.addEventListener('visibilitychange', () => { S.st.timer.last = Date.now(); });
  await Bridge.init();
  route();
}
window.addEventListener('katex-ready', () => route());
document.addEventListener('DOMContentLoaded', boot);


/* ======================= 短影音 ======================= */
const CLIP_LAB = { 'dm-pigeon': 'pigeon', 'dm-venn': 'venn', 'dm-catalan': 'catalan', 'dm-hasse': 'hasse', 'dm-euclid': 'euclid', 'ds-heap': 'heap', 'co-pipe': 'pipe', 'os-srtf': 'cpu', 'la-eigen': 'lintrans', 'ds-avl': 'bst', 'al-dijkstra': 'graph', 'co-cache': 'cache', 'os-lru': 'page', 'la-systems': 'gauss', 'ds-sort': 'sort', 'la-vs': 'lintrans', 'la-det': 'gauss', 'ds-hash': 'hash', 'ds-unionfind': 'uf', 'ds-graph': 'graph', 'os-deadlock': 'banker', 'al-dp': 'dp', 'al-mst-flow': 'graph', 'os-storage': 'disk' };
let feedFilter = 'all';
function clipOrder(list) { // 交錯學習：輪流換科目，不連續刷同一科
  const by = {}; list.forEach(c => (by[c.subject] = by[c.subject] || []).push(c));
  const keys = DATA.subjects.map(s => s.id).filter(k => by[k]); const out = [];
  while (out.length < list.length) for (const k of keys) if (by[k].length) out.push(by[k].shift());
  return out;
}
/* ======================= 動畫講解（影片＋互動） ======================= */
function lessonXpHtml(id) {
  if (typeof Explain === 'undefined') return '';
  const xs = Explain.forLesson(id); if (!xs.length) return '';
  return `<section class="xp-sec" id="xpSec"><div class="xp-sec-h"><h3>影片講解</h3>${xs.length > 1 ? `<div class="xp-tabs">${xs.map((x, i) => `<button type="button" class="chip${i ? '' : ' on'}" data-xp="${x.id}">${Explain.seen(x.id) ? '✓ ' : ''}${esc(x.title)}</button>`).join('')}</div>` : ''}</div><div id="xpHost"></div></section>`;
}
function mountLessonXp(id) {
  const host = $('#xpHost'); if (!host) return; const xs = Explain.forLesson(id);
  const nextOf = cur => { const i = xs.findIndex(x => x.id === cur), nx = xs[i + 1]; if (nx) return { label: '下一部：' + nx.title, go: () => show(nx.id, true) }; return { label: '開始讀這章 ↓', go: () => { const el = $('#intu') || $('#lessonBody'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } }; };
  const show = (xid, auto) => { Explain.stopAll(); Explain.mount(host, xid, { next: nextOf, autoplay: !!auto }); $$('.xp-tabs [data-xp]').forEach(b => b.classList.toggle('on', b.dataset.xp === xid)); };
  $$('.xp-tabs [data-xp]').forEach(b => b.onclick = () => show(b.dataset.xp, true));
  show((xs.find(x => !Explain.seen(x.id)) || xs[0]).id, false);
}
function xpOrder() {
  const order = []; for (const p of DATA.plan || []) for (const lid of p.lessons || []) if (!order.includes(lid)) order.push(lid);
  DATA.lessons.forEach(l => { if (!order.includes(l.id)) order.push(l.id); });
  return Explain.all().sort((a, b) => order.indexOf(a.lesson) - order.indexOf(b.lesson));
}
function xpCard(x, big) {
  const l = LESSON[x.lesson], seen = Explain.seen(x.id);
  return `<a class="xp-card${big ? ' big' : ''}${seen ? ' seen' : ''}" href="#video-${x.id}" style="--sc:var(--s-${x.subject})">
    <div class="xp-thumb">${x.video ? `<img src="videos/${x.id}.jpg" alt="" loading="lazy">` : '<div class="xp-thumb-ph">🎛</div>'}<span class="xp-badge">${x.video ? '▶ ' + Math.round(x.dur / 60 * 10) / 10 + ' 分' : '互動動畫'}</span>${seen ? '<span class="xp-seen">✓ 看過</span>' : ''}</div>
    <div class="xp-meta"><b>${esc(x.title)}</b><span>${esc(SUBJ[x.subject] ? SUBJ[x.subject].name : '')}${l ? '・' + esc(l.title.split(/[：（]/)[0]) : ''}</span></div></a>`;
}
function viewVideos() {
  const m = main(), list = xpOrder(), next = list.find(x => x.video && !Explain.seen(x.id)) || list.find(x => !Explain.seen(x.id)) || list[0];
  const subs = DATA.subjects.filter(s => list.some(x => x.subject === s.id));
  m.innerHTML = `<div class="page-head"><h1>🎞 影片</h1></div>
    ${next ? `<section class="xp-hero">${xpCard(next, true)}<div class="xp-hero-side"><div class="muted small">推薦下一部</div><h2>${esc(next.title)}</h2><a class="btn primary xp-play-btn" href="#video-${next.id}">▶ 播放</a><div class="muted small">${list.filter(x => Explain.seen(x.id)).length} / ${list.length} 部看過</div></div></section>` : ''}
    ${subs.map(s => `<h2 class="lab-sec" style="--sc:var(--s-${s.id})"><span class="sdot"></span>${esc(s.name)}</h2><div class="xp-grid">${list.filter(x => x.subject === s.id).map(x => xpCard(x)).join('')}</div>`).join('')}
    ${typeof Clips !== 'undefined' && Clips.list.length ? `<p class="muted" style="margin-top:28px">還有 ${Clips.list.length} 支 30 秒直式短片：<a href="#feed">去刷短片 →</a></p>` : ''}`;
}
function viewVideo(id) {
  const m = main(), list = xpOrder(), x = list.find(v => v.id === id); if (!x) { location.hash = '#videos'; return; }
  const l = LESSON[x.lesson], i = list.indexOf(x), more = list.filter(v => v.id !== id && !Explain.seen(v.id)).slice(0, 4);
  m.innerHTML = `<div class="xp-page"><div class="xp-page-h"><a class="muted" href="#videos">← 影片</a>${l ? `<a class="muted" href="#${l.id}">📖 ${esc(l.title.split(/[：（]/)[0])}</a>` : ''}</div><div id="xpHost"></div>
    ${more.length ? `<h3 class="xp-more-h">接著看</h3><div class="xp-grid">${more.map(v => xpCard(v)).join('')}</div>` : ''}</div>`;
  const fromAuto = S.st.auto && (S.st.auto.ids || []).includes('xp:' + x.lesson);
  Explain.mount($('#xpHost'), id, { autoplay: false, autoNext: fromAuto, next: () => {
    const c = typeof Auto !== 'undefined' && S.st.onboarded ? Auto.current() : null;
    if (fromAuto && c) return { label: '下一步：' + c.title, go: () => nextStep() };
    if (l) return { label: '讀這章：' + l.title.split(/[：（]/)[0], go: () => { location.hash = '#' + l.id; } };
    const nx = list[i + 1]; return nx ? { label: '下一部 ▶', go: () => { location.hash = '#video-' + nx.id; } } : null;
  } });
  const h = $('#xpHost .xp'); if (h) h.focus({ preventScroll: true });
}
function lessonClipsHtml(id) {
  if (typeof Clips === 'undefined') return '';
  const cs = Clips.list.filter(c => c.lesson === id); if (!cs.length) return '';
  return `<section class="clip-sec"><div class="clip-sec-h"><h3>短片</h3><a class="btn sm ghost" href="#feed-${cs[0].id}">全螢幕</a></div><div class="clip-strip" id="clipStrip"></div></section>`;
}
function mountLessonClips(id) {
  const host = $('#clipStrip'); if (!host) return;
  const cs = Clips.list.filter(c => c.lesson === id); cs.forEach((c, i) => {
    const it = document.createElement('div'); it.className = 'clip-item'; host.appendChild(it);
    Clips.player(it, c.id, { auto: i === 0 });
    if (cs.length > 1) { const meta = document.createElement('div'); meta.className = 'clip-meta'; meta.innerHTML = `<span>${esc(c.chip.split('·').pop().trim())}</span>`; it.appendChild(meta); }
  });
}
function viewFeed(startId) {
  const m = main();
  const subs = DATA.subjects.filter(s => Clips.list.some(c => c.subject === s.id));
  let list = clipOrder(Clips.list.slice()); if (feedFilter !== 'all') list = list.filter(c => c.subject === feedFilter);
  m.innerHTML = `<div class="feed-wrap">
    <div class="feed-filter">${[['all', '全部']].concat(subs.map(s => [s.id, s.name])).map(([k, n]) => `<button class="chip ${feedFilter === k ? 'on' : ''}" data-f="${k}" ${k !== 'all' ? `style="--sc:var(--s-${k})"` : ''}>${esc(n)}</button>`).join('')}</div>
    <div class="feed" id="feed" tabindex="0">${list.map((c, i) => { const l = LESSON[c.lesson]; const n = QBANK.all().filter(q => q.ch === c.lesson).length; return `<section class="feed-item" data-id="${c.id}">
      <div class="feed-slot"></div>
      <div class="feed-acts">
        ${l ? `<a href="#${c.lesson}"><span class="ic">📖</span>讀這章</a>` : ''}
        ${n ? `<button data-quiz="${c.lesson}"><span class="ic">✍️</span>練 ${n} 題</button>` : ''}
        ${CLIP_LAB[c.id] ? `<a href="#lab-${CLIP_LAB[c.id]}"><span class="ic">🧪</span>動手玩</a>` : ''}
        <button data-next><span class="ic">⬇</span>${i < list.length - 1 ? '下一支' : '回頂端'}</button>
      </div>
      <div class="feed-cap"><b>${esc(l ? l.title : c.chip)}</b><span>${i + 1} / ${list.length}</span></div>
    </section>`; }).join('')}
    <section class="feed-item feed-end"><div><h2>刷完了 🎉</h2><p>影片只負責給直覺。真正的分數在推導與題目裡。</p><div class="row wrap" style="justify-content:center"><a class="btn primary" href="#today">回今日督導</a><a class="btn" href="#practice">去練題</a><button class="btn" id="feedTop">從頭再刷</button></div></div></section>
    </div></div>`;
  const feed = $('#feed');
  $$('.feed-item[data-id]', m).forEach(sec => Clips.player($('.feed-slot', sec), sec.dataset.id, { auto: true, feed: true, onEnd: () => {} }));
  $$('.feed-filter .chip', m).forEach(b => b.onclick = () => { feedFilter = b.dataset.f; Clips.stopAll(); viewFeed(); });
  $$('[data-next]', m).forEach(b => b.onclick = () => { const sec = b.closest('.feed-item'); const nx = sec.nextElementSibling; if (nx && nx.dataset.id) nx.scrollIntoView({ behavior: 'smooth' }); else feed.scrollTo({ top: 0, behavior: 'smooth' }); });
  $$('[data-quiz]', m).forEach(b => b.onclick = () => { const ch = b.dataset.quiz; Practice.start(QBANK.all().filter(q => q.ch === ch).map(q => q.id), { title: LESSON[ch].title + '｜看完影片馬上練' }); });
  const top = $('#feedTop'); if (top) top.onclick = () => feed.scrollTo({ top: 0, behavior: 'smooth' });
  if (startId) { const sec = m.querySelector(`.feed-item[data-id="${CSS.escape(startId)}"]`); if (sec) requestAnimationFrame(() => { feed.scrollTop = sec.offsetTop; }); }
  feed.focus({ preventScroll: true });
}
document.addEventListener('keydown', e => {
  if (!document.body.classList.contains('feed-mode')) return; const feed = $('#feed'); if (!feed || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'PageDown') { e.preventDefault(); feed.scrollBy({ top: feed.clientHeight, behavior: 'smooth' }); }
  else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'PageUp') { e.preventDefault(); feed.scrollBy({ top: -feed.clientHeight, behavior: 'smooth' }); }
  else if (e.key === ' ') { e.preventDefault(); const i = Math.round(feed.scrollTop / feed.clientHeight); const cv = $$('.feed-item', feed)[i]?.querySelector('video, canvas'); if (cv) cv.click(); }
  else if (e.key === 'm') { const b = $('.snd-btn'); if (b) b.click(); }
});
