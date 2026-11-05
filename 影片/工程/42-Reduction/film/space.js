/* space.js — 資工所短影音的 3D 空間（依賴 motion.js + kit.js + cs.js）
 * 目的：把概念擺進一個有透視、景深、可以繞著走的「房間」，方便觀眾建立記憶宮殿。
 * 純 canvas 2D 投影（不用 WebGL）：畫面仍是 t 的純函數，渲染穩定。
 * 世界座標：x 向右、y 向前（遠離觀眾）、z 向上；地板是 z = 0。
 *   const V = Space(K, S);
 *   V.camKeys([[t, {pos:[x,y,z], tgt:[x,y,z], fov:45}], ...]);   // 鏡頭關鍵幀（位置、注視點、視角）
 *   render: V.begin(t) 之後用 V.floor / V.line / V.orb / V.pillar / V.ring / V.label / V.arrow 畫
 */
(function () {
  'use strict';
  const { lerp, clamp, ease: E } = M;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  function Space(K, S, o = {}) {
    const W = K.W, H = K.H;
    const V = { cx: o.cx ?? W / 2, cy: o.cy ?? H * .45, fogNear: o.fogNear ?? 8, fogFar: o.fogFar ?? 30 };
    let KEYS = [[0, { pos: [0, -10, 6], tgt: [0, 0, 0], fov: 45 }]];
    V.camKeys = (k) => { KEYS = k; };
    /** 繞 tgt 轉：角度 deg（0 = 從 −y 方向看）、水平距離 r、高度 h */
    V.orbit = (deg, r, h, tgt = [0, 0, 0], fov = 45) => { const a = deg * Math.PI / 180; return { pos: [tgt[0] + Math.sin(a) * r, tgt[1] - Math.cos(a) * r, tgt[2] + h], tgt, fov }; };
    V.camAt = (t) => {
      const kf = (f) => M.kf(t, KEYS.map(([tt, c, e]) => [tt, f(c), e || E.inOutCubic]));
      return { pos: kf((c) => c.pos), tgt: kf((c) => c.tgt), fov: kf((c) => c.fov ?? 45) };
    };
    let C = null;
    V.begin = (t) => {
      const c = V.camAt(t), f = norm(sub(c.tgt, c.pos)), r = norm(cross(f, [0, 0, 1])), u = cross(r, f);
      C = { pos: c.pos, f, r, u, focal: (H / 2) / Math.tan(c.fov * Math.PI / 360) };
      return C;
    };
    /** 投影：回傳 {x, y, s（每單位長的像素數）, z（深度）, fog（0..1，越遠越淡）}；在鏡頭後面回傳 null */
    V.p = (p) => {
      const d = sub(p, C.pos), zc = dot(d, C.f); if (zc < .2) return null;
      const s = C.focal / zc;
      return { x: V.cx + dot(d, C.r) * s, y: V.cy - dot(d, C.u) * s, s, z: zc, fog: 1 - clamp((zc - V.fogNear) / (V.fogFar - V.fogNear)) * .85 };
    };
    V.line = (c, a, b, lo = {}) => {
      const P = V.p(a), Q = V.p(b); if (!P || !Q) return;
      const al = (lo.a ?? 1) * Math.min(P.fog, Q.fog); if (al <= .003) return;
      const w = lo.w ?? 2.4, ws = lo.worldW ? Math.max(.8, lo.worldW * (P.s + Q.s) / 2) : w;
      if (lo.plain) { c.save(); c.strokeStyle = K.rgba(lo.color || K.P.accent, al); c.lineWidth = ws; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(Q.x, Q.y); c.stroke(); c.restore(); return; }
      K.glowLine(c, [[P.x, P.y], [Q.x, Q.y]], { w: ws, color: lo.color, a: al });
    };
    /** 3D 折線（例如路徑）：pts 為世界座標點列；p 0..1 生長進度 */
    V.path = (c, pts, lo = {}) => {
      const p = lo.p ?? 1, n = pts.length - 1, h = clamp(p) * n; const scr = [];
      for (let i = 0; i <= Math.floor(h); i++) { const q = V.p(pts[i]); if (q) scr.push([q.x, q.y]); }
      if (h < n) { const i = Math.floor(h), f = h - i, a = pts[i], b = pts[i + 1]; const q = V.p([lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)]); if (q) scr.push([q.x, q.y]); }
      if (scr.length > 1) K.glowLine(c, scr, { w: lo.w ?? 3, color: lo.color, a: lo.a ?? 1 });
      return scr[scr.length - 1];
    };
    V.arrow = (c, a, b, lo = {}) => {
      const P = V.p(a), Q = V.p(b); if (!P || !Q) return;
      const al = (lo.a ?? 1) * Math.min(P.fog, Q.fog); if (al <= .003) return;
      const w = lo.w ?? 3; K.glowLine(c, [[P.x, P.y], [Q.x, Q.y]], { w, color: lo.color, a: al });
      const ang = Math.atan2(Q.y - P.y, Q.x - P.x), s = lo.head ?? 18;
      K.glowLine(c, [[Q.x - Math.cos(ang - .45) * s, Q.y - Math.sin(ang - .45) * s], [Q.x, Q.y], [Q.x - Math.cos(ang + .45) * s, Q.y - Math.sin(ang + .45) * s]], { w, color: lo.color, a: al });
    };
    /** 地板格線（z = 0），越遠越淡 */
    V.floor = (c, fo = {}) => {
      const n = fo.n ?? 12, st = fo.step ?? 1, col = fo.color || K.P.accent, A = fo.a ?? 1, cx0 = fo.cx ?? 0, cy0 = fo.cy ?? 0;
      if (A <= .003) return;
      c.save(); c.lineWidth = 1;
      for (let i = -n; i <= n; i++) for (let j = -n; j < n; j++) {
        for (const [a, b] of [[[cx0 + i * st, cy0 + j * st, 0], [cx0 + i * st, cy0 + (j + 1) * st, 0]], [[cx0 + j * st, cy0 + i * st, 0], [cx0 + (j + 1) * st, cy0 + i * st, 0]]]) {
          const P = V.p(a), Q = V.p(b); if (!P || !Q) continue;
          const major = (fo.major ?? 0) && i % fo.major === 0, al = A * Math.min(P.fog, Q.fog) * (major ? .22 : .1) * (1 - clamp((Math.hypot(a[0] - cx0, a[1] - cy0) - n * st * .6) / (n * st * .4)));
          if (al <= .004) continue; c.strokeStyle = K.rgba(col, al); c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(Q.x, Q.y); c.stroke();
        }
      }
      c.restore();
    };
    /** 發光球：世界半徑 r */
    V.orb = (c, p, r, oo = {}) => { const P = V.p(p); if (!P) return null; const a = (oo.a ?? 1) * P.fog; if (a > .003) K.orb(c, P.x, P.y, Math.max(1.5, r * P.s), Object.assign({}, oo, { a })); return P; };
    V.core = (c, p, r, a = 1, col) => { const P = V.p(p); if (P) K.core(c, P.x, P.y, Math.max(1, r * P.s), a * P.fog, col); return P; };
    V.glow = (c, p, r, a = 1, col, kind = 'soft') => { const P = V.p(p); if (P) K.sprC(c, col, P.x, P.y, Math.max(2, r * P.s), a * P.fog, kind); return P; };
    /** 文字貼在 3D 位置（看板）：size 為世界單位高度；字號會隨距離縮放（上下限 minPx/maxPx） */
    V.label = (c, s, p, lo = {}) => { const P = V.p(p); if (!P) return null; const px = clamp((lo.size ?? .4) * P.s, lo.minPx ?? 18, lo.maxPx ?? 96); S.label(c, s, P.x + (lo.dx ?? 0), P.y + (lo.dy ?? 0), Object.assign({}, lo, { size: px, a: (lo.a ?? 1) * P.fog })); return P; };
    /** 地板上的圓環：中心 p（z 可不為 0）、半徑 r */
    V.ring = (c, p, r, lo = {}) => { const pts = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2; const q = V.p([p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r, p[2] ?? 0]); if (q) pts.push([q.x, q.y]); } if (pts.length > 2) K.glowLine(c, pts, { w: lo.w ?? 2, color: lo.color, a: (lo.a ?? 1) * (V.p(p)?.fog ?? 1) }); };
    /** 實心多邊形（世界座標頂點） */
    V.poly = (c, pts, fill, stroke, a = 1) => { const q = pts.map(V.p); if (q.some((x) => !x)) return; const fog = Math.min(...q.map((x) => x.fog)); c.save(); c.globalAlpha *= a * fog; c.beginPath(); q.forEach((x, i) => (i ? c.lineTo(x.x, x.y) : c.moveTo(x.x, x.y))); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); } c.restore(); };
    /** 發光柱（底面中心 base、寬 w、高 h）：只畫朝向鏡頭的面，頂面最亮 */
    V.pillar = (c, base, w, h, col, a = 1, po = {}) => {
      if (a <= .003 || h <= .001) return; const [x, y, z0] = base, d = w / 2, z1 = z0 + h;
      const P = (dx, dy, zz) => [x + dx, y + dy, zz];
      const faces = [
        { n: [0, -1, 0], q: [P(-d, -d, z0), P(d, -d, z0), P(d, -d, z1), P(-d, -d, z1)], k: .55 },
        { n: [1, 0, 0], q: [P(d, -d, z0), P(d, d, z0), P(d, d, z1), P(d, -d, z1)], k: .38 },
        { n: [-1, 0, 0], q: [P(-d, d, z0), P(-d, -d, z0), P(-d, -d, z1), P(-d, d, z1)], k: .38 },
        { n: [0, 1, 0], q: [P(d, d, z0), P(-d, d, z0), P(-d, d, z1), P(d, d, z1)], k: .3 },
        { n: [0, 0, 1], q: [P(-d, -d, z1), P(d, -d, z1), P(d, d, z1), P(-d, d, z1)], k: .95 },
      ];
      const mid = [x, y, (z0 + z1) / 2];
      for (const f of faces) { const toCam = sub(C.pos, mid); if (dot(f.n, toCam) <= 0) continue; V.poly(c, f.q, K.rgba(K.mix(col, '#ffffff', f.k * .35), (po.fill ?? .55) * f.k), K.rgba(K.mix(col, '#ffffff', .4), .85), a); }
      const top = V.p([x, y, z1]); if (top) K.sprC(c, col, top.x, top.y, Math.max(6, w * 1.4 * top.s), .45 * a * top.fog, 'soft');
    };
    /** 依深度排序後再畫：items = [{p:[x,y,z], draw:()=>{}}]，遠的先畫 */
    V.sorted = (items) => { items.map((it) => ({ it, z: (V.p(it.p) || { z: 1e9 }).z })).sort((a, b) => b.z - a.z).forEach(({ it }) => it.draw()); };
    return V;
  }
  window.Space = Space;
})();
