/* 資工所衝刺站 — 自我檢查（雙擊 test.bat 或打開 web/selftest.html）
   不連 bridge、用獨立的儲存空間，不會動到你的進度。 */
'use strict';
(async () => {
  const out = $('#main'), R = [];
  const errs = []; window.addEventListener('error', e => errs.push(String(e.message || e)));
  const section = (name, fails, total, note = '') => { R.push({ name, fails, total, note }); paint(); };
  const paint = () => {
    const bad = R.reduce((a, r) => a + r.fails.length, 0);
    out.innerHTML = `<header class="page-head"><h1>自我檢查 ${R.length < STEPS ? '…' : bad ? `<span class="bad-t">✗ ${bad} 個問題</span>` : '<span class="good-t">✓ 全部通過</span>'}</h1></header>
    <section class="card"><table class="st-t">${R.map(r => `<tr class="${r.fails.length ? 'bad' : 'ok'}"><td>${r.fails.length ? '✗' : '✓'}</td><td>${esc(r.name)}</td><td class="muted">${r.total}${r.note ? '　' + esc(r.note) : ''}</td></tr>${r.fails.slice(0, 12).map(f => `<tr class="bad"><td></td><td colspan="2"><code>${esc(String(f).slice(0, 300))}</code></td></tr>`).join('')}`).join('')}</table></section>`;
    document.title = R.length < STEPS ? '檢查中…' : bad ? `✗ ${bad}` : '✓ 全部通過';
    window.SELFTEST_RESULT = { done: R.length >= STEPS, bad, sections: R };
  };
  const STEPS = 9, tick = () => new Promise(r => setTimeout(r, 0));
  const figFail = html => /<pre class="code">[^<]*(tree|array|graph|bits|lanes|timeline|bars|venn|plane|matrix|flow)/.test(html) || (html.match(/<svg[\s\S]*?<\/svg>/g) || []).some(v => /="NaN"|>NaN<|="-?Infinity"/.test(v));
  const mathFail = html => { const m = html.match(/<span class="katex-error"[^>]*title="([^"]*)"|<code class="tex">([^<]*)/); return m ? (m[1] || m[2] || '').slice(0, 80) : ''; };
  const tryMd = (s, where, f) => { try { const h = md(String(s || '')); if (figFail(h)) f.push(where + '：圖解語法錯誤'); const mf = mathFail(h); if (mf) f.push(where + '：公式錯誤 ' + mf); return h; } catch (e) { f.push(where + '：' + e.message); return ''; } };

  S.load(); S.st = defaultState(); QBANK.build();

  // 1. 資料一致性
  { const f = [], lids = new Set(DATA.lessons.map(l => l.id)), fids = new Set((DATA.found || []).map(x => typeof x === 'string' ? x : x.id));
    DATA.quiz.forEach(q => { if (!lids.has(q.ch) && !fids.has(q.ch)) f.push(`${q.id}：章節 ${q.ch} 不存在`); if (q.kp && !(DATA.kp && DATA.kp.nodes && DATA.kp.nodes[q.kp])) f.push(`${q.id}：知識點 ${q.kp} 不存在`); });
    DATA.cards.forEach(c => { if (!lids.has(c.ch)) f.push(`${c.id}：章節 ${c.ch} 不存在`); });
    (DATA.plan || []).forEach(p => (p.lessons || []).forEach(l => { if (!lids.has(l)) f.push(`計畫第 ${p.day} 天：${l} 不存在`); }));
    const ids = DATA.quiz.map(q => q.id); ids.filter((x, i) => ids.indexOf(x) !== i).forEach(x => f.push('重複題號 ' + x));
    section('資料一致性（章節、題號、計畫）', f, `${DATA.lessons.length} 章、${DATA.quiz.length} 題、${DATA.cards.length} 張卡`); }
  await tick();

  // 2. 題庫：格式、答案能被自己判對、詳解與圖能顯示
  { const f = [], per = {};
    for (const q of DATA.quiz) {
      per[q.ch] = (per[q.ch] || 0) + 1;
      if (!['single', 'multi', 'fill', 'essay'].includes(q.type)) { f.push(`${q.id}：題型 ${q.type}`); continue; }
      if (!String(q.stem || '').trim()) f.push(`${q.id}：沒有題目`);
      if (!String(q.expl || '').trim()) f.push(`${q.id}：沒有詳解`);
      if (q.type === 'single' || q.type === 'multi') {
        if (!Array.isArray(q.opts) || q.opts.length < 2) f.push(`${q.id}：選項不足`);
        else if (!q.ans.length || q.ans.some(k => k < 0 || k >= q.opts.length)) f.push(`${q.id}：答案超出選項`);
        if (q.type === 'single' && q.ans.length !== 1) f.push(`${q.id}：單選卻有 ${q.ans.length} 個答案`);
        (q.opts || []).forEach((o, k) => tryMd(o, `${q.id} 選項 ${k}`, f));
      }
      if (q.type !== 'essay' && Practice.isCorrect(q, q.type === 'fill' ? q.ans[0] : q.ans) !== true) f.push(`${q.id}：正解自己判成錯`);
      tryMd(q.stem, q.id + ' 題目', f); tryMd(q.expl, q.id + ' 詳解', f);
    }
    const thin = DATA.lessons.filter(l => (per[l.id] || 0) < 3).map(l => l.id);
    section('題庫', f, `${DATA.quiz.length} 題`, thin.length ? `不到 3 題的章：${thin.length}` : ''); }
  await tick();

  // 3. 計算題產生器：每種 40 個隨機種子
  { const f = []; let n = 0;
    for (const g of Gen.list) for (let s = 1; s <= 40; s++) {
      n++; let q; try { q = Gen.make(g.id, s * 7919); } catch (e) { f.push(`${g.id}#${s}：${e.message}`); continue; }
      if (!q || !q.stem || !q.ans || !q.ans.length) { f.push(`${g.id}#${s}：沒有題目或答案`); continue; }
      if (q.type !== 'essay' && Practice.isCorrect(q, q.type === 'fill' ? q.ans[0] : q.ans) !== true) f.push(`${g.id}#${s}：正解自己判成錯（${q.ans}）`);
      if (q.ans.some(a => /NaN|undefined|Infinity/.test(String(a)))) f.push(`${g.id}#${s}：答案是 ${q.ans}`);
    }
    section('計算題產生器', f, `${Gen.list.length} 種 × 40`); }
  await tick();

  // 4. 卡片
  { const f = []; for (const c of DATA.cards) { if (!String(c.back || '').trim()) f.push(`${c.id}：背面是空的`); tryMd(c.front, c.id + ' 正面', f); tryMd(c.back, c.id + ' 背面', f); }
    section('必背卡', f, `${DATA.cards.length} 張`); }
  await tick();

  // 5. 直觀版、跟著做與圖解（公式離線渲染）
  { const f = []; let figs = 0, steps = 0;
    if (!window.katex) f.push('KaTeX 沒載入：公式無法離線顯示');
    const cnt = h => { figs += (h.match(/<figure class="fgw"/g) || []).length; };
    for (const l of DATA.lessons) {
      if (!l.intuit) f.push(`${l.id}：沒有直觀版`); else cnt(tryMd(l.intuit, l.id, f));
      cnt(tryMd(l.body, l.id + ' 本文', f));
      const w = l.worked; if (!w) continue;   // 舊章例題已停用（改成知識點例題）
      if (!w.steps.length || !w.ans) f.push(`${l.id}：例題缺步驟或答案`);
      cnt(tryMd(w.q, l.id + ' 例題', f)); w.steps.forEach((x, i) => { steps++; tryMd(x.t, `${l.id} 第${i + 1}步標題`, f); cnt(tryMd(x.b, `${l.id} 第${i + 1}步`, f)); }); tryMd(w.ans, l.id + ' 答案', f); tryMd(w.err, l.id + ' 常錯', f);
    }
    section('課文、直觀版、跟著做與圖解', f, `${DATA.lessons.length} 章、${steps} 步、${figs} 張圖`); }
  await tick();

  // 6. 短片：每支畫開頭、中間、結尾三格
  { const f = Clips.list.filter(c => !Clips.videoOf(c.id)).map(c => c.id + ' 沒有 MP4'); section('短片', f, `${Clips.list.length} 支 MP4`); }
  await tick();

  // 7. 每個頁面都能打開
  { const f = [], routes = ['go', 'cards', 'practice', 'feed', 'wrong', 'stats', 'rewards', 'today', 'plan', 'gen', 'lab', 'agent', 'methods', 'setup', ...DATA.subjects.map(s => 'subj-' + s.id), ...DATA.lessons.map(l => l.id)];
    const host = h('div', { id: 'main', hidden: true }), rail = h('nav', { id: 'rail', hidden: true }), realMain = out; realMain.id = 'stOut';
    document.body.append(host, rail);
    S.st.onboarded = true;
    for (const r of routes) { const e0 = errs.length; try { history.replaceState(null, '', '#' + r); route(); } catch (e) { f.push(`#${r}：${e.message}`); } if (errs.length > e0) f.push(`#${r}：${errs.slice(e0).join('；')}`); if (!host.innerHTML.trim()) f.push(`#${r}：畫面是空的`); await tick(); }
    try { typeof Clips !== 'undefined' && Clips.stopAll(); Labs.stopAll && Labs.stopAll(); } catch (e) { }
    host.remove(); rail.remove(); realMain.id = 'main'; history.replaceState(null, '', location.pathname);
    $$('.go-pill,#goPill,.rw-float,.rw-ach-t,.rw-drop,.rw-lvban,.rw-confetti,.nd-wrap,.modal-wrap').forEach(x => x.remove());
    section('每個頁面都能打開', f, `${routes.length} 頁`); }
  await tick();

  // 8. 進度合併：合併兩次結果一樣、不會重複計算
  { const f = []; try { const a = defaultState(); a.answers = { x: { n: 2, c: 1, last: '2026-01-02' } }; a.log = { '2026-01-02': { min: 10, q: 2, c: 1, lessons: ['a'] } };
      const b = defaultState(); b.answers = { x: { n: 1, c: 1, last: '2026-01-01' }, y: { n: 1, c: 0, last: '2026-01-03' } }; b.log = { '2026-01-02': { min: 30, q: 1, c: 1, lessons: ['b'] } };
      const m1 = Sync.merge(a, b), m2 = Sync.merge(m1, b);
      if (JSON.stringify(m1) !== JSON.stringify(m2)) f.push('合併兩次結果不同');
      if (m1.answers.x.n !== 2 || !m1.answers.y) f.push('作答合併錯誤');
      if (m1.log['2026-01-02'].min !== 30 || m1.log['2026-01-02'].lessons.length !== 2) f.push('每日紀錄合併錯誤');
    } catch (e) { f.push(e.message); }
    section('進度合併', f, '3 項'); }
  await tick();

  // 9. 記憶模型
  { const f = []; const c1 = FSRS.next(null, 3, '2026-01-01'); if (!(c1.s > 3 && c1.s < 4.5)) f.push('新卡「記得」的穩定度應約 3.7 天，得到 ' + c1.s);
    if (Math.abs(FSRS.R(c1.s, c1.s) - .9) > .01) f.push('經過 S 天後記得機率應為 90%');
    section('記憶模型', f, '2 項'); }
  try { localStorage.removeItem('csgrad.selftest'); } catch (e) { }
})();
