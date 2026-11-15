/* 資工所衝刺站 — 補齊每一章的互動實驗（和同章短影音的畫面一致：先看影片，再自己換數字玩一次）
   說明文字一律一句話；數字、狀態、顏色交給畫面。 */
'use strict';

/* ---------- 共用小工具 ---------- */
const LM = {
  W: (w, h, body, cls = '') => `<div class="svgwrap"><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="lm ${cls}" role="img">${body}</svg></div>`,
  box: (x, y, w, h, txt, st = '') => `<g class="lm-box ${st}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/><text x="${x + w / 2}" y="${y + h / 2 + 5}">${txt}</text></g>`,
  line: (x1, y1, x2, y2, st = '') => `<line class="lm-ln ${st}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`,
  text: (x, y, t, st = '', anchor = 'middle') => `<text class="lm-t ${st}" x="${x}" y="${y}" text-anchor="${anchor}">${t}</text>`,
  rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; },
  bits: (s, st) => s.split('').map(ch => `<span class="lm-bit ${st}">${ch}</span>`).join(''),
  fmt: (x, d = 3) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(d).replace(/0+$/, '').replace(/\.$/, '')),
};

/* ============ B 樹插入與分裂（資結：ds-btree） ============ */
Labs.reg({
  id: 'btree', title: 'B 樹插入：滿了就往上分裂', subject: 'ds', lessons: ['ds-btree'],
  desc: '依序插入，節點超過上限就把中間的 key 推上去；樹只會從根長高',
  form: [{ id: 'keys', label: '依序插入', value: '10 20 30 40 50 60 70', wide: true }, { id: 'max', label: '每個節點最多幾個 key', type: 'select', value: '2', options: [['2', '2（2-3 樹）'], ['3', '3（t = 2）']] }],
  presets: [{ name: '影片：10 到 70', v: { keys: '10 20 30 40 50 60 70', max: '2' } }, { name: '亂序', v: { keys: '35 10 80 25 60 5 45 90 15', max: '2' } }, { name: 't = 2', v: { keys: '1 2 3 4 5 6 7 8 9 10', max: '3' } }],
  build(v) {
    const K = +v.max, a = nums(v.keys); if (a.length > 24) throw new Error('最多 24 個');
    const clone = n => n && { k: n.k.slice(), c: n.c.map(clone) };
    let root = null; const F = [];
    const snap = (note, hl = [], over = null) => F.push({ root: clone(root), note, hl, over, K });
    snap('空樹。');
    for (const x of a) {
      if (!root) { root = { k: [x], c: [] }; snap(`插入 ${x}。`, [x]); continue; }
      const path = []; let n = root;
      while (true) { path.push(n); if (!n.c.length) break; let i = 0; while (i < n.k.length && x > n.k[i]) i++; n = n.c[i]; }
      if (n.k.includes(x)) { snap(`${x} 已經在樹裡。`, [x]); continue; }
      n.k.push(x); n.k.sort((p, q) => p - q); snap(`插入 ${x}。`, [x], n.k.length > K ? n.k.slice() : null);
      for (let d = path.length - 1; d >= 0; d--) {
        const nd = path[d]; if (nd.k.length <= K) break;
        const m = Math.floor(nd.k.length / 2), mid = nd.k[m];
        const L = { k: nd.k.slice(0, m), c: nd.c.slice(0, m + 1) }, R = { k: nd.k.slice(m + 1), c: nd.c.slice(m + 1) };
        if (d === 0) { root = { k: [mid], c: [L, R] }; snap(`根滿了：${mid} 變成新根，樹長高一層。`, [mid]); }
        else { const P = path[d - 1], j = P.c.indexOf(nd); P.c.splice(j, 1, L, R); P.k.splice(j, 0, mid); snap(`分裂：${mid} 往上推。`, [mid], P.k.length > K ? P.k.slice() : null); }
      }
    }
    let h = 0; for (let n = root; n; n = n.c[0]) h++;
    snap(`完成。高度 ${h}，所有葉子同一層。`);
    return F;
  },
  render(f, st) {
    if (!f.root) { st.innerHTML = '<p class="muted">（空樹）</p>'; return; }
    const KW = 30, GAP = 14, LH = 70, levels = [];
    (function walk(n, d) { (levels[d] = levels[d] || []).push(n); n._d = d; n.c.forEach(c => walk(c, d + 1)); })(f.root, 0);
    const wOf = n => n.k.length * KW + 10;
    const leaves = levels[levels.length - 1]; let x = 10;
    const place = n => { if (!n.c.length) { n._x = x + wOf(n) / 2; x += wOf(n) + GAP; } else { n.c.forEach(place); n._x = (n.c[0]._x + n.c[n.c.length - 1]._x) / 2; } };
    place(f.root);
    const W = Math.max(300, x), H = levels.length * LH + 10;
    let e = '', b = '';
    levels.forEach(lv => lv.forEach(n => {
      const y = 12 + n._d * LH, w = wOf(n), over = f.over && n.k.length === f.over.length && n.k.every((k, i) => k === f.over[i]);
      n.c.forEach(c => { e += LM.line(n._x, y + 30, c._x, 12 + c._d * LH, ''); });
      b += `<g class="lm-node ${over ? 'over' : ''}"><rect x="${n._x - w / 2}" y="${y}" width="${w}" height="30" rx="6"/>`;
      n.k.forEach((k, i) => { const kx = n._x - w / 2 + 5 + i * KW; b += `${i ? `<line class="lm-sep" x1="${kx}" y1="${y + 4}" x2="${kx}" y2="${y + 26}"/>` : ''}<text class="${f.hl.includes(k) ? 'hl' : ''}" x="${kx + KW / 2}" y="${y + 20}">${k}</text>`; });
      b += '</g>';
    }));
    st.innerHTML = LM.W(W, H, e + b, 'btree') + `<p class="lm-cap">上限 ${f.K} 個 key${f.over ? '　<b class="bad-t">超過了</b>' : ''}</p>`;
  },
});

/* ============ 動態陣列加倍（資結：ds-amortized） ============ */
Labs.reg({
  id: 'amort', title: '動態陣列：滿了就加倍', subject: 'ds', lessons: ['ds-amortized'],
  desc: '偶爾一次很貴（整個搬家），但平均每次插入只要常數',
  form: [{ id: 'n', label: '插入幾次', type: 'number', value: '17', size: 4 }, { id: 'g', label: '滿了變成幾倍', type: 'select', value: '2', options: [['2', '2 倍'], ['1.5', '1.5 倍'], ['add', '每次 +4（不加倍）']] }],
  presets: [{ name: '加倍 17 次', v: { n: '17', g: '2' } }, { name: '每次 +4', v: { n: '17', g: 'add' } }],
  build(v) {
    const n = Math.max(1, Math.min(40, +v.n || 17)), F = []; let cap = 1, size = 0, total = 0; const cost = [];
    for (let i = 1; i <= n; i++) {
      let c = 1, moved = 0;
      if (size === cap) { moved = size; c += size; cap = v.g === 'add' ? cap + 4 : Math.max(cap + 1, Math.ceil(cap * +v.g)); }
      size++; total += c; cost.push(c);
      F.push({ size, cap, cost: cost.slice(), total, i, moved, note: moved ? `第 ${i} 次：滿了，搬 ${moved} 個到新陣列（容量 ${cap}）。` : `第 ${i} 次：直接放進去。` });
    }
    F.push(Object.assign({}, F[F.length - 1], { note: `總共 ${total}，平均每次 ${(total / n).toFixed(2)}${v.g === 'add' ? '：會隨 n 變大' : '：不超過 3'}。`, end: true }));
    return F;
  },
  render(f, st) {
    const cells = Array.from({ length: f.cap }, (_, k) => k < f.size ? '■' : '');
    const arr = svgArray(cells, { cls: k => k === f.size - 1 ? 'hl' : k < f.size ? '' : 'probe' });
    st.innerHTML = `<p class="lm-cap">容量 ${f.cap}，已用 ${f.size}</p>${arr}${svgBars(f.cost, { cls: k => f.cost[k] > 1 ? 'hl' : '' })}<p class="lm-cap">每次插入的成本　總和 <b>${f.total}</b>　平均 <b>${(f.total / f.i).toFixed(2)}</b></p>`;
  },
});

/* ============ Huffman（演算法：al-greedy） ============ */
Labs.reg({
  id: 'huffman', title: 'Huffman：最少的兩個先合併', subject: 'al', lessons: ['al-greedy'],
  desc: '每次從佇列拿出頻率最小的兩棵樹合併，常出現的字拿到短碼',
  form: [{ id: 'f', label: '字元:頻率', value: 'a:45 b:13 c:12 d:16 e:9 f:5', wide: true }],
  presets: [{ name: 'CLRS 例', v: { f: 'a:45 b:13 c:12 d:16 e:9 f:5' } }, { name: '平均', v: { f: 'a:1 b:1 c:1 d:1' } }, { name: 'Fibonacci', v: { f: 'a:1 b:1 c:2 d:3 e:5 f:8' } }],
  build(v) {
    const items = String(v.f).trim().split(/[\s,，]+/).map(s => { const [c, w] = s.split(':'); if (!c || isNaN(+w)) throw new Error('格式：字元:頻率'); return { k: c + ':' + w, w: +w, ch: c }; });
    if (items.length < 2 || items.length > 12) throw new Error('2 到 12 個字元');
    let Q = items.map(x => ({ k: x.k, w: x.w, ch: x.ch, l: null, r: null })), F = [];
    const sortQ = () => Q.sort((p, q) => p.w - q.w);
    sortQ(); F.push({ Q: Q.map(x => x.w), tree: null, note: '依頻率排好。' });
    while (Q.length > 1) {
      const a = Q.shift(), b = Q.shift(), m = { k: String(a.w + b.w), w: a.w + b.w, l: a, r: b };
      Q.push(m); sortQ(); F.push({ Q: Q.map(x => x.w), tree: m, pick: [a.w, b.w], note: `${a.w} + ${b.w} = ${m.w}` });
    }
    const codes = []; (function walk(n, s) { if (!n.l) { codes.push([n.ch, n.w, s || '0']); return; } walk(n.l, s + '0'); walk(n.r, s + '1'); })(Q[0], '');
    const cost = codes.reduce((t, [, w, s]) => t + w * s.length, 0), fixed = Math.ceil(Math.log2(items.length)) * items.reduce((t, x) => t + x.w, 0);
    F.push({ Q: Q.map(x => x.w), tree: Q[0], codes, note: `總長 ${cost}，固定長度要 ${fixed}。` });
    return F;
  },
  render(f, st) {
    const q = svgArray(f.Q, { cls: k => f.pick && k === f.Q.indexOf(f.pick[0] + f.pick[1]) ? 'hl' : '' });
    const t = f.tree ? svgTree(f.tree, { hl: f.tree ? [f.tree.k] : [] }) : '';
    const c = f.codes ? htmlTable(f.codes.map(([ch, w, s]) => [ch, w, `<code>${s}</code>`]), { head: ['字元', '頻率', '碼'] }) : '';
    st.innerHTML = `<p class="lm-cap">佇列</p>${q}${t}${c}`;
  },
});

/* ============ Karatsuba（演算法：al-dc） ============ */
Labs.reg({
  id: 'karatsuba', title: 'Karatsuba：4 次乘法變 3 次', subject: 'al', lessons: ['al-dc'],
  desc: '先乘兩個角 ac、bd，再乘一次 (a+b)(c+d)，整塊減兩角就是中間',
  form: [{ id: 'x', label: 'x', value: '12', size: 8 }, { id: 'y', label: 'y', value: '34', size: 8 }],
  presets: [{ name: '12 × 34', v: { x: '12', y: '34' } }, { name: '1234 × 5678', v: { x: '1234', y: '5678' } }, { name: '99 × 99', v: { x: '99', y: '99' } }],
  build(v) {
    const x = String(v.x).trim(), y = String(v.y).trim(); if (!/^\d{1,8}$/.test(x) || !/^\d{1,8}$/.test(y)) throw new Error('1 到 8 位正整數');
    const n = Math.max(x.length, y.length), h = Math.ceil(n / 2), B = 10 ** h, X = +x, Y = +y;
    const a = Math.floor(X / B), b = X % B, c = Math.floor(Y / B), d = Y % B;
    const ac = a * c, bd = b * d, big = (a + b) * (c + d), mid = big - ac - bd, F = [];
    const base = { a, b, c, d, B, h };
    F.push(Object.assign({ note: `拆成 ${a}·10${h > 1 ? '^' + h : ''} + ${b} 和 ${c}·10${h > 1 ? '^' + h : ''} + ${d}。`, show: [] }, base));
    F.push(Object.assign({ note: `第 1 次：ac = ${ac}`, show: ['ac'], ac }, base));
    F.push(Object.assign({ note: `第 2 次：bd = ${bd}`, show: ['ac', 'bd'], ac, bd }, base));
    F.push(Object.assign({ note: `第 3 次：(a+b)(c+d) = ${a + b}×${c + d} = ${big}`, show: ['ac', 'bd', 'big'], ac, bd, big }, base));
    F.push(Object.assign({ note: `中間 = ${big} − ${ac} − ${bd} = ${mid}`, show: ['ac', 'bd', 'mid'], ac, bd, big, mid }, base));
    F.push(Object.assign({ note: `${ac}·${B * B} + ${mid}·${B} + ${bd} = ${ac * B * B + mid * B + bd}${ac * B * B + mid * B + bd === X * Y ? '　✓' : ''}`, show: ['ac', 'bd', 'mid'], ac, bd, big, mid, done: true }, base));
    return F;
  },
  render(f, st) {
    const S = 230, cx = 70, cy = 30, sh = f.show, on = k => sh.includes(k);
    const cell = (x, y, lbl, val, k) => `<g class="lm-cell ${on(k) ? 'on ' + k : ''}"><rect x="${x}" y="${y}" width="${S / 2 - 4}" height="${S / 2 - 4}" rx="6"/><text x="${x + S / 4 - 2}" y="${y + S / 4 - 4}">${lbl}</text><text class="v" x="${x + S / 4 - 2}" y="${y + S / 4 + 18}">${on(k) || (k === 'ad' || k === 'bc') && on('mid') ? val : '?'}</text></g>`;
    let g = cell(cx, cy, 'ac', f.ac ?? '', 'ac') + cell(cx + S / 2, cy, 'bc', f.b * f.c, on('mid') ? 'mid' : 'bc') + cell(cx, cy + S / 2, 'ad', f.a * f.d, on('mid') ? 'mid' : 'ad') + cell(cx + S / 2, cy + S / 2, 'bd', f.bd ?? '', 'bd');
    if (on('big')) g += `<rect class="lm-big" x="${cx - 6}" y="${cy - 6}" width="${S + 8}" height="${S + 8}" rx="10"/><text class="lm-t big" x="${cx + S / 2}" y="${cy + S + 26}">(a+b)(c+d) = ${f.big}</text>`;
    g += LM.text(cx + S / 4, cy - 10, 'a = ' + f.a, 'am') + LM.text(cx + 3 * S / 4, cy - 10, 'b = ' + f.b, 'cy') + LM.text(cx - 12, cy + S / 4, 'c = ' + f.c, 'am', 'end') + LM.text(cx - 12, cy + 3 * S / 4, 'd = ' + f.d, 'cy', 'end');
    const muls = sh.includes('mid') ? 3 : sh.filter(k => k !== 'mid').length;
    st.innerHTML = LM.W(cx + S + 30, cy + S + 40, g) + `<p class="lm-cap">乘法 <b>${muls}</b> 次（直接算要 4 次）　每層 3 支 → Θ(n<sup>lg 3</sup>)</p>`;
  },
});

/* ============ 遞迴樹（演算法：al-recurrence） ============ */
Labs.reg({
  id: 'rectree', title: '遞迴樹：每一層花多少', subject: 'al', lessons: ['al-recurrence'],
  desc: 'T(n) = a·T(n/b) + n^d：比較每一層的成本，看是頂層、平均、還是葉子主導',
  form: [{ id: 'a', label: 'a（分幾支）', type: 'number', value: '2', size: 3 }, { id: 'b', label: 'b（縮幾倍）', type: 'number', value: '2', size: 3 }, { id: 'd', label: 'd（每層 n^d）', type: 'number', value: '1', size: 3 }, { id: 'n', label: 'n', type: 'number', value: '64', size: 5 }],
  presets: [{ name: '合併排序 2,2,1', v: { a: '2', b: '2', d: '1' } }, { name: 'Karatsuba 3,2,1', v: { a: '3', b: '2', d: '1' } }, { name: '二分搜尋 1,2,0', v: { a: '1', b: '2', d: '0' } }, { name: '頂層主導 2,2,2', v: { a: '2', b: '2', d: '2' } }],
  build(v) {
    const a = +v.a, b = +v.b, d = +v.d, n = +v.n; if (!(a >= 1 && b > 1 && n >= 2 && n <= 1e6)) throw new Error('a ≥ 1、b > 1、2 ≤ n ≤ 10⁶');
    const L = Math.floor(Math.log(n) / Math.log(b) + 1e-9), lv = [], F = [];
    for (let i = 0; i <= L; i++) { lv.push(a ** i * (n / b ** i) ** d); F.push({ lv: lv.slice(), i, note: `第 ${i} 層：${LM.fmt(a ** i)} 個子問題 × (${LM.fmt(n / b ** i)})^${d} = ${LM.fmt(lv[i], 1)}` }); }
    const e = Math.log(a) / Math.log(b), r = a / b ** d;
    const kind = Math.abs(r - 1) < 1e-9 ? `每層一樣 → Θ(n^${LM.fmt(d)} log n)` : r < 1 ? `越往下越小，頂層主導 → Θ(n^${LM.fmt(d)})` : `越往下越大，葉子主導 → Θ(n^${LM.fmt(e)})`;
    F.push({ lv, i: L, note: `比值 a/b^d = ${LM.fmt(r)}：${kind}`, end: true });
    return F;
  },
  render(f, st) { st.innerHTML = svgBars(f.lv.map(x => Math.round(x)), { cls: k => k === f.i ? 'hl' : '' }) + `<p class="lm-cap">每一層的成本（第 0 層在最左）　總和 <b>${LM.fmt(f.lv.reduce((s, x) => s + x, 0), 0)}</b></p>`; },
});

/* ============ 雇用問題（演算法：al-prob） ============ */
Labs.reg({
  id: 'hiring', title: '雇用問題：平均換幾次', subject: 'al', lessons: ['al-prob'],
  desc: '隨機順序下，第 i 個被雇的機率是 1/i；做很多次取平均，會貼近 Hₙ ≈ ln n',
  form: [{ id: 'n', label: '應徵人數 n', type: 'number', value: '10', size: 4 }, { id: 't', label: '模擬幾次', type: 'number', value: '200', size: 5 }, { id: 'seed', label: '亂數種子', type: 'number', value: '7', size: 4 }],
  presets: [{ name: 'n = 10', v: { n: '10', t: '200' } }, { name: 'n = 100', v: { n: '100', t: '500' } }],
  build(v) {
    const n = Math.max(2, Math.min(200, +v.n || 10)), T = Math.max(1, Math.min(2000, +v.t || 200)), R = LM.rng(+v.seed || 7), F = [];
    const perm = () => { const p = Array.from({ length: n }, (_, i) => i + 1); for (let i = n - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p; };
    const p0 = perm(); let best = 0, hires = 0;
    if (n <= 30) p0.forEach((x, i) => { const h = x > best; if (h) { best = x; hires++; } F.push({ p: p0, i, hires, best, note: h ? `第 ${i + 1} 個（${x}）比目前最好的強：換人。` : `第 ${i + 1} 個（${x}）沒有比較強。` }); });
    else { p0.forEach(x => { if (x > best) { best = x; hires++; } }); F.push({ p: null, hires, note: `這一輪換了 ${hires} 次。` }); }
    const hist = []; let sum = 0;
    for (let t = 0; t < T; t++) { const p = perm(); let b = 0, h = 0; for (const x of p) if (x > b) { b = x; h++; } hist[h] = (hist[h] || 0) + 1; sum += h; }
    let H = 0; for (let i = 1; i <= n; i++) H += 1 / i;
    F.push({ hist, avg: sum / T, H, n, note: `做 ${T} 次：平均 ${(sum / T).toFixed(2)} 次；Hₙ = ${H.toFixed(2)}；最壞 ${n} 次。` });
    return F;
  },
  render(f, st) {
    if (f.hist) { const arr = Array.from({ length: Math.max(...Object.keys(f.hist).map(Number)) + 1 }, (_, k) => f.hist[k] || 0); st.innerHTML = svgBars(arr, { cls: k => Math.abs(k - f.avg) < .5 ? 'hl' : '' }) + `<p class="lm-cap">換人次數的分布（從 0 次起）　平均 <b>${f.avg.toFixed(2)}</b>　Hₙ <b>${f.H.toFixed(2)}</b></p>`; return; }
    if (!f.p) { st.innerHTML = `<p class="lm-cap">換了 <b>${f.hires}</b> 次</p>`; return; }
    let b = 0; const hired = f.p.map((x, k) => { const h = k <= f.i && x > b; if (k <= f.i && x > b) b = x; return h; });
    st.innerHTML = svgBars(f.p, { cls: k => k > f.i ? 'probe' : hired[k] ? 'hl' : '' }) + `<p class="lm-cap">換人 <b>${f.hires}</b> 次　目前最好 <b>${f.best}</b></p>`;
  },
});

/* ============ 頂點覆蓋：找很難、驗證很快（演算法：al-np） ============ */
Labs.reg({
  id: 'vcover', title: '頂點覆蓋：找很難，驗證很快', subject: 'al', lessons: ['al-np'],
  desc: '暴力法要試 C(n, k) 組；但給你一組答案，看每條邊就能 O(E) 驗證——這就是「在 NP」',
  form: [{ id: 'e', label: '邊（u-v）', value: '1-2 1-3 2-3 2-4 3-5 4-5 4-6 5-6', wide: true }, { id: 'k', label: 'k', type: 'number', value: '3', size: 3 }],
  presets: [{ name: '6 點 8 邊、k = 3', v: { e: '1-2 1-3 2-3 2-4 3-5 4-5 4-6 5-6', k: '3' } }, { name: 'k = 2（找不到）', v: { e: '1-2 1-3 2-3 2-4 3-5 4-5 4-6 5-6', k: '2' } }, { name: '星形', v: { e: '1-2 1-3 1-4 1-5 1-6', k: '1' } }],
  build(v) {
    const E = String(v.e).trim().split(/[\s,，]+/).map(s => s.split('-').map(Number)); if (E.some(p => p.length !== 2 || p.some(isNaN))) throw new Error('格式：1-2 2-3 …');
    const V = [...new Set(E.flat())].sort((a, b) => a - b), k = +v.k; if (V.length > 10) throw new Error('最多 10 個點');
    const F = [], subs = []; (function gen(i, cur) { if (cur.length === k) { subs.push(cur.slice()); return; } if (i >= V.length) return; cur.push(V[i]); gen(i + 1, cur); cur.pop(); gen(i + 1, cur); })(0, []);
    let tried = 0, found = null;
    for (const s of subs) { tried++; const ok = E.every(([a, b]) => s.includes(a) || s.includes(b)); if (tried <= 6 || ok) F.push({ V, E, s, ok, tried, total: subs.length, note: ok ? `試第 ${tried} 組 {${s.join(', ')}}：每條邊都被蓋到 ✓` : `試第 ${tried} 組 {${s.join(', ')}}：有邊沒蓋到。` }); if (ok) { found = s; break; } }
    if (!found) F.push({ V, E, s: [], ok: false, tried, total: subs.length, note: `${subs.length} 組全試完：大小 ${k} 的覆蓋不存在。` });
    F.push({ V, E, s: found || [], ok: !!found, tried, total: subs.length, note: `找：最多試 C(${V.length}, ${k}) = ${subs.length} 組，n 變大會爆炸；驗證：看 ${E.length} 條邊就好。`, end: true });
    return F;
  },
  render(f, st) {
    const n = f.V.length, R = 110, cx = 160, cy = 140, P = {}; f.V.forEach((x, i) => { const th = -Math.PI / 2 + i * 2 * Math.PI / n; P[x] = [cx + R * Math.cos(th), cy + R * Math.sin(th)]; });
    let g = f.E.map(([a, b]) => { const cov = f.s.includes(a) || f.s.includes(b); return LM.line(P[a][0], P[a][1], P[b][0], P[b][1], f.s.length ? (cov ? 'good' : 'bad') : ''); }).join('');
    g += f.V.map(x => `<g class="lm-v ${f.s.includes(x) ? 'on' : ''}"><circle cx="${P[x][0]}" cy="${P[x][1]}" r="16"/><text x="${P[x][0]}" y="${P[x][1] + 5}">${x}</text></g>`).join('');
    st.innerHTML = LM.W(320, 280, g) + `<p class="lm-cap">已試 <b>${f.tried}</b> / ${f.total} 組</p>`;
  },
});

/* ============ Amdahl（計組：co-perf） ============ */
Labs.reg({
  id: 'amdahl', title: 'Amdahl：加速有上限', subject: 'co', lessons: ['co-perf'],
  desc: '只有比例 p 的部分變快 s 倍；剩下的 1 − p 不會變，所以加速比最多 1/(1 − p)',
  form: [{ id: 'p', label: '可加速的比例 p', type: 'number', value: '0.8', size: 5 }, { id: 's', label: '最多幾倍', type: 'number', value: '64', size: 5 }],
  presets: [{ name: 'p = 0.8', v: { p: '0.8' } }, { name: 'p = 0.95', v: { p: '0.95' } }, { name: 'p = 0.5', v: { p: '0.5' } }],
  build(v) {
    const p = +v.p, sMax = Math.max(2, Math.min(4096, +v.s || 64)); if (!(p >= 0 && p <= 1)) throw new Error('0 ≤ p ≤ 1');
    const F = []; for (let s = 1; s <= sMax; s *= 2) { const t = (1 - p) + p / s; F.push({ p, s, t, note: `平行部分快 ${s} 倍：時間 ${(t * 100).toFixed(1)}%，加速 ${(1 / t).toFixed(2)} 倍。` }); }
    F.push({ p, s: Infinity, t: 1 - p, note: `就算無限快，也只有 1/(1 − p) = ${p < 1 ? (1 / (1 - p)).toFixed(2) : '∞'} 倍。`, end: true });
    return F;
  },
  render(f, st) {
    const W = 560, x0 = 20, w = W - 40, ser = (1 - f.p) * w, par = f.p / (f.s === Infinity ? 1e9 : f.s) * w;
    const g = `<rect class="lm-seg ser" x="${x0}" y="20" width="${ser}" height="40" rx="4"/><rect class="lm-seg par" x="${x0 + ser}" y="20" width="${Math.max(par, 1)}" height="40" rx="4"/>` + LM.text(x0 + ser / 2, 85, '不能加速 ' + LM.fmt((1 - f.p) * 100, 0) + '%', 'co') + `<rect class="lm-ghost" x="${x0}" y="20" width="${w}" height="40" rx="4"/>`;
    st.innerHTML = LM.W(W, 100, g) + `<p class="lm-cap">加速比 <b>${(1 / f.t).toFixed(2)}</b>　上限 <b>${f.p < 1 ? (1 / (1 - f.p)).toFixed(2) : '∞'}</b></p>`;
  },
});

/* ============ IEEE 754（計組：co-arith） ============ */
Labs.reg({
  id: 'ieee754', title: 'IEEE 754：符號、指數、尾數', subject: 'co', lessons: ['co-arith'],
  desc: '先寫成 1.xxx × 2^e，指數加 127，尾數只存小數點後面',
  form: [{ id: 'x', label: '十進位數', value: '-6.75', size: 10 }],
  presets: [{ name: '-6.75', v: { x: '-6.75' } }, { name: '0.1', v: { x: '0.1' } }, { name: '1', v: { x: '1' } }, { name: '100', v: { x: '100' } }],
  build(v) {
    const x = +v.x; if (!isFinite(x) || x === 0) throw new Error('請輸入非零有限數');
    const buf = new DataView(new ArrayBuffer(4)); buf.setFloat32(0, x); const u = buf.getUint32(0), b = u.toString(2).padStart(32, '0');
    const sgn = b[0], ex = b.slice(1, 9), man = b.slice(9), E = parseInt(ex, 2), e = E - 127, F = [];
    F.push({ b, part: 's', note: `符號：${x < 0 ? '負' : '正'} → ${sgn}` });
    F.push({ b, part: 'n', note: `|x| = ${Math.abs(x)} = 1.${man.replace(/0+$/, '') || '0'}₂ × 2^${e}` });
    F.push({ b, part: 'e', note: `指數 ${e} + 127 = ${E} = ${ex}₂` });
    F.push({ b, part: 'm', note: `尾數存小數點後 23 位（前面的 1 不存）。` });
    const back = buf.getFloat32(0); F.push({ b, part: 'all', note: `存起來的值 = ${back}${back !== x ? `（和 ${x} 差 ${Math.abs(back - x).toExponential(2)}，二進位寫不完）` : ''}` });
    return F;
  },
  render(f, st) {
    const on = p => f.part === p || f.part === 'all';
    st.innerHTML = `<div class="lm-bits">${LM.bits(f.b.slice(0, 1), 's ' + (on('s') ? 'on' : ''))}<i></i>${LM.bits(f.b.slice(1, 9), 'e ' + (on('e') ? 'on' : ''))}<i></i>${LM.bits(f.b.slice(9), 'm ' + (on('m') || on('n') ? 'on' : ''))}</div><p class="lm-cap"><span class="lm-key s">符號 1</span><span class="lm-key e">指數 8</span><span class="lm-key m">尾數 23</span></p>`;
  },
});

/* ============ 單週期 vs 多週期（計組：co-datapath） ============ */
Labs.reg({
  id: 'cycles', title: '單週期 vs 多週期', subject: 'co', lessons: ['co-datapath'],
  desc: '單週期每條指令都等最慢的 lw；多週期每條只走自己需要的階段',
  form: [{ id: 'lat', label: 'IF ID EX MEM WB（ps）', value: '200 100 200 200 100', wide: true }, { id: 'mix', label: 'lw sw R beq 比例（%）', value: '25 10 50 15', wide: true }],
  presets: [{ name: '課本', v: { lat: '200 100 200 200 100', mix: '25 10 50 15' } }, { name: '記憶體很慢', v: { lat: '200 100 150 400 100', mix: '25 10 50 15' } }],
  build(v) {
    const L = nums(v.lat), mx = nums(v.mix); if (L.length !== 5 || mx.length !== 4) throw new Error('5 個延遲、4 個比例');
    const need = { lw: [1, 1, 1, 1, 1], sw: [1, 1, 1, 1, 0], R: [1, 1, 1, 0, 1], beq: [1, 1, 1, 0, 0] }, names = ['lw', 'sw', 'R', 'beq'];
    const single = L.reduce((a, b) => a + b, 0), clk = Math.max(...L), steps = names.map(n => need[n].reduce((a, b) => a + b, 0));
    const tot = mx.reduce((a, b) => a + b, 0), cpi = names.reduce((s, n, i) => s + mx[i] / tot * steps[i], 0), multi = cpi * clk, F = [];
    F.push({ L, need, names, mode: 's', single, clk, note: `單週期：時脈 = 全部加起來 = ${single} ps，每條指令都一樣。` });
    F.push({ L, need, names, mode: 'm', single, clk, steps, note: `多週期：時脈 = 最慢的一段 = ${clk} ps；lw 5 段、sw 4、R 4、beq 3。` });
    F.push({ L, need, names, mode: 'm', single, clk, steps, note: `平均 CPI ${cpi.toFixed(2)} × ${clk} = ${multi.toFixed(0)} ps / 指令，單週期 ${single} ps。`, end: true });
    return F;
  },
  render(f, st) {
    const W = 600, sc = 520 / f.single; let g = '', y = 14;
    f.names.forEach((n, i) => {
      g += LM.text(8, y + 20, n, '', 'start'); let x = 48;
      if (f.mode === 's') { g += `<rect class="lm-seg ser" x="${x}" y="${y}" width="${f.single * sc}" height="28" rx="4"/>`; }
      else f.need[n].forEach((u, k) => { if (u) { g += `<rect class="lm-seg par" x="${x}" y="${y}" width="${f.clk * sc - 2}" height="28" rx="4"/>`; x += f.clk * sc; } });
      y += 38;
    });
    st.innerHTML = LM.W(W, y + 4, g) + `<p class="lm-cap">${f.mode === 's' ? `每條 ${f.single} ps` : `每段 ${f.clk} ps`}</p>`;
  },
});

/* ============ 暫存器換名（計組：co-ilp） ============ */
Labs.reg({
  id: 'rename', title: '暫存器換名：撞名的相依消失', subject: 'co', lessons: ['co-ilp'],
  desc: 'RAW 是真的要等資料；WAR、WAW 只是同一個名字，每次寫入換新的暫存器就沒了',
  form: [{ id: 'code', label: '指令（目的 來源 來源）', type: 'area', rows: 5, value: 'DIV F0 F2 F4\nADD F6 F0 F8\nSUB F8 F10 F14\nMUL F6 F10 F8' }],
  presets: [{ name: 'H&P 例', v: { code: 'DIV F0 F2 F4\nADD F6 F0 F8\nSUB F8 F10 F14\nMUL F6 F10 F8' } }, { name: '迴圈展開', v: { code: 'LD F0 R1 R0\nADD F4 F0 F2\nSD F4 R1 R0\nLD F0 R1 R0\nADD F4 F0 F2' } }],
  build(v) {
    const I = String(v.code).trim().split('\n').map(l => l.trim().split(/[\s,]+/)).filter(x => x.length >= 3).map(([op, d, ...s]) => ({ op, d, s })); if (I.length < 2 || I.length > 8) throw new Error('2 到 8 條指令');
    const deps = [];
    I.forEach((b, j) => I.slice(0, j).forEach((a, i) => {
      if (b.s.includes(a.d) && !I.slice(i + 1, j).some(m => m.d === a.d)) deps.push({ i, j, k: 'RAW', r: a.d });
      if (a.s.includes(b.d)) deps.push({ i, j, k: 'WAR', r: b.d });
      if (a.d === b.d) deps.push({ i, j, k: 'WAW', r: b.d });
    }));
    const map = {}; let p = 0; const R = I.map(x => { const s = x.s.map(r => map[r] || r); map[x.d] = 'P' + (++p); return { op: x.op, d: map[x.d], s }; });
    const raw = deps.filter(d => d.k === 'RAW');
    return [
      { I, deps: [], note: `${I.length} 條指令。` },
      { I, deps: raw, note: `RAW ${raw.length} 條：真的要等資料。` },
      { I, deps, note: `WAR ${deps.filter(d => d.k === 'WAR').length}、WAW ${deps.filter(d => d.k === 'WAW').length} 條：只是名字撞到。` },
      { I: R, deps: raw, renamed: true, note: `每次寫入換新暫存器 P1…：撞名的全部消失，只剩 RAW。`, end: true },
    ];
  },
  render(f, st) {
    const rows = f.I.map((x, i) => [i + 1, `<b>${x.op}</b>`, `<span class="lm-reg ${f.renamed ? 'p' : ''}">${x.d}</span>`, x.s.map(r => `<span class="lm-reg ${/^P/.test(r) ? 'p' : ''}">${r}</span>`).join(' ')]);
    const dl = f.deps.map(d => `<span class="lm-dep ${d.k}">${d.k} ${d.i + 1}→${d.j + 1}（${d.r}）</span>`).join('');
    st.innerHTML = htmlTable(rows, { head: ['#', '', '寫', '讀'] }) + `<div class="lm-deps">${dl || '<span class="muted">—</span>'}</div>`;
  },
});

/* ============ MESI（計組：co-vm-coherence） ============ */
Labs.reg({
  id: 'mesi', title: 'MESI：一個人寫，別人作廢', subject: 'co', lessons: ['co-vm-coherence'],
  desc: '輸入一串讀寫，看兩顆核心的快取狀態和匯流排上的訊息',
  form: [{ id: 'ops', label: '操作（P1R、P2W…）', value: 'P1R P2R P1W P2R', wide: true }],
  presets: [{ name: '讀讀寫讀', v: { ops: 'P1R P2R P1W P2R' } }, { name: 'E 直接寫', v: { ops: 'P1R P1W P1W P2R' } }, { name: 'false sharing', v: { ops: 'P1W P2W P1W P2W P1W P2W' } }],
  build(v) {
    const ops = String(v.ops).toUpperCase().split(/[\s,]+/).filter(Boolean); if (ops.some(o => !/^P[12][RW]$/.test(o))) throw new Error('格式：P1R P2W …');
    const s = { 1: 'I', 2: 'I' }, F = [{ s: { ...s }, bus: '', note: '兩邊都沒有這個區塊。', mem: 'ok' }]; let mem = 'ok', miss = 0;
    for (const o of ops) {
      const me = +o[1], ot = me === 1 ? 2 : 1, w = o[2] === 'W'; let bus = '', note;
      if (!w) {
        if (s[me] !== 'I') { note = `P${me} 讀：命中（${s[me]}），不用匯流排。`; }
        else { miss++; bus = 'BusRd'; if (s[ot] === 'M') { mem = 'ok'; s[ot] = 'S'; s[me] = 'S'; note = `P${me} 讀：P${ot} 有改過的版本，交出資料並寫回記憶體 → 兩邊 S。`; } else if (s[ot] !== 'I') { s[ot] = 'S'; s[me] = 'S'; note = `P${me} 讀：P${ot} 也有 → 兩邊 S。`; } else { s[me] = 'E'; note = `P${me} 讀：只有它有 → E。`; } }
      } else {
        if (s[me] === 'M') note = `P${me} 寫：已經是 M，直接寫。`;
        else if (s[me] === 'E') { s[me] = 'M'; note = `P${me} 寫：E → M，不用廣播。`; }
        else { bus = s[me] === 'S' ? 'BusUpgr（作廢）' : 'BusRdX（作廢）'; if (s[me] === 'I') miss++; if (s[ot] === 'M') mem = 'ok'; s[ot] = 'I'; s[me] = 'M'; note = `P${me} 寫：先廣播作廢，P${ot} → I，P${me} → M。`; }
        mem = 'stale';
      }
      F.push({ s: { ...s }, bus, note, mem, op: o, miss });
    }
    return F;
  },
  render(f, st) {
    const c = (i) => `<div class="lm-core"><b>P${i}</b><span class="lm-st ${f.s[i]}">${f.s[i]}</span></div>`;
    st.innerHTML = `<div class="lm-mesi">${c(1)}${c(2)}</div><div class="lm-bus ${f.bus ? 'on' : ''}">${f.bus || '匯流排：沒有訊息'}</div><p class="lm-cap">記憶體 ${f.mem === 'stale' ? '<b class="bad-t">是舊的</b>' : '最新'}${f.miss != null ? `　快取失誤 <b>${f.miss}</b>` : ''}</p>`;
  },
});

/* ============ fork 會生幾個行程（OS：os-process） ============ */
Labs.reg({
  id: 'fork', title: 'fork()：每呼叫一次，行程數加倍', subject: 'os', lessons: ['os-process'],
  desc: '每個活著的行程都會執行下一行 fork()，所以 n 次之後有 2ⁿ 個',
  form: [{ id: 'n', label: '連續呼叫 fork() 幾次', type: 'number', value: '3', size: 3 }],
  presets: [{ name: '3 次', v: { n: '3' } }, { name: '4 次', v: { n: '4' } }],
  build(v) {
    const n = Math.max(1, Math.min(5, +v.n || 3)); let pid = 1; const root = { k: 'P1', l: null, r: null }, F = [];
    let live = [root]; F.push({ root: JSON.parse(JSON.stringify(root)), hl: ['P1'], cnt: 1, note: '一開始只有 1 個行程。' });
    for (let i = 1; i <= n; i++) {
      const nx = [], born = [];
      for (const p of live) { const keep = { k: p.k, l: null, r: null }, ch = { k: 'P' + (++pid), l: null, r: null }; p.l = keep; p.r = ch; nx.push(keep, ch); born.push(ch.k); }
      live = nx; F.push({ root: JSON.parse(JSON.stringify(root)), hl: born, cnt: live.length, note: `第 ${i} 個 fork()：每個行程都生一個 → ${live.length} 個。` });
    }
    F.push(Object.assign({}, F[F.length - 1], { note: `${n} 次 fork() → 2^${n} = ${2 ** n} 個行程（印 ${2 ** n} 次）。`, end: true }));
    return F;
  },
  render(f, st) { st.innerHTML = svgTree(f.root, { hl: f.hl }) + `<p class="lm-cap">左：自己繼續　右：新生的子行程　現在 <b>${f.cnt}</b> 個</p>`; },
});

/* ============ 競爭條件（OS：os-sync） ============ */
Labs.reg({
  id: 'race', title: 'count++ 不是一步：競爭條件', subject: 'os', lessons: ['os-sync'],
  desc: '每次 count++ 是「讀、加 1、寫回」三步；兩個執行緒交錯就會少加',
  form: [{ id: 'sch', label: '執行順序（A、B 各 3 步）', value: 'A A B B B A', wide: true }],
  presets: [{ name: '交錯：少加一次', v: { sch: 'A A B B B A' } }, { name: '照順序（像有鎖）', v: { sch: 'A A A B B B' } }, { name: '另一種交錯', v: { sch: 'A B A B A B' } }],
  build(v) {
    const sch = String(v.sch).toUpperCase().split(/[\s,]+/).filter(Boolean); if (sch.filter(x => x === 'A').length !== 3 || sch.filter(x => x === 'B').length !== 3) throw new Error('A、B 各要剛好 3 步');
    const step = ['讀 count', '加 1', '寫回'], st = { A: { pc: 0, r: null }, B: { pc: 0, r: null } }; let mem = 0; const F = [{ st: JSON.parse(JSON.stringify(st)), mem, note: 'count = 0，兩個執行緒都要 count++。' }];
    for (const t of sch) { const s = st[t]; const k = s.pc; if (k === 0) s.r = mem; else if (k === 1) s.r++; else mem = s.r; s.pc++; F.push({ st: JSON.parse(JSON.stringify(st)), mem, t, k, note: `${t}：${step[k]}${k === 0 ? `（拿到 ${s.r}）` : k === 2 ? ` → count = ${mem}` : ''}` }); }
    F.push(Object.assign({}, F[F.length - 1], { note: mem === 2 ? 'count = 2：正確。' : `count = ${mem}：少加了一次（B 的結果被蓋掉）。用 mutex 把三步包起來就不會交錯。`, end: true }));
    return F;
  },
  render(f, st) {
    const th = (t) => `<div class="lm-th ${f.t === t ? 'on' : ''}"><b>${t}</b>${['讀', '加 1', '寫回'].map((s, k) => `<span class="${k < f.st[t].pc ? 'done' : ''}">${s}</span>`).join('')}<em>暫存器 ${f.st[t].r ?? '—'}</em></div>`;
    st.innerHTML = `<div class="lm-race">${th('A')}<div class="lm-mem">count<b>${f.mem}</b></div>${th('B')}</div>`;
  },
});

/* ============ 分頁位址轉換（OS：os-memory） ============ */
Labs.reg({
  id: 'paging', title: '分頁：頁號查表，位移照抄', subject: 'os', lessons: ['os-memory'],
  desc: '位址拆成頁號和頁內位移，頁號查頁表換成頁框號，位移不變',
  form: [{ id: 'va', label: '邏輯位址（16 進位）', value: '12345', size: 10 }, { id: 'pg', label: '頁大小（KB）', type: 'select', value: '4', options: [['1', '1 KB'], ['4', '4 KB'], ['16', '16 KB']] }, { id: 'pt', label: '頁表（頁:頁框）', value: '10:3 11:9 12:7 13:1 14:4', wide: true }],
  presets: [{ name: '影片：0x12345', v: { va: '12345', pg: '4', pt: '10:3 11:9 12:7 13:1 14:4' } }, { name: '頁不在表裡', v: { va: '1F000', pg: '4', pt: '10:3 11:9 12:7' } }],
  build(v) {
    const va = parseInt(String(v.va).replace(/^0x/i, ''), 16); if (isNaN(va)) throw new Error('請輸入 16 進位');
    const size = +v.pg * 1024, ob = Math.log2(size), page = Math.floor(va / size), off = va % size, T = {};
    String(v.pt).trim().split(/[\s,]+/).forEach(s => { const [p, f] = s.split(':'); T[parseInt(p, 16)] = parseInt(f, 16); });
    const hx = (x, w) => x.toString(16).toUpperCase().padStart(w, '0'), F = [];
    F.push({ va, ob, page, off, T, note: `頁大小 ${v.pg} KB = 2^${ob}：低 ${ob} 位元是位移。`, step: 0 });
    F.push({ va, ob, page, off, T, note: `頁號 0x${hx(page, 1)}、位移 0x${hx(off, Math.ceil(ob / 4))}`, step: 1 });
    if (T[page] == null) { F.push({ va, ob, page, off, T, note: `頁表沒有第 0x${hx(page, 1)} 頁：分頁錯誤（page fault）。`, step: 2, fault: true }); return F; }
    const pa = T[page] * size + off;
    F.push({ va, ob, page, off, T, note: `查表：第 0x${hx(page, 1)} 頁在頁框 0x${hx(T[page], 1)}。`, step: 2 });
    F.push({ va, ob, page, off, T, pa, note: `實體位址 = 0x${hx(T[page], 1)} | 0x${hx(off, Math.ceil(ob / 4))} = 0x${hx(pa, 1)}`, step: 3, end: true });
    return F;
  },
  render(f, st) {
    const hx = x => x.toString(16).toUpperCase(), ow = Math.ceil(f.ob / 4);
    const addr = `<div class="lm-addr"><span class="pg ${f.step >= 1 ? 'on' : ''}">${hx(f.page)}</span><span class="of ${f.step >= 1 ? 'on' : ''}">${hx(f.off).padStart(ow, '0')}</span></div>`;
    const rows = Object.entries(f.T).map(([p, fr]) => [`0x${hx(+p)}`, `0x${hx(fr)}`]);
    const tbl = htmlTable(rows, { head: ['頁', '頁框'], cls: i => f.step >= 2 && +Object.keys(f.T)[i] === f.page ? 'hl' : '' });
    const out = f.pa != null ? `<div class="lm-addr"><span class="fr on">${hx(f.T[f.page])}</span><span class="of on">${hx(f.off).padStart(ow, '0')}</span></div>` : f.fault ? '<p class="bad-t">page fault</p>' : '';
    st.innerHTML = `<div class="lm-pg">${addr}${tbl}${out}</div>`;
  },
});

/* ============ 線性遞迴與特徵方程式（離散：dm-recur-gf） ============ */
Labs.reg({
  id: 'linrec', title: '線性遞迴：猜它長得像 rⁿ', subject: 'dm', lessons: ['dm-recur-gf'],
  desc: 'aₙ = c₁aₙ₋₁ + c₂aₙ₋₂：解 r² = c₁r + c₂，通解是兩個等比數列疊起來',
  form: [{ id: 'c1', label: 'c₁', type: 'number', value: '1', size: 3 }, { id: 'c2', label: 'c₂', type: 'number', value: '2', size: 3 }, { id: 'a0', label: 'a₀', type: 'number', value: '3', size: 3 }, { id: 'a1', label: 'a₁', type: 'number', value: '3', size: 3 }],
  presets: [{ name: '影片：1、2、3、3', v: { c1: '1', c2: '2', a0: '3', a1: '3' } }, { name: 'Fibonacci', v: { c1: '1', c2: '1', a0: '0', a1: '1' } }, { name: '重根 4、−4', v: { c1: '4', c2: '-4', a0: '1', a1: '4' } }],
  build(v) {
    const c1 = +v.c1, c2 = +v.c2, a0 = +v.a0, a1 = +v.a1, D = c1 * c1 + 4 * c2; if ([c1, c2, a0, a1].some(isNaN)) throw new Error('請輸入數字');
    const seq = [a0, a1]; for (let i = 2; i < 10; i++) seq.push(c1 * seq[i - 1] + c2 * seq[i - 2]);
    const F = [{ seq: seq.slice(0, 2), note: `a₀ = ${a0}、a₁ = ${a1}` }];
    for (let i = 2; i < 10; i++) F.push({ seq: seq.slice(0, i + 1), note: `a${'₀₁₂₃₄₅₆₇₈₉'[i]} = ${c1}·${seq[i - 1]} + ${c2}·${seq[i - 2]} = ${seq[i]}` });
    if (D < 0) { F.push({ seq, note: `r² = ${c1}r + ${c2} 的判別式 < 0：複數根，數列會震盪。`, end: true }); return F; }
    const r1 = (c1 + Math.sqrt(D)) / 2, r2 = (c1 - Math.sqrt(D)) / 2;
    if (Math.abs(D) < 1e-12) { const al = a0, be = a1 / r1 - a0; F.push({ seq, note: `重根 r = ${LM.fmt(r1)}：aₙ = (${LM.fmt(al)} + ${LM.fmt(be)}n)·${LM.fmt(r1)}ⁿ`, end: true }); return F; }
    const be = (a1 - a0 * r1) / (r2 - r1), al = a0 - be;
    F.push({ seq, note: `r² = ${c1}r + ${c2} → r = ${LM.fmt(r1)}、${LM.fmt(r2)}` });
    F.push({ seq, note: `aₙ = ${LM.fmt(al)}·${LM.fmt(r1)}ⁿ + ${LM.fmt(be)}·(${LM.fmt(r2)})ⁿ；長期看最大的根 ${LM.fmt(Math.max(Math.abs(r1), Math.abs(r2)))}`, end: true });
    return F;
  },
  render(f, st) { st.innerHTML = svgBars(f.seq.map(x => Math.abs(x)), { cls: k => k === f.seq.length - 1 ? 'hl' : f.seq[k] < 0 ? 'probe' : '' }) + `<p class="lm-cap">${f.seq.join('、')}</p>`; },
});

/* ============ Havel–Hakimi（離散：dm-graph） ============ */
Labs.reg({
  id: 'havel', title: 'Havel–Hakimi：度數序列畫得出圖嗎', subject: 'dm', lessons: ['dm-graph'],
  desc: '拿掉最大的 d，後面 d 個各減 1；一直做到全 0 就畫得出來，出現負數就不行',
  form: [{ id: 'd', label: '度數序列', value: '3 3 2 2 2', wide: true }],
  presets: [{ name: '可以', v: { d: '3 3 2 2 2' } }, { name: '不行', v: { d: '4 4 3 1 0' } }, { name: 'K4', v: { d: '3 3 3 3' } }, { name: '總和奇數', v: { d: '3 2 2' } }],
  build(v) {
    let a = nums(v.d).sort((p, q) => q - p); const F = [{ a: a.slice(), note: `排成由大到小。總和 ${a.reduce((s, x) => s + x, 0)}${a.reduce((s, x) => s + x, 0) % 2 ? '：奇數，握手定理說不可能' : '：偶數'}。` }];
    if (a.reduce((s, x) => s + x, 0) % 2) { F.push({ a, bad: true, note: '總和是奇數 → 畫不出來。', end: true }); return F; }
    while (a.length && a[0] > 0) {
      const d = a.shift(); if (d > a.length) { F.push({ a, bad: true, note: `要連 ${d} 個點，但只剩 ${a.length} 個 → 畫不出來。`, end: true }); return F; }
      const hi = []; for (let i = 0; i < d; i++) { a[i]--; hi.push(i); }
      if (a.some(x => x < 0)) { F.push({ a: a.slice(), hi, bad: true, note: '出現負數 → 畫不出來。', end: true }); return F; }
      F.push({ a: a.slice(), hi, note: `拿掉 ${d}，後面 ${d} 個各減 1。` });
      a.sort((p, q) => q - p); F.push({ a: a.slice(), note: '重新排序。' });
    }
    F.push({ a, ok: true, note: '全部變成 0 → 畫得出來。', end: true });
    return F;
  },
  render(f, st) { st.innerHTML = svgArray(f.a.length ? f.a : ['∅'], { cls: k => f.bad && f.a[k] < 0 ? 'probe' : f.hi && f.hi.includes(k) ? 'hl' : '' }) + `<p class="lm-cap">${f.ok ? '<b class="good-t">可圖</b>' : f.bad ? '<b class="bad-t">不可圖</b>' : `剩 ${f.a.length} 個點`}</p>`; },
});

/* ---------- 2D 平面（線代共用） ---------- */
function lmPlane(vecs, opt = {}) {
  const S = opt.scale || 40, W = 320, H = 320, cx = W / 2, cy = H / 2, P = ([x, y]) => [cx + x * S, cy - y * S];
  let g = '';
  for (let i = -4; i <= 4; i++) { g += LM.line(cx + i * S, 0, cx + i * S, H, 'grid') + LM.line(0, cy - i * S, W, cy - i * S, 'grid'); }
  g += LM.line(0, cy, W, cy, 'axis') + LM.line(cx, 0, cx, H, 'axis');
  if (opt.lattice) { const [u, w] = opt.lattice; for (let i = -6; i <= 6; i++) { const a = P([u[0] * i - w[0] * 6, u[1] * i - w[1] * 6]), b = P([u[0] * i + w[0] * 6, u[1] * i + w[1] * 6]), c = P([w[0] * i - u[0] * 6, w[1] * i - u[1] * 6]), d = P([w[0] * i + u[0] * 6, w[1] * i + u[1] * 6]); g += LM.line(a[0], a[1], b[0], b[1], 'lat') + LM.line(c[0], c[1], d[0], d[1], 'lat'); } }
  if (opt.ellipse) { const pts = []; for (let k = 0; k <= 64; k++) { const t = k / 64 * Math.PI * 2, q = opt.ellipse([Math.cos(t), Math.sin(t)]); pts.push(P(q).join(',')); } g += `<polyline class="lm-ell" points="${pts.join(' ')}"/>`; const c0 = []; for (let k = 0; k <= 64; k++) { const t = k / 64 * Math.PI * 2; c0.push(P([Math.cos(t), Math.sin(t)]).join(',')); } g += `<polyline class="lm-ell ghost" points="${c0.join(' ')}"/>`; }
  for (const v of vecs) { const [x1, y1] = P(v.from || [0, 0]), [x2, y2] = P(v.to), ang = Math.atan2(y2 - y1, x2 - x1), hs = 9; g += `<g class="lm-vec ${v.st || ''}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><path d="M${x2},${y2} L${x2 - hs * Math.cos(ang - .4)},${y2 - hs * Math.sin(ang - .4)} L${x2 - hs * Math.cos(ang + .4)},${y2 - hs * Math.sin(ang + .4)} Z"/>${v.lbl ? `<text x="${x2 + 8}" y="${y2 - 6}">${v.lbl}</text>` : ''}</g>`; }
  return LM.W(W, H, g, 'plane');
}

/* ============ 基底與座標（線代：la-vs） ============ */
Labs.reg({
  id: 'coords', title: '基底與座標：換一組格子', subject: 'la', lessons: ['la-vs'],
  desc: '同一個向量，在不同基底下座標不同；解 c₁b₁ + c₂b₂ = v 就是它的新座標',
  form: [{ id: 'b1', label: 'b₁', value: '2 1', size: 6 }, { id: 'b2', label: 'b₂', value: '-1 1', size: 6 }, { id: 'v', label: 'v', value: '1 2', size: 6 }],
  presets: [{ name: '斜格子', v: { b1: '2 1', b2: '-1 1', v: '1 2' } }, { name: '標準基底', v: { b1: '1 0', b2: '0 1', v: '1 2' } }, { name: '平行（不是基底）', v: { b1: '1 1', b2: '2 2', v: '1 2' } }],
  build(v) {
    const b1 = nums(v.b1), b2 = nums(v.b2), x = nums(v.v); if (b1.length !== 2 || b2.length !== 2 || x.length !== 2) throw new Error('每個向量 2 個數');
    const det = b1[0] * b2[1] - b1[1] * b2[0], F = [{ b1, b2, x, note: 'v 在標準座標是 (' + x.join(', ') + ')。' }];
    if (Math.abs(det) < 1e-9) { F.push({ b1, b2, x, bad: true, note: 'b₁、b₂ 平行：只蓋住一條線，不是基底。', end: true }); return F; }
    const c1 = (x[0] * b2[1] - x[1] * b2[0]) / det, c2 = (b1[0] * x[1] - b1[1] * x[0]) / det;
    F.push({ b1, b2, x, lat: true, note: '換成 b₁、b₂ 的格子。' });
    F.push({ b1, b2, x, lat: true, c: [c1, 0], note: `先走 ${LM.fmt(c1)} 個 b₁。` });
    F.push({ b1, b2, x, lat: true, c: [c1, c2], note: `再走 ${LM.fmt(c2)} 個 b₂：新座標 (${LM.fmt(c1)}, ${LM.fmt(c2)})。`, end: true });
    return F;
  },
  render(f, st) {
    const vs = [{ to: f.b1, st: 'b1', lbl: 'b₁' }, { to: f.b2, st: 'b2', lbl: 'b₂' }, { to: f.x, st: 'x', lbl: 'v' }];
    if (f.c) { const p = [f.b1[0] * f.c[0], f.b1[1] * f.c[0]]; vs.push({ to: p, st: 'step' }); if (f.c[1]) vs.push({ from: p, to: [p[0] + f.b2[0] * f.c[1], p[1] + f.b2[1] * f.c[1]], st: 'step' }); }
    st.innerHTML = lmPlane(vs, { lattice: f.lat ? [f.b1, f.b2] : null, scale: 34 });
  },
});

/* ============ Gram–Schmidt（線代：la-ortho） ============ */
Labs.reg({
  id: 'gram', title: 'Gram–Schmidt：扣掉影子就垂直', subject: 'la', lessons: ['la-ortho'],
  desc: '第二個向量減掉它在第一個上的投影，剩下的部分就和第一個垂直',
  form: [{ id: 'a', label: 'a₁', value: '3 1', size: 6 }, { id: 'b', label: 'a₂', value: '2 2', size: 6 }],
  presets: [{ name: '例', v: { a: '3 1', b: '2 2' } }, { name: '幾乎平行', v: { a: '3 1', b: '3 1.5' } }],
  build(v) {
    const a = nums(v.a), b = nums(v.b); if (a.length !== 2 || b.length !== 2) throw new Error('每個向量 2 個數');
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1], k = dot(a, b) / dot(a, a), proj = [a[0] * k, a[1] * k], u2 = [b[0] - proj[0], b[1] - proj[1]], n1 = Math.hypot(...a), n2 = Math.hypot(...u2);
    if (n2 < 1e-9) throw new Error('a₂ 和 a₁ 平行');
    return [
      { a, b, note: '兩個向量不垂直。' },
      { a, b, proj, note: `a₂ 在 a₁ 上的影子 = (a₂·a₁ / a₁·a₁) a₁ = ${LM.fmt(k)} a₁` },
      { a, b, proj, u2, note: `u₂ = a₂ − 影子 = (${LM.fmt(u2[0])}, ${LM.fmt(u2[1])})，和 a₁ 的內積 = ${LM.fmt(dot(a, u2))}` },
      { a, b, u2, q: [[a[0] / n1, a[1] / n1], [u2[0] / n2, u2[1] / n2]], note: '各自除以長度 → 單位正交基底 q₁、q₂（這就是 A = QR 的 Q）。', end: true },
    ];
  },
  render(f, st) {
    const vs = [{ to: f.a, st: 'b1', lbl: 'a₁' }, { to: f.b, st: f.u2 ? 'ghost' : 'b2', lbl: 'a₂' }];
    if (f.proj) vs.push({ to: f.proj, st: 'step', lbl: '影子' }, { from: f.proj, to: f.b, st: 'ghost' });
    if (f.u2) vs.push({ to: f.u2, st: 'x', lbl: 'u₂' });
    if (f.q) vs.push({ to: f.q[0], st: 'q', lbl: 'q₁' }, { to: f.q[1], st: 'q', lbl: 'q₂' });
    st.innerHTML = lmPlane(vs, { scale: 40 });
  },
});

/* ============ 對稱矩陣的特徵向量（線代：la-sym-svd） ============ */
Labs.reg({
  id: 'eig2', title: '對稱矩陣：圓變橢圓，軸互相垂直', subject: 'la', lessons: ['la-sym-svd'],
  desc: '對稱矩陣把單位圓壓成橢圓；不轉向的兩個方向就是特徵向量，而且互相垂直',
  form: [{ id: 'm', label: '矩陣 [[p, q], [q, r]]：p q r', value: '2 1 2', size: 10 }],
  presets: [{ name: '[[2,1],[1,2]]', v: { m: '2 1 2' } }, { name: '不定 [[1,2],[2,1]]', v: { m: '1 2 1' } }, { name: '對角 [[3,0],[0,1]]', v: { m: '3 0 1' } }],
  build(v) {
    const [p, q, r] = nums(v.m); if ([p, q, r].some(x => x == null)) throw new Error('輸入 p q r 三個數');
    const tr = p + r, det = p * r - q * q, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det)), l1 = tr / 2 + disc, l2 = tr / 2 - disc;
    const vec = (l) => Math.abs(q) > 1e-12 ? (() => { const x = [q, l - p], n = Math.hypot(...x); return [x[0] / n, x[1] / n]; })() : (Math.abs(l - p) < 1e-12 ? [1, 0] : [0, 1]);
    const e1 = vec(l1), e2 = vec(l2), A = ([x, y]) => [p * x + q * y, q * x + r * y], kind = l1 > 0 && l2 > 0 ? '正定：xᵀAx 是一個碗' : l1 < 0 && l2 < 0 ? '負定' : l1 * l2 < 0 ? '不定：馬鞍' : '半正定';
    return [
      { A, k: 0, note: '單位圓上的八根箭頭。' },
      { A, k: 1, note: '乘上 A：大部分箭頭轉了方向。' },
      { A, k: 1, e: [e1, e2], l: [l1, l2], note: `只有兩個方向不轉：λ₁ = ${LM.fmt(l1)}、λ₂ = ${LM.fmt(l2)}，內積 = ${LM.fmt(e1[0] * e2[0] + e1[1] * e2[1])}（垂直）` },
      { A, k: 1, e: [e1, e2], l: [l1, l2], note: `A = QΛQᵀ；${kind}。`, end: true },
    ];
  },
  render(f, st) {
    const vs = []; for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4 + Math.PI / 8, u = [Math.cos(t), Math.sin(t)]; vs.push({ to: f.k ? f.A(u) : u, st: 'ghost' }); }
    if (f.e) f.e.forEach((e, i) => vs.push({ to: [e[0] * f.l[i], e[1] * f.l[i]], st: i ? 'b2' : 'b1', lbl: 'λ = ' + LM.fmt(f.l[i]) }));
    st.innerHTML = lmPlane(vs, { ellipse: f.k ? f.A : null, scale: 38 });
  },
});
