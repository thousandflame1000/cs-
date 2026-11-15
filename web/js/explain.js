/* 資工所衝刺站 — 動畫講解
   一步一個畫面：圖自己動、旁白（瀏覽器語音合成）講「為什麼」，符號只在最後當結論。
   每部 = { id, lesson, subject, title, q, steps:[{ cap, say, dur, ask }], draw(g, s), play? }
   draw 拿到 s = { k 目前第幾步, u 這一步動畫進度 0..1, a(i) 第 i 步的出現程度, T 秒 }。
   ask = { q, opts:[...], ans, why }：先猜再揭曉。play = { params:[{id,label,min,max,step,value}], draw(g,p,T), note(p) }：自己玩。 */
'use strict';

const Explain = (() => {
  const W = 960, H = 540;
  const C = { bg: '#0c1220', bg2: '#111a2e', grid: '#18223a', faint: '#2a3756', dim: '#8390ad', ink: '#eaf0fa', soft: '#c3cde2', teal: '#2ee6c9', amber: '#ffc547', coral: '#ff6b8b', violet: '#a98bff', green: '#5cf28a', blue: '#5aa8ff', red: '#ff5a5a', white: '#ffffff' };
  const SUBC = { ds: C.teal, al: C.violet, co: C.amber, os: C.coral, dm: C.green, la: C.blue };
  const PAL = [C.teal, C.amber, C.coral, C.violet, C.green, C.blue, '#ff9f43', '#f78fb3', '#7bed9f', '#70a1ff', '#eccc68', '#c56cf0', '#ff7f50', '#1dd1a1', '#feca57'];
  const SANS = '"Noto Sans TC","Microsoft JhengHei","PingFang TC","Heiti TC",sans-serif';
  const MI = 'KaTeX_Math,"Cambria Math","Times New Roman",serif', MR = 'KaTeX_Main,"Cambria Math","Times New Roman",serif';
  const cl = x => Math.max(0, Math.min(1, x)), lerp = (a, b, u) => a + (b - a) * u;
  const E = { io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out: t => 1 - Math.pow(1 - t, 3), back: t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }, lin: t => t };
  const seg = (u, a, b) => cl((u - a) / (b - a));   // u 在 [a,b] 之間的子進度

  /* ---------- 畫圖工具 ---------- */
  function kit(ctx) {
    const g = {
      W, H, C, PAL, ctx, E, cl, lerp, seg,
      clear(acc) {
        const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, C.bg2); gr.addColorStop(1, C.bg); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = C.grid; for (let x = 24; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
      },
      alpha(a, fn) { if (a <= .003) return; ctx.save(); ctx.globalAlpha *= cl(a); fn(); ctx.restore(); },
      text(s, x, y, o = {}) {
        const { size = 24, color = C.ink, align = 'center', weight = 500, font = SANS, alpha = 1, base = 'middle', italic = false, glow = 0, max = 0 } = o;
        if (alpha <= .003 || s == null || s === '') return 0; ctx.save(); ctx.globalAlpha *= cl(alpha);
        ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillStyle = color;
        if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
        if (max) { const w = ctx.measureText(String(s)).width; if (w > max) { ctx.font = `${italic ? 'italic ' : ''}${weight} ${size * max / w}px ${font}`; } }
        ctx.fillText(String(s), x, y); const w = ctx.measureText(String(s)).width; ctx.restore(); return w;
      },
      /* 小型數學排版：字母斜體（KaTeX_Math），數字與符號正體；支援 ^x ^{..} _x _{..}、\lg \log \sum \Theta 等 */
      math(src, x, y, o = {}) {
        const { size = 26, color = C.ink, align = 'center', alpha = 1, glow = 0, weight = 400 } = o;
        if (alpha <= .003) return 0;
        const toks = mtok(String(src)); ctx.save(); ctx.globalAlpha *= cl(alpha); ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color;
        if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
        const lay = []; let cx = 0;
        const put = (t, sz, dy) => { ctx.font = `${t.it ? 'italic ' : ''}${weight} ${sz}px ${t.it ? MI : MR}`; const w = ctx.measureText(t.s).width; lay.push({ s: t.s, f: ctx.font, x: cx, dy }); cx += w + (t.sp || 0) * sz; };
        for (const t of toks) {
          if (t.sup || t.sub) { const base = cx; for (const q of t.toks) put(q, size * .68, t.sup ? -size * .42 : size * .22); if (t.sub && t.sup2) { const e = cx; cx = base; for (const q of t.sup2) put(q, size * .68, -size * .42); cx = Math.max(cx, e); } }
          else put(t, size, 0);
        }
        const x0 = align === 'center' ? x - cx / 2 : align === 'right' ? x - cx : x;
        for (const l of lay) { ctx.font = l.f; ctx.fillText(l.s, x0 + l.x, y + size * .34 + l.dy); }
        ctx.restore(); return cx;
      },
      mathW(src, size = 26) { ctx.save(); let w = 0; for (const t of mtok(String(src))) { if (t.sup || t.sub) { for (const q of t.toks) { ctx.font = `${q.it ? 'italic ' : ''}400 ${size * .68}px ${q.it ? MI : MR}`; w += ctx.measureText(q.s).width; } } else { ctx.font = `${t.it ? 'italic ' : ''}400 ${size}px ${t.it ? MI : MR}`; w += ctx.measureText(t.s).width + (t.sp || 0) * size; } } ctx.restore(); return w; },
      line(x1, y1, x2, y2, o = {}) {
        const { color = C.dim, w = 2, alpha = 1, dash = null, u = 1, glow = 0, cap = 'round' } = o; if (u <= 0 || alpha <= .003) return;
        ctx.save(); ctx.globalAlpha *= cl(alpha); if (dash) ctx.setLineDash(dash); if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
        ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = cap; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, u), lerp(y1, y2, u)); ctx.stroke(); ctx.restore();
      },
      arrow(x1, y1, x2, y2, o = {}) {
        const { color = C.ink, w = 3, alpha = 1, u = 1, head = 12, glow = 0, dash = null } = o; if (u <= 0 || alpha <= .003) return;
        const ex = lerp(x1, x2, u), ey = lerp(y1, y2, u), a = Math.atan2(ey - y1, ex - x1);
        g.line(x1, y1, ex - Math.cos(a) * head * .6, ey - Math.sin(a) * head * .6, { color, w, alpha, glow, dash });
        ctx.save(); ctx.globalAlpha *= cl(alpha); ctx.fillStyle = color; if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; } ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - head * Math.cos(a - .42), ey - head * Math.sin(a - .42)); ctx.lineTo(ex - head * Math.cos(a + .42), ey - head * Math.sin(a + .42)); ctx.closePath(); ctx.fill(); ctx.restore();
      },
      rect(x, y, w, h, o = {}) {
        const { fill = null, stroke = null, lw = 2, r = 6, alpha = 1, glow = 0, dash = null } = o; if (alpha <= .003 || w === 0 || h === 0) return;
        ctx.save(); ctx.globalAlpha *= cl(alpha); if (glow) { ctx.shadowColor = stroke || fill; ctx.shadowBlur = glow; } if (dash) ctx.setLineDash(dash);
        ctx.beginPath(); if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; } ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
        if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } ctx.restore();
      },
      circle(x, y, r, o = {}) {
        const { fill = null, stroke = null, lw = 2, alpha = 1, glow = 0 } = o; if (alpha <= .003 || r <= 0) return;
        ctx.save(); ctx.globalAlpha *= cl(alpha); if (glow) { ctx.shadowColor = stroke || fill; ctx.shadowBlur = glow; } ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } ctx.restore();
      },
      node(x, y, r, label, o = {}) {
        const { stroke = C.dim, fill = '#17213a', color = C.ink, alpha = 1, scale = 1, glow = 0, size = r * .95, lw = 2.5, math = false } = o; if (alpha <= .003 || scale <= .01) return;
        ctx.save(); ctx.globalAlpha *= cl(alpha); ctx.translate(x, y); ctx.scale(scale, scale);
        g.circle(0, 0, r, { fill, stroke, lw, glow });
        if (label !== '' && label != null) { if (math) g.math(label, 0, 0, { size, color }); else g.text(label, 0, 1, { size, weight: 700, color }); }
        ctx.restore();
      },
      poly(pts, o = {}) {
        const { fill = null, stroke = null, lw = 2, alpha = 1, close = true, glow = 0, dash = null } = o; if (alpha <= .003 || pts.length < 2) return;
        ctx.save(); ctx.globalAlpha *= cl(alpha); if (dash) ctx.setLineDash(dash); if (glow) { ctx.shadowColor = stroke || fill; ctx.shadowBlur = glow; }
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); if (close) ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); } ctx.restore();
      },
      path(pts, o = {}) {   // 依長度畫出一部分（u）
        const { color = C.ink, w = 3, alpha = 1, u = 1, glow = 0, dash = null } = o; if (u <= 0 || pts.length < 2) return;
        let tot = 0; const sg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); sg.push(d); tot += d; }
        let rem = tot * cl(u); ctx.save(); ctx.globalAlpha *= cl(alpha); if (dash) ctx.setLineDash(dash); if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
        ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length && rem > 0; i++) { const f = Math.min(1, rem / (sg[i - 1] || 1)); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); rem -= sg[i - 1]; }
        ctx.stroke(); ctx.restore();
      },
      brace(x1, y1, x2, y2, label, o = {}) {   // 大括號（從 1 到 2，標籤在外側）
        const { color = C.dim, alpha = 1, size = 22, side = 1, math = true, lw = 2 } = o; if (alpha <= .003) return;
        const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), nx = -dy / len * side, ny = dx / len * side, d = 10;
        const P = (t, k) => [x1 + dx * t + nx * d * k, y1 + dy * t + ny * d * k];
        ctx.save(); ctx.globalAlpha *= cl(alpha); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
        ctx.moveTo(...P(0, 0)); ctx.quadraticCurveTo(...P(0, 1), ...P(.06, 1)); ctx.lineTo(...P(.44, 1)); ctx.quadraticCurveTo(...P(.5, 1), ...P(.5, 2)); ctx.quadraticCurveTo(...P(.5, 1), ...P(.56, 1)); ctx.lineTo(...P(.94, 1)); ctx.quadraticCurveTo(...P(1, 1), ...P(1, 0)); ctx.stroke(); ctx.restore();
        const [lx, ly] = P(.5, 2); const off = 16 + size * .4; const tx = lx + nx * off, ty = ly + ny * off;
        if (label) (math ? g.math : g.text)(label, tx, ty, { size, color, alpha });
      },
      chip(s, x, y, o = {}) {   // 圓角標籤
        const { color = C.ink, bg = 'rgba(255,255,255,.07)', size = 20, alpha = 1, stroke = null, math = false, align = 'center' } = o; if (alpha <= .003) return;
        ctx.save(); ctx.font = `600 ${size}px ${SANS}`; const w = (math ? g.mathW(s, size) : ctx.measureText(s).width) + size * 1.1, h = size * 1.7; ctx.restore();
        const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
        g.rect(x0, y - h / 2, w, h, { fill: bg, stroke, r: h / 2, alpha, lw: 1.5 });
        (math ? g.math : g.text)(s, x0 + w / 2, y, { size, color, alpha, weight: 600 }); return w;
      },
      count(a, b, u) { return Math.round(lerp(a, b, cl(u))); },
    };
    return g;
  }
  const GREEK = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', theta: 'θ', lambda: 'λ', mu: 'μ', pi: 'π', sigma: 'σ', phi: 'φ', omega: 'ω', rho: 'ρ', tau: 'τ', Theta: 'Θ', Omega: 'Ω', Sigma: 'Σ', Lambda: 'Λ', Delta: 'Δ', Phi: 'Φ' };
  const SYM = { le: '≤', ge: '≥', ne: '≠', times: '×', cdot: '·', to: '→', infty: '∞', sum: 'Σ', approx: '≈', in: '∈', cup: '∪', cap: '∩', lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉', pm: '±', perp: '⊥', ldots: '…', cdots: '⋯', mid: '|', equiv: '≡', sqrt: '√', ', ': ' ', quad: '  ' };
  const UPR = ['lg', 'log', 'ln', 'det', 'rank', 'dim', 'min', 'max', 'mod', 'gcd', 'sin', 'cos'];
  function mtok(s) {   // 字串 → [{s, it}]，^/_ 變成上下標群組
    const out = []; let i = 0;
    const one = () => {
      const c = s[i];
      if (c === '\\') { const m = s.slice(i + 1).match(/^([A-Za-z]+|.)/); const nm = m[1]; i += 1 + nm.length; if (GREEK[nm]) return [{ s: GREEK[nm], it: /^[a-z]/.test(nm) }]; if (UPR.includes(nm)) return [{ s: nm, it: false, sp: .12 }]; if (SYM[nm] != null) return [{ s: /^(le|ge|ne|times|to|approx|in|equiv|perp)$/.test(nm) ? ' ' + SYM[nm] + ' ' : SYM[nm], it: false }]; if (nm === ',') return [{ s: ' ', it: false }]; return [{ s: nm, it: false }]; }
      if (c === '{') { let d = 1, j = i + 1; while (j < s.length && d) { if (s[j] === '{') d++; else if (s[j] === '}') d--; j++; } const inner = s.slice(i + 1, j - 1); i = j; return mtok(inner); }
      i++;
      if (/[A-Za-zα-ωθλ]/.test(c)) return [{ s: c, it: true }];
      if ('=+-−<>≤≥×→≈'.includes(c)) { const prev = out[out.length - 1]; const un = (c === '-' || c === '−') && (!prev || /^\s*[=+−<>≤≥×(→≈,]\s*$/.test(prev.s)); return [{ s: un ? '−' : ' ' + (c === '-' ? '−' : c) + ' ', it: false }]; }
      if (c === '·') return [{ s: '·', it: false }];
      return [{ s: c, it: false }];
    };
    while (i < s.length) {
      if (s[i] === '^' || s[i] === '_') { const k = s[i]; i++; const toks = one(); const last = out[out.length - 1]; if (k === '^' && last && last.sub && !last.sup2) { last.sup2 = toks; continue; } out.push({ toks, sup: k === '^', sub: k === '_' }); continue; }
      out.push(...one());
    }
    return out;
  }

  /* ---------- 旁白：瀏覽器內建語音合成（台灣中文優先） ---------- */
  const Voice = {
    v: null, tried: false,
    on() { try { return localStorage.getItem('csgrad.xpvoice') !== '0'; } catch (e) { return true; } },
    set(b) { try { localStorage.setItem('csgrad.xpvoice', b ? '1' : '0'); } catch (e) { } if (!b) this.stop(); },
    ok() { return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined'; },
    pick() {
      if (!this.ok()) return null; const vs = speechSynthesis.getVoices() || []; if (!vs.length) return null;
      const sc = v => (/zh[-_]TW/i.test(v.lang) ? 20 : /zh[-_](HK|Hant)/i.test(v.lang) ? 8 : /^zh/i.test(v.lang) || /cmn/i.test(v.lang) ? 6 : 0) + (/Natural|Online|Neural|HsiaoChen|HsiaoYu|Yating|Hanhan|Zhiwei|Google/i.test(v.name) ? 4 : 0);
      let best = null, bs = 0; for (const v of vs) { const s = sc(v); if (s > bs) { bs = s; best = v; } } this.v = best; return best;
    },
    speak(text, rate, done) {
      this.stop(); const clean = String(text || '').replace(/\$[^$]*\$/g, '').replace(/[*_`#>]/g, '').trim();
      if (!clean) { done && done(); return; }
      const fallback = () => { const ms = clean.length / 5.2 * 1000 / rate + 400; this.timer = setTimeout(() => done && done(), ms); };
      if (!this.on() || !this.ok()) return fallback();
      if (!this.v) this.pick(); if (!this.v) { fallback(); return; }
      const parts = clean.split(/(?<=[。！？；])/).map(x => x.trim()).filter(Boolean); let n = 0, fin = false;
      const end = () => { if (fin) return; fin = true; clearTimeout(this.guard); done && done(); };
      this.guard = setTimeout(end, clean.length / 2.2 * 1000 / rate + 2500);   // 語音卡住時的保險
      parts.forEach((p, i) => { const ut = new SpeechSynthesisUtterance(p); ut.voice = this.v; ut.lang = this.v.lang || 'zh-TW'; ut.rate = Math.min(1.6, .98 * rate); ut.pitch = 1.02; ut.onend = ut.onerror = () => { if (++n >= parts.length) end(); }; speechSynthesis.speak(ut); });
    },
    stop() { clearTimeout(this.timer); clearTimeout(this.guard); if (this.ok()) try { speechSynthesis.cancel(); } catch (e) { } },
  };
  if (Voice.ok()) { try { speechSynthesis.onvoiceschanged = () => Voice.pick(); Voice.pick(); } catch (e) { } }

  const LIST = [];
  const def = x => { x.steps.forEach(s => { s.dur = s.dur || 2.2; }); LIST.push(x); };
  const get = id => LIST.find(x => x.id === id);
  const forLesson = lid => LIST.filter(x => x.lesson === lid);
  let active = null;
  const seen = id => !!((S.st.xpSeen || {})[id]);
  function markSeen(id) { const o = S.st.xpSeen || (S.st.xpSeen = {}); if (!o[id]) { o[id] = D.today(); S.save(); if (typeof window.onXpSeen === 'function') window.onXpSeen(id); } }

  /* ---------- 播放器 ---------- */
  function mount(host, id, opts = {}) {
    const X = get(id); if (!X || !host) return null;
    const acc = SUBC[X.subject] || C.teal, N = X.steps.length;
    const mins = Math.max(1, Math.round(X.steps.reduce((t, s) => t + Math.max(s.dur, String(s.say || s.cap).length / 5.2) + .8, 0) / 60));
    host.innerHTML = `<div class="xp" tabindex="0" style="--xa:${acc}">
      <div class="xp-stage"><canvas width="${W}" height="${H}" aria-label="${esc(X.title)}"></canvas>
        <button type="button" class="xp-start"><span class="xp-start-ic">▶</span><b>${esc(X.title)}</b><small>${N} 步 · 約 ${mins} 分鐘${Voice.ok() ? ' · 有旁白' : ''}</small></button>
        <div class="xp-ask" hidden></div><div class="xp-end" hidden></div>
      </div>
      <div class="xp-cap prose" aria-live="polite"></div>
      <div class="xp-bar">
        <button type="button" data-a="prev" title="上一步（←）" aria-label="上一步">⏮</button><button type="button" data-a="play" class="xp-pp" title="播放／暫停（空白鍵）" aria-label="播放">▶</button><button type="button" data-a="next" title="下一步（→）" aria-label="下一步">⏭</button>
        <div class="xp-dots">${X.steps.map((s, i) => `<button type="button" data-k="${i}" class="${s.ask ? 'q' : ''}" title="第 ${i + 1} 步${s.ask ? '（先猜）' : ''}" aria-label="第 ${i + 1} 步"></button>`).join('')}</div>
        <button type="button" data-a="voice" class="xp-voice" title="旁白開關">${Voice.on() ? '🔊' : '🔇'}</button><button type="button" data-a="speed" title="速度">1×</button>${X.play ? '<button type="button" data-a="lab" class="xp-labbtn" title="自己調參數看看">自己玩</button>' : ''}<button type="button" data-a="fs" title="全螢幕">⛶</button>
      </div>
      <div class="xp-play" hidden></div>
    </div>`;
    const root = host.querySelector('.xp'), cv = root.querySelector('canvas'), ctx = cv.getContext('2d'), g = kit(ctx), capEl = root.querySelector('.xp-cap'), askEl = root.querySelector('.xp-ask'), endEl = root.querySelector('.xp-end'), playEl = root.querySelector('.xp-play'), ppBtn = root.querySelector('.xp-pp');
    const st = { k: 0, t0: performance.now(), playing: false, spoke: true, doneAt: 0, speed: 1, mode: 'story', started: false, answered: {}, p: {}, raf: 0, vis: true, alive: true, scratch: {} };
    (X.play ? X.play.params : []).forEach(q => { st.p[q.id] = q.value; });
    const dpr = () => Math.min(2.5, window.devicePixelRatio || 1);
    function fit() { const r = cv.getBoundingClientRect(); const s = dpr(); const w = Math.max(320, Math.round(r.width * s)); if (cv.width !== w) { cv.width = w; cv.height = Math.round(w * H / W); } }
    function setCap() { const s = X.steps[st.k]; capEl.innerHTML = `<span class="xp-cap-n">${st.k + 1}/${N}</span>${md(s.cap || s.say).replace(/^<p>|<\/p>$/g, '')}`; root.querySelectorAll('.xp-dots button').forEach((b, i) => { b.classList.toggle('on', i === st.k); b.classList.toggle('done', i < st.k); }); }
    function speakStep() { const s = X.steps[st.k]; st.spoke = false; Voice.speak(s.say || s.cap, st.speed, () => { st.spoke = true; }); }
    function go(k, play = st.playing) {
      st.k = Math.max(0, Math.min(N - 1, k)); st.t0 = performance.now(); st.doneAt = 0; askEl.hidden = true; endEl.hidden = true; setCap();
      st.playing = play; ppBtn.textContent = play ? '⏸' : '▶'; if (play) { active && active !== api && active.pause(); active = api; speakStep(); } else { Voice.stop(); st.spoke = true; }
    }
    function play() { if (st.mode === 'lab') setMode('story'); root.querySelector('.xp-start').hidden = true; st.started = true; if (!endEl.hidden) { go(0, true); return; } st.playing = true; ppBtn.textContent = '⏸'; active && active !== api && active.pause(); active = api; st.t0 = performance.now() - prog() * stepDur() * 1000; speakStep(); }
    function pause() { st.playing = false; ppBtn.textContent = '▶'; Voice.stop(); st.spoke = true; st.pu = prog(); }
    const stepDur = () => X.steps[st.k].dur / st.speed;
    const prog = () => st.started ? cl((performance.now() - st.t0) / 1000 / stepDur()) : 0;
    function ask() {
      const s = X.steps[st.k], q = s.ask; st.playing = false; ppBtn.textContent = '▶';
      askEl.innerHTML = `<div class="xp-ask-in"><div class="xp-ask-h">🤔 先猜猜看</div><div class="xp-ask-q">${md(q.q).replace(/^<p>|<\/p>$/g, '')}</div><div class="xp-ask-o">${q.opts.map((o, i) => `<button type="button" data-o="${i}"><span>${'ABCD'[i]}</span><span class="xp-o-t">${md(o).replace(/^<p>|<\/p>$/g, '')}</span></button>`).join('')}</div><div class="xp-ask-f"></div></div>`;
      askEl.hidden = false; Voice.speak(q.q, st.speed, () => { });
      askEl.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
        const i = +b.dataset.o, ok = i === q.ans; st.answered[st.k] = ok ? 1 : -1;
        askEl.querySelectorAll('[data-o]').forEach((x, j) => { x.disabled = true; x.classList.toggle('ok', j === q.ans); x.classList.toggle('no', j === i && !ok); });
        askEl.querySelector('.xp-ask-f').innerHTML = `<p class="${ok ? 'good' : 'bad'}"><b>${ok ? '猜對了！' : '其實是 ' + 'ABCD'[q.ans] + '。'}</b>${md(q.why || '').replace(/^<p>|<\/p>$/g, '')}</p><button type="button" class="btn primary xp-cont">看動畫揭曉 ▶</button>`;
        Voice.speak((ok ? '猜對了。' : '其實是 ' + 'ABCD'[q.ans] + '。') + (q.why || ''), st.speed, () => { });
        const cont = askEl.querySelector('.xp-cont'); cont.focus(); cont.onclick = () => { Voice.stop(); askEl.hidden = true; go(st.k + 1, true); };
        if (typeof opts.onAsk === 'function') opts.onAsk(X.id, st.k, ok);
      });
      const f = askEl.querySelector('[data-o]'); f && f.focus({ preventScroll: true });
    }
    function finish() {
      st.playing = false; ppBtn.textContent = '↺'; markSeen(X.id);
      const nx = typeof opts.next === 'function' ? opts.next(X.id) : null;
      endEl.innerHTML = `<div class="xp-end-in"><div class="xp-end-h">看完了 ✓</div>${X.take ? `<div class="xp-take prose">${md(X.take)}</div>` : ''}<div class="xp-end-b"><button type="button" class="btn" data-e="again">↺ 再看一次</button>${X.play ? '<button type="button" class="btn" data-e="lab">自己玩</button>' : ''}${nx ? `<button type="button" class="btn primary" data-e="next">${esc(nx.label || '下一步 ▶')}</button>` : ''}</div></div>`;
      endEl.hidden = false;
      endEl.querySelector('[data-e=again]').onclick = () => go(0, true);
      const lb = endEl.querySelector('[data-e=lab]'); if (lb) lb.onclick = () => setMode('lab');
      const nb = endEl.querySelector('[data-e=next]'); if (nb) { nb.onclick = () => nx.go(); if (opts.autoNext) { let n = 6; nb.textContent = `${nx.label || '下一步'} ▶（${n}）`; const tm = setInterval(() => { if (!root.isConnected || endEl.hidden) { clearInterval(tm); return; } if (--n <= 0) { clearInterval(tm); nx.go(); } else nb.textContent = `${nx.label || '下一步'} ▶（${n}）`; }, 1000); endEl.addEventListener('pointerdown', () => { clearInterval(tm); nb.textContent = (nx.label || '下一步') + ' ▶'; }, { once: true }); } }
      if (typeof opts.onEnd === 'function') opts.onEnd(X.id);
    }
    function setMode(m) {
      st.mode = m; const lab = m === 'lab'; playEl.hidden = !lab; capEl.hidden = lab; root.classList.toggle('lab', lab);
      root.querySelector('.xp-start').hidden = true; endEl.hidden = true; askEl.hidden = true;
      const lbtn = root.querySelector('.xp-labbtn'); if (lbtn) lbtn.textContent = lab ? '◀ 回講解' : '自己玩';
      if (lab) { pause(); renderLab(); }
    }
    function renderLab() {
      const P = X.play; if (!P) return;
      playEl.innerHTML = `<div class="xp-params">${P.params.map(q => q.type === 'choice' ? `<div class="xp-param"><span>${md(q.label).replace(/^<p>|<\/p>$/g, '')}</span><div class="xp-seg">${q.options.map(([v, t]) => `<button type="button" data-p="${q.id}" data-v="${v}" class="${String(st.p[q.id]) === String(v) ? 'on' : ''}">${esc(t)}</button>`).join('')}</div></div>` : q.type === 'button' ? `<div class="xp-param"><button type="button" class="btn sm" data-btn="${q.id}">${esc(q.label)}</button></div>` : `<label class="xp-param"><span>${md(q.label).replace(/^<p>|<\/p>$/g, '')}</span><input type="range" data-p="${q.id}" min="${q.min}" max="${q.max}" step="${q.step || 1}" value="${st.p[q.id]}"><output>${fmtv(q, st.p[q.id])}</output></label>`).join('')}</div><div class="xp-note prose"></div>`;
      playEl.querySelectorAll('input[data-p]').forEach(inp => inp.oninput = () => { const q = P.params.find(x => x.id === inp.dataset.p); st.p[q.id] = +inp.value; inp.nextElementSibling.textContent = fmtv(q, st.p[q.id]); st.p._t = performance.now(); note(); });
      playEl.querySelectorAll('button[data-p]').forEach(b => b.onclick = () => { const q = P.params.find(x => x.id === b.dataset.p); st.p[q.id] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; playEl.querySelectorAll(`button[data-p="${q.id}"]`).forEach(x => x.classList.toggle('on', x === b)); st.p._t = performance.now(); note(); });
      playEl.querySelectorAll('[data-btn]').forEach(b => b.onclick = () => { st.p[b.dataset.btn] = (st.p[b.dataset.btn] || 0) + 1; st.p._t = performance.now(); note(); });
      note();
    }
    const fmtv = (q, v) => q.fmt ? q.fmt(v) : String(v);
    function note() { const el = playEl.querySelector('.xp-note'); if (el && X.play.note) el.innerHTML = md(X.play.note(st.p, st.scratch) || ''); }
    function frame(now) {
      if (!root.isConnected) { st.alive = false; if (active === api) { Voice.stop(); active = null; } return; }
      st.raf = requestAnimationFrame(frame);
      if (!st.vis && st.drawn) return;
      fit(); const s = cv.width / W; ctx.setTransform(s, 0, 0, s, 0, 0);
      const T = now / 1000;
      try {
        if (st.mode === 'lab' && X.play) { g.clear(); X.play.draw(g, st.p, T, st.scratch); }
        else {
          const u = st.started ? (st.playing ? prog() : (st.pu != null ? st.pu : prog())) : 0, k = st.k;
          if (!st.playing && st.started && st.pu == null) st.pu = u; if (st.playing) st.pu = null;
          const a = i => (k > i ? 1 : k === i ? u : 0);
          g.clear(); X.draw(g, { k, u, a, T, started: st.started, S: st.scratch });
          if (st.playing && u >= 1 && st.spoke) {
            if (!st.doneAt) st.doneAt = now; else if (now - st.doneAt > 650 / st.speed) {
              const sStep = X.steps[k];
              if (sStep.ask && !st.answered[k]) ask(); else if (k < N - 1) go(k + 1, true); else finish();
            }
          }
        }
      } catch (e) { console.error(e); }
      st.drawn = true;
    }
    root.querySelector('.xp-start').onclick = () => { st.started = true; go(0, true); root.querySelector('.xp-start').hidden = true; };
    root.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      const a = b.dataset.a; st.started = true; root.querySelector('.xp-start').hidden = true;
      if (a === 'play') { if (st.mode === 'lab') { setMode('story'); go(st.k, true); return; } if (!endEl.hidden) { go(0, true); return; } st.playing ? pause() : play(); }
      else if (a === 'prev') { if (st.mode === 'lab') setMode('story'); go(prog() > .3 ? st.k : st.k - 1, st.playing); }
      else if (a === 'next') { if (st.mode === 'lab') setMode('story'); if (st.k >= N - 1) { finish(); return; } go(st.k + 1, st.playing); if (!st.playing) { st.t0 = performance.now() - stepDur() * 1000; st.pu = 1; } }
      else if (a === 'voice') { const on = !Voice.on(); Voice.set(on); b.textContent = on ? '🔊' : '🔇'; if (on && st.playing) speakStep(); }
      else if (a === 'speed') { const sp = [1, 1.25, 1.5, .8]; st.speed = sp[(sp.indexOf(st.speed) + 1) % sp.length]; b.textContent = st.speed + '×'; if (st.playing) { st.t0 = performance.now(); speakStep(); } }
      else if (a === 'lab') setMode(st.mode === 'lab' ? 'story' : 'lab');
      else if (a === 'fs') { const el = root; if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => { }); }
    });
    root.querySelectorAll('.xp-dots button').forEach(b => b.onclick = () => { st.started = true; root.querySelector('.xp-start').hidden = true; if (st.mode === 'lab') setMode('story'); go(+b.dataset.k, st.playing); if (!st.playing) { st.pu = null; st.t0 = performance.now() - stepDur() * 1000; } });
    cv.onclick = () => { if (st.mode === 'lab') return; if (!st.started) { root.querySelector('.xp-start').click(); return; } if (!endEl.hidden) return; st.playing ? pause() : play(); };
    root.addEventListener('keydown', e => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === ' ') { e.preventDefault(); root.querySelector('[data-a=play]').click(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); root.querySelector('[data-a=next]').click(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); root.querySelector('[data-a=prev]').click(); }
      else if (/^[1-4]$/.test(e.key) && !askEl.hidden) { const b = askEl.querySelectorAll('[data-o]')[+e.key - 1]; if (b && !b.disabled) b.click(); }
      else if (e.key === 'Enter' && !askEl.hidden) { const c = askEl.querySelector('.xp-cont'); if (c) c.click(); }
    });
    if (typeof IntersectionObserver !== 'undefined') { const io = new IntersectionObserver(es => { for (const en of es) { st.vis = en.isIntersecting; if (!st.vis && st.playing) pause(); } }); io.observe(root); }
    const api = { id: X.id, root, pause, play, go: k => go(k, true), lab: () => setMode('lab'), state: st };
    setCap(); st.raf = requestAnimationFrame(frame);
    if (opts.autoplay) { st.started = true; root.querySelector('.xp-start').hidden = true; go(0, true); }
    return api;
  }
  /* ---------- 影片模式：Manim 算好的 MP4（有旁白）＋ 字幕（KaTeX）＋ 先猜就停 ＋ 自己玩 ---------- */
  const VIDS = () => (window.CSDATA && CSDATA.videos) || {};
  const hasVideo = id => !!VIDS()[id];
  const fmtT = t => { t = Math.max(0, Math.floor(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  function mountVideo(host, id, opts = {}) {
    const V = VIDS()[id], X = get(id) || { id, subject: (V.subject || 'ds'), title: V.title }, acc = SUBC[X.subject || V.subject] || C.teal;
    const src = 'videos/' + id + '.mp4', poster = 'videos/' + id + '.jpg', chs = V.chapters || [], asks = (V.asks || []).slice().sort((a, b) => a.t - b.t);
    host.innerHTML = `<div class="xp xpv" tabindex="0" style="--xa:${acc}">
      <div class="xp-stage"><video preload="metadata" playsinline poster="${poster}" src="${src}"></video><canvas class="xp-labcv" width="${W}" height="${H}" hidden></canvas>
        <button type="button" class="xp-start"><span class="xp-start-ic">▶</span><b>${esc(V.title || X.title)}</b><small>${fmtT(V.dur)} · 有旁白 · ${asks.length ? asks.length + ' 個先猜' : '動畫講解'}</small></button>
        <div class="xp-ask" hidden></div><div class="xp-end" hidden></div>
      </div>
      <div class="xp-cap prose" aria-live="polite"></div>
      <div class="xp-prog"><div class="xp-prog-fill"></div>${chs.slice(1).map(c => `<i class="xp-tick" style="left:${c.t / V.dur * 100}%"></i>`).join('')}${asks.map(a => `<i class="xp-qtick" style="left:${a.t / V.dur * 100}%" title="先猜"></i>`).join('')}</div>
      <div class="xp-bar">
        <button type="button" data-a="prev" title="上一段（←）" aria-label="上一段">⏮</button><button type="button" data-a="play" class="xp-pp" title="播放／暫停（空白鍵）" aria-label="播放">▶</button><button type="button" data-a="next" title="下一段（→）" aria-label="下一段">⏭</button>
        <span class="xp-time">0:00 / ${fmtT(V.dur)}</span><span class="xp-chap"></span>
        <button type="button" data-a="cc" class="on" title="字幕">字幕</button><button type="button" data-a="speed" title="速度">1×</button>${X.play ? '<button type="button" data-a="lab" class="xp-labbtn" title="自己調參數看看">自己玩</button>' : ''}<button type="button" data-a="fs" title="全螢幕">⛶</button>
      </div>
      <div class="xp-play" hidden></div>
    </div>`;
    const root = host.querySelector('.xp'), vd = root.querySelector('video'), capEl = root.querySelector('.xp-cap'), askEl = root.querySelector('.xp-ask'), endEl = root.querySelector('.xp-end'), playEl = root.querySelector('.xp-play'), pp = root.querySelector('.xp-pp'), startB = root.querySelector('.xp-start'), fill = root.querySelector('.xp-prog-fill'), timeEl = root.querySelector('.xp-time'), chapEl = root.querySelector('.xp-chap'), lcv = root.querySelector('.xp-labcv');
    const st = { done: {}, cue: -1, ch: -1, mode: 'story', p: {}, scratch: {}, cc: true, raf: 0 };
    (X.play ? X.play.params : []).forEach(q => { st.p[q.id] = q.value; });
    const cueAt = t => { const cs = V.cues || []; let k = -1; for (let i = 0; i < cs.length; i++) if (cs[i].t <= t + .05) k = i; return k; };
    const chAt = t => { let k = 0; chs.forEach((c, i) => { if (c.t <= t + .05) k = i; }); return k; };
    function sync() {
      const t = vd.currentTime || 0, k = cueAt(t);
      if (k !== st.cue) { st.cue = k; const c = (V.cues || [])[k]; capEl.innerHTML = c && st.cc ? md(c.cap).replace(/^<p>|<\/p>$/g, '') : ''; }
      const ch = chAt(t); if (ch !== st.ch) { st.ch = ch; chapEl.textContent = chs[ch] ? chs[ch].name : ''; }
      fill.style.width = (t / (vd.duration || V.dur) * 100) + '%'; timeEl.textContent = fmtT(t) + ' / ' + fmtT(vd.duration || V.dur);
      if (!vd.paused) { const a = asks.find(q => !st.done[q.t] && t >= q.t && t < q.t + 1.5); if (a) ask(a); }
    }
    function loop() { if (!root.isConnected) { vd.pause(); return; } sync(); st.raf = requestAnimationFrame(loop); }
    function play() { if (st.mode === 'lab') setMode('story'); startB.hidden = true; endEl.hidden = true; askEl.hidden = true; if (active && active !== api) active.pause(); active = api; const pr = vd.play(); if (pr && pr.catch) pr.catch(() => { }); }
    function pause() { vd.pause(); }
    function ask(a) {
      vd.pause(); st.done[a.t] = 1;
      askEl.innerHTML = `<div class="xp-ask-in"><div class="xp-ask-h">🤔 先猜猜看</div><div class="xp-ask-q">${md(a.q).replace(/^<p>|<\/p>$/g, '')}</div><div class="xp-ask-o">${a.opts.map((o, i) => `<button type="button" data-o="${i}"><span>${'ABCD'[i]}</span><span class="xp-o-t">${md(o).replace(/^<p>|<\/p>$/g, '')}</span></button>`).join('')}</div><div class="xp-ask-f"></div></div>`;
      askEl.hidden = false;
      askEl.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
        const i = +b.dataset.o, ok = i === a.ans;
        askEl.querySelectorAll('[data-o]').forEach((x, j) => { x.disabled = true; x.classList.toggle('ok', j === a.ans); x.classList.toggle('no', j === i && !ok); });
        askEl.querySelector('.xp-ask-f').innerHTML = `<p class="${ok ? 'good' : 'bad'}"><b>${ok ? '猜對了！' : '其實是 ' + 'ABCD'[a.ans] + '。'}</b>${md(a.why || '').replace(/^<p>|<\/p>$/g, '')}</p><button type="button" class="btn primary xp-cont">繼續看揭曉 ▶</button>`;
        const c = askEl.querySelector('.xp-cont'); c.focus(); c.onclick = () => { askEl.hidden = true; play(); };
        if (typeof opts.onAsk === 'function') opts.onAsk(id, a.t, ok);
      });
      const f = askEl.querySelector('[data-o]'); f && f.focus({ preventScroll: true });
    }
    function finish() {
      markSeen(id); pp.textContent = '↺';
      const nx = typeof opts.next === 'function' ? opts.next(id) : null, take = (X && X.take) || V.take;
      endEl.innerHTML = `<div class="xp-end-in"><div class="xp-end-h">看完了 ✓</div>${take ? `<div class="xp-take prose">${md(take)}</div>` : ''}<div class="xp-end-b"><button type="button" class="btn" data-e="again">↺ 再看一次</button>${X.play ? '<button type="button" class="btn" data-e="lab">自己玩</button>' : ''}${nx ? `<button type="button" class="btn primary" data-e="next">${esc(nx.label || '下一步 ▶')}</button>` : ''}</div></div>`;
      endEl.hidden = false;
      endEl.querySelector('[data-e=again]').onclick = () => { vd.currentTime = 0; st.done = {}; play(); };
      const lb = endEl.querySelector('[data-e=lab]'); if (lb) lb.onclick = () => setMode('lab');
      const nb = endEl.querySelector('[data-e=next]'); if (nb) { nb.onclick = () => nx.go(); if (opts.autoNext) { let n = 6; const lab0 = nx.label || '下一步'; nb.textContent = `${lab0} ▶（${n}）`; const tm = setInterval(() => { if (!root.isConnected || endEl.hidden) { clearInterval(tm); return; } if (--n <= 0) { clearInterval(tm); nx.go(); } else nb.textContent = `${lab0} ▶（${n}）`; }, 1000); endEl.addEventListener('pointerdown', () => { clearInterval(tm); nb.textContent = lab0 + ' ▶'; }, { once: true }); } }
      if (typeof opts.onEnd === 'function') opts.onEnd(id);
    }
    function setMode(m) {
      st.mode = m; const lab = m === 'lab'; vd.hidden = lab; lcv.hidden = !lab; playEl.hidden = !lab; capEl.hidden = lab; root.classList.toggle('lab', lab); startB.hidden = true; endEl.hidden = true; askEl.hidden = true;
      const lbtn = root.querySelector('.xp-labbtn'); if (lbtn) lbtn.textContent = lab ? '◀ 回影片' : '自己玩';
      if (lab) { vd.pause(); renderLab(); labLoop(); }
    }
    function renderLab() {
      const P = X.play; const fmtv = (q, v) => q.fmt ? q.fmt(v) : String(v);
      playEl.innerHTML = `<div class="xp-params">${P.params.map(q => q.type === 'choice' ? `<div class="xp-param"><span>${md(q.label).replace(/^<p>|<\/p>$/g, '')}</span><div class="xp-seg">${q.options.map(([v, t]) => `<button type="button" data-p="${q.id}" data-v="${v}" class="${String(st.p[q.id]) === String(v) ? 'on' : ''}">${esc(t)}</button>`).join('')}</div></div>` : q.type === 'button' ? `<div class="xp-param"><button type="button" class="btn sm" data-btn="${q.id}">${esc(q.label)}</button></div>` : `<label class="xp-param"><span>${md(q.label).replace(/^<p>|<\/p>$/g, '')}</span><input type="range" data-p="${q.id}" min="${q.min}" max="${q.max}" step="${q.step || 1}" value="${st.p[q.id]}"><output>${fmtv(q, st.p[q.id])}</output></label>`).join('')}</div><div class="xp-note prose"></div>`;
      const note = () => { const el = playEl.querySelector('.xp-note'); if (el && P.note) el.innerHTML = md(P.note(st.p, st.scratch) || ''); };
      playEl.querySelectorAll('input[data-p]').forEach(inp => inp.oninput = () => { const q = P.params.find(x => x.id === inp.dataset.p); st.p[q.id] = +inp.value; inp.nextElementSibling.textContent = fmtv(q, st.p[q.id]); note(); });
      playEl.querySelectorAll('button[data-p]').forEach(b => b.onclick = () => { const q = P.params.find(x => x.id === b.dataset.p); st.p[q.id] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; playEl.querySelectorAll(`button[data-p="${q.id}"]`).forEach(x => x.classList.toggle('on', x === b)); note(); });
      playEl.querySelectorAll('[data-btn]').forEach(b => b.onclick = () => { st.p[b.dataset.btn] = (st.p[b.dataset.btn] || 0) + 1; note(); });
      note();
    }
    function labLoop() {
      if (st.mode !== 'lab' || !root.isConnected) return; const ctx = lcv.getContext('2d'), g = kit(ctx), r = lcv.getBoundingClientRect(), s = Math.min(2.5, window.devicePixelRatio || 1), w = Math.max(320, Math.round(r.width * s));
      if (lcv.width !== w) { lcv.width = w; lcv.height = Math.round(w * H / W); } ctx.setTransform(lcv.width / W, 0, 0, lcv.width / W, 0, 0);
      try { g.clear(); X.play.draw(g, st.p, performance.now() / 1000, st.scratch); } catch (e) { console.error(e); }
      requestAnimationFrame(labLoop);
    }
    vd.addEventListener('play', () => { pp.textContent = '⏸'; startB.hidden = true; });
    vd.addEventListener('pause', () => { pp.textContent = '▶'; });
    vd.addEventListener('ended', finish);
    vd.addEventListener('timeupdate', () => { if (vd.duration && vd.currentTime / vd.duration > .9) markSeen(id); });
    startB.onclick = play; vd.onclick = () => { vd.paused ? play() : pause(); };
    const seekCh = d => { const t = vd.currentTime, i = chAt(t); let j = i + d; if (d < 0 && t - chs[i].t > 2) j = i; j = Math.max(0, Math.min(chs.length - 1, j)); vd.currentTime = chs[j] ? chs[j].t + .01 : 0; asks.forEach(a => { if (a.t >= vd.currentTime) delete st.done[a.t]; }); sync(); };
    root.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'play') { if (st.mode === 'lab') { setMode('story'); play(); return; } if (!endEl.hidden) { vd.currentTime = 0; st.done = {}; play(); return; } vd.paused ? play() : pause(); }
      else if (a === 'prev') { if (st.mode === 'lab') setMode('story'); seekCh(-1); }
      else if (a === 'next') { if (st.mode === 'lab') setMode('story'); seekCh(1); }
      else if (a === 'cc') { st.cc = !st.cc; b.classList.toggle('on', st.cc); st.cue = -2; sync(); }
      else if (a === 'speed') { const sp = [1, 1.25, 1.5, .8]; vd.playbackRate = sp[(sp.indexOf(vd.playbackRate) + 1) % sp.length]; b.textContent = vd.playbackRate + '×'; }
      else if (a === 'lab') setMode(st.mode === 'lab' ? 'story' : 'lab');
      else if (a === 'fs') { if (document.fullscreenElement) document.exitFullscreen(); else if (root.requestFullscreen) root.requestFullscreen().catch(() => { }); }
    });
    root.querySelector('.xp-prog').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); vd.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (vd.duration || V.dur); asks.forEach(a => { if (a.t >= vd.currentTime) delete st.done[a.t]; }); startB.hidden = true; sync(); };
    root.addEventListener('keydown', e => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); root.querySelector('[data-a=play]').click(); }
      else if (e.key === 'ArrowRight' || e.key === 'l') { e.preventDefault(); vd.currentTime = Math.min(vd.duration || V.dur, vd.currentTime + 5); }
      else if (e.key === 'ArrowLeft' || e.key === 'j') { e.preventDefault(); vd.currentTime = Math.max(0, vd.currentTime - 5); }
      else if (/^[1-4]$/.test(e.key) && !askEl.hidden) { const b = askEl.querySelectorAll('[data-o]')[+e.key - 1]; if (b && !b.disabled) b.click(); }
      else if (e.key === 'Enter' && !askEl.hidden) { const c = askEl.querySelector('.xp-cont'); if (c) c.click(); }
    });
    if (typeof IntersectionObserver !== 'undefined') { const io = new IntersectionObserver(es => { for (const en of es) if (!en.isIntersecting && !vd.paused) vd.pause(); }); io.observe(root); }
    const api = { id, root, video: vd, pause, play, lab: () => setMode('lab'), state: st };
    sync(); st.raf = requestAnimationFrame(loop);
    if (opts.autoplay) play();
    return api;
  }
  const mountAny = (host, id, opts) => hasVideo(id) ? mountVideo(host, id, opts) : mount(host, id, opts);
  const all = () => { const ids = new Set([...LIST.map(x => x.id), ...Object.keys(VIDS())]); return [...ids].map(id => { const X = get(id), V = VIDS()[id]; return { id, lesson: (X && X.lesson) || (V && V.lesson), subject: (X && X.subject) || (V && V.subject), title: (V && V.title) || (X && X.title), video: !!V, dur: V ? V.dur : 0 }; }); };
  function stopAll() { Voice.stop(); if (active) active.pause(); active = null; document.querySelectorAll('.xpv video').forEach(v => v.pause()); }

  return { def, get, forLesson: lid => all().filter(x => x.lesson === lid), list: LIST, all, hasVideo, mount: mountAny, mountCanvas: mount, mountVideo, stopAll, seen, Voice, C, PAL, SUBC, W, H };
})();
