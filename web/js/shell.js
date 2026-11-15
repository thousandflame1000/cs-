/* 資工所衝刺站 — 外框（2026-11-14 介面重寫，課程規格 U1–U7）
   主導覽只有 4 個入口：今天、課程、練習、我的。桌機在左欄，手機在底部分頁列。
   每個區塊的子頁放在內容上方的分頁列（#secTabs），任何一頁兩下就到；🔍／Ctrl+K 搜尋知識點、章節、頁面。
   「下一步」不再浮在內容上：桌機放左欄（#railNext），手機放分頁列上方的固定列（#mDock）。 */
'use strict';

Object.assign(ICON_P, {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.2 4.2"/>',
  me: '<circle cx="12" cy="8.2" r="3.7"/><path d="M4.6 20c.9-3.9 3.8-6 7.4-6s6.5 2.1 7.4 6"/>',
  notes: '<path d="M6 3.8h9l3.5 3.5V20.2H6z"/><path d="M14.6 3.8v3.9h3.9M9 12h6.5M9 15.6h6.5"/>',
  eraser: '<path d="M8.3 19.5h11.2M4.6 15.1l8.9-8.9a2 2 0 0 1 2.8 0l2.5 2.5a2 2 0 0 1 0 2.8l-7.6 7.6a2 2 0 0 1-1.4.6H8.7a2 2 0 0 1-1.4-.6l-2.7-2.7a.9.9 0 0 1 0-1.3z"/><path d="M9.4 10.3l5.3 5.3"/>',
  undo: '<path d="M9 14.5L4.5 10 9 5.5"/><path d="M4.5 10H14a5.5 5.5 0 0 1 0 11h-3"/>',
  trash: '<path d="M4.5 6.8h15M9.5 6.8V4.6h5v2.2M6.6 6.8l.9 13h9l.9-13"/>',
  expand: '<path d="M14.5 4.5h5v5M9.5 19.5h-5v-5M19.5 4.5l-6 6M4.5 19.5l6-6"/>',
  shrink: '<path d="M19.5 9.5h-5v-5M4.5 14.5h5v5M14.5 9.5l6-6M9.5 14.5l-6 6"/>',
  down: '<path d="M6 9.5l6 6 6-6"/>',
  back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  camera: '<path d="M4 8.2h3.2l1.6-2.4h6.4l1.6 2.4H20v10.6H4z"/><circle cx="12" cy="13.2" r="3.3"/>',
  image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9.2" cy="10" r="1.6"/><path d="M4.5 17.5l5-5 3.5 3.5 2.5-2.5 4 4"/>',
});

const Shell = (() => {
  const lastSubj = () => { try { return localStorage.getItem('ui.subj') || 'ds'; } catch (e) { return 'ds'; } };
  const SECT = [
    { id: 'today', t: '今天', ic: 'today', home: 'go', tabs: () => [['go', '帶我讀'], ['today', '今日紀錄']] },
    { id: 'course', t: '課程', ic: 'course', home: 'map', tabs: () => [['map', '課程地圖'], ['subj-' + lastSubj(), '章節'], ['videos', '影片'], ['lab', '實驗室'], ['notes', '筆記']] },
    { id: 'practice', t: '練習', ic: 'practice', home: 'practice', tabs: () => [['practice', '推薦'], ['wrong', '錯題本'], ['cards', '必背卡'], ['papers', '原卷模考'], ['gen', '隨機題']] },
    { id: 'me', t: '我的', ic: 'me', home: 'me', tabs: () => [['me', '總覽'], ['stats', '儀表板'], ['rewards', '獎勵'], ['palace', '宮殿'], ['state', '狀態'], ['agent', Bridge.mode === 'cloud' ? 'Claude' : 'Agent'], ['setup', '設定'], ['methods', '學習法']] },
  ];
  const PAGE_DESC = { go: '今天要做的事，一次一步', today: '今天的任務、時數、打卡、督導訊息', map: '219 個知識點照先修順序排好', videos: '短影片', lab: '動手玩的互動實驗', notes: '自己寫的筆記，依科目歸檔', practice: '推薦的下一關', wrong: '答錯的題目，到期再做一次', cards: '陷阱、考點、回想卡', papers: '114 年台大原卷，紙筆作答後逐題核分', gen: '程式產生的計算題', me: '所有設定與紀錄的入口', stats: '掌握度、記憶、時數', rewards: '金幣、等級、兌換', palace: '3D 記憶宮殿', state: '狀態紀錄', agent: 'Agent／Claude 的訊息與連線', setup: '考試日期、每日時數、進度檔', methods: '這個網站用的學習法' };

  /* 目前這頁屬於哪個區塊 */
  function sectionOf(h) {
    if (/^(go|today)$/.test(h)) return 'today';
    if (/^(practice|cards|wrong|gen)$/.test(h) || h === 'papers' || h.startsWith('papers/')) return 'practice';
    if (/^(me|stats|state|rewards|setup|agent|methods|palace)$/.test(h)) return 'me';
    if (h === 'map' || h === 'plan' || h.startsWith('k/') || h.startsWith('subj-') || h === 'notes' || h.startsWith('notes/') || /^(videos|video-|feed|lab)/.test(h) || LESSON[h]) return 'course';
    return 'today';
  }
  /* 分頁列上哪一格算「目前」 */
  function tabOf(h) {
    if (h.startsWith('subj-') || (LESSON[h] && !LESSON[h].found)) return 'chapters';
    if (h.startsWith('video-') || h.startsWith('feed')) return 'videos';
    if (h.startsWith('lab-')) return 'lab';
    if (h.startsWith('notes')) return 'notes';
    if (h.startsWith('papers')) return 'papers';
    if (h === 'plan') return 'map';
    return h;
  }
  const tabKey = id => id.startsWith('subj-') ? 'chapters' : id;

  function nav() {
    const h = decodeURIComponent(location.hash.slice(1)) || 'go', cur = sectionOf(h), left = S.daysLeft();
    if (h.startsWith('subj-') && SUBJ[h.slice(5)]) { try { localStorage.setItem('ui.subj', h.slice(5)); } catch (e) { } }
    else if (LESSON[h] && LESSON[h].subject) { try { localStorage.setItem('ui.subj', LESSON[h].subject); } catch (e) { } }
    const item = (s, cls) => `<a href="#${s.home}" class="${cls}${cur === s.id ? ' cur' : ''}" data-sec="${s.id}"${cur === s.id ? ' aria-current="page"' : ''}>${ICON(s.ic)}<span>${s.t}</span>${s.id === 'me' ? '<span class="unread-badge" hidden></span>' : ''}</a>`;
    const rail = $('#rail');
    rail.innerHTML = `
      <a class="r-brand" href="#go"><span class="b1">資工所</span><span class="b2">衝刺站</span></a>
      <button type="button" class="r-search" data-search>${ICON('search')}<span>搜尋</span><kbd>Ctrl K</kbd></button>
      <div class="r-next" id="railNext"></div>
      <nav class="r-nav" aria-label="主導覽">${SECT.map(s => item(s, 'r-item')).join('')}</nav>
      <div class="r-foot">
        <button type="button" class="r-notes" data-notes>${ICON('notes')}<span>筆記</span></button>
        <div class="r-meta"><span>剩 <b>${left >= 0 ? left : 0}</b> 天</span><span>連續 <b>${S.streak()}</b> 天</span><a class="rail-coin" id="railCoin" href="#rewards" aria-label="金幣">${COIN}<b data-coin>${Rewards.coins()}</b></a></div>
        <a href="#agent" class="bridge-pill off" data-auto="1" hidden><span class="dot"></span><span>…</span></a>
      </div>`;
    let tb = $('#tabbar');
    if (!tb) { tb = h_('nav', { id: 'tabbar', class: 'tabbar', 'aria-label': '主導覽' }); document.body.appendChild(tb); }
    tb.innerHTML = SECT.map(s => item(s, 't-item')).join('');
    if (!$('#mDock')) document.body.appendChild(h_('div', { id: 'mDock', class: 'm-dock' }));
    tabs(h);
    Bridge.render();
  }
  const h_ = (tag, attrs) => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  /* 區塊分頁列：在內容上方；上課（知識點頁）和做題中不顯示，免得分心 */
  function tabs(h) {
    h = h || decodeURIComponent(location.hash.slice(1)) || 'go';
    const el = $('#secTabs'); if (!el) return;
    const s = SECT.find(x => x.id === sectionOf(h)), cur = tabOf(h);
    let html = `<div class="st-row" role="tablist">${s.tabs().map(([id, t]) => `<a href="#${id}" role="tab" class="st-tab${tabKey(id) === cur ? ' cur' : ''}"${tabKey(id) === cur ? ' aria-current="page" aria-selected="true"' : ' aria-selected="false"'}>${esc(t)}</a>`).join('')}</div>`;
    if (cur === 'chapters') {   // 章節：再一排科目
      const sj = h.startsWith('subj-') ? h.slice(5) : (LESSON[h] || {}).subject;
      html += `<div class="st-row st-sub">${DATA.subjects.map(x => `<a href="#subj-${x.id}" class="st-chip${x.id === sj ? ' cur' : ''}" style="--sc:var(--s-${x.id})"><span class="sdot"></span>${esc(x.name)}</a>`).join('')}</div>`;
    }
    el.innerHTML = html;
    syncTabs();
  }
  /* 做題、上課中把分頁列藏起來（Practice／CardSess 會自己重畫 #main，用 MutationObserver 跟著判斷） */
  function syncTabs() {
    const el = $('#secTabs'); if (!el) return;
    const h = decodeURIComponent(location.hash.slice(1)) || 'go';
    const focus = h.startsWith('k/') || h.startsWith('feed') || (h === 'practice' && typeof Practice !== 'undefined' && Practice.sess) || (h === 'cards' && typeof CardSess !== 'undefined' && !!CardSess) || !!$('#main .exam-head');
    el.hidden = focus;
    document.body.classList.toggle('in-focus', focus);
  }

  /* ---------- 搜尋 ---------- */
  let IDX = null;
  function index() {
    if (IDX) return IDX;
    const out = [];
    for (const s of SECT) for (const [id, t] of s.tabs()) if (!id.startsWith('subj-')) out.push({ t, sub: s.t + (PAGE_DESC[id] ? '・' + PAGE_DESC[id] : ''), href: '#' + id, kind: '頁面', key: (t + ' ' + id + ' ' + (PAGE_DESC[id] || '')).toLowerCase() });
    for (const x of DATA.subjects) out.push({ t: x.name, sub: '科目', href: '#subj-' + x.id, kind: '科目', key: (x.name + ' ' + x.id).toLowerCase() });
    for (const l of DATA.lessons) if (!l.found) out.push({ t: l.title, sub: (SUBJ[l.subject] || {}).name || '', href: '#' + l.id, kind: '章節', key: (l.title + ' ' + l.id + ' ' + (l.summary || '')).toLowerCase() });
    if (typeof KP !== 'undefined') KP.ORDER.forEach((k, i) => { const n = KP.N[k]; out.push({ t: n.title, sub: `第 ${i + 1} 個知識點・${(SUBJ[n.subject] || {}).name || ''}`, href: KP.href(k), kind: '知識點', k, key: (n.title + ' ' + k + ' ' + (n.goal || '')).toLowerCase() }); });
    return (IDX = out);
  }
  const plain = t => String(t || '').replace(/\$([^$]*)\$/g, '$1').replace(/[*`]/g, '');
  function find(q) {
    q = q.trim().toLowerCase(); if (!q) return [];
    const ws = q.split(/\s+/), res = [];
    for (const x of index()) {
      if (!ws.every(w => x.key.includes(w))) continue;
      const tl = x.t.toLowerCase(), sc = (tl.startsWith(ws[0]) ? 0 : tl.includes(ws[0]) ? 1 : 2) * 10 + ({ 頁面: 0, 科目: 1, 章節: 2, 知識點: 3 }[x.kind] || 4);
      res.push([sc, x]);
    }
    return res.sort((a, b) => a[0] - b[0]).slice(0, 40).map(r => r[1]);
  }
  function openSearch() {
    if ($('.sp-wrap')) { $('.sp-in').focus(); return; }
    const w = h_('div', { class: 'sp-wrap', role: 'dialog', 'aria-modal': 'true', 'aria-label': '搜尋' });
    w.innerHTML = `<div class="sp"><div class="sp-bar">${ICON('search')}<input class="sp-in" type="search" placeholder="搜尋知識點、章節、頁面（例如：堆疊、RISC-V、錯題）" autocomplete="off" spellcheck="false" aria-label="搜尋"><button type="button" class="sp-x" aria-label="關閉">Esc</button></div><ul class="sp-list" role="listbox"></ul></div>`;
    document.body.appendChild(w); document.body.classList.add('sp-on');
    const inp = $('.sp-in', w), list = $('.sp-list', w);
    let items = [], sel = 0;
    const close = () => { w.remove(); document.body.classList.remove('sp-on'); };
    const go = x => { close(); if (x) location.hash = x.href; };
    const paint = () => {
      const q = inp.value;
      items = q.trim() ? find(q) : SECT.map(s => ({ t: s.t, sub: s.tabs().map(x => x[1]).join('・'), href: '#' + s.home, kind: '區塊' }));
      if (sel >= items.length) sel = 0;
      list.innerHTML = items.length ? items.map((x, i) => `<li role="option" class="sp-i${i === sel ? ' on' : ''}" data-i="${i}" aria-selected="${i === sel}"><span class="sp-k">${x.kind}</span><span class="sp-t">${esc(plain(x.t))}${x.k && KP.learned(x.k) ? ' <small class="sp-ok">學會了</small>' : ''}</span><span class="sp-s">${esc(plain(x.sub))}</span></li>`).join('') : `<li class="sp-none">找不到「${esc(q)}」</li>`;
      const on = $('.sp-i.on', list); if (on) on.scrollIntoView({ block: 'nearest' });
    };
    inp.addEventListener('input', () => { sel = 0; paint(); });
    inp.addEventListener('keydown', e => {
      if (e.isComposing) return;
      if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); paint(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); }
      else if (e.key === 'Enter') { go(items[sel]); e.preventDefault(); }
      else if (e.key === 'Escape') { close(); e.preventDefault(); }
    });
    list.addEventListener('click', e => { const li = e.target.closest('.sp-i'); if (li) go(items[+li.dataset.i]); });
    w.addEventListener('click', e => { if (e.target === w || e.target.closest('.sp-x')) close(); });
    paint(); setTimeout(() => inp.focus(), 0);
  }

  /* ---------- 我的（總覽） ---------- */
  function viewMe() {
    const left = S.daysLeft(), st = Bridge.status ? Bridge.status() : { text: '', cls: '' };
    const kpN = typeof KP !== 'undefined' ? KP.M().length : 0, kpT = typeof KP !== 'undefined' ? KP.ORDER.length : 0;
    const tile = (id, ic, t, v) => `<a class="me-tile" href="#${id}"><span class="me-ic">${ICON(ic)}</span><span class="me-t">${t}</span><span class="me-v">${v}</span></a>`;
    main().innerHTML = `<header class="page-head"><h1>我的</h1>
      <div class="me-stats"><div><b>${left >= 0 ? left : 0}</b><span>天後考試</span></div><div><b>${S.streak()}</b><span>連續天數</span></div><div><b>${kpN}<small>/${kpT}</small></b><span>知識點學會</span></div><div><b>${Rewards.coins()}</b><span>金幣</span></div></div></header>
      <div class="me-grid">
        ${tile('stats', 'records', '儀表板', '掌握度、記憶、時數')}
        ${tile('today', 'today', '今日紀錄', '任務、打卡、督導訊息')}
        ${tile('rewards', 'gift', '獎勵', '金幣兌換、等級')}
        ${tile('palace', 'palace', '宮殿', '3D 記憶宮殿')}
        ${tile('state', 'eye', '狀態', '精神、睡眠紀錄')}
        ${tile('agent', 'chat', Bridge.mode === 'cloud' ? 'Claude' : 'Agent', esc(st.text || '訊息與連線'))}
        ${tile('setup', 'settings', '設定', '考試日期、每日時數、進度檔')}
        ${tile('methods', 'book', '學習法', '為什麼這樣排')}
      </div>`;
  }

  /* ---------- 掛上全域事件 ---------- */
  function init() {
    document.addEventListener('click', e => {
      if (e.target.closest('[data-search]')) { e.preventDefault(); openSearch(); return; }
      const nb = e.target.closest('[data-notes]'); if (nb) { e.preventDefault(); const b = $('#notesBtn'); if (b) b.click(); }
    });
    document.addEventListener('keydown', e => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '') || (e.target && e.target.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openSearch(); return; }
      if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !$('.modal-wrap')) { e.preventDefault(); openSearch(); }
    });
    const m = $('#main'); if (m && 'MutationObserver' in window) new MutationObserver(() => syncTabs()).observe(m, { childList: true });
  }

  return { SECT, sectionOf, tabOf, nav, tabs, syncTabs, openSearch, find, viewMe, init };
})();
