/* 資工所衝刺站 — 知識點頁（課程規格 content/課程規格.md）
   一個知識點 = 一頁，固定三步：教（一小段讀 → 馬上動手）→ 例（每題至少一步要你先寫）→ 練（做到學會）。
   講解、題目、手寫板、提示在同一個畫面（寬螢幕左右、手機上下）；整頁只有一個主按鈕，永遠指向下一個動作。
   學生原話：「一般人上課，手、筆、題目都會一起動，而不是死板地盯著」 */
'use strict';

/* ---------- 唯一的影片播放器（H15）：MP4，可以只播一段 ---------- */
const KPV = {
  src(clip) {
    const v = (DATA.shorts || {})[clip]; if (v) return v;
    const x = (DATA.videos || {})[clip]; return x ? { src: 'videos/' + clip + '.mp4', poster: 'videos/' + clip + '.jpg' } : null;
  },
  html(clip, a, b, cls) {
    const v = KPV.src(clip); if (!v) return '';
    const t = b ? `#t=${a || 0},${b}` : (a ? `#t=${a}` : '');
    return `<div class="kpv ${cls || ''}" data-clip="${esc(clip)}" data-a="${a || 0}" data-b="${b || ''}">
      <video playsinline preload="metadata"${v.poster ? ` poster="${v.poster}"` : ''} src="${v.src}${t}"></video>
      <button type="button" class="kpv-play" aria-label="播放">${ICON('play')}</button>
      <button type="button" class="kpv-snd ${Sound.on ? 'on' : ''}" aria-label="影片聲音開關">${ICON(Sound.on ? 'sound' : 'mute')}</button>
      <button type="button" class="kpv-x kpv-noteb" aria-label="打開筆記">筆記</button>
      <button type="button" class="kpv-x kpv-bigb" aria-label="放大影片">放大</button>
      <div class="kpv-bar" aria-hidden="true"><i></i></div>
      ${b ? `<span class="kpv-len">${Math.round(b - (a || 0))} 秒</span>` : ''}</div>`;
  },
  _box(box, opts = {}) {
    if (box._api) return box._api;
    const v = $('video', box), a = +box.dataset.a || 0, b = +box.dataset.b || 0, bar = $('.kpv-bar i', box);
    const len = () => (b || v.duration || 1) - a;
    let seen = false;
    const markSeen = () => { if (seen) return; seen = true; box.classList.add('seen'); if (typeof window.onClipSeen === 'function') window.onClipSeen(box.dataset.clip); };
    const api = {
      box, video: v,
      play() { if (opts.restart || (b && v.currentTime >= b - .05)) { v.currentTime = a; opts.restart = false; } v.muted = !Sound.on; const pr = v.play(); if (pr && pr.catch) pr.catch(() => { v.muted = true; v.play().catch(() => { }); }); },
      pause() { if (!v.paused) v.pause(); },
      stop() { api.pause(); if (api.io) api.io.disconnect(); },
    };
    const toggle = () => { v.paused ? api.play() : api.pause(); };
    $('.kpv-play', box).onclick = toggle; v.onclick = toggle;
    $('.kpv-snd', box).onclick = e => { e.stopPropagation(); Sound.toggle(); if (v.paused) api.play(); };
    $('.kpv-bar', box).onclick = e => { const r = e.currentTarget.getBoundingClientRect(); v.currentTime = a + Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * len(); };
    v.addEventListener('play', () => { box.classList.add('playing'); KPV.stopOthers(v); if (typeof Notes !== 'undefined') Notes.seen(box.dataset.clip, v); });
    $('.kpv-bigb', box).onclick = e => { e.stopPropagation(); KPV.big(box); };
    $('.kpv-noteb', box).onclick = e => { e.stopPropagation(); if (typeof Notes !== 'undefined') { Notes.seen(box.dataset.clip, v); Notes.open(undefined, { tab: 'mine' }); } };
    v.addEventListener('pause', () => box.classList.remove('playing'));
    v.addEventListener('timeupdate', () => {
      const p = Math.max(0, Math.min(1, (v.currentTime - a) / len())); bar.style.width = (p * 100) + '%';
      if (p >= .9) markSeen();
      if (b && v.currentTime >= b) { v.pause(); markSeen(); if (opts.onEnd) opts.onEnd(api); }
    });
    v.addEventListener('ended', () => { markSeen(); box.classList.remove('playing'); if (opts.onEnd) opts.onEnd(api); });
    v.addEventListener('loadedmetadata', () => { const w = v.videoWidth > v.videoHeight; box.classList.toggle('wide', w); if (box.parentElement) box.parentElement.classList.toggle('wide', w); if (a && v.currentTime < a) v.currentTime = a; });
    if (opts.auto && 'IntersectionObserver' in window) {
      api.io = new IntersectionObserver(es => es.forEach(en => { if (en.intersectionRatio >= .6) { opts.restart = !!opts.feed; api.play(); } else api.pause(); }), { threshold: [0, .6, 1] });
      api.io.observe(box);
    }
    box._api = api; if (typeof Notes !== 'undefined') Notes.claim(box, api); return api;
  },
  /* 放大：整個畫面都是影片，但筆記欄還留在旁邊（所以全螢幕的是整頁，不是影片本身） */
  big(box, force) {
    const on = force != null ? force : !box.classList.contains('big');
    $$('.kpv.big').forEach(b => { b.classList.remove('big'); const x = $('.kpv-bigb', b); if (x) x.textContent = '放大'; });
    document.body.classList.toggle('video-big', on);
    if (on) { box.classList.add('big'); $('.kpv-bigb', box).textContent = '縮小'; const r = document.documentElement; if (r.requestFullscreen && !document.fullscreenElement) r.requestFullscreen().catch(() => { }); }
    else if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
  },
  wire(root) { $$('.kpv', root).forEach(box => KPV._box(box)); },
  mount(host, clip, opts = {}) {
    const tmp = document.createElement('div'); tmp.innerHTML = KPV.html(clip, opts.a, opts.b, opts.feed ? 'feed' : '');
    const box = tmp.firstElementChild; if (!box) return null; host.appendChild(box); return KPV._box(box, opts);
  },
  stopOthers(keep) { $$('video').forEach(x => { if (x !== keep && !x.paused) x.pause(); }); },
  stopAll() { $$('.kpv video').forEach(x => { try { x.pause(); } catch (e) { } }); },
};

document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) $$('.kpv.big').forEach(b => KPV.big(b, false)); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('.kpv.big')) KPV.big($('.kpv.big'), false); });

const KP = (() => {
  const G = DATA.kp || { order: [], nodes: {}, vids: {} };
  const N = G.nodes || {}, ORDER = G.order || [], POS = {};
  ORDER.forEach((k, i) => { POS[k] = i; });
  const QOF = {}, DIFF = {};   // 載入時 S.st 還沒好，不能碰 QBANK：直接用 DATA.quiz
  for (const q of DATA.quiz || []) { DIFF[q.id] = q.diff || 2; if (q.kp && N[q.kp]) (QOF[q.kp] = QOF[q.kp] || []).push(q.id); }
  for (const k in QOF) QOF[k].sort((x, y) => DIFF[x] - DIFF[y] || (x < y ? -1 : 1));
  const INTER = { mc: 1, fill: 1, write: 1, order: 1, lab: 1 };
  const STAGES = [{ k: 'teach', t: '教' }, { k: 'ex', t: '例' }, { k: 'prac', t: '練' }];
  const SHORT = { ds: '資結', al: '演算法', co: '計組', os: 'OS', dm: '離散', la: '線代', en: '英文' };

  /* ---------- 狀態 ---------- */
  const all = () => S.st.kp || (S.st.kp = {});
  const peek = k => all()[k] || null;
  const st = k => { const s = all()[k] || (all()[k] = { i: 1, stage: 'teach' }); s.res = s.res || {}; s.ew = s.ew || {}; s.att = s.att || []; s.ex = s.ex || 0; s.es = s.es || 0; s.i = s.i || 1; return s; };
  const learned = k => !!(peek(k) && peek(k).done);
  const M = () => ORDER.filter(learned);
  const canStart = k => !!N[k] && (N[k].pre || []).every(learned);
  const current = () => ORDER.find(k => !learned(k)) || null;
  const next = k => ORDER.slice((POS[k] ?? -1) + 1).find(x => !learned(x)) || null;
  const href = k => '#k/' + encodeURIComponent(k);
  const title = k => (N[k] || {}).title || k;
  const shortT = k => title(k).split(/[：（(]/)[0];
  const qs = k => (QOF[k] || []).filter(id => QBANK.get(id));
  function log(k, type, ok, extra) { const L = S.day(); (L.kp = L.kp || []).push(Object.assign({ t: Date.now(), k, type, ok: ok == null ? null : !!ok }, extra || {})); }
  function prog(k) { const a = (peek(k) || {}).att || [], last = a.slice(-5); return { n: a.length, ok: last.filter(x => x.ok).length, m: last.length, acc: last.length ? last.filter(x => x.ok).length / last.length : 0 }; }
  /* H13：做過 ≥3 題（題目不到 3 題就全部）且最近 5 題答對率 ≥ 60% */
  function mastered(k) { const n = qs(k).length; if (!n) return true; const p = prog(k); return p.n >= Math.min(3, n) && p.acc >= .6; }
  function stageOf(k) { const s = peek(k); return !s ? 'teach' : s.done ? 'done' : (s.stage || 'teach'); }
  function stageLabel(k) {
    const s = peek(k), sg = stageOf(k), n = N[k] || {};
    if (sg === 'done') return '學會了';
    if (sg === 'teach') return `教 ${Math.min((s || {}).i || 0, (n.items || []).length)}/${(n.items || []).length}`;
    if (sg === 'ex') return `例題 ${((s || {}).ex || 0) + 1}/${(n.examples || []).length}`;
    const p = prog(k); return `練習 ${p.n} 題`;
  }
  function learnedOn(date) { const L = S.st.log[date]; return ((L && L.kpDone) || []).filter(k => N[k]); }
  /* 今天要上的知識點：今天已經上完的 ＋ 從目前進度往後，塞到「每日時數 × 60%」為止（其餘時間給回想、卡片、複習、練習） */
  function todayList() {
    const budget = Math.round((S.st.settings.dailyMinutes || 360) * .6), done = learnedOn(D.today());
    let t = done.reduce((a, k) => a + ((N[k] || {}).mins || 30), 0); const out = [...done];
    for (const k of ORDER) {
      if (learned(k) || out.includes(k)) continue;
      const m = N[k].mins || 30;
      if (out.length > done.length && t + m > budget) break;
      if (!out.length && t + m > budget && done.length) break;
      out.push(k); t += m;
    }
    return out;
  }

  /* ---------- 手寫板（整頁共用一塊；寬螢幕在右欄、一直打開，手機放在目前這一題下面） ----------
     I11 筆跡對準：畫布內部大小＝畫布自己的內容區（不含外框內距），指標座標再依實際顯示大小換算；
     筆跡存成座標清單，換大小、收起再打開時重畫，不會偏也不會糊。 */
  const PCOL = { ink: '', blue: '#2f5bd3', red: '#c8323a' };
  const Pad = {
    el: null, cv: null, g: null, ta: null, mode: 'ink', userMode: null, dirty: false, tool: 'pen', col: 'ink', strokes: [], cur: null, user: null, full: false, _key: '',
    make() {
      const box = h('div', { class: 'kp-padbox', id: 'kpPadBox' });
      const tb = (pt, ic, t, on) => `<button type="button" class="kp-tb${on ? ' on' : ''}" data-pt="${pt}" aria-label="${t}" title="${t}">${ICON(ic)}</button>`;
      box.innerHTML = `<div class="kp-pad-h">
        <span class="kp-tools"><span class="kp-cols" role="group" aria-label="筆的顏色">${Object.keys(PCOL).map(c => `<button type="button" class="kp-col c-${c}${c === 'ink' ? ' on' : ''}" data-pc="${c}" aria-label="${{ ink: '黑', blue: '藍', red: '紅' }[c]}筆" title="${{ ink: '黑', blue: '藍', red: '紅' }[c]}筆"></button>`).join('')}</span>${tb('eraser', 'eraser', '橡皮擦')}${tb('undo', 'undo', '復原')}${tb('clear', 'trash', '清除')}</span>
        <button type="button" class="chip kp-code-clr" data-pm-clear title="清空打字框">清空</button>
        <span class="kp-pad-r">${tb('full', 'expand', '放大').replace('class="kp-tb"', 'class="kp-tb kp-full-b"')}<button type="button" class="kp-pad-t" data-pt="toggle" aria-expanded="true"><b>${ICON('pen')} 手寫板</b><span class="kp-pad-st">收起</span></button></span></div>
        <div class="kp-pad-wrap"><canvas class="kp-pad" aria-label="手寫板：用滑鼠、觸控筆或手指寫"></canvas><textarea class="kp-code" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="打字框：寫程式或筆記" placeholder="在這裡打程式、虛擬碼或筆記&#10;Tab 縮排、Shift+Tab 退縮排、Enter 自動對齊、Ctrl+Enter 對答案"></textarea></div>
        <div class="kp-pad-f"><span class="kp-mode" role="group" aria-label="作答方式"><button type="button" class="chip on" data-pm="ink" aria-pressed="true" title="用滑鼠、觸控筆或手指寫">手寫</button><button type="button" class="chip" data-pm="code" aria-pressed="false" title="用鍵盤打字：寫程式、虛擬碼或筆記">打字</button></span><label class="kp-paper"><input type="checkbox" id="kpPaper"> 我寫在紙上</label></div>`;
      this.el = box; const cv = this.cv = $('canvas', box); this.g = cv.getContext('2d'); this.dirty = false; this.strokes = [];
      const pos = e => { const r = cv.getBoundingClientRect(), bl = cv.clientLeft, bt = cv.clientTop, sx = cv.clientWidth / Math.max(1, r.width - 2 * bl), sy = cv.clientHeight / Math.max(1, r.height - 2 * bt); return [(e.clientX - r.left - bl) * sx, (e.clientY - r.top - bt) * sy]; };
      let penSeen = false;
      cv.addEventListener('pointerdown', e => {
        if (e.pointerType === 'pen') penSeen = true; else if (penSeen && e.pointerType === 'touch') return;   // 用觸控筆時，手掌碰到不算
        if (!cv._w) this.size();
        const p = pos(e); this.cur = { t: this.tool, c: this.col, w: this.width(e), p: [p] };
        cv.setPointerCapture(e.pointerId); this.dot(this.cur); e.preventDefault();
      });
      cv.addEventListener('pointermove', e => {
        const c = this.cur; if (!c) return;
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        for (const ev of (evs.length ? evs : [e])) { const p = pos(ev), q = c.p[c.p.length - 1]; c.p.push(p); this.seg(c, q, p); }
        if (c.t === 'pen' && !this.dirty) { this.dirty = true; View.sync(); }   // 這一步有新的筆跡
        e.preventDefault();
      });
      const end = () => { const c = this.cur; if (!c) return; this.cur = null; this.strokes.push(c); if (c.t === 'pen' && !this.dirty) { this.dirty = true; View.sync(); } };
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
      $$('[data-pt]', box).forEach(b => b.onclick = () => {
        const t = b.dataset.pt;
        if (t === 'clear') { this.clear(); return; }
        if (t === 'undo') { this.strokes.pop(); this.base = Math.min(this.base || 0, this.strokes.length); this.redraw(); this.dirty = this.strokes.slice(this.base || 0).some(x => x.t === 'pen'); View.sync(); return; }
        if (t === 'toggle') { this.user = this.el.classList.contains('kp-pad-quiet'); View.placePad(); return; }
        if (t === 'full') { this.setFull(!this.full); return; }
        this.tool = t === 'eraser' && this.tool === 'eraser' ? 'pen' : t;   // 再按一次橡皮擦＝回到筆
        $$('[data-pt="eraser"]', box).forEach(x => x.classList.toggle('on', this.tool === 'eraser')); $$('[data-pc]', box).forEach(x => x.classList.toggle('on', this.tool === 'pen' && x.dataset.pc === this.col));
      });
      $$('[data-pc]', box).forEach(b => b.onclick = () => { this.col = b.dataset.pc; this.tool = 'pen'; $$('[data-pc]', box).forEach(x => x.classList.toggle('on', x === b)); $$('[data-pt="eraser"]', box).forEach(x => x.classList.remove('on')); });
      $('#kpPaper', box).onchange = () => View.sync();
      $$('[data-pm]', box).forEach(b => b.onclick = () => { this.setMode(b.dataset.pm, true); try { localStorage.setItem('kp.padMode', b.dataset.pm); } catch (e) { } });
      this.wireCode($('.kp-code', box));
      $('[data-pm-clear]', box).onclick = () => { const ta = this.ta; ta.focus(); ta.select(); if (!document.execCommand || !document.execCommand('delete')) ta.value = ''; this.codeBase = ''; this._typed = false; View.sync(); };   // 用編輯指令清，按 Ctrl+Z 救得回來
      if ('ResizeObserver' in window) new ResizeObserver(() => this.size()).observe(cv);
      addEventListener('keydown', e => { if (e.key === 'Escape' && this.full) this.setFull(false); });
      return box;
    },
    /* 打字框：寫程式用（Tab 縮排、Enter 自動對齊、打 } 自動退一層、Ctrl+Enter＝主按鈕） */
    wireCode(ta) {
      this.ta = ta; const IND = '    ';
      const ins = t => { ta.focus(); if (!document.execCommand || !document.execCommand('insertText', false, t)) ta.setRangeText(t, ta.selectionStart, ta.selectionEnd, 'end'); };
      const lineStart = i => ta.value.lastIndexOf('\n', i - 1) + 1;
      ta.addEventListener('keydown', e => {
        if (e.isComposing) return;
        const v = ta.value, a = ta.selectionStart, z = ta.selectionEnd;
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); const b = $('#kpGo'); if (b && !b.disabled) b.click(); return; }
        if (e.key === 'Tab') {
          e.preventDefault();
          const ls = lineStart(a), multi = v.slice(a, z).includes('\n');
          if (!multi && !e.shiftKey) { ins(IND); return; }
          const le = z > a && v[z - 1] === '\n' ? z - 1 : z, block = v.slice(ls, le);
          const out = e.shiftKey ? block.replace(/^( {1,4}|\t)/gm, '') : block.replace(/^/gm, IND);
          ta.setSelectionRange(ls, le); ins(out); ta.setSelectionRange(ls, ls + out.length); return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const ls = lineStart(a), cur = v.slice(ls, a), lead = (cur.match(/^[ \t]*/) || [''])[0];
          const open = /[{(\[:]\s*$/.test(cur), close = /^\s*[}\])]/.test(v.slice(z));
          if (open && close) { ins('\n' + lead + IND + '\n' + lead); const p = ta.selectionStart - 1 - lead.length; ta.setSelectionRange(p, p); return; }
          ins('\n' + lead + (open ? IND : '')); return;
        }
        if (e.key === '}' && a === z) {
          const ls = lineStart(a), cur = v.slice(ls, a);
          if (/^ +$/.test(cur) && cur.length >= 4) { e.preventDefault(); ta.setSelectionRange(a - 4, a); ins('}'); }
        }
      });
      ta.addEventListener('input', () => { const t = this.typed(); if (t !== this._typed) { this._typed = t; View.sync(); } });
    },
    setMode(m, user) {
      if (!this.el) return; this.mode = m === 'code' ? 'code' : 'ink'; if (user) this.userMode = this.mode;
      const on = this.mode === 'code'; this.el.classList.toggle('kp-code-on', on);
      $$('[data-pm]', this.el).forEach(b => { const x = b.dataset.pm === this.mode; b.classList.toggle('on', x); b.setAttribute('aria-pressed', x ? 'true' : 'false'); });
      const t = $('.kp-pad-t b', this.el); if (t) t.innerHTML = `${ICON('pen')} ${on ? '打字框' : '手寫板'}`;
      if (on && this.full) this.setFull(false);
      requestAnimationFrame(() => this.size());
      if (on && user) this.ta.focus();
      View.sync();
    },
    /* 打字框跟紙一樣：換下一步不會清掉，推導可以一路往下寫；「這一步寫了什麼」＝上次對答案之後新打的部分 */
    codeBase: '',
    typed() { return !!(this.ta && this.ta.value.trim() && this.ta.value !== this.codeBase); },
    take() {
      if (!this.ta) return ''; const v = this.ta.value, b = this.codeBase;
      const d = (b && v.startsWith(b) ? v.slice(b.length) : v).replace(/^\s*\n/, '').replace(/\s+$/, '');
      return d.trim() ? d.slice(0, 8000) : '';
    },
    clearCode() { if (this.ta) { this.ta.value = ''; this.codeBase = ''; this._typed = false; } },
    width(e) { return this.tool === 'eraser' ? 22 : (e.pointerType === 'pen' && e.pressure ? 1.4 + e.pressure * 3.2 : 2.8); },
    ink(c) { return c.t === 'eraser' ? '#000' : (PCOL[c.c] || getComputedStyle(this.cv).color || '#18202c'); },
    style(c) { const g = this.g; g.globalCompositeOperation = c.t === 'eraser' ? 'destination-out' : 'source-over'; g.strokeStyle = g.fillStyle = this.ink(c); g.lineWidth = c.w; g.lineCap = 'round'; g.lineJoin = 'round'; },
    dot(c) { const g = this.g, [x, y] = c.p[0]; this.style(c); g.beginPath(); g.arc(x, y, c.w / 2, 0, Math.PI * 2); g.fill(); },
    seg(c, a, b) { const g = this.g; this.style(c); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); },
    redraw() {
      const g = this.g, cv = this.cv; if (!g) return;
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.restore();
      for (const c of this.strokes) { this.dot(c); for (let i = 1; i < c.p.length; i++) this.seg(c, c.p[i - 1], c.p[i]); }
      g.globalCompositeOperation = 'source-over';
    },
    /* I13：手機 ≥ 300px、寬螢幕 ≥ 420px；放大時佔大半個畫面 */
    target() { const wide = View.wide(); return this.full ? Math.round(innerHeight * (wide ? .7 : .6)) : wide ? Math.round(Math.max(420, Math.min(640, innerHeight - 320))) : Math.round(Math.max(300, Math.min(420, innerHeight * .4))); },
    size() {
      if (this.ta && this.mode === 'code' && this.ta.isConnected && this.ta.offsetParent) { const hh = this.target(); if (this.ta._css !== hh) { this.ta.style.height = hh + 'px'; this.ta._css = hh; } }
      const cv = this.cv; if (!cv || !cv.isConnected || !cv.offsetParent) return;   // 收起時不量（量到的是 0）
      const hh = this.target(); if (cv._css !== hh) { cv.style.height = hh + 'px'; cv._css = hh; }
      const w = cv.clientWidth, ch = cv.clientHeight, dpr = window.devicePixelRatio || 1; if (!w || !ch) return;
      if (cv._w === w && cv._h === ch && cv._dpr === dpr) return;
      const sc = cv._w ? w / cv._w : 1;   // 換寬度時，筆跡跟著等比例縮放
      if (sc !== 1) this.strokes.forEach(c => { c.w *= sc > 1 ? 1 : sc; c.p.forEach(p => { p[0] *= sc; p[1] *= sc; }); });
      cv.width = Math.round(w * dpr); cv.height = Math.round(ch * dpr); cv._w = w; cv._h = ch; cv._dpr = dpr;
      this.g = cv.getContext('2d'); this.g.setTransform(cv.width / w, 0, 0, cv.height / ch, 0, 0);
      this.redraw();
    },
    setFull(on) {
      this.full = !!on; this.el.classList.toggle('kp-pad-full', this.full); document.body.classList.toggle('kp-padfull-on', this.full);
      const b = $('.kp-full-b', this.el); if (b) { b.innerHTML = ICON(this.full ? 'shrink' : 'expand'); b.title = this.full ? '縮小' : '放大'; b.setAttribute('aria-label', b.title); }
      if (this.full) this.el.classList.remove('kp-pad-quiet');
      requestAnimationFrame(() => this.size());
    },
    clear() { this.strokes = []; this.cur = null; this.base = 0; this.redraw(); this.dirty = false; View.sync(); },
    /* 要「這一步」寫了新的東西才算寫好（之前步驟留下的筆跡不算） */
    ready() { return this.dirty || this.typed() || !!(this.el && $('#kpPaper', this.el).checked); },
    resetPaper() { if (this.el) $('#kpPaper', this.el).checked = false; this.base = this.strokes.length; this.dirty = false; if (this.ta) { this.codeBase = this.ta.value; this._typed = false; } },
  };

  /* ---------- 互動題 ---------- */
  const shuffleIdx = (n, seed) => rng(seed).shuffle([...Array(n).keys()]);
  const seedOf = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  /* 提示裡的術語：LaTeX 寫法（\cap、K_n…）排成數學符號，不要露出原始碼；「O(」這種只寫一半的補成 O(…) */
  const TERM_FIX = { '\\binom': '\\binom{n}{k}', '\\pmod': 'a\\equiv b\\pmod m', 'T(\\sqrt': 'T(\\sqrt n)' };
  const termTxt = x => { if (TERM_FIX[x]) return '$' + TERM_FIX[x] + '$'; const t = String(x).replace(/([(\[])$/, (m, b) => b === '(' ? '(\\dots)' : '[\\dots]'); return /[\\^_{}]/.test(x) || /^[A-Za-z]\($/.test(x) ? '$' + t + '$' : '「' + t.replace(/\\dots/, '…') + '」'; };
  const mineHtml = c => c ? `<div class="kp-mine"><div class="muted small">你寫的</div><pre class="kp-mine-code">${esc(c)}</pre></div>` : '';
  /* 這一步是不是要寫程式：題目說「寫出程式／寫一段…」，或參考答案本身是程式碼（```、或行內程式有 ; { }） */
  const CODE_RE = { test: t => /```|寫出程式|寫程式|寫成程式|寫一段|程式碼|虛擬碼|pseudo ?code|寫一個函式|寫出函式/i.test(t) || /`[^`\n]*[;{}][^`\n]*`/.test(t) };
  const fbHtml = (kind, head, body) => `<div class="kp-fb ${kind}"><b>${head}</b>${body ? `<div class="prose">${md(body)}</div>` : ''}</div>`;

  function interHtml(k, x, idx, r, active, ui) {
    const done = r && r.done, tag = { mc: '選一選', fill: '填一填', write: '寫一寫', order: '排一排', lab: '玩一玩' }[x.t] || '想一想';
    let body = '';
    if (x.t === 'mc') {
      const multi = (x.ans || []).length > 1;
      body = `<div class="kp-opts ${multi ? 'multi' : ''}" role="${multi ? 'group' : 'radiogroup'}">${x.opts.map((o, j) => {
        const sel = active ? (ui.sel || []).includes(j) : (r && (r.last || []).includes(j));
        const cls = done ? (x.ans.includes(j) ? ' right' : (r.last || []).includes(j) ? ' wrong' : '') : (r && r.wrongSel && r.wrongSel.includes(j) ? ' wrong' : '');
        return `<button type="button" class="kp-opt${sel ? ' on' : ''}${cls}" data-j="${j}" ${done ? 'disabled' : ''} role="${multi ? 'checkbox' : 'radio'}" aria-checked="${sel ? 'true' : 'false'}"><span class="kp-opt-k">${'ABCDEFGH'[j]}</span><span class="kp-opt-t">${mdLine(o)}</span></button>`;
      }).join('')}</div>${multi ? '<p class="muted small">可以選不只一個</p>' : ''}`;
    } else if (x.t === 'fill') {
      body = `<input class="kp-fill" type="text" autocomplete="off" spellcheck="false" placeholder="${esc(fillHint({ ans: x.ans }))}" value="${esc(active ? (ui.text || '') : (r && r.lastText) || '')}" ${done ? 'disabled' : ''}>`;
    } else if (x.t === 'order') {
      const ord = shuffleIdx(x.items.length, seedOf(k + idx)), picked = active ? (ui.seq || []) : (done ? x.items.map((_, j) => j) : []);
      body = `<div class="kp-seq">${picked.map((j, n) => `<span class="kp-seq-i"><b>${n + 1}</b>${mdLine(x.items[j])}</span>`).join('') || '<span class="muted small">依序點下面的項目</span>'}</div>
        ${done ? '' : `<div class="kp-pool">${ord.filter(j => !picked.includes(j)).map(j => `<button type="button" class="kp-pool-i" data-j="${j}">${mdLine(x.items[j])}</button>`).join('')}</div>${picked.length ? '<button type="button" class="chip kp-seq-reset">重排</button>' : ''}`}`;
    } else if (x.t === 'write') {
      body = done ? `${mineHtml(r && r.code)}<div class="kp-model"><div class="muted small">參考答案</div><div class="prose">${md((x.ans || []).join('\n'))}</div></div>`
        : `<p class="kp-do">${ICON('pen')} 先在手寫板、打字框（或紙上）寫出來，寫好再按下面的按鈕對答案。</p>`;
    }
    let fb = '';
    if (r && r.done) fb = r.ok ? fbHtml('good', '答對了', x.why) : x.t === 'write' ? (r.self ? fbHtml(r.self === 'ok' ? 'good' : 'bad', r.self === 'ok' ? '寫對了' : '記下來：這裡還不熟', x.why) : '') : fbHtml('bad', `正解：${x.t === 'mc' ? x.ans.map(j => 'ABCDEFGH'[j]).join('、') : x.t === 'fill' ? x.ans[0] : '如上'}`, x.why);
    else if (r && r.n === 1) fb = fbHtml('hint', '還不對，再試一次', x.hint ? '提示：' + x.hint : '回頭看上面那一段，找出跟你想的不一樣的地方。');
    const selfBtns = x.t === 'write' && done && !r.self ? `<div class="row kp-self"><span class="muted small">跟參考答案比，你寫的：</span><button type="button" class="btn sm" data-self="ok">寫對了</button><button type="button" class="btn sm" data-self="no">有錯／寫不出來</button></div>` : '';
    const st8 = done ? (r.ok || r.self === 'ok' ? ' is-ok' : (r.ok === false || r.self === 'no') ? ' is-no' : '') : (r && r.n === 1 ? ' is-try' : '');
    return `<div class="kp-blk kp-q${active ? ' kp-active' : ''}${done ? ' done' : ''}${st8}" data-idx="${idx}"><div class="kp-q-tag">${tag}</div><div class="kp-q-stem prose">${md(x.stem || '')}</div>${body}${fb}${selfBtns}</div>`;
  }

  /* ---------- 頁面 ---------- */
  const View = {
    k: null, ui: {},
    render(k) {
      const n = N[k], m = main();
      if (!n) { m.innerHTML = `<header class="page-head"><h1>找不到這個知識點</h1></header><p><a href="#map">回課程地圖</a></p>`; return; }
      this.k = k; this.ui = {};
      const locked = !learned(k) && !canStart(k);
      if (!locked && !peek(k)) { st(k).started = D.today(); S.save(); }
      const sj = SHORT[n.subject] || '', pos = POS[k] + 1;
      m.innerHTML = `<article class="kp" data-k="${esc(k)}">
        <header class="kp-head">
          <div class="kp-bar"><a class="kp-back" href="#map">${ICON('back')}<span>課程地圖</span></a><span class="kp-crumb">${sj ? `<span>${sj}</span>` : ''}<span>第 ${pos}/${ORDER.length} 個知識點</span><span>約 ${n.mins} 分鐘</span></span>
            <span class="kp-bar-r"><button type="button" class="kp-hb" id="kpPadOpen" hidden>${ICON('pen')}<span>手寫板</span></button>${n.notes ? `<button type="button" class="kp-hb" id="kpNotesBtn" aria-expanded="false" aria-controls="kpDrawer">${ICON('notes')}<span>考試筆記</span></button>` : ''}</span></div>
          <h1>${mdLine(n.title)}</h1>
          ${n.goal ? `<p class="kp-goal">學完你要能：${mdLine(n.goal)}</p>` : ''}
          <ol class="kp-steps" id="kpSteps"></ol>
        </header>
        <div class="kp-grid"><div class="kp-main"><div id="kpStream" aria-live="polite"></div>
          <div class="kp-foot" id="kpFoot"><span class="kp-foot-l" id="kpFootL"></span><button type="button" class="btn primary kp-gobtn" id="kpGo"></button></div></div>
          <aside class="kp-side" id="kpSide"></aside></div>
        ${n.notes ? `<div class="kp-drawer" id="kpDrawer" hidden><div class="kp-drawer-in" role="dialog" aria-label="考試筆記"><div class="kp-drawer-h"><b>考試筆記</b><span class="muted small">這一節的完整重點</span><button type="button" class="kp-hb" id="kpDrawerX" aria-label="關閉">${ICON('close')}</button></div><div class="kp-drawer-b prose">${md(n.notes)}</div></div></div>` : ''}
      </article>`;
      { const dr = $('#kpDrawer'), nb = $('#kpNotesBtn'); if (dr && nb) { const set = on => { dr.hidden = !on; nb.setAttribute('aria-expanded', on ? 'true' : 'false'); document.body.classList.toggle('kp-drawer-on', on); }; nb.onclick = () => set(dr.hidden); $('#kpDrawerX').onclick = () => set(false); dr.onclick = e => { if (e.target === dr) set(false); }; if (!this._esc) { this._esc = e => { if (e.key === 'Escape') { const d = $('#kpDrawer'); if (d && !d.hidden) { d.hidden = true; document.body.classList.remove('kp-drawer-on'); const b = $('#kpNotesBtn'); if (b) b.setAttribute('aria-expanded', 'false'); } } }; addEventListener('keydown', this._esc); } } document.body.classList.remove('kp-drawer-on'); }
      { const po = $('#kpPadOpen'); if (po) po.onclick = () => { Pad.user = true; this.placePad(); const a = $('.kp-active', $('#kpStream')); if (Pad.el) Pad.el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }; }
      if (!Pad.el) Pad.make();
      Pad.resetPaper(); if (Pad.cv) Pad.clear(); Pad.clearCode();
      $('#kpGo').onclick = () => this.go();
      if (!this._key) { this._key = e => { if (e.key !== 'Enter' || !this.k || !$('#kpGo')) return; const t = e.target; if (t && (t.tagName === 'TEXTAREA' || (t.tagName === 'BUTTON' && t.id !== 'kpGo' && !t.closest('.kp-opt, .kp-pool-i')))) return;   /* I10：選項選好直接 Enter＝主按鈕 */ e.preventDefault(); const b = $('#kpGo'); if (b && !b.disabled) b.click(); }; document.addEventListener('keydown', this._key); }
      if (!this._rs) { this._rs = () => { if (this.k && $('#kpStream')) { this.placePad(); } }; addEventListener('resize', debounce(this._rs, 150)); }
      // 字型、圖片載入後版面會長高：畫完 1.5 秒內版面一變，就再對準一次（要寫的那一步，手寫板一定要在畫面內）
      if (this._ro) this._ro.disconnect();
      if ('ResizeObserver' in window) { this._ro = new ResizeObserver(() => { if (this.k === k && this.settling()) this.reveal(true, true); }); this._ro.observe($('#kpStream')); if (Pad.el) this._ro.observe(Pad.el); }
      // 畫完 3 秒內，如果瀏覽器自己把畫面捲走（捲動錨定、字型載入），而學生還沒碰畫面，要寫的那一步就再對準一次（I7）
      if (!this._mv) { this._mv = () => { this._userMoved = true; }; ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, this._mv, { passive: true, capture: true })); addEventListener('scroll', () => { if (this.k && this.settling()) this.reveal(true, true); }, { passive: true }); }
      this._scroll = false; this.draw(); this._scroll = true;
      requestAnimationFrame(() => { if (this.k === k) this.reveal(true); });   // 回到做到一半的知識點：直接捲到目前這一步
    },
    wide() { return matchMedia('(min-width: 1180px)').matches; },
    settling() { return !this._userMoved && performance.now() < (this._until || 0); },
    /* 依目前狀態重畫教學串、步驟列、主按鈕 */
    draw() {
      const k = this.k, n = N[k], s = st(k), sg = stageOf(k), locked = !learned(k) && !canStart(k);
      const steps = $('#kpSteps'), si = STAGES.findIndex(x => x.k === sg);
      steps.innerHTML = STAGES.map((x, i) => `<li class="${sg === 'done' || i < si ? 'done' : i === si ? 'on' : ''}"><span class="kp-st-n">${sg === 'done' || i < si ? '✓' : i + 1}</span>${x.t}${i === si ? `<small>${stageLabel(k).replace(/^\S+\s/, '')}</small>` : ''}</li>`).join('');
      const out = [];
      if (locked) {
        const miss = (n.pre || []).filter(p => !learned(p));
        out.push(`<div class="kp-blk kp-lock"><b>這個知識點要先學會：</b><ul>${miss.map(p => `<li><a href="${href(p)}">${mdLine(title(p))}</a></li>`).join('')}</ul><p class="muted small">照順序上，題目才不會用到你還沒學過的東西。</p></div>`);
      } else {
        const items = n.items && n.items.length ? n.items : [{ t: 'md', text: '這個知識點的白話講解還在寫。先讀右邊（手機在下面）的「考試筆記」，再做例題和練習。' }];
        const upto = sg === 'teach' ? Math.min(s.i, items.length) : items.length;
        out.push(`<section class="kp-sec" data-sec="teach">`);
        if (sg === 'teach') {
          // U5：只展開「目前這一步＋前一段閱讀」；上一個已作答的題目（含）以前收成一行
          let cut = -1;
          for (let i = 0; i < upto - 1; i++) { const r = s.res[i]; if (INTER[items[i].t] && r && r.done) cut = i; }
          out.push(`<h2 class="kp-h2">教</h2>`);
          if (cut >= 0) out.push(this.pastHtml(items.slice(0, cut + 1).map((x, idx) => this.itemHtml(x, idx, false)), items.slice(0, cut + 1), '前面'));
          items.slice(cut + 1, upto).forEach((x, j) => { const idx = cut + 1 + j; out.push(this.itemHtml(x, idx, idx === upto - 1)); });
        } else out.push(this.pastHtml(items.map((x, idx) => this.itemHtml(x, idx, false)), items, '教'));
        out.push(`</section>`);
        if (sg !== 'teach') out.push(this.exHtml());
        if (sg === 'prac' || sg === 'done') out.push(this.pracHtml());
        if (sg === 'done') out.push(this.doneHtml());
      }
      $('#kpStream').innerHTML = out.join('');
      if (this._hit) { const b = $(this._hit.sel, $('#kpStream')); if (b) b.classList.add(this._hit.ok ? 'kp-hit-ok' : 'kp-hit-bad'); this._hit = null; }   // I14
      this.wireStream();
      KPV.wire($('#kpStream'));
      this.placePad();
      this.sync();
      this._until = performance.now() + 3000; this._userMoved = false;
      this.reveal();
    },
    pastHtml(parts, kinds, label) {
      const q = kinds.filter(x => x && INTER[x.t]).length, r = kinds.length - q;
      const sum = kinds.length && kinds[0] && kinds[0].steps ? `${kinds.length} 題` : [r ? `${r} 段講解` : '', q ? `${q} 題小測` : ''].filter(Boolean).join('、');
      return `<details class="kp-past"><summary><span class="kp-past-t">${label}</span><span class="kp-past-n">${sum}</span><span class="kp-past-o">回看${ICON('down')}</span></summary><div class="kp-past-b">${parts.join('')}</div></details>`;
    },
    itemHtml(x, idx, last) {
      const k = this.k, s = st(k), r = s.res[idx];
      if (x.t === 'md') return `<div class="kp-blk kp-read${last ? ' kp-active' : ''}"><div class="prose">${md(x.text)}</div></div>`;
      if (x.t === 'video') return `<div class="kp-blk kp-vid${last ? ' kp-active' : ''}">${KPV.html(x.clip, x.a, x.b) || '<p class="muted small">（影片檔不在這台電腦上）</p>'}</div>`;
      if (INTER[x.t]) return interHtml(k, x, idx, r, last && !(r && r.done && (x.t !== 'write' || r.self)), this.ui);
      return '';
    },
    exHtml() {
      const k = this.k, n = N[k], s = st(k), sg = stageOf(k), exs = n.examples || [];
      if (!exs.length) return '';
      const out = [`<section class="kp-sec" data-sec="ex">${sg === 'ex' ? '<h2 class="kp-h2">例：跟著做</h2>' : ''}`], blocks = [];
      const upto = sg === 'ex' ? s.ex : exs.length - 1;
      exs.slice(0, upto + 1).forEach((e, j) => {
        const out = [];
        const cur = sg === 'ex' && j === s.ex, shown = cur ? s.es : e.steps.length;
        out.push(`<div class="kp-blk kp-ex${cur ? '' : ' done'}"><div class="kp-q-tag">例題 ${j + 1}</div><div class="prose">${md(e.q)}</div><ol class="kp-steps-ex">`);
        e.steps.forEach((p, i) => {
          if (i > shown) return;
          const key = j + '.' + i, ew = s.ew[key];
          if (i < shown) {
            out.push(`<li class="kp-step done${p.w ? ' w' : ''}"><div class="kp-step-h">${p.w ? '你寫' : '第 ' + (i + 1) + ' 步'}：${mdLine(p.hint)}</div>${(s.excode || {})[key] ? mineHtml(s.excode[key]) + '<div class="muted small">參考答案</div>' : ''}<div class="prose">${md(p.sol)}</div>${p.w && cur && !ew ? `<div class="row kp-self"><span class="muted small">跟你寫的比：</span><button type="button" class="btn sm" data-ew="ok" data-ek="${key}">一樣</button><button type="button" class="btn sm" data-ew="no" data-ek="${key}">不一樣／沒寫出來</button></div>` : p.w && ew ? `<div class="kp-ew ${ew}">${ew === 'ok' ? '你寫對了' : '記下來：這一步還不熟'}</div>` : ''}</li>`);
          } else if (cur) {
            out.push(`<li class="kp-step kp-active${p.w ? ' w' : ''}"><div class="kp-step-h">${p.w ? `${ICON('pen')} 換你寫` : '想一想'}：${mdLine(p.hint)}</div>${!p.w ? '<div class="row kp-see"><span class="muted small">想好了嗎？</span><button type="button" class="btn sm" data-see>看答案</button></div>' : ''}${p.w ? (CODE_RE.test(p.hint + ' ' + (p.sol || '')) ? '<p class="kp-do">直接在打字框寫程式（Tab 縮排、Enter 自動對齊），寫好按 Ctrl+Enter 或下面的按鈕對答案。</p>' : '<p class="kp-do">寫在手寫板、打字框或紙上，寫好再對答案。</p>') : ''}</li>`);
          }
        });
        out.push(`</ol>`);
        if (shown >= e.steps.length && e.ans) out.push(`<div class="kp-ans"><span>答案</span><div class="prose">${md(e.ans)}</div></div>`);
        out.push(`</div>`);
        blocks.push([j, out.join('')]);
      });
      const past = blocks.filter(([j]) => sg !== 'ex' || j < s.ex);
      if (past.length) out.push(this.pastHtml(past.map(b => b[1]), past.map(([j]) => exs[j]), sg === 'ex' ? '前面的例題' : '例'));
      blocks.filter(([j]) => sg === 'ex' && j === s.ex).forEach(b => out.push(b[1]));
      out.push(`</section>`);
      return out.join('');
    },
    pracHtml() {
      const k = this.k, s = st(k), sg = stageOf(k), list = qs(k);
      const out = [`<section class="kp-sec" data-sec="prac">${sg === 'prac' ? '<h2 class="kp-h2">練：自己做</h2>' : '<h2 class="kp-h2">練</h2>'}`];
      if (!list.length) { out.push(`<div class="kp-blk"><p class="muted">這個知識點的練習題還在補。</p></div></section>`); return out.join(''); }
      const p = prog(k);
      let streak = 0; for (let i = s.att.length - 1; i >= 0 && s.att[i].ok; i--) streak++;
      out.push(`<div class="kp-prog">${streak >= 2 ? `<span class="kp-streak">連對 <b>${streak}</b> 題</span>` : ''}<span>做過 <b>${p.n}</b> 題</span><span>最近 ${p.m} 題答對 <b>${p.ok}</b></span><span class="muted small">學會＝做過 ${Math.min(3, list.length)} 題以上、最近 5 題答對 60% 以上</span></div>`);
      if (s.att.length) out.push(`<div class="kp-hist">${s.att.slice(-12).map(a => `<span class="kp-hist-i ${a.ok ? 'ok' : 'no'}">${a.ok ? '✓' : '✗'}</span>`).join('')}</div>`);
      if (sg === 'prac') {
        const qid = (s.queue || [])[s.pq || 0];
        const q = qid && QBANK.get(qid);
        if (q) out.push(this.qHtml(q));
        if (q && s.need && (s.qdone || {})[q.id]) out.push(`<div class="kp-blk"><b>還差一點</b><p>最近 ${p.m} 題答對 ${p.ok} 題，還沒到 60%。按「再練一次錯的」，把剛剛錯的題目自己從頭想一遍。</p></div>`);
        else if (!q && s.need) out.push(`<div class="kp-blk kp-active"><b>還差一點</b><p>最近 ${p.m} 題答對 ${p.ok} 題。再做一次剛剛錯的題目（已經看過解答，這次自己從頭想一遍）。</p></div>`);
      }
      out.push(`</section>`);
      return out.join('');
    },
    qHtml(q) {
      const k = this.k, s = st(k), t = (s.tries || {})[q.id] || 0, done = !!(s.qdone || {})[q.id], ui = this.ui, lastSel = (s.qsel || {})[q.id] || [];
      let body = '';
      if (q.type === 'single' || q.type === 'multi') {
        body = `<div class="kp-opts ${q.type === 'multi' ? 'multi' : ''}">${q.opts.map((o, j) => {
          const sel = done ? lastSel.includes(j) : (ui.sel || []).includes(j);
          const cls = done ? (q.ans.includes(j) ? ' right' : lastSel.includes(j) ? ' wrong' : '') : ((s.qwrong || {})[q.id] || []).includes(j) ? ' wrong' : '';
          return `<button type="button" class="kp-opt${sel ? ' on' : ''}${cls}" data-j="${j}" ${done ? 'disabled' : ''}><span class="kp-opt-k">${'ABCDEFGH'[j]}</span><span class="kp-opt-t">${mdLine(o)}</span></button>`;
        }).join('')}</div>${q.type === 'multi' ? '<p class="muted small">可以選不只一個</p>' : ''}`;
      } else if (q.type === 'fill') {
        body = fillHtml(q, 'kp-fill', done ? ((s.qsel || {})[q.id] || '') : (ui.text || ''), done);
      } else {
        body = done ? mineHtml((s.qcode || {})[q.id]) : `<p class="kp-do">${ICON('pen')} 寫在手寫板、打字框或紙上，寫好再看詳解，自己對照。</p>`;
      }
      let fb = '';
      if (done) {
        const ok = (s.qok || {})[q.id];
        fb = q.type === 'essay' ? `<div class="kp-fb ${ok ? 'good' : 'bad'}"><b>${ok == null ? '詳解' : ok ? '寫對了' : '記下來：還不熟'}</b><div class="prose">${md(fmtExpl(q.expl || ''))}</div></div>`
          : `<div class="kp-fb ${ok ? 'good' : 'bad'}"><b>${ok ? '答對了' : '正解：' + esc(Practice.fmtAns(q))}</b>${q.expl ? `<div class="prose">${md(fmtExpl(q.expl))}</div>` : ''}</div>`;
      } else if (t === 1) {
        const req = (q.req || []).slice(0, 3);
        fb = fbHtml('hint', '還不對，再試一次', req.length ? `提示：這題用到 ${req.map(termTxt).join('、')}。回頭看「教」裡講到它的那一段。` : '回頭看「教」和「例」，找出跟你想的不一樣的地方。');
      }
      const selfBtns = q.type === 'essay' && done && (s.qok || {})[q.id] == null ? `<div class="row kp-self"><span class="muted small">跟詳解比，你寫的：</span><button type="button" class="btn sm" data-qself="ok">對了</button><button type="button" class="btn sm" data-qself="no">有錯</button></div>` : '';
      const stars = '★'.repeat(q.diff || 2);
      const qok = (s.qok || {})[q.id], st8 = done ? (qok ? ' is-ok' : qok === false ? ' is-no' : '') : (t === 1 ? ' is-try' : '');
      return `<div class="kp-blk kp-q kp-active${done ? ' done' : ''}${st8}" data-qid="${esc(q.id)}"><div class="kp-q-tag">第 ${(s.pq || 0) + 1}/${(s.queue || []).length} 題 <span class="kp-diff">${stars}</span></div><div class="kp-q-stem prose">${md(q.stem)}</div>${body}${fb}${selfBtns}</div>`;
    },
    doneHtml() {
      const k = this.k, nx = next(k), n = N[k];
      const chDone = n.ch && ORDER.filter(x => N[x].ch === n.ch).every(learned);
      return `<section class="kp-sec"><div class="kp-blk kp-done"><b>這個知識點學會了</b><p class="muted">${learned(k) ? '明天會先回想今天學的，再用卡片和題目幫你記住。' : ''}</p>${chDone ? `<p>「${esc(LESSON[n.ch] ? LESSON[n.ch].title : n.ch)}」整章都上完了，可以到<a href="#${n.ch}">章節頁</a>做費曼關卡（用自己的話講一遍）。</p>` : ''}${nx ? `<p class="muted small">下一個：${mdLine(title(nx))}</p>` : ''}</div></section>`;
    },
    /* 捲到目前這一步；要寫的時候，手寫板整塊都要在畫面內、不被底下的主按鈕擋住（I7） */
    reveal(instant, padOnly) {
      const act = $('.kp-active', $('#kpStream')); if (!act || (!this._scroll && !instant)) return;
      const foot = $('#kpFoot'), room = innerHeight - (foot ? foot.getBoundingClientRect().height : 0) - 8;
      const needPad = !this.wide() && Pad.el && Pad.el.isConnected && (act.classList.contains('w') || !!$('.kp-do', act));
      if (padOnly && !needPad) return;
      const r = act.getBoundingClientRect(), bot = needPad ? Pad.el.getBoundingClientRect().bottom : r.bottom;
      let dy = 0;
      if (bot > room) dy = bot - room;
      if (r.top - dy < 64 && !needPad) dy = r.top - 64;
      // 題目頂端被捲出去時往回捲一點，但要寫的時候手寫板底邊不能因此掉出畫面（I7）
      if (r.top < 64 && !dy) dy = needPad ? Math.min(0, Math.max(r.top - 64, bot - room)) : r.top - 64;
      if (Math.abs(dy) > 2) scrollBy({ top: dy, behavior: instant || needPad ? 'auto' : 'smooth' });   // 要寫的時候直接到位，不讓動畫被打斷
    },
    /* 目前這一步要不要寫程式：是的話打字框自動打開 */
    curCode() {
      const k = this.k, n = N[k], s = st(k), sg = stageOf(k);
      try {
        if (sg === 'teach') { const items = n.items || [], x = items[Math.min(s.i, items.length) - 1]; return !!(x && x.t === 'write' && CODE_RE.test((x.stem || '') + ' ' + (x.ans || []).join('\n'))); }
        if (sg === 'ex') { const e = (n.examples || [])[s.ex], p = e && e.steps[s.es]; return !!(p && p.w && CODE_RE.test(p.hint + ' ' + (p.sol || ''))); }
        if (sg === 'prac') { const q = QBANK.get((s.queue || [])[s.pq || 0]); return !!(q && q.type === 'essay' && !(s.qdone || {})[q.id] && CODE_RE.test((q.stem || '') + ' ' + (q.expl || ''))); }
      } catch (e) { }
      return false;
    },
    placePad() {
      const k = this.k; if (!Pad.el || !$('#kpStream')) return;
      const locked = !learned(k) && !canStart(k);
      if (locked) { if (Pad.full) Pad.setFull(false); Pad.el.remove(); return; }
      const act = $('.kp-active', $('#kpStream'));
      // I12：目前這一步是任何還沒作答的題目（選、填、排、寫、例題步驟、練習題），手寫板就打開
      const ask = !!(act && (act.classList.contains('w') || $('.kp-do', act) || act.classList.contains('kp-step') || (act.classList.contains('kp-q') && !act.classList.contains('done'))));
      const key = k + '|' + (act ? (act.dataset.idx || act.dataset.qid || '') + '|' + act.className.replace(/\s+kp-hit-\w+/g, '') : '');
      if (key !== Pad._key) { Pad._key = key; Pad.user = null; }
      const s0 = st(k), mkey = key + '|' + stageOf(k) + '|' + [s0.i, s0.ex, s0.es, s0.pq].join('.');   // 每一步各自決定手寫或打字
      if (mkey !== Pad._mkey) { Pad._mkey = mkey; Pad.userMode = null; let pref = 'ink'; try { pref = localStorage.getItem('kp.padMode') || 'ink'; } catch (e) { } Pad.setMode(this.curCode() ? 'code' : pref); }
      const wide = this.wide();
      if (wide) { const side = $('#kpSide'); if (side && Pad.el.parentElement !== side) side.insertBefore(Pad.el, side.firstChild); }
      else { const at = act || $('#kpStream').lastElementChild; if (at && at.nextElementSibling !== Pad.el) at.after(Pad.el); }
      const open = Pad.full || (Pad.user != null ? Pad.user : (wide || ask));
      // U6：手機純閱讀（沒有要作答）時整塊不掛，標題列有「手寫板」可以自己叫出來
      const off = !wide && !ask && !open;
      Pad.el.classList.toggle('kp-pad-quiet', !open);
      Pad.el.classList.toggle('kp-pad-off', off);
      const po = $('#kpPadOpen'); if (po) po.hidden = !off;
      const t = $('.kp-pad-t', Pad.el); if (t) { t.setAttribute('aria-expanded', open ? 'true' : 'false'); $('.kp-pad-st', t).textContent = open ? '收起' : '打開'; }
      Pad.size();
    },
    /* 主按鈕：依狀態決定文字與能不能按 */
    sync() {
      const k = this.k, b = $('#kpGo'), L = $('#kpFootL'); if (!b) return;
      const a = this.action(); b.textContent = a.t; b.disabled = !!a.off; b.dataset.act = a.id;
      if (L) L.innerHTML = a.note ? esc(a.note) : '';
    },
    action() {
      const k = this.k, n = N[k], s = st(k), sg = stageOf(k);
      if (!learned(k) && !canStart(k)) { const c = current(); return c ? { id: 'goto', t: `去學：${shortT(c)}`, to: c } : { id: 'map', t: '回課程地圖' }; }
      if (sg === 'teach') {
        const items = n.items && n.items.length ? n.items : [{ t: 'md' }], cur = items[Math.min(s.i, items.length) - 1], idx = Math.min(s.i, items.length) - 1, r = s.res[idx];
        if (cur && INTER[cur.t] && !(r && r.done)) {
          if (cur.t === 'write') return { id: 'w-reveal', t: '寫好了，看參考答案', off: !Pad.ready(), note: Pad.ready() ? '' : '先寫在手寫板或打字框，或勾「我寫在紙上」' };
          const ok = cur.t === 'mc' ? (this.ui.sel || []).length : cur.t === 'fill' ? (this.ui.text || '').trim() : cur.t === 'order' ? (this.ui.seq || []).length === cur.items.length : true;
          return { id: 'submit', t: r && r.n === 1 ? '再送出一次' : '送出答案', off: !ok, note: ok ? '' : '先作答，才能往下' };
        }
        if (cur && cur.t === 'write' && r && r.done && !r.self) return { id: 'none', t: '繼續', off: true, note: '先選：寫對了，還是有錯' };
        if (s.i < items.length) return { id: 'more', t: '繼續' };
        return (n.examples || []).length ? { id: 'to-ex', t: '下一步：跟著做例題' } : { id: 'to-prac', t: '下一步：自己做題' };
      }
      if (sg === 'ex') {
        const e = n.examples[s.ex], p = e && e.steps[s.es];
        const prevW = e && s.es > 0 && e.steps[s.es - 1].w && !s.ew[s.ex + '.' + (s.es - 1)];
        // 上一步「跟你寫的比」改成可選：沒按也能往下（以前會卡住，學生以為答案不給看）
        if (p) return p.w ? { id: 'ex-reveal', t: '寫好了，對答案', off: !Pad.ready(), note: Pad.ready() ? (prevW ? '上一步可以先按「一樣／不一樣」記下來' : '') : '先寫在手寫板或打字框，或勾「我寫在紙上」' } : { id: 'ex-reveal', t: '看答案', note: prevW ? '上一步可以先按「一樣／不一樣」記下來' : '' };
        return s.ex + 1 < n.examples.length ? { id: 'ex-next', t: '下一個例題' } : { id: 'to-prac', t: '下一步：自己做題' };
      }
      if (sg === 'prac') {
        const list = qs(k); if (!list.length) return { id: 'finish', t: '完成這個知識點' };
        const qid = (s.queue || [])[s.pq || 0], q = qid && QBANK.get(qid);
        if (q) {
          const done = !!(s.qdone || {})[q.id];
          if (!done) {
            if (q.type === 'essay') return { id: 'q-reveal', t: '寫好了，看詳解', off: !Pad.ready(), note: Pad.ready() ? '' : '先寫在手寫板或打字框，或勾「我寫在紙上」' };
            const ok = q.type === 'fill' ? (this.ui.text || '').trim() : (this.ui.sel || []).length;
            return { id: 'q-submit', t: ((s.tries || {})[q.id] || 0) === 1 ? '再送出一次' : '送出答案', off: !ok, note: ok ? '' : '先作答' };
          }
          if (q.type === 'essay' && (s.qok || {})[q.id] == null) return { id: 'none', t: '下一題', off: true, note: '先選：對了，還是有錯' };
          if (mastered(k) && ((s.pq || 0) + 1 >= (s.queue || []).length || prog(k).n >= Math.min(5, list.length))) return { id: 'finish', t: '完成這個知識點' };
          return (s.pq || 0) + 1 < (s.queue || []).length ? { id: 'q-next', t: '下一題' } : (mastered(k) ? { id: 'finish', t: '完成這個知識點' } : { id: 'q-round', t: '再練一次錯的' });
        }
        return mastered(k) ? { id: 'finish', t: '完成這個知識點' } : { id: 'q-round', t: '再練一次錯的' };
      }
      const nx = next(k) || current(), td = todayList();
      if (learned(k) && S.st.onboarded && td.length && td.every(learned) && learnedOn(D.today()).includes(k)) return { id: 'home', t: '今天的課上完了：回到今天的清單' };
      return nx ? { id: 'goto', t: `下一個：${shortT(nx)}`, to: nx } : { id: 'map', t: '回課程地圖' };
    },
    go() {
      const k = this.k, n = N[k], s = st(k), a = this.action();
      if (a.off) return;
      if (a.id === 'goto') { location.hash = href(a.to); return; }
      if (a.id === 'map') { location.hash = '#map'; return; }
      if (a.id === 'home') { location.hash = '#go'; return; }
      if (a.id === 'more') { s.i++; log(k, 'read', null, { i: s.i }); S.save(); this.ui = {}; Pad.resetPaper(); this.draw(); return; }
      if (a.id === 'submit') { this.submitInter(); return; }
      if (a.id === 'w-reveal') { const idx = s.i - 1, r = s.res[idx] || (s.res[idx] = { n: 0 }), code = Pad.take(); if (code) r.code = code; r.n = 1; r.done = true; r.ok = null; log(k, 'write', null, { idx, pad: Pad.dirty }); S.save(); this.draw(); return; }
      if (a.id === 'to-ex') { s.stage = 'ex'; s.ex = 0; s.es = 0; log(k, 'stage', null, { to: 'ex' }); S.save(); Pad.resetPaper(); this.draw(); return; }
      if (a.id === 'ex-reveal') { const p = n.examples[s.ex].steps[s.es], code = Pad.take(); if (code) (s.excode = s.excode || {})[s.ex + '.' + s.es] = code; log(k, p.w ? 'ex-write' : 'ex-step', null, { ex: s.ex, step: s.es, pad: Pad.dirty }); s.es++; S.save(); Pad.resetPaper(); this.draw(); return; }
      if (a.id === 'ex-next') { s.ex++; s.es = 0; S.save(); this.draw(); return; }
      if (a.id === 'to-prac') { this.startPrac(); return; }
      if (a.id === 'q-submit') { this.submitQ(); return; }
      if (a.id === 'q-reveal') { const qid = s.queue[s.pq], code = Pad.take(); if (code) (s.qcode = s.qcode || {})[qid] = code; (s.qdone = s.qdone || {})[qid] = 1; log(k, 'q-write', null, { q: qid }); S.save(); this.draw(); return; }
      if (a.id === 'q-next') { s.pq++; this.ui = {}; S.save(); Pad.resetPaper(); this.draw(); return; }
      if (a.id === 'q-round') { this.newRound(); return; }
      if (a.id === 'finish') { this.finish(); return; }
    },
    startPrac() {
      const k = this.k, s = st(k);
      s.stage = 'prac'; s.queue = qs(k); s.pq = 0; s.round = 1; s.tries = {}; s.qdone = {}; s.qok = {}; s.qsel = {}; s.qwrong = {};
      log(k, 'stage', null, { to: 'prac' }); S.save(); this.ui = {}; Pad.resetPaper(); this.draw();
    },
    newRound() {
      const k = this.k, s = st(k), wrong = (s.queue || []).filter(id => (s.qok || {})[id] === false);
      s.queue = wrong.length ? wrong : qs(k); s.pq = 0; s.round = (s.round || 1) + 1; s.tries = {}; s.qdone = {}; s.qok = {}; s.qsel = {}; s.qwrong = {}; s.need = false;
      S.save(); this.ui = {}; this.draw();
    },
    submitInter() {
      const k = this.k, n = N[k], s = st(k), idx = s.i - 1, x = n.items[idx], r = s.res[idx] || (s.res[idx] = { n: 0 });
      let ok = false;
      if (x.t === 'mc') { const a = [...x.ans].sort().join(','), b = [...(this.ui.sel || [])].sort().join(','); ok = a === b; r.last = [...(this.ui.sel || [])]; }
      else if (x.t === 'fill') { ok = fillCorrect(this.ui.text || '', x.ans || []); r.lastText = this.ui.text || ''; }
      else if (x.t === 'order') { ok = (this.ui.seq || []).every((j, i) => j === i); }
      r.n++;
      log(k, x.t, ok, { idx, n: r.n });
      if (ok) { r.done = true; r.ok = r.n === 1; }
      else if (r.n >= 2) { r.done = true; r.ok = false; }
      else { r.wrongSel = x.t === 'mc' ? [...(this.ui.sel || [])] : null; this.ui = {}; }
      this._hit = { sel: `.kp-q[data-idx="${idx}"]`, ok };
      S.save(); this.draw();
    },
    submitQ() {
      const k = this.k, s = st(k), qid = s.queue[s.pq], q = QBANK.get(qid);
      const resp = q.type === 'fill' ? (this.ui.text || '') : [...(this.ui.sel || [])];
      const ok = !!Practice.isCorrect(q, resp);
      s.tries = s.tries || {}; s.tries[qid] = (s.tries[qid] || 0) + 1; const t = s.tries[qid];
      if (t === 1) { s.att.push({ q: qid, ok, d: D.today() }); S.answer(qid, ok, { conf: 2, q }); }
      log(k, 'q', ok, { q: qid, n: t });
      if (ok || t >= 2) { (s.qdone = s.qdone || {})[qid] = 1; (s.qok = s.qok || {})[qid] = t === 1 && ok; (s.qsel = s.qsel || {})[qid] = resp; }
      else { (s.qwrong = s.qwrong || {})[qid] = Array.isArray(resp) ? resp : []; this.ui = {}; }
      if ((s.qdone || {})[qid] && (s.pq + 1 >= s.queue.length) && !mastered(k)) s.need = true;
      this._hit = { sel: `.kp-q[data-qid="${qid}"]`, ok };
      S.save(); this.draw();
    },
    finish() {
      const k = this.k, s = st(k);
      s.done = D.today(); s.stage = 'done';
      const L = S.day(); L.kpDone = L.kpDone || []; if (!L.kpDone.includes(k)) L.kpDone.push(k);
      const ch = N[k].ch; if (ch) { L.lessons = L.lessons || []; if (!L.lessons.includes(ch)) L.lessons.push(ch); if (ORDER.filter(x => N[x].ch === ch).every(learned)) { const ls = S.lesson(ch); if (!ls.read) ls.read = D.today(); } }
      log(k, 'done', true); S.save();
      toast('學會了：' + shortT(k), 'good');
      try { renderGoPill(location.hash.slice(1)); } catch (e) { }
      this.draw();
    },
    wireStream() {
      const k = this.k, n = N[k], s = st(k), root = $('#kpStream');
      const act = $('.kp-q.kp-active', root);
      if (act) {
        const qid = act.dataset.qid, x = qid ? QBANK.get(qid) : n.items[+act.dataset.idx];
        const multi = qid ? x.type === 'multi' : (x.ans || []).length > 1;
        $$('.kp-opt', act).forEach(b => b.onclick = () => {
          const j = +b.dataset.j, sel = this.ui.sel || [];
          this.ui.sel = multi ? (sel.includes(j) ? sel.filter(y => y !== j) : [...sel, j]) : [j];
          $$('.kp-opt', act).forEach(o => { const on = this.ui.sel.includes(+o.dataset.j); o.classList.toggle('on', on); o.setAttribute('aria-checked', on ? 'true' : 'false'); o.classList.remove('wrong'); });
          this.sync();
        });
        wireFillParts(act); { const p0 = $('.fill-pi', act); if (p0 && !p0.disabled) setTimeout(() => { if (document.activeElement === document.body || !document.activeElement) p0.focus(); }, 0); }
        const fi = $('.kp-fill', act); if (fi && !fi.disabled) { fi.oninput = () => { this.ui.text = fi.value; this.sync(); }; setTimeout(() => { if (document.activeElement === document.body || !document.activeElement) fi.focus({ preventScroll: true }); }, 60); }
        $$('.kp-pool-i', act).forEach(b => b.onclick = () => { this.ui.seq = [...(this.ui.seq || []), +b.dataset.j]; this.draw(); });
        const rs = $('.kp-seq-reset', act); if (rs) rs.onclick = () => { this.ui.seq = []; this.draw(); };
      }
      $$('[data-self]', root).forEach(b => b.onclick = () => { const blk = b.closest('.kp-q'), idx = +blk.dataset.idx, r = s.res[idx]; r.self = b.dataset.self; r.ok = r.self === 'ok'; log(k, 'write-self', r.ok, { idx }); S.save(); this.draw(); });
      $$('[data-ew]', root).forEach(b => b.onclick = () => { const key = b.dataset.ek || (s.ex + '.' + (s.es - 1)); s.ew[key] = b.dataset.ew; log(k, 'ex-self', b.dataset.ew === 'ok', { ex: s.ex, step: +key.split('.')[1] }); S.save(); this.draw(); });
      $$('[data-see]', root).forEach(b => b.onclick = () => { const g = $('#kpGo'); if (g && !g.disabled) g.click(); });
      $$('[data-qself]', root).forEach(b => b.onclick = () => { const qid = s.queue[s.pq], ok = b.dataset.qself === 'ok', q = QBANK.get(qid); (s.qok = s.qok || {})[qid] = ok; s.att.push({ q: qid, ok, d: D.today() }); S.answer(qid, ok, { conf: 2, q }); log(k, 'q-self', ok, { q: qid }); if (s.pq + 1 >= s.queue.length && !mastered(k)) s.need = true; S.save(); this.draw(); });
    },
  };

  return {
    N, ORDER, POS, QOF, href, title, shortT, learned, M, canStart, current, next, mastered, stageOf, stageLabel, learnedOn, todayList, qs, prog,
    view: k => View.render(k), stop: () => { View.k = null; KPV.stopAll(); },
    has: () => ORDER.length > 0, _v: View,
  };
})();
