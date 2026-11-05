/* cs.js — 資工所短影音共用工具（依賴 motion.js + kit.js）
 * 從 01-BuildHeap 抽出：畫面大字疊加層、標註、發光節點、樹版面、交換軌跡、箭頭、光痕、章節角標、片名卡、考試公式卡。
 * 每支片把這個檔案複製進 film/（字體子集化只讀 film/ 底下的檔案）。所有東西仍是 t 的純函數。
 */
(function () {
  'use strict';
  const { prog, ease: E, lerp, clamp } = M;
  const TAU = Math.PI * 2;

  function CS(K, o = {}) {
    const W = K.W, H = K.H, CX = W / 2, stage = o.stage || document.getElementById('stage');
    const S = { W, H, CX };
    S.SIZE = { hero: 132, mid: 64, small: 30 };   // 三級字號：英雄字 / 畫面中字 / 標註

    // ── 疊加層：不跟鏡頭動的畫面大字
    const over = document.createElement('div');
    Object.assign(over.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', zIndex: 7, pointerEvents: 'none' });
    stage.appendChild(over); S.over = over;
    const heroes = [];
    /** 畫面大字：在 [t0, t1] 出現；o: {y, size, color, slam, mode, w} */
    S.hero = (str, t0, t1, ho = {}) => {
      const e = K.text(over, str, { x: 0, y: ho.y ?? 300, size: ho.size ?? S.SIZE.hero, align: 'c', ls: ho.ls ?? '.02em', lh: ho.lh ?? 1.1, w: ho.w ?? 700 });
      e.style.fontFamily = 'Plex';
      if (ho.color) K.glowTitle(e, { color: ho.color, strength: ho.glow ?? .8 });
      heroes.push({ e, t0, t1, mode: ho.mode || 'rise', slam: ho.slam, st: ho.stagger ?? .03 });
      return e;
    };
    S.drawHeroes = (t) => {
      for (const h of heroes) {
        if (t < h.t0 - .2 || t > h.t1 + .5) { h.e.style.visibility = 'hidden'; continue; }
        if (h.slam) { K.slam(h.e, t, h.t0, { from: 1.5, dur: .5 }); h.e.style.visibility = 'visible'; const k = prog(t, h.t1, h.t1 + .3, E.inCubic); if (k > 0) h.e.style.opacity = 1 - k; continue; }
        h.e.reveal(t, h.t0, { mode: h.mode, dur: .6, stagger: h.st }); h.e.hide(t, h.t1, { dur: .3 });
      }
    };

    // ── 畫在 canvas 上的字
    S.font = (w, s) => `${w} ${s}px "Plex"`;
    S.label = (c, s, x, y, lo = {}) => {
      if ((lo.a ?? 1) <= .003) return;
      c.save(); c.font = S.font(lo.w ?? 500, lo.size ?? S.SIZE.small); c.textAlign = lo.align || 'center'; c.textBaseline = 'middle';
      if (lo.ls) c.letterSpacing = lo.ls;
      c.fillStyle = lo.color ? K.rgba(lo.color, lo.a ?? 1) : K.I(lo.a ?? .6); c.fillText(s, x, y); c.restore();
    };

    // ── 樹
    S.depth = (k) => Math.floor(Math.log2(k));
    /** 完全二元樹第 k 個節點（1 起算）的位置：g = {cx, w, top, dy} */
    S.treeXY = (k, g) => { const r = S.depth(k), j = k - (1 << r); return [g.cx - g.w / 2 + (j + .5) * g.w / (1 << r), g.top + r * g.dy]; };
    /** 發光節點：有體積的球 + 數字 */
    S.node = (c, x, y, r, col, a, txt, lit = 0) => {
      if (a <= .003) return;
      K.orb(c, x, y, r, { color: col, a: a * (.8 + .2 * lit), atmo: .6, spec: .7, rim: .9 });
      if (lit > .02) K.core(c, x, y - r * .05, r * .16, .35 * lit * a, col);
      if (txt != null) { c.save(); c.globalAlpha *= a; S.label(c, String(txt), x, y + 1, { w: 600, size: r * .82, color: '#ffffff', a: .6 + .4 * lit }); c.restore(); }
    };
    S.edge = (c, p, q, col, a, w = 2) => { if (a > .003) K.glowLine(c, [p, q], { w, color: col, a: a * .62 }); };
    S.arrow = (c, x0, y0, x1, y1, col, a, w = 3) => {
      if (a <= .003) return; K.glowLine(c, [[x0, y0], [x1, y1]], { w, color: col, a });
      const ang = Math.atan2(y1 - y0, x1 - x0), s = 10 + w * 2;
      K.glowLine(c, [[x1 - Math.cos(ang - .5) * s, y1 - Math.sin(ang - .5) * s], [x1, y1], [x1 - Math.cos(ang + .5) * s, y1 - Math.sin(ang + .5) * s]], { w, color: col, a });
    };
    /** 位置交換的時間軌：init[slot] = id，events = [{t, a, b, d}]（依時間排序）→ (t) => {id: [fromSlot, toSlot, p]} */
    S.swapTrack = (init, events) => (t) => {
      const slot = init.slice(), pos = {};
      slot.forEach((id, i) => { if (id != null) pos[id] = [i, i, 1]; });
      for (const ev of events) {
        if (t < ev.t) break;
        const p = clamp((t - ev.t) / ev.d), A = slot[ev.a], B = slot[ev.b];
        if (p < 1) { pos[A] = [ev.a, ev.b, p]; pos[B] = [ev.b, ev.a, p]; continue; }
        slot[ev.a] = B; slot[ev.b] = A; pos[A] = [ev.b, ev.b, 1]; pos[B] = [ev.a, ev.a, 1];
      }
      return pos;
    };
    /** 沿路徑的發光光痕：pts 點列，p 0..1，tail 尾長比例 */
    S.streak = (c, pts, p, col, a = 1, tail = .45, w = 2.4) => {
      if (p <= 0 || p >= 1 + tail || a <= .003 || pts.length < 2) return;
      const n = pts.length - 1, h = clamp(p) * n, s = clamp(p - tail) * n;
      const at = (u) => { const i = Math.min(n - 1, Math.floor(u)), f = u - i; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; };
      const out = [at(s)]; for (let i = Math.ceil(s); i < h; i++) out.push(pts[i]); out.push(at(h));
      K.glowLine(c, out, { w, color: col, a: a * .9 }); if (p < 1) K.core(c, ...at(h), 3.2, a, col);
    };

    // ── 章節角標（左上極小，出現 1.8 秒後淡出，避免壓到畫面大字）
    const CHAP = K.text(over, '', { x: 64, y: 300, size: 22, ls: '.3em' }); CHAP.style.color = K.I(.42);
    let CHAPS = [];
    S.chapters = (list) => { CHAPS = list; };
    S.drawChap = (t) => {
      let s = '', t0 = 0; for (const [tt, v] of CHAPS) if (t >= tt) { s = v; t0 = tt; }
      if (CHAP.textContent !== s) CHAP.textContent = s;
      CHAP.style.opacity = s ? .9 * (1 - prog(t, t0 + 1.8, t0 + 2.4)) : 0;
    };

    // ── 片名卡：中文小標 + 英文極小 + 巨大主標 + 一句問題
    S.titleCard = (T, to) => {
      const top = to.y ?? 560;
      const big = K.text(over, to.big, { x: 0, y: top, size: to.size ?? 220, align: 'c', ls: '0', lh: 1 }); big.style.fontFamily = 'Plex'; big.style.fontWeight = 700; K.glowTitle(big, { color: to.color, strength: 1.1 });
      const en = K.text(over, to.en, { x: 0, y: top - 60, size: 26, align: 'c', ls: '.32em' }); en.style.color = K.I(.6);
      const kick = to.kick ? K.text(over, to.kick, { x: 0, y: top - 150, size: 72, align: 'c', ls: '.04em' }) : null; if (kick) { kick.style.fontWeight = 600; kick.style.color = '#eef3fa'; }
      const q = K.text(over, to.q, { x: 0, y: top + (to.qGap ?? 400), size: 54, align: 'c', lh: 1.45 }); q.style.fontWeight = 500;
      return (t) => {
        if (kick) { kick.reveal(t, T.start + .1, { mode: 'rise', dur: .6 }); kick.hide(t, T.end); }
        en.reveal(t, T.start + .35, { mode: 'rise', dur: .6, stagger: .012 }); en.hide(t, T.end);
        big.reveal(t, T.start, { mode: 'center', dur: .9, stagger: .07 }); big.hide(t, T.end, { dur: .35 });
        q.reveal(t, T.start + .9, { mode: 'ink', dur: .3, stagger: 1 / 20 }); q.hide(t, T.end, { dur: .3 });
      };
    };

    // ── 考試公式卡（片尾）：lines = ['<考試這樣寫>', '公式', ...]
    S.examCard = (Ec, str, eo = {}) => {
      const f = K.text(over, str, { x: 0, y: eo.y ?? 600, size: eo.size ?? 84, align: 'c', lh: eo.lh ?? 1.45, ls: '.01em' }); f.style.fontFamily = 'Plex'; f.style.fontWeight = 600;
      const sub = eo.sub ? K.text(over, eo.sub, { x: 0, y: eo.subY ?? 1190, size: 36, align: 'c', ls: '.08em' }) : null; if (sub) sub.style.color = K.I(.55);
      return (t, dur) => {
        f.reveal(t, Ec.start + .1, { mode: 'rise', dur: .6, stagger: eo.stagger ?? .05 }); f.hide(t, dur + 1);
        if (sub) { sub.reveal(t, Ec.start + (eo.subAt ?? 2), { mode: 'ink', dur: .4, stagger: .03 }); sub.hide(t, dur + 1); }
      };
    };
    /** 有上下標的數學式（畫在 canvas）：parts = [[字串, 層級]]，層級 0 正常、1 上標、2 上標裡的下標、-1 下標 */
    S.math = (c, parts, x, y, size, mo = {}) => {
      const sz = (lv) => size * ({ 0: 1, 1: .62, 2: .44, '-1': .62 })[lv], dy = (lv) => size * ({ 0: 0, 1: -.42, 2: -.26, '-1': .26 })[lv];
      c.save(); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      let w = 0; for (const [s, lv] of parts) { c.font = S.font(mo.w ?? 600, sz(lv)); w += c.measureText(s).width; }
      let px = mo.align === 'left' ? x : x - w / 2;
      for (const [s, lv, col] of parts) {
        c.font = S.font(mo.w ?? 600, sz(lv)); c.fillStyle = col ? K.rgba(col, mo.a ?? 1) : K.I(mo.a ?? 1);
        if (mo.glow) { c.shadowColor = K.rgba(col || mo.glow, .7); c.shadowBlur = 18; }
        c.fillText(s, px, y + dy(lv)); px += c.measureText(s).width;
      }
      c.restore(); return w;
    };
    return S;
  }
  window.CS = CS;
})();
