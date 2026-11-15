/* 資工所衝刺站 — 帶我讀：每天自動排好順序，一次只給你一件事 */
'use strict';

/* 畫餅：用真實進度算「照這速度哪天讀完」，一行、有數字 */
function goPie() {
  const tot = KP.ORDER.length, got = KP.M().length, left = S.daysLeft(), budget = Math.round((S.st.settings.dailyMinutes || 360) * .6);
  const rest = KP.ORDER.filter(k => !KP.learned(k)).reduce((t, k) => t + (KP.N[k].mins || 30), 0), need = Math.ceil(rest / Math.max(30, budget));
  if (!rest) return `<p class="go-pie">${tot} 個知識點全部學會，剩 ${left} 天拿來複習和模考</p>`;
  const fin = D.add(D.today(), need), spare = left - need;
  return spare >= 21 ? `<p class="go-pie">學會 ${got}/${tot} 個知識點；照每天 ${Math.round((S.st.settings.dailyMinutes || 360) / 60)} 小時，<b>${fin.slice(5).replace('-', '/')}</b> 上完，比考試早 <b>${spare}</b> 天</p>`
    : `<p class="go-pie">學會 ${got}/${tot} 個知識點；照每天 ${Math.round((S.st.settings.dailyMinutes || 360) / 60)} 小時要到 <b>${fin.slice(5).replace('-', '/')}</b> 才上完，${spare >= 0 ? '只比考試早 ' + spare + ' 天' : '來不及'}：到設定把每天時數調高</p>`;
}
/* 短影音看到 90% 就記為看過（clips.js 會呼叫） */
window.onXpSeen = () => { try { renderGoPill(location.hash.slice(1) || 'go'); } catch (e) { } };
window.onClipSeen = id => { const cs = S.st.clipSeen || (S.st.clipSeen = {}); if (!cs[id]) { cs[id] = D.today(); S.save(); try { renderGoPill(location.hash.slice(1) || 'go'); } catch (e) { } } };

const Auto = {
  /* ---------- 今天的步驟清單（每天第一次打開時排好，之後只更新完成狀態） ---------- */
  plan(force) {
    const today = D.today(), A = S.st.auto || (S.st.auto = {});
    if (!force && A.date === today && A.ids && A.ids.length) return A.ids;
    const st = S.st;
    // 還沒開始上任何一堂課：計畫從今天算（不會一打開就「落後 N 章」）
    if (!Auto.started() && S.planDay() > 1) { st.settings.startDate = today; }
    const day = S.planDay(), plan = (DATA.plan || []).find(p => p.day === day), ids = [];
    // 白紙回憶：只有「昨天真的學過東西」才出現，回想的就是那些內容（以前是看計畫上排了什麼）
    if (Auto.learnedOn(D.add(today, -1)).length) ids.push('blurt');
    if (Learn.cardDue().length) ids.push('cards-due');
    if (S.dueReviews().length) ids.push('review');
    Personal.fixDue().forEach(c => ids.push('fix:' + c));
    // 考前 14 天：不再開新章（除非還有落後），改成總複習、補弱點、隔天一場模考
    if (Personal.cram()) {
      ids.push('cram');
      Learn.weakest(2).forEach(w => ids.push('weak:' + w.id));
      if (S.daysLeft() % 2 === 0) ids.push('mock:' + GROUPS[Math.floor(S.daysLeft() / 2) % GROUPS.length].id);
      const cur = KP.current();
      if (cur && S.daysLeft() > 7) ids.push('kp:' + cur);
      ids.push('adaptive'); if (Learn.newCards().length && S.daysLeft() > 7) ids.push('cards-new'); ids.push('checkin');
      S.st.auto = { date: today, ids: [...new Set(ids)], skip: [] }; S.save(); return S.st.auto.ids;
    }
    // 新內容：照知識點圖的拓撲順序 π 往下推，塞到每日時數的 60%（課程規格 H3、H12、H17）。一個知識點＝一頁：教 → 例 → 練
    const kps = KP.todayList();
    if (!kps.length) { const w = Learn.weakest(1)[0]; if (w) ids.push('weak:' + w.id); }
    for (const k of kps) ids.push('kp:' + k);
    // 整章的知識點都學會、還沒交費曼：排一次（每天最多一章）；昨天延後的費曼今天補
    const fc = DATA.lessons.find(x => { const s2 = st.lessons[x.id] || {}; return KP.ORDER.some(k => KP.N[k].ch === x.id) && KP.ORDER.filter(k => KP.N[k].ch === x.id).every(KP.learned) && !['pending', 'pass', 'self'].includes(s2.gate) && !(s2.feynLater && s2.feynLater > today); });
    if (fc) ids.push('feyn:' + fc.id);
    if (DATA.lessons.some(l => (st.lessons[l.id] || {}).gate === 'revise')) ids.push('revise');
    for (const g of (plan && plan.mocks) || []) ids.push('mock:' + g);
    // 練習與新卡：只有學過至少一章才出現，而且只從學過的章出
    if (KP.M().length) ids.push('adaptive');
    if (Learn.newCards().length) ids.push('cards-new');
    ids.push('checkin');
    S.st.auto = { date: today, ids, skip: [] }; S.save();
    return ids;
  },
  chQs(lid) { return QBANK.all().filter(q => q.ch === lid && q.type !== 'essay' && q.src !== 'agent'); },
  /* 有沒有開始上過任何一堂課 */
  started() { return Object.keys(S.st.kp || {}).length > 0 || DATA.lessons.some(l => { const s = S.st.lessons[l.id] || {}; return s.read || s.stg || s.sec || s.wk; }); },
  /* 某一天真的學過的章（看當天的學習紀錄，不看計畫） */
  /* 某一天真的學會的知識點（看當天的紀錄 kpDone，不看計畫）：回想只問這些（H11） */
  learnedOn(date) { return KP.learnedOn(date); },
  /* 預排某一天（例如明天）的步驟，不動到真正的進度：給每日推播、Agent 督導用 */
  preview(date) {
    const st = S.st, realToday = D.today, realSave = S.save, keepAuto = st.auto, had = Object.prototype.hasOwnProperty.call(st.log, date), keepLog = st.log[date];
    try {
      D.today = () => date; S.save = () => { };
      return this.plan(true).map(id => { try { const d = this.def(id); return { id, title: d.title, mins: d.mins || 0 }; } catch (e) { return { id, title: id, mins: 0 }; } });
    } catch (e) { return []; } finally {
      D.today = realToday; S.save = realSave; st.auto = keepAuto; if (had) st.log[date] = keepLog; else delete st.log[date];
    }
  },

  /* ---------- 每種步驟的內容、完成條件、按下去做什麼 ---------- */
  def(id) {
    const [kind, arg] = id.split(':'), st = S.st, L = S.day(), l = arg ? LESSON[arg] : null, ls = arg ? (st.lessons[arg] || {}) : {}, short = l ? l.title.split(/[：（]/)[0] : '';
    const go = h => () => { location.hash = h; };
    switch (kind) {
      case 'paper': return Papers.dailyTask(arg);
      case 'blurt': { const ys = Auto.learnedOn(D.add(D.today(), -1)).map(x => KP.shortT(x)); return { icon: 'pen', title: '回想昨天學的', sub: ys.slice(0, 4).join('、') + (ys.length > 4 ? ` 等 ${ys.length} 個` : ''), why: '只問昨天學會的知識點：先想、再作答，想不起來的地方今天補', mins: Math.max(5, ys.length * 2), done: !!L.blurt, act: () => blurtDialog() }; }
      case 'kp': { const n = KP.N[arg]; if (!n) return { icon: 'book', title: arg, sub: '', why: '', mins: 0, done: true, act: () => { } }; return { icon: 'book', title: `上課：${KP.shortT(arg)}`, sub: `第 ${KP.POS[arg] + 1}/${KP.ORDER.length} 個知識點・${KP.stageLabel(arg)}`, why: '讀一小段就動手做一題；例題要你先寫一步；做到學會才往下', mins: n.mins || 30, done: KP.learned(arg), act: go(KP.href(arg)) }; }
      case 'class': { const g = Guide.stages(l), cur = Guide.current(l), k = g.indexOf(cur); return { icon: 'book', title: `上課：${short}`, sub: cur ? `第 ${k + 1}/${g.length} 步：${cur.t}` : '', why: '照固定順序：看懂 → 跟著做 → 自己做 → 用自己的話講', mins: Math.max(20, Math.round(g.filter(x => !x.done).reduce((t, x) => t + (x.mins || 10), 0))), done: Guide.allDone(l), act: go('#' + arg) }; }
      case 'cards-due': { const n = Learn.cardDue().length; return { icon: 'cards', title: `到期必背卡 ${n} 張`, sub: '', why: '這些卡依記憶模型算出你快忘了，今天複習一次效益最高', mins: Math.max(3, Math.ceil(n * .3)), done: n === 0, act: () => startCards({ noNew: true, title: '到期必背卡' }) }; }
      case 'review': { const n = S.dueReviews().length; return { icon: 'review', title: `到期複習 ${n} 題`, sub: '', why: '在快忘記時再做一次，記憶間隔會被拉長', mins: Math.max(3, Math.ceil(n * 1.5)), done: n === 0, act: () => Practice.start(S.dueReviews(), { title: '到期複習', review: true }) }; }
      case 'pre': return { icon: 'target', title: `預測驗：${short}`, sub: '先猜 3 題', why: '被問過的問題，讀的時候大腦會主動找答案', mins: 5, done: !!(ls.pre || ls.read), act: () => { const ids = rng(Date.now() & 0xffffffff).shuffle(this.chQs(arg).map(q => q.id)).slice(0, 3); Practice.start(ids, { title: '讀前預測驗：' + l.title, pretest: arg }); } };
      case 'clip': { const cs = Clips.list.filter(c => c.lesson === arg), seen = cs.filter(c => (st.clipSeen || {})[c.id]).length; return { icon: 'play', title: `短片：${short}`, sub: '', why: '先用畫面抓直覺，讀推導時比較不會迷路', mins: cs.length * 1, done: seen >= cs.length, act: go('#' + arg) }; }
      case 'xp': { if (typeof Explain === 'undefined') return { icon: 'play', title: '影片', sub: '', why: '', mins: 0, done: true, act: () => { } }; const xs = Explain.forLesson(arg), un = xs.filter(x => !Explain.seen(x.id)), mins = Math.max(2, Math.round(xs.reduce((t, x) => t + (x.dur || 150), 0) / 60)); return { icon: 'play', title: `動畫：${short}`, sub: xs.length > 1 ? `${xs.length - un.length}/${xs.length}` : '', why: '先看圖動起來，懂「為什麼」，讀推導時才不會迷路', mins, done: !un.length, act: go('#video-' + (un[0] || xs[0]).id) }; }
      case 'read': return { icon: 'book', title: `精讀：${l.title}`, sub: '讀完按「標記讀完」', why: '這是今天的主菜：遇到粗體與「考點」框要停下來自己推一遍', mins: Math.round(l.mins * .5), done: !!ls.read, act: go('#' + arg) };
      case 'quiz': { const cs = chapterStats(arg), need = Math.min(cs.n, 5); return { icon: 'practice', title: `練習：${short}`, sub: `${cs.att}/${need} 題`, why: '讀完馬上提取，才知道是真懂還是看過', mins: 15, done: cs.att >= need, act: () => { const qs = this.chQs(arg), d = Math.min(3, Practice.starGet(arg) + 1), up = qs.filter(q => (q.diff || 2) >= d); Practice.start((up.length ? up : qs).map(q => q.id), { title: l.title, ch: arg, limit: 8 }); } }; }
      case 'cram': return { icon: 'bolt', title: '考前總複習 40 張', sub: '最快忘的先複習', why: '', mins: 25, done: !!L.cramDone, act: () => startCram() };
      case 'fix': { const n = (Personal.causes()[arg] || []).length; return { icon: 'review', title: `補救：${arg}`, sub: `最近 7 天 ${n} 題`, why: '', mins: 15, done: (S.st.fixed || {})[arg] === D.today() || n < 3, act: () => Personal.startFix(arg) }; }
      case 'base': return { icon: 'book', title: `打底：${short}`, sub: '先看範例，再做同類題', why: '', mins: 20, done: !!ls.baseDone, act: () => { const w = Rescue.warm(arg); if (!w.ids.length) { S.lesson(arg).baseDone = D.today(); S.save(); location.hash = '#' + arg; return; } Practice.start(w.ids, { title: '打底：' + short, base: arg, ex: w.ex }); } };
      case 'feyn': return { icon: 'chat', title: `費曼：${short}`, sub: '', why: '講得出完整因果鏈才算懂；Agent 會指出你跳步的地方', mins: 20, done: ['pending', 'pass', 'self'].includes(ls.gate) || !!(ls.feynLater && ls.feynLater > D.today()), act: () => { location.hash = '#' + arg; setTimeout(() => { const f = $('#feyn'); if (f) f.scrollIntoView({ behavior: 'smooth' }); }, 300); } };
      case 'revise': { const r = DATA.lessons.filter(x => (st.lessons[x.id] || {}).gate === 'revise'); return { icon: 'chat', title: `重交費曼（${r.length} 章）`, sub: r.slice(0, 2).map(x => x.title.split(/[：（]/)[0]).join('、'), why: '被退回的那一步，正是考場上會失分的地方', mins: 20 * Math.max(1, r.length), done: !r.length, act: () => { if (r[0]) { location.hash = '#' + r[0].id; setTimeout(() => { const f = $('#feyn'); if (f) f.scrollIntoView({ behavior: 'smooth' }); }, 300); } } }; }
      case 'mock': { const g = GROUPS.find(x => x.id === arg); return { icon: 'timer', title: `模考：${g.name}`, sub: `${g.mins} 分鐘`, why: '在考試條件下提取，練時間分配', mins: g.mins + 15, done: (L.mocks || []).includes(arg), act: () => Practice.startMock(arg) }; }
      case 'weak': return { icon: 'target', title: `補弱點：${short}`, sub: '', why: '把分數最容易拉上來的地方先補起來', mins: 25, done: !!(L.weakDone || []).includes(arg), act: () => Practice.startAdaptive(arg, { weakTask: arg }) };
      case 'adaptive': { const goal = st.settings.dailyQuestions || 30; return { icon: 'bolt', title: `練習學過的 ${L.q}/${goal}`, sub: Learn.learned().map(x => LESSON[x].title.split(/[：（]/)[0]).slice(-3).join('、'), why: '難度剛好的題目學得最多；做到今天的題數目標為止', mins: Math.max(5, Math.ceil(Math.max(0, goal - L.q) * 1.3)), done: L.q >= goal, act: () => Practice.startAdaptive() }; }
      case 'cards-new': { const n = Math.min(Learn.newLeft(), Learn.newCards().length); return { icon: 'cards', title: `新必背卡 ${n} 張`, sub: '', why: '每天少量加新卡，考前才不會一次爆量', mins: Math.max(3, Math.ceil(n * .4)), done: n === 0, act: () => startCards({ title: '新的必背卡' }) }; }
      case 'mini-q': return { icon: 'bolt', title: `保底 10 題 ${Math.min(L.q, 10)}/10`, sub: '', why: '累的時候也要維持「每天都有碰」：中斷才是最大的損失', mins: Math.max(3, Math.ceil(Math.max(0, 10 - L.q) * 1.3)), done: L.q >= 10, act: () => Practice.startAdaptive(undefined, { limit: Math.max(1, 10 - L.q) }) };
      case 'checkin': return { icon: 'check', title: '晚間打卡', sub: '', why: '寫下明天第一件事，隔天開機就不會發呆', mins: 5, done: !!L.checkin, act: () => checkinDialog(todayTasks()) };
    }
    return { icon: '•', title: id, sub: '', why: '', mins: 0, done: true, act: () => { } };
  },
  list() {
    const L = S.day(), ids = L.minMode ? (L.minIds || ['mini-q', 'checkin']) : this.plan();
    const tasks = L.minMode ? [] : [...new Set(Papers.dueCorrections().map(item => 'paper:' + item.kind))];
    const skip = new Set((S.st.auto || {}).skip || []);
    return [...tasks, ...ids].map(id => Object.assign({ id, skipped: skip.has(id) }, this.def(id)));
  },
  minMode(on) { const L = S.day(); L.minMode = on; if (on) L.minIds = [...(Learn.cardDue().length ? ['cards-due'] : []), 'mini-q', 'checkin']; S.save(); },
  /* 照目前速度，考前讀得完幾章 */
  pace() {
    const day = S.planDay(), read = DATA.lessons.filter(l => (S.st.lessons[l.id] || {}).read).length;
    let expect = 0; for (const p of DATA.plan || []) if (p.day < day) expect += (p.lessons || []).length;
    const rate = read / Math.max(1, day - 1), proj = Math.min(DATA.lessons.length, Math.round(read + rate * Math.max(0, S.daysLeft())));
    return { day, read, expect, proj, total: DATA.lessons.length };
  },
  current() { return this.list().find(s => !s.done && !s.skipped) || null; },
  skip(id) { const A = S.st.auto; (A.skip = A.skip || []).push(id); S.save(); },
  /* 插在目前這一步後面（🆘 打底用） */
  insertNext(id) { this.plan(); const A = S.st.auto; if (!A || !A.ids || A.ids.includes(id)) return; const cur = this.current(), i = cur ? A.ids.indexOf(cur.id) : -1; A.ids.splice(i >= 0 ? i + 1 : A.ids.length, 0, id); S.save(); },
};

/* ======================= 帶我讀 ======================= */
function viewGo() {
  const st = S.st;
  if (!st.onboarded) return goOnboard();
  const steps = Auto.list(), cur = steps.find(s => !s.done && !s.skipped), n = steps.length, done = steps.filter(s => s.done).length, day = S.planDay();
  const L = S.day(), streak = S.streak(), y = st.log[D.add(D.today(), -1)], rw = Rewards.st();
  const missedY = day > 1 && !(y && (y.checkin || y.frozen)), froze = rw.usedFreeze === D.today() && y && y.frozen;
  const pc = Auto.pace(), commit = L.commit || st.settings.commitTime;
  const toMin = x => { const m = String(x || '').match(/^(\d{1,2}):(\d{2})$/); return m ? +m[1] * 60 + +m[2] : null; }, nowM = new Date().getHours() * 60 + new Date().getMinutes(), cm = toMin(commit);
  const behind = day >= 3 && day <= 31 && pc.read < pc.expect ? pc.expect - pc.read : 0;
  const notesHtml = `  ${froze ? '<div class="go-note">凍結卡保住了連續天數</div>' : ''}
  ${Bridge.mode === 'cloud' && typeof CloudAgent !== 'undefined' && CloudAgent.ready() && !st.aiOK ? '<div class="go-note">讓 Claude 直接幫你改作業、回答問題 <button class="btn sm primary" id="goAI">開啟</button></div>' : ''}
  ${Sync.needNudge() ? '<div class="go-note warn">這台的進度只存在瀏覽器裡 <button class="btn sm" id="goBak">下載備份</button></div>' : ''}
  ${(() => { const pr = pendingReviews(); if (!pr.length) return ''; return `<details class="go-note pend"><summary>待批改 ${pr.length} 件${agentAway() ? `（${agName()} 不在線，可以先自評）` : ''}</summary><ul>${pr.slice(0, 8).map(x => `<li><a href="${x.href}${x.feyn ? '' : ''}">${esc(x.title)}</a>${x.since ? `<span class="muted small">　${esc(x.since)} 交出</span>` : ''}</li>`).join('')}</ul></details>`; })()}
  ${missedY && !L.checkin ? `<div class="go-note bad">昨天沒打卡${st.settings.stake ? `　·　${esc(st.settings.stake)}` : ''}</div>` : ''}
  ${typeof StateLog !== 'undefined' ? StateLog.checkinHtml() : ''}`;
  main().innerHTML = `
  <div class="go-top"><span>連續 <b class="n">${streak}</b> 天</span>${cm != null && !L.checkin ? `<button class="go-t ${nowM > cm ? 'bad-t' : ''}" id="goCommit" title="打卡時間">${commit} 打卡</button>` : ''}${behind ? `<span class="bad-t">落後 ${behind} 章</span>` : ''}${L.minMode ? '<span>保底</span>' : ''}${Personal.cram() ? '<span class="bad-t">考前衝刺</span>' : ''}${rw.chests.length ? `<button class="go-chest" id="goChest">寶箱 ${rw.chests.length}</button>` : ''}</div>
  ${cur ? `<section class="go-hero">
    <div class="go-ringwrap">${(() => { const R = 52, C = 2 * Math.PI * R, f = n ? done / n : 0; return `<svg class="go-ring" viewBox="0 0 120 120" aria-label="今天 ${done}/${n} 步"><circle cx="60" cy="60" r="${R}" class="gr-bg"/><circle cx="60" cy="60" r="${R}" class="gr-fg" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - f)).toFixed(1)}"/></svg>`; })()}<div class="go-ic go-num"><b>${steps.indexOf(cur) + 1}</b><small>/ ${n}</small></div></div>
    <h2>${esc(cur.title)}</h2>
    ${cur.sub ? `<p class="go-sub">${esc(cur.sub)}</p>` : ''}${cur.why ? `<p class="go-why">${esc(cur.why)}</p>` : ''}
    <button class="go-start" id="goNow">開始</button>
    <div class="go-meta">${cur.mins} 分</div>
    ${goPie()}
    <div class="go-links"><button id="goFive">只做 5 分鐘</button>${L.minMode ? '<button id="goFull">完整計畫</button>' : '<button id="goMin">保底</button>'}<button id="goSkip">跳過</button></div>
  </section>`
  : `<section class="go-hero done"><div class="go-ringwrap">${(() => { const R = 52, C = 2 * Math.PI * R, f = n ? done / n : 0; return `<svg class="go-ring" viewBox="0 0 120 120" aria-label="今天 ${done}/${n} 步"><circle cx="60" cy="60" r="${R}" class="gr-bg"/><circle cx="60" cy="60" r="${R}" class="gr-fg" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - f)).toFixed(1)}"/></svg>`; })()}<div class="go-ic go-num"><b>${n}</b><small>/ ${n}</small></div></div><h2>今天完成</h2><button class="go-start" id="goMore">再打一關</button><div class="go-links"><a href="#videos">影片</a><a href="#gen">隨機題</a><a href="#rewards">獎勵</a></div></section>`}
  <details class="go-more" open><summary>今天 ${n} 步<span class="go-pos">上完 ${DATA.lessons.filter(l => Guide.allDone(l)).length}/${DATA.lessons.length} 堂　<a href="#map">課程地圖</a></span></summary>
    <ol class="go-list">${steps.map((s, i) => `<li class="${s.done ? 'ok' : s.skipped ? 'sk' : s === cur ? 'cur' : ''}"><button data-step="${i}"><span class="gi">${s.done ? '✓' : s.skipped ? '–' : i + 1}</span><span class="gt">${esc(s.title)}</span><span class="gm">${s.done || s.skipped ? '' : s.mins + ' 分'}</span></button></li>`).join('')}</ol>
    <div class="row end"><button class="btn sm ghost" id="goRe">重新安排</button></div>
  </details>
  ${notesHtml}`;
  const q = id => $('#' + id);
  if (typeof StateLog !== 'undefined') StateLog.wireCheckin();
  if (q('goMore')) q('goMore').onclick = () => Practice.goNext();
  if (cur) { q('goNow').onclick = nextStep; q('goSkip').onclick = () => { Auto.skip(cur.id); route(); }; setTimeout(() => { const b = q('goNow'); if (b) b.focus({ preventScroll: true }); }, 30); }
  if (q('goFive')) q('goFive').onclick = () => Nudge.five();
  if (q('goMin')) q('goMin').onclick = () => { Auto.minMode(true); route(); };
  if (q('goFull')) q('goFull').onclick = () => { Auto.minMode(false); route(); };
  if (q('goCommit')) q('goCommit').onclick = () => { const o = ['20:00', '21:00', '22:00', '23:00']; L.commit = o[(o.indexOf(commit) + 1) % o.length]; S.save(); route(); };
  $$('[data-step]').forEach(b => b.onclick = () => { if (!steps[+b.dataset.step].done && !S.st.timer.running) Timer.toggle(); steps[+b.dataset.step].act(); });
  q('goRe').onclick = () => { Auto.plan(true); route(); };
  if (q('goBak')) q('goBak').onclick = () => { Sync.download(); route(); };
  if (q('goAI')) q('goAI').onclick = async () => { q('goAI').disabled = true; q('goAI').textContent = '請按「允許」…'; try { S.st.aiSup = D.today(); await CloudAgent.supervise(null, D.today(), '學生第一次開啟 Claude 家教。用 3 句話歡迎他、說明你會怎麼幫他（改費曼、回答問題、每天排任務），再給今天的任務。'); } catch (e) { } route(); };
  if (q('goChest')) q('goChest').onclick = () => Rewards.openAll(() => route());
}

/* ---------- 無腦連刷：做完一步，直接接下一步 ---------- */
function nextStep() {
  NextAuto.cancel();
  const c = Auto.current(); if (!c) { location.hash = '#go'; return; }
  if (!S.st.timer.running) Timer.toggle();
  window.__fromAuto = Date.now(); c.act();
}
/* 結算畫面的「下一步」：4 秒後自動接下一步（按 Enter 立刻、點別的地方取消） */
const NextAuto = {
  t: null, left: 0,
  html() { const c = S.st.onboarded && Auto.current(); return `<button class="btn primary next-go" id="nextGo">${c ? `下一步：${esc(c.title.length > 18 ? c.title.slice(0, 18) + '…' : c.title)}` : '完成 ✓'} <span class="ng-c" id="ngC"></span></button>`; },
  wire(auto = true) {
    const b = $('#nextGo'); if (!b) return; const gp = $('#goPill'); if (gp) gp.remove(); b.onclick = e => { e.stopPropagation(); nextStep(); };
    this.cancel(); if (!auto || !S.st.onboarded || !Auto.current()) return;
    this.left = 4; const paint = () => { const c = $('#ngC'); if (c) c.textContent = this.left; };
    paint(); b.classList.add('counting');
    this.t = setInterval(() => { this.left--; paint(); if (this.left <= 0) { this.cancel(); nextStep(); } }, 1000);
    const stop = e => { if (e.target && e.target.closest && e.target.closest('#nextGo')) return; if (e.type === 'keydown' && e.key === 'Enter') { e.preventDefault(); nextStep(); return; } this.cancel(); };
    this.stop = stop; ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => document.addEventListener(ev, stop, { capture: true, passive: ev !== 'keydown' }));
  },
  cancel() {
    clearInterval(this.t); this.t = null; const c = $('#ngC'); if (c) c.textContent = ''; const b = $('#nextGo'); if (b) b.classList.remove('counting');
    if (this.stop) { ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => document.removeEventListener(ev, this.stop, { capture: true })); this.stop = null; }
  },
};
window.addEventListener('hashchange', () => NextAuto.cancel());
/* 帶我讀頁：Enter／空白鍵 = 開始 */
document.addEventListener('keydown', e => {
  if ((location.hash.slice(1) || 'go') !== 'go' || e.target.closest('input,textarea,select,button,summary') || $('.nd-wrap,.modal-wrap')) return;
  if (e.key === 'Enter' || e.key === ' ') { const b = $('#goNow'); if (b) { e.preventDefault(); b.click(); } }
});
function goOnboard() {
  const s = S.st.settings;
  main().innerHTML = `
  <header class="page-head"><h1>開始前</h1></header>
  <section class="card form go-ob">
    <label for="obExam">考試日</label><input id="obExam" type="date" value="${s.examDate}">
    <label>每天讀幾小時</label>
    <div class="row wrap" id="obHrs">${[2, 4, 6, 8].map(h => `<button class="cf ${Math.round((s.dailyMinutes || 360) / 60) === h ? 'on' : ''}" data-h="${h}">${h}${h === 8 ? '+' : ''}</button>`).join('')}</div>
    <label>計畫起始日</label>
    <div class="row wrap"><button class="cf on" data-st="today">今天</button><button class="cf" data-st="keep">${s.startDate}</button></div>
    <label>每天幾點開始</label>
    <div class="row wrap">${['08:00', '09:00', '10:00', '13:00', '19:00'].map(t => `<button class="cf ${(s.studyStart || '09:00') === t ? 'on' : ''}" data-ss="${t}">${t}</button>`).join('')}</div>
    <label for="obStake">沒打卡的代價（選填）</label><input id="obStake" placeholder="例：隔天多做 30 題" value="${esc(s.stake || '')}">
    <div class="row end"><button class="btn primary go-btn" id="obGo">開始</button></div>
  </section>`;
  let hrs = Math.round((s.dailyMinutes || 360) / 60), sd = 'today', ss = s.studyStart || '09:00';
  $$('[data-ss]').forEach(b => b.onclick = () => { $$('[data-ss]').forEach(x => x.classList.remove('on')); b.classList.add('on'); ss = b.dataset.ss; });
  $$('[data-h]').forEach(b => b.onclick = () => { $$('[data-h]').forEach(x => x.classList.remove('on')); b.classList.add('on'); hrs = +b.dataset.h; });
  $$('[data-st]').forEach(b => b.onclick = () => { $$('[data-st]').forEach(x => x.classList.remove('on')); b.classList.add('on'); sd = b.dataset.st; });
  $('#obGo').onclick = () => {
    s.examDate = $('#obExam').value || s.examDate; s.examDateCustom = true; s.dailyMinutes = hrs * 60; s.dailyQuestions = hrs <= 2 ? 15 : hrs <= 4 ? 25 : 30; s.newCards = hrs <= 2 ? 10 : 20;
    if (sd === 'today') s.startDate = D.today();
    s.studyStart = ss; s.commitTime = s.commitTime || '22:00'; s.stake = $('#obStake').value.trim();
    S.st.onboarded = true; S.st.auto = null; S.save(); route();
    if ('Notification' in window && Notification.permission === 'default') setTimeout(() => Nudge.overlay('<div class="nd-ic">' + ICON('today') + '</div><h2>開啟提醒？</h2>', [['開啟', () => Nudge.ask(), 'primary'], ['不用', () => { }]]), 400);
  };
}
/* 其他頁面左下角的「下一步」浮鈕 */
/* 浮動「下一步」：捲動時變淡（不擋字），停下來 0.7 秒再恢復 */
(() => { let t = null; window.addEventListener('scroll', () => { const p = document.getElementById('goPill'); if (!p) return; p.classList.add('dim'); clearTimeout(t); t = setTimeout(() => p.classList.remove('dim'), 700); }, { passive: true }); })();
/* 寬螢幕的教材頁有右側欄：「下一步」放進側欄，不再浮在畫面上 */
function placeGoPill(p) {
  p = p || document.getElementById('goPill'); if (!p) { document.body.classList.remove('has-dock'); return; }
  // 2026-11-14：不再浮在內容上。教材頁寬螢幕放側欄；其他桌機放左欄；手機放底部分頁列上方的固定列
  const side = document.getElementById('sideNext'), wide = window.matchMedia && matchMedia('(min-width: 821px)').matches;
  const inSide = side && window.matchMedia && matchMedia('(min-width: 1360px)').matches;
  const host = inSide ? side : (wide ? document.getElementById('railNext') : document.getElementById('mDock')) || document.body;
  if (p.parentNode !== host) host.appendChild(p);
  p.classList.toggle('in-side', !!inSide);
  document.body.classList.toggle('has-dock', !wide && host.id === 'mDock');
}
window.addEventListener('resize', () => placeGoPill());
/* 教材頁：已經捲過短片往下讀，就把「看短片」這步算過，按鈕直接換成下一步 */
function watchClipPast(id) {
  const sec = document.querySelector('.clip-sec'); if (!sec || typeof IntersectionObserver === 'undefined') return;
  const io = new IntersectionObserver(es => { for (const e of es) if (!e.isIntersecting && e.boundingClientRect.bottom < 0) { const c = Auto.current(); if (c && c.id === 'clip:' + id) { Auto.skip(c.id); renderGoPill(id); } io.disconnect(); } });
  io.observe(sec);
}
function renderGoPill(cur) {
  cur = cur || location.hash.slice(1) || 'go';
  let p = $('#goPill');
  const inSess = (cur === 'practice' && Practice.sess) || (cur === 'cards' && window.CardSess) || $('#nextGo');
  // 知識點頁只有一個主按鈕（課程規格 H14），不再疊一顆浮動的「下一步」
  if (!S.st.onboarded || cur === 'go' || inSess || cur.startsWith('k/')) { if (p) p.remove(); document.body.classList.remove('has-dock'); return; }
  const c = Auto.current(), [kind, arg] = c ? c.id.split(':') : [];
  const here = c && arg === cur;   // 這一步就在目前這頁
  const label = !c ? '今天完成 ✓' : here && kind === 'read' ? '✓ 讀完，下一步' : here && kind === 'clip' ? '跳過短片 →' : here && kind === 'feyn' ? '↓ 費曼' : (c.title.length > 16 ? c.title.slice(0, 16) + '…' : c.title) + ' →';
  if (!p) p = h('a', { id: 'goPill', class: 'go-pill', href: '#go' });
  placeGoPill(p);
  p.onclick = e => {
    const c2 = Auto.current(); if (!c2) return; e.preventDefault();
    const [k2, a2] = c2.id.split(':'), h2 = (location.hash.slice(1) || 'go') === a2;
    if (h2 && k2 === 'read') { const b = $('#btnRead'); if (b) { b.click(); return; } }
    if (h2 && k2 === 'clip') { Auto.skip(c2.id); renderGoPill(); return; }
    if (h2 && k2 === 'feyn') { const f = $('#feyn'); if (f) { f.scrollIntoView({ behavior: 'smooth' }); return; } }
    nextStep();
  };
  p.innerHTML = `<b>${esc(label)}</b>`;
}
