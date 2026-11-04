/* 資工所衝刺站 — 圖解引擎：在 Markdown 裡寫 ```fig … ``` 就畫出 SVG（跟著深淺色主題）
   種類：tree、array、graph、bits、lanes、timeline、bars、venn、plane、matrix、flow；用 --- 並排多張圖；cap: 圖說 */
'use strict';
const Fig = (() => {
  const E = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tw = s => [...String(s)].reduce((a, c) => a + (c.charCodeAt(0) > 0x2e80 ? 13 : 7.4), 0);
  const cls = s => /\*$/.test(s) ? ['hl', s.slice(0, -1)] : /!$/.test(s) ? ['bad', s.slice(0, -1)] : /\+$/.test(s) ? ['good', s.slice(0, -1)] : ['', s];
  const T = (x, y, s, o = '') => `<text x="${x}" y="${y}" ${o.replace(/text-anchor="(\w+)"/, 'style="text-anchor:$1"')}>${E(s)}</text>`;
  const arrowDef = '<defs><marker id="fga" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="fg-ah"/></marker><marker id="fgah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="fg-ahh"/></marker></defs>';
  const wrap = (w, h, body) => `<svg class="fg" viewBox="0 0 ${Math.ceil(w)} ${Math.ceil(h)}" width="${Math.ceil(w)}" role="img">${arrowDef}${body}</svg>`;
  const kv = lines => { const o = {}, rest = []; for (const l of lines) { const m = l.match(/^(\w+)\s*:\s*(.*)$/); if (m) (o[m[1]] = o[m[1]] || []).push(m[2]); else rest.push(l); } return [o, rest]; };

  /* ---------- tree：2(1,3)、[3 5](1,[4],[7 9])、5*(…) ---------- */
  function tree(lines) {
    const up = /\bup\b/.test(lines[0] || '') ; const src = lines.filter(l => !/^(up|down)$/.test(l.trim())).join('');
    let i = 0;
    const parse = () => {
      while (src[i] === ' ') i++;
      if (i >= src.length || src[i] === ',' || src[i] === ')') return null;
      let lab = '';
      if (src[i] === '[') { const j = src.indexOf(']', i); lab = src.slice(i, j + 1); i = j + 1; while (/[*!+]/.test(src[i] || '')) lab += src[i++]; }
      else while (i < src.length && !'(),'.includes(src[i])) lab += src[i++];
      const n = { lab: lab.trim(), kids: [] };
      if (src[i] === '(') { i++; for (;;) { n.kids.push(parse()); if (src[i] === ',') { i++; continue; } if (src[i] === ')') i++; break; } }
      return n;
    };
    const root = parse();
    const wOf = n => { if (!n) return 1; const [, l] = cls(n.lab); const own = l.startsWith('[') ? Math.max(1, (tw(l) + 10) / 46) : 1; n.w = Math.max(own, n.kids.reduce((a, k) => a + wOf(k), 0) || 0); return n.w; };
    wOf(root); const U = Math.min(52, 540 / root.w), out = []; let maxD = 0;
    const place = (n, x0, d) => { if (!n) return; n.x = x0 + n.w * U / 2; n.y = 26 + d * 62; maxD = Math.max(maxD, d); let x = x0; const sum = n.kids.reduce((a, k) => a + (k ? k.w : 1), 0); x += (n.w - sum) * U / 2; for (const k of n.kids) { place(k, x, d + 1); x += (k ? k.w : 1) * U; } };
    place(root, 10, 0);
    const edges = [], nodes = [];
    const draw = n => { if (!n) return; const [c, l] = cls(n.lab);
      for (const k of n.kids) if (k) { edges.push(up ? `<line x1="${k.x}" y1="${k.y - 16}" x2="${n.x}" y2="${n.y + 16}" class="fg-e" marker-end="url(#fga)"/>` : `<line x1="${n.x}" y1="${n.y}" x2="${k.x}" y2="${k.y}" class="fg-e"/>`); draw(k); }
      if (l.startsWith('[')) { const t = l.slice(1, -1).trim(), w = Math.max(30, tw(t) + 16); nodes.push(`<rect x="${n.x - w / 2}" y="${n.y - 15}" width="${w}" height="30" rx="6" class="fg-n ${c}"/>${T(n.x, n.y + 5, t, 'text-anchor="middle"')}`); }
      else if (l) nodes.push(`<circle cx="${n.x}" cy="${n.y}" r="${Math.max(16, tw(l) / 2 + 6)}" class="fg-n ${c}"/>${T(n.x, n.y + 5, l, 'text-anchor="middle"')}`);
    };
    draw(root);
    return [root.w * U + 20, 52 + maxD * 62, edges.join('') + nodes.join('')];
  }

  /* ---------- array：row 標籤: 10 17 24* _ ；row 3號: 10 -> 17 -> 24 ；idx: 0 1 2 ---------- */
  function array(lines) {
    const rows = []; let y = 8, w = 0, lw = 0;
    for (const l of lines) { const m = l.match(/^(row|idx)\s*([^:]*):\s*(.*)$/); if (!m) continue; rows.push({ k: m[1], lab: m[2].trim(), toks: m[3].trim().split(/\s+/) }); if (m[2].trim()) lw = Math.max(lw, tw(m[2].trim()) + 12); }
    const out = [];
    for (const r of rows) {
      if (r.k === 'idx') { let x = lw; r.toks.forEach(t => { out.push(T(x + 20, y + 2, t, 'text-anchor="middle" class="fg-m"')); x += 44; }); y += 14; continue; }
      y += 4; if (r.lab) out.push(T(0, y + 22, r.lab, 'class="fg-m"'));
      let x = lw;
      for (const t of r.toks) {
        if (t === '->') { out.push(`<line x1="${x + 2}" y1="${y + 17}" x2="${x + 22}" y2="${y + 17}" class="fg-e" marker-end="url(#fga)"/>`); x += 26; continue; }
        const [c, v] = cls(t), val = v === '_' ? '' : v, cw = Math.max(40, tw(val) + 14);
        out.push(`<rect x="${x}" y="${y}" width="${cw}" height="34" class="fg-n ${c} ${v === '_' ? 'fg-empty' : ''}"/>${T(x + cw / 2, y + 22, val, 'text-anchor="middle"')}`); x += cw + 4;
      }
      w = Math.max(w, x); y += 40;
    }
    return [w + 4, y + 4, out.join('')];
  }

  /* ---------- graph：nodes: s@0,1 a@1,0 ；edges: s>a:3 a-b:1* ---------- */
  function graph(lines) {
    const [o] = kv(lines); const N = {}, out = [];
    (o.nodes || []).join(' ').trim().split(/\s+/).forEach(t => { const m = t.match(/^([^@]+)@(-?[\d.]+),(-?[\d.]+)$/); if (m) { const [c, l] = cls(m[1]); N[l] = { x: +m[2], y: +m[3], c, l }; } });
    const xs = Object.values(N).map(n => n.x), ys = Object.values(N).map(n => n.y), mx = Math.max(...xs), my = Math.max(...ys), nx = Math.min(...xs), ny = Math.min(...ys);
    const S = Math.min(130, 480 / Math.max(1, mx - nx)), P = n => [30 + (n.x - nx) * S, 28 + (n.y - ny) * Math.min(S, 90)];
    for (const t of (o.edges || []).join(' ').trim().split(/\s+/).filter(Boolean)) {
      const m = t.match(/^([^>\-:]+)([>-])([^:*!+]+)(?::([^*!+]+))?([*!+]?)$/); if (!m || !N[m[1]] || !N[m[3]]) continue;
      const [x1, y1] = P(N[m[1]]), [x2, y2] = P(N[m[3]]), d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
      const c = m[5] === '*' ? 'fg-he' : m[5] === '!' ? 'fg-be' : m[5] === '+' ? 'fg-ge' : 'fg-e';
      out.push(`<line x1="${x1 + ux * 18}" y1="${y1 + uy * 18}" x2="${x2 - ux * 19}" y2="${y2 - uy * 19}" class="${c}" ${m[2] === '>' ? `marker-end="url(#${m[5] === '*' ? 'fgah' : 'fga'})"` : ''}/>`);
      if (m[4]) { const lx = (x1 + x2) / 2 - uy * 11, ly = (y1 + y2) / 2 + ux * 11 + 4; out.push(`<rect x="${lx - tw(m[4]) / 2 - 3}" y="${ly - 12}" width="${tw(m[4]) + 6}" height="16" rx="3" class="fg-bg"/>${T(lx, ly, m[4], 'text-anchor="middle" class="fg-w"')}`); }
    }
    for (const n of Object.values(N)) { const [x, y] = P(n), r = Math.max(17, tw(n.l) / 2 + 7); out.push(`<circle cx="${x}" cy="${y}" r="${r}" class="fg-n ${n.c}"/>${T(x, y + 5, n.l, 'text-anchor="middle"')}`); }
    return [60 + (mx - nx) * S, 56 + (my - ny) * Math.min(S, 90), out.join('')];
  }

  /* ---------- bits：bits: tag 18 | index 8 | offset 6 ---------- */
  function bits(lines) {
    const [o] = kv(lines); const f = (o.bits || [''])[0].split('|').map(s => s.trim()).filter(Boolean).map(s => { const m = s.match(/^(.*?)\s+(\d+)([*!+]?)$/); return m ? { n: m[1], b: +m[2], c: cls('x' + m[3])[0] } : { n: s, b: 1, c: '' }; });
    const tot = f.reduce((a, x) => a + x.b, 0), W = 520, out = []; let x = 10;
    if (o.top) out.push(T(10 + W / 2, 14, o.top[0], 'text-anchor="middle" class="fg-m"'));
    for (const x0 of f) { const w = Math.max(64, W * x0.b / tot); out.push(`<rect x="${x}" y="22" width="${w}" height="40" class="fg-n ${x0.c}"/>${T(x + w / 2, 40, x0.n, 'text-anchor="middle"')}${T(x + w / 2, 56, x0.b + ' 位', 'text-anchor="middle" class="fg-m"')}`); x += w; }
    return [x + 10, 70, out.join('')];
  }

  /* ---------- lanes（管線）：lw: 0 IF ID EX MEM WB ；add: 1 IF ID * EX MEM WB ---------- */
  function lanes(lines) {
    const rows = lines.map(l => l.match(/^([^:]+):\s*(\d+)\s+(.*)$/)).filter(Boolean).map(m => ({ lab: m[1].trim(), s: +m[2], seg: m[3].trim().split(/\s+/) }));
    const lw = Math.max(...rows.map(r => tw(r.lab))) + 14, C = Math.max(50, ...rows.flatMap(r => r.seg.map(sg => tw(cls(sg)[1]) + 14))), n = Math.max(...rows.map(r => r.s + r.seg.length)), out = [];
    for (let k = 0; k < n; k++) out.push(T(lw + k * C + C / 2, 14, k + 1, 'text-anchor="middle" class="fg-m"'));
    rows.forEach((r, j) => { const y = 22 + j * 36; out.push(T(0, y + 20, r.lab)); r.seg.forEach((sg, k) => { const x = lw + (r.s + k) * C, b = sg === '*' || sg === '泡'; const [c, l] = cls(sg); out.push(`<rect x="${x + 2}" y="${y}" width="${C - 4}" height="28" rx="5" class="fg-n ${b ? 'fg-bub' : c}"/>${T(x + C / 2, y + 19, b ? '泡' : l, 'text-anchor="middle" class="fg-s"')}`); }); });
    return [lw + n * C + 6, 28 + rows.length * 36, out.join('')];
  }

  /* ---------- timeline（排程）：timeline FCFS: P1 6 | P2 2 | P3 4 ---------- */
  function timeline(lines) {
    const rows = lines.map(l => l.match(/^timeline\s*([^:]*):\s*(.*)$/)).filter(Boolean).map(m => ({ lab: m[1].trim(), seg: m[2].split('|').map(s => s.trim().split(/\s+/)).map(([n, d]) => { const [c, l] = cls(n); return { n: l, d: +d, c }; }) }));
    const lw = Math.max(0, ...rows.map(r => tw(r.lab))) + (rows.some(r => r.lab) ? 12 : 0), tot = Math.max(...rows.map(r => r.seg.reduce((a, s) => a + s.d, 0))), S = Math.min(44, 500 / tot), out = [];
    rows.forEach((r, j) => { const y = 8 + j * 58; if (r.lab) out.push(T(0, y + 21, r.lab, 'class="fg-m"')); let t = 0; out.push(T(lw, y + 46, 0, 'text-anchor="middle" class="fg-m"'));
      r.seg.forEach(s => { const x = lw + t * S; out.push(`<rect x="${x}" y="${y}" width="${s.d * S}" height="30" class="fg-n ${s.c}"/>${T(x + s.d * S / 2, y + 20, s.n, 'text-anchor="middle"')}`); t += s.d; out.push(T(lw + t * S, y + 46, t, 'text-anchor="middle" class="fg-m"')); }); });
    return [lw + tot * S + 12, 14 + rows.length * 58, out.join('')];
  }

  /* ---------- bars：bar 第 0 層: 8 n ---------- */
  function bars(lines) {
    const rows = lines.map(l => l.match(/^bar\s*([^:]*):\s*([\d.]+)\s*(.*)$/)).filter(Boolean).map(m => { const [c, txt] = cls(m[3].trim()); return { lab: m[1].trim(), v: +m[2], t: txt, c }; });
    const lw = Math.max(...rows.map(r => tw(r.lab))) + 12, mx = Math.max(...rows.map(r => r.v)), W = 520 - lw, out = [];
    rows.forEach((r, j) => { const y = 6 + j * 32, w = Math.max(3, W * r.v / mx); out.push(T(0, y + 18, r.lab, 'class="fg-m"'), `<rect x="${lw}" y="${y}" width="${w}" height="24" rx="4" class="fg-bar ${r.c}"/>`, T(lw + w + 6 > 500 ? lw + w - 6 : lw + w + 6, y + 17, r.t || r.v, lw + w + 6 > 500 ? 'text-anchor="end" class="fg-in"' : '')); });
    return [540, 10 + rows.length * 32, out.join('')];
  }

  /* ---------- venn：venn: 2 的倍數 | 3 的倍數 ；nums: 34 16 17 ---------- */
  function venn(lines) {
    const [o] = kv(lines); const [a, b] = (o.venn || ['A|B'])[0].split('|').map(s => s.trim()), n = (o.nums || [''])[0].trim().split(/\s+/);
    const body = `<circle cx="190" cy="92" r="72" class="fg-va"/><circle cx="290" cy="92" r="72" class="fg-vb"/>${T(150, 14, a, 'text-anchor="middle"')}${T(330, 14, b, 'text-anchor="middle"')}${T(158, 98, n[0] || '', 'text-anchor="middle" class="fg-big"')}${T(240, 98, n[1] || '', 'text-anchor="middle" class="fg-big"')}${T(322, 98, n[2] || '', 'text-anchor="middle" class="fg-big"')}`;
    return [480, 172, body];
  }

  /* ---------- plane：range: -1 4 -1 4 ；vec (1,1) hl "v" ；pt (0,6) "A" ；line 5 -3 ；seg (x,y) (x,y) dash ；poly … ---------- */
  function plane(lines) {
    const [o, rest] = kv(lines); const [x0, x1, y0, y1] = (o.range || ['-1 4 -1 4'])[0].trim().split(/\s+/).slice(0, 4).map(Number);
    const st = /stretch/.test((o.range || [''])[0]), S = Math.min(56, 400 / (x1 - x0), 300 / (y1 - y0)), Sx = st ? Math.min(90, 360 / (x1 - x0)) : S, Sy = st ? Math.min(56, 300 / (y1 - y0)) : S, W = (x1 - x0) * Sx, H = (y1 - y0) * Sy, X = x => 20 + (x - x0) * Sx, Y = y => 10 + (y1 - y) * Sy, out = [];
    for (let x = Math.ceil(x0); x <= x1; x++) out.push(`<line x1="${X(x)}" y1="${Y(y0)}" x2="${X(x)}" y2="${Y(y1)}" class="${x === 0 ? 'fg-ax' : 'fg-grid'}"/>`);
    for (let y = Math.ceil(y0); y <= y1; y++) out.push(`<line x1="${X(x0)}" y1="${Y(y)}" x2="${X(x1)}" y2="${Y(y)}" class="${y === 0 ? 'fg-ax' : 'fg-grid'}"/>`);
    const P = s => s.match(/\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g).map(p => p.replace(/[()\s]/g, '').split(',').map(Number));
    const lab = s => { const m = s.match(/"([^"]*)"/); return m ? m[1] : ''; }, col = s => /\bhl\b/.test(s) ? 'hl' : /\bbad\b/.test(s) ? 'bad' : /\bgood\b/.test(s) ? 'good' : '';
    for (const l of rest) {
      const k = l.trim().split(/\s+/)[0], c = col(l), t = lab(l);
      if (k === 'vec') { const [[a, b]] = P(l), m = l.match(/from\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/), fx = m ? +m[1] : 0, fy = m ? +m[2] : 0; out.push(`<line x1="${X(fx)}" y1="${Y(fy)}" x2="${X(fx + a)}" y2="${Y(fy + b)}" class="fg-v ${c}" marker-end="url(#${c === 'hl' ? 'fgah' : 'fga'})"/>`); if (t) out.push(T(X(fx + a) + 6, Y(fy + b) - 6, t, `class="fg-lab ${c}"`)); }
      else if (k === 'pt') { for (const [a, b] of P(l)) out.push(`<circle cx="${X(a)}" cy="${Y(b)}" r="5" class="fg-pt ${c}"/>`); if (t) { const [[a, b]] = P(l); out.push(T(X(a) + 8, Y(b) - 6, t, `class="fg-lab ${c}"`)); } }
      else if (k === 'line') { const [C, D] = l.replace(/"[^"]*"/, '').trim().split(/\s+/).slice(1, 3).map(Number); let a0 = x0, a1 = x1; if (D) { const xa = (y0 - C) / D, xb = (y1 - C) / D; a0 = Math.max(x0, Math.min(xa, xb)); a1 = Math.min(x1, Math.max(xa, xb)); } out.push(`<line x1="${X(a0)}" y1="${Y(C + D * a0)}" x2="${X(a1)}" y2="${Y(C + D * a1)}" class="fg-ln ${c}"/>`); }
      else if (k === 'seg') { const [[a, b], [p, q]] = P(l); out.push(`<line x1="${X(a)}" y1="${Y(b)}" x2="${X(p)}" y2="${Y(q)}" class="fg-ln ${c} ${/dash/.test(l) ? 'fg-dash' : ''}"/>`); if (t) out.push(T((X(a) + X(p)) / 2 + 6, (Y(b) + Y(q)) / 2, t, `class="fg-lab ${c}"`)); }
      else if (k === 'poly') { const ps = P(l); out.push(`<polygon points="${ps.map(([a, b]) => X(a) + ',' + Y(b)).join(' ')}" class="fg-poly ${c}"/>`); if (t) { const cx = ps.reduce((s, p) => s + p[0], 0) / ps.length, cy = ps.reduce((s, p) => s + p[1], 0) / ps.length; out.push(T(X(cx), Y(cy) + 5, t, `text-anchor="middle" class="fg-lab ${c}"`)); } }
      else if (k === 'text') { const [[a, b]] = P(l); out.push(T(X(a), Y(b), t, `class="fg-lab ${c}"`)); }
    }
    return [W + 40, H + 24, out.join('')];
  }

  /* ---------- matrix：matrix: 1 2 3 ; 4 5 6 ；pivot: 1,1 2,2 ；free: 3 ；name: A ---------- */
  function matrix(lines) {
    const [o] = kv(lines); const rows = (o.matrix || [''])[0].split(';').map(r => r.trim().split(/\s+/));
    const piv = new Set(((o.pivot || [''])[0].match(/\d+,\d+/g) || [])), free = new Set(((o.free || [''])[0].match(/\d+/g) || []).map(Number)), bad = new Set(((o.bad || [''])[0].match(/\d+/g) || []).map(Number));
    const C = 46, R = 34, nm = (o.name || [''])[0], lw = nm ? tw(nm) + 18 : 0, nc = Math.max(...rows.map(r => r.length)), out = [];
    if (nm) out.push(T(0, 14 + rows.length * R / 2 + 5, nm + ' ='));
    const x0 = lw + 8, y0 = 14;
    out.push(`<path d="M${x0 + 6},${y0} h-6 v${rows.length * R} h6 M${x0 + nc * C + 4},${y0} h6 v${rows.length * R} h-6" class="fg-br"/>`);
    for (const c of free) out.push(`<rect x="${x0 + (c - 1) * C + 3}" y="${y0 - 2}" width="${C - 2}" height="${rows.length * R + 4}" rx="6" class="fg-free"/>${T(x0 + (c - 1) * C + C / 2 + 2, y0 + rows.length * R + 18, '自由', 'text-anchor="middle" class="fg-lab good"')}`);
    for (const r of bad) out.push(`<rect x="${x0 + 2}" y="${y0 + (r - 1) * R + 2}" width="${nc * C}" height="${R - 4}" rx="6" class="fg-badrow"/>`);
    rows.forEach((r, i) => r.forEach((v, j) => { const p = piv.has(`${i + 1},${j + 1}`); if (p) out.push(`<circle cx="${x0 + j * C + C / 2 + 2}" cy="${y0 + i * R + R / 2}" r="14" class="fg-piv"/>`); out.push(T(x0 + j * C + C / 2 + 2, y0 + i * R + R / 2 + 5, v, 'text-anchor="middle"')); }));
    return [x0 + nc * C + 20, y0 + rows.length * R + (free.size ? 28 : 10), out.join('')];
  }

  /* ---------- flow：flow: CPU -> L1 快 -> 記憶體 慢 ；用 | 分岔：fork() -> 父：拿到子 PID | 子：拿到 0 ---------- */
  function flow(lines) {
    const out = []; let W = 0, Y = 4;
    for (const l of lines) {
      const m = l.match(/^flow\s*:?\s*(.*)$/); if (!m) continue;
      const st = m[1].split('->').map(s => s.split('|').map(b => b.trim()).filter(Boolean));
      const bw = st.map(bs => Math.max(...bs.map(b => tw(cls(b)[1]) + 22), 56)), maxB = Math.max(...st.map(b => b.length)), H = maxB * 44 - 8;
      let x = 4; const pos = [];
      st.forEach((bs, i) => { const ys = bs.map((_, k) => Y + (H - (bs.length * 44 - 8)) / 2 + k * 44); pos.push(bs.map((b, k) => { const [c, t] = cls(b); out.push(`<rect x="${x}" y="${ys[k]}" width="${bw[i]}" height="36" rx="8" class="fg-n ${c}"/>${T(x + bw[i] / 2, ys[k] + 23, t, 'text-anchor="middle"')}`); return [x, ys[k] + 18, x + bw[i]]; })); x += bw[i] + 34; });
      for (let i = 0; i + 1 < pos.length; i++) for (const [ai, a] of pos[i].entries()) for (const [bi, b] of pos[i + 1].entries()) if (pos[i].length !== pos[i + 1].length || ai === bi) out.push(`<line x1="${a[2] + 2}" y1="${a[1]}" x2="${b[0] - 3}" y2="${b[1]}" class="fg-e" marker-end="url(#fga)"/>`);
      W = Math.max(W, x - 30); Y += H + 16;
    }
    return [W + 4, Y - 8, out.join('')];
  }

  const KIND = { tree, array, graph, bits, lanes, timeline, bars, venn, plane, matrix, flow };
  function one(src) {
    const lines = src.split('\n').map(l => l.replace(/\s+$/, '')).filter(l => l.trim());
    const cap = lines.filter(l => /^cap\s*:/.test(l)).map(l => l.replace(/^cap\s*:\s*/, '')).join(' ');
    const body = lines.filter(l => !/^cap\s*:/.test(l));
    let kind = (body[0] || '').trim().split(/[\s:]/)[0];
    if (!KIND[kind]) return '';
    if (['tree', 'array', 'lanes'].includes(kind) && /^\w+\s*$/.test(body[0].trim()) || /^tree\s+up\s*$/.test(body[0].trim())) { if (/^tree\s+up/.test(body[0])) body[0] = 'up'; else body.shift(); }
    try { const [w, h, svg] = KIND[kind](body); return `<figure class="fgw">${wrap(w, h, svg)}${cap ? `<figcaption>${typeof mdLine === 'function' ? mdLine(cap) : E(cap)}</figcaption>` : ''}</figure>`; }
    catch (e) { return `<pre class="code">${E(src)}</pre>`; }
  }
  return { svg(src) { const parts = src.split(/^---\s*$/m).map(one).filter(Boolean); return parts.length > 1 ? `<div class="fg-row">${parts.join('')}</div>` : parts.join(''); } };
})();
