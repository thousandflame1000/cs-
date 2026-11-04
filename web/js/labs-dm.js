/* 資工所衝刺站 — 離散數學動畫：鴿籠（Erdős–Szekeres）、排容文氏圖、Catalan 反射原理、Hasse 圖、延伸歐幾里得 */
'use strict';

/* ============ 鴿籠：Erdős–Szekeres ============ */
Labs.reg({
  id: 'pigeon', title: '鴿籠原理：Erdős–Szekeres', subject: 'dm', lessons: ['dm-logic'], desc: 'n²+1 個相異數一定有長度 n+1 的遞增或遞減子序列：看每個數拿到的數對 (i, d) 怎麼被塞進 n² 個鴿籠',
  form: [{ id: 'seq', label: '相異數列（建議 n²+1 個）', value: '5 3 8 1 9 2 7 4 6 10', wide: true }],
  presets: [{ name: 'n=3，10 個數', v: { seq: '5 3 8 1 9 2 7 4 6 10' } }, { name: 'n=2，5 個數', v: { seq: '3 1 4 5 2' } }, { name: '極端：9 個數剛好沒有長度 4', v: { seq: '3 2 1 6 5 4 9 8 7' } }],
  build(v) {
    const a = nums(v.seq); if (new Set(a).size !== a.length) throw new Error('數字要相異');
    const N = a.length, n = Math.max(1, Math.ceil(Math.sqrt(N - 1)));
    const inc = Array(N).fill(null), dec = Array(N).fill(null), F = [];
    const snap = (note, extra = {}) => F.push(Object.assign({ a, n, inc: inc.slice(), dec: dec.slice(), note }, extra));
    snap(`共 ${N} 個數。令 $n=${n}$（$n^2+1=${n * n + 1}$）。對每個 $a_k$ 定義 $i_k$＝以它**開頭**的最長遞增子序列長度、$d_k$＝最長遞減子序列長度。從右往左算。`);
    for (let k = N - 1; k >= 0; k--) {
      let bi = 1, bd = 1;
      for (let j = k + 1; j < N; j++) { if (a[j] > a[k]) bi = Math.max(bi, inc[j] + 1); if (a[j] < a[k]) bd = Math.max(bd, dec[j] + 1); }
      inc[k] = bi; dec[k] = bd;
      snap(`$a_{${k + 1}}=${a[k]}$：後面比它大的數中最大的 $i$ 加 1 → $i=${bi}$；比它小的數中最大的 $d$ 加 1 → $d=${bd}$。`, { cur: k });
    }
    const big = inc.findIndex((x, k) => x > n || dec[k] > n);
    snap(`假設所有 $(i_k,d_k)$ 都 $\\le ${n}$，數對只有 $${n}^2=${n * n}$ 種（下方 ${n}×${n} 的鴿籠）。但有 ${N} 個數${N > n * n ? '，比鴿籠多 → 一定有兩個數擠在同一格' : '，沒有比鴿籠多，不保證'}。`, { grid: true });
    if (N > n * n) snap(`為什麼擠在同一格就矛盾？設 $a_s,a_t$（$s<t$）數對相同。若 $a_s<a_t$，把 $a_s$ 接在以 $a_t$ 開頭的最長遞增子序列前面，得到更長的，$i_s\\ge i_t+1$；若 $a_s>a_t$ 則 $d_s\\ge d_t+1$。兩者都和「數對相同」矛盾，所以假設錯誤：**一定有某個 $i_k$ 或 $d_k$ 大於 ${n}**。`, { grid: true });
    // reconstruct longest
    let k0 = 0; let useInc = true; let best = 0;
    for (let k = 0; k < N; k++) { if (inc[k] > best) { best = inc[k]; k0 = k; useInc = true; } if (dec[k] > best) { best = dec[k]; k0 = k; useInc = false; } }
    const path = [k0]; let cur = k0;
    while (true) { let nx = -1; for (let j = cur + 1; j < N; j++) if ((useInc ? a[j] > a[cur] && inc[j] === inc[cur] - 1 : a[j] < a[cur] && dec[j] === dec[cur] - 1)) { nx = j; break; } if (nx < 0) break; path.push(nx); cur = nx; }
    snap(`所以一定有某個 $i_k$ 或 $d_k$ 超過 ${n}。這裡最長的是**${useInc ? '遞增' : '遞減'}**子序列 ${path.map(k => a[k]).join(' → ')}，長度 ${path.length}${path.length >= n + 1 ? `，達到 $n+1=${n + 1}$ ✓` : `（數字不到 $n^2+1$ 個，定理不保證）`}。`, { path, grid: true });
    return F;
  },
  render(f, st) {
    const N = f.a.length, w = 58, W = N * w + 20;
    const inPath = k => f.path && f.path.includes(k);
    let svg = `<div class="svgwrap"><svg viewBox="0 0 ${W} 110" width="${W}" height="110" class="arr">`;
    f.a.forEach((x, k) => {
      const cls = [k === f.cur ? 'hl' : '', inPath(k) ? 'hl' : '', f.pair && f.pair.includes(k) ? 'probe' : ''].join(' ');
      svg += `<g class="cell ${cls}"><rect x="${10 + k * w}" y="10" width="${w - 8}" height="40" rx="6"/><text x="${10 + k * w + (w - 8) / 2}" y="36" style="font-size:16px">${x}</text>
        <text class="idx" x="${10 + k * w + (w - 8) / 2}" y="70" style="font-size:13px">${f.inc[k] == null ? '' : '(' + f.inc[k] + ',' + f.dec[k] + ')'}</text><text class="idx" x="${10 + k * w + (w - 8) / 2}" y="92">a${k + 1}</text></g>`;
    });
    svg += '</svg></div>';
    let grid = '';
    if (f.grid) {
      const rows = [];
      for (let i = 1; i <= f.n; i++) rows.push([`<b>i=${i}</b>`, ...Array.from({ length: f.n }, (_, d) => f.a.filter((x, k) => f.inc[k] === i && f.dec[k] === d + 1).join(', '))]);
      const over = f.a.filter((x, k) => f.inc[k] > f.n || f.dec[k] > f.n);
      grid = `<p class="muted small">鴿籠（數對 (i,d)，i、d ≤ ${f.n}）：</p>` + htmlTable(rows, { head: ['', ...Array.from({ length: f.n }, (_, d) => 'd=' + (d + 1))], cls: (i, j) => j > 0 && String(rows[i][j]).includes(',') ? 'chg' : '' }) + (over.length ? `<p class="small">超出鴿籠（i 或 d > ${f.n}）：<b>${over.join(', ')}</b></p>` : '');
    }
    st.innerHTML = svg + grid;
  },
});

/* ============ 排容：三集合文氏圖 ============ */
Labs.reg({
  id: 'venn', title: '排容原理：三集合文氏圖', subject: 'dm', lessons: ['dm-counting'], desc: '一項一項加減，看每個區域「被算了幾次」，最後每塊都剛好 1 次',
  form: [{ id: 'A', label: '|A|', type: 'number', value: '20', size: 4 }, { id: 'B', label: '|B|', type: 'number', value: '25', size: 4 }, { id: 'C', label: '|C|', type: 'number', value: '18', size: 4 },
    { id: 'AB', label: '|A∩B|', type: 'number', value: '8', size: 4 }, { id: 'AC', label: '|A∩C|', type: 'number', value: '6', size: 4 }, { id: 'BC', label: '|B∩C|', type: 'number', value: '7', size: 4 }, { id: 'ABC', label: '|A∩B∩C|', type: 'number', value: '3', size: 4 }],
  presets: [{ name: '1～100 被 2、3、5 整除', v: { A: '50', B: '33', C: '20', AB: '16', AC: '10', BC: '6', ABC: '3' } }],
  build(v) {
    const g = k => +v[k];
    const abc = g('ABC'), ab = g('AB') - abc, ac = g('AC') - abc, bc = g('BC') - abc;
    const a = g('A') - ab - ac - abc, b = g('B') - ab - bc - abc, c = g('C') - ac - bc - abc;
    const R = { a, b, c, ab, ac, bc, abc };
    if (Object.values(R).some(x => x < 0 || isNaN(x))) throw new Error('數字不一致：某個區域會是負的');
    const memb = { a: 'A', b: 'B', c: 'C', ab: 'AB', ac: 'AC', bc: 'BC', abc: 'ABC' };
    const cnt = Object.fromEntries(Object.keys(R).map(k => [k, 0]));
    const steps = [['+', 'A'], ['+', 'B'], ['+', 'C'], ['−', 'AB'], ['−', 'AC'], ['−', 'BC'], ['+', 'ABC']];
    const F = []; let total = 0; const terms = [];
    F.push({ R, cnt: Object.assign({}, cnt), on: '', note: `七個區域的實際大小已標在圖上（由交集反推）。目標：$|A\\cup B\\cup C|$。排容的秘密是：**每個區域最後都要剛好被算 1 次**。` });
    for (const [sg, S] of steps) {
      const delta = sg === '+' ? 1 : -1; const val = g(S); total += delta * val; terms.push(`${sg === '+' ? (terms.length ? '+' : '') : '−'}${val}`);
      for (const k of Object.keys(R)) if ([...S].every(ch => memb[k].includes(ch))) cnt[k] += delta;
      const bad = Object.keys(R).filter(k => cnt[k] !== 1);
      F.push({ R, cnt: Object.assign({}, cnt), on: S, note: `${sg === '+' ? '加上' : '減掉'} $|${[...S].join('\\cap ')}|=${val}$。目前算式 ${terms.join(' ')} = ${total}。` + (bad.length ? `還沒剛好算 1 次的區域：${bad.length} 塊。` : '**全部區域都剛好 1 次** ✓') });
    }
    F.push({ R, cnt, on: 'ABC*', note: `$|A\\cup B\\cup C|=${total}$。直接把七塊加起來驗算：${Object.values(R).join('+')} = ${Object.values(R).reduce((x, y) => x + y, 0)}。` });
    return F;
  },
  render(f, st) {
    const pos = { a: [150, 140], b: [330, 140], c: [240, 300], ab: [240, 115], ac: [175, 235], bc: [305, 235], abc: [240, 195] };
    const circ = (cx, cy, nm, col, on) => `<circle cx="${cx}" cy="${cy}" r="120" style="fill:${col};fill-opacity:${on ? 0.28 : 0.08};stroke:${col};stroke-width:${on ? 4 : 2}"/><text x="${cx + (nm === 'A' ? -110 : nm === 'B' ? 110 : 0)}" y="${cy + (nm === 'C' ? 140 : -95)}" style="font-size:20px;font-weight:700;fill:${col}">${nm}</text>`;
    const on = s => f.on && (f.on.includes(s) || f.on === 'ABC*');
    let svg = `<div class="svgwrap"><svg viewBox="0 0 480 460" width="480" height="460">` + circ(180, 170, 'A', 'var(--s-ds)', on('A')) + circ(300, 170, 'B', 'var(--s-al)', on('B')) + circ(240, 275, 'C', 'var(--s-co)', on('C'));
    for (const [k, [x, y]] of Object.entries(pos)) {
      const c = f.cnt[k]; const col = c === 1 ? 'var(--good)' : c === 0 ? 'var(--ink-2)' : 'var(--bad)';
      svg += `<text x="${x}" y="${y}" style="font-size:18px;font-weight:700">${f.R[k]}</text><text x="${x}" y="${y + 20}" style="font-size:12px;fill:${col}">算了 ${c} 次</text>`;
    }
    st.innerHTML = svg + '</svg></div>';
  },
});

/* ============ Catalan：反射原理 ============ */
Labs.reg({
  id: 'catalan', title: 'Catalan 數：反射原理', subject: 'dm', lessons: ['dm-counting'], desc: '壞路徑第一次碰到 y=x+1 後，把剩下的步伐上下對調，一一對應到終點 (n−1, n+1) 的路徑',
  form: [{ id: 'path', label: '路徑（R＝右、U＝上）', value: 'RUURURRU', wide: true }],
  presets: [{ name: '壞路徑 n=4', v: { path: 'RUURURRU' } }, { name: '好路徑 n=4', v: { path: 'RRUURRUU' } }, { name: '一開始就壞', v: { path: 'URRURUUR' } }, { name: 'n=5 壞路徑', v: { path: 'RRUUURRURU' } }],
  build(v) {
    const p = v.path.toUpperCase().replace(/[^RU]/g, '');
    const n = p.length / 2; if (!Number.isInteger(n) || [...p].filter(c => c === 'R').length !== n) throw new Error('R 與 U 的個數要相同');
    const C = (m, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (m - k + i) / i; return Math.round(r); };
    const pts = [[0, 0]]; for (const c of p) { const [x, y] = pts[pts.length - 1]; pts.push(c === 'R' ? [x + 1, y] : [x, y + 1]); }
    const touch = pts.findIndex(([x, y]) => y === x + 1);
    const F = [];
    F.push({ n, pts, k: 0, touch, refl: null, note: `從 $(0,0)$ 走到 $(${n},${n})$，每步向右或向上。**好路徑**：永遠不跑到對角線 $y=x$ 的上方。總路徑數 $\\binom{${2 * n}}{${n}}=${C(2 * n, n)}$。` });
    for (let k = 1; k <= pts.length - 1; k++) {
      const hit = k === touch;
      F.push({ n, pts, k, touch: hit || k > touch ? touch : -1, refl: null, note: hit ? `第 ${k} 步碰到虛線 $y=x+1$：這是**壞路徑**，記下第一次碰到的點 (${pts[k].join(',')})。` : `第 ${k} 步：${p[k - 1] === 'R' ? '向右' : '向上'}到 (${pts[k].join(',')})。` });
    }
    if (touch < 0) { F.push({ n, pts, k: pts.length - 1, touch, refl: null, note: `整條路徑沒有碰到 $y=x+1$，是好路徑。好路徑共有 $C_${n}=\\frac{1}{${n + 1}}\\binom{${2 * n}}{${n}}=${C(2 * n, n) / (n + 1)}$ 條。換一條壞路徑看看反射。` }); return F; }
    const refl = pts.slice(0, touch + 1);
    for (let k = touch; k < p.length; k++) { const [x, y] = refl[refl.length - 1]; refl.push(p[k] === 'R' ? [x, y + 1] : [x + 1, y]); F.push({ n, pts, k: pts.length - 1, touch, refl: refl.slice(), note: `反射：第 ${k + 1} 步原本${p[k] === 'R' ? '向右' : '向上'}，對調成${p[k] === 'R' ? '向上' : '向右'}。` }); }
    F.push({ n, pts, k: pts.length - 1, touch, refl, note: `反射後的路徑終點是 $(${n - 1},${n + 1})$。每條壞路徑都對應到唯一一條終點為 $(${n - 1},${n + 1})$ 的路徑，反之亦然（再反射一次就回來），所以壞路徑有 $\\binom{${2 * n}}{${n + 1}}=${C(2 * n, n + 1)}$ 條。好路徑 $=${C(2 * n, n)}-${C(2 * n, n + 1)}=${C(2 * n, n) - C(2 * n, n + 1)}=C_${n}$。` });
    return F;
  },
  render(f, st) {
    const n = f.n, s = Math.min(66, 400 / (n + 1)), O = 30, H = (n + 1) * s + O + 44;
    const X = x => O + x * s, Y = y => H - O - y * s;
    let g = '';
    for (let i = 0; i <= n + 1; i++) { g += `<line x1="${X(0)}" y1="${Y(i)}" x2="${X(n)}" y2="${Y(i)}" class="axis" style="stroke-width:1"/>`; if (i <= n) g += `<line x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(n + 1)}" class="axis" style="stroke-width:1"/>`; }
    g += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(n)}" y2="${Y(n)}" style="stroke:var(--good);stroke-width:2"/><line x1="${X(0)}" y1="${Y(1)}" x2="${X(n)}" y2="${Y(n + 1)}" style="stroke:var(--pen);stroke-width:2;stroke-dasharray:6 5"/>`;
    const poly = (pts, col, w) => `<polyline points="${pts.map(([x, y]) => X(x) + ',' + Y(y)).join(' ')}" style="fill:none;stroke:${col};stroke-width:${w};stroke-linejoin:round"/>`;
    g += poly(f.pts.slice(0, f.k + 1), 'var(--accent)', 4);
    if (f.refl) g += poly(f.refl, 'var(--hl-strong)', 4) + `<circle cx="${X(n - 1)}" cy="${Y(n + 1)}" r="7" style="fill:var(--hl-strong)"/><text x="${X(n - 1)}" y="${Y(n + 1) - 12}">(${n - 1},${n + 1})</text>`;
    if (f.touch >= 0) { const [x, y] = f.pts[f.touch]; g += `<circle cx="${X(x)}" cy="${Y(y)}" r="8" style="fill:var(--pen)"/>`; }
    g += `<text x="${X(n)}" y="${Y(n) + 22}">(${n},${n})</text><text x="${X(0)}" y="${Y(0) + 20}">(0,0)</text>`;
    st.innerHTML = `<div class="svgwrap"><svg viewBox="0 0 ${X(n) + 70} ${H}" width="${X(n) + 70}" height="${H}">${g}</svg></div><p class="legend small"><span class="lg tree">原路徑</span><span class="lg cand">反射後</span><span class="lg back">y = x + 1</span></p>`;
  },
});

/* ============ Hasse 圖：整除偏序 ============ */
Labs.reg({
  id: 'hasse', title: 'Hasse 圖：整除偏序', subject: 'dm', lessons: ['dm-relations'], desc: '從「所有可比較的邊」刪到 Hasse 圖，再看最長鏈、最大反鏈、gcd 與 lcm',
  form: [{ id: 'n', label: 'n 的所有正因數', type: 'number', value: '60', size: 6 }, { id: 'x', label: '元素 x', type: 'number', value: '12', size: 5 }, { id: 'y', label: '元素 y', type: 'number', value: '20', size: 5 }],
  presets: [{ name: '24', v: { n: '24', x: '6', y: '8' } }, { name: '30（布林代數）', v: { n: '30', x: '6', y: '10' } }, { name: '72', v: { n: '72', x: '12', y: '18' } }],
  build(v) {
    const n = +v.n; if (!(n >= 2 && n <= 720)) throw new Error('n 請在 2～720');
    const D = []; for (let d = 1; d <= n; d++) if (n % d === 0) D.push(d);
    const omega = m => { let c = 0; for (let p = 2; p * p <= m; p++) while (m % p === 0) { m /= p; c++; } return c + (m > 1 ? 1 : 0); };
    const lv = Object.fromEntries(D.map(d => [d, omega(d)]));
    const all = [], cover = [];
    for (const a of D) for (const b of D) if (a < b && b % a === 0) { all.push([a, b]); if (!D.some(c => c !== a && c !== b && c % a === 0 && b % c === 0)) cover.push([a, b]); }
    const H = Math.max(...Object.values(lv));
    const chain = [1]; while (chain[chain.length - 1] !== n) { const c = chain[chain.length - 1]; chain.push(cover.find(([a]) => a === c)[1]); }
    const levels = Array.from({ length: H + 1 }, (_, i) => D.filter(d => lv[d] === i)); const wide = levels.reduce((x, y) => y.length > x.length ? y : x);
    const x = +v.x, y = +v.y; if (!D.includes(x) || !D.includes(y)) throw new Error('x、y 必須是 n 的因數');
    const gcd = (p, q) => q ? gcd(q, p % q) : p; const g = gcd(x, y), l = x / g * y;
    const sq = (() => { let m = n; for (let p = 2; p * p <= m; p++) { if (m % (p * p) === 0) return false; while (m % p === 0) m /= p; } return true; })();
    const base = { D, lv, H };
    return [
      Object.assign({}, base, { edges: all, note: `${D.length} 個正因數，「$a\\mid b$」是偏序（自反、反對稱、遞移）。先畫出所有可比較的對：共 ${all.length} 條邊，很亂。` }),
      Object.assign({}, base, { edges: cover, note: `Hasse 圖只保留**覆蓋關係**（$a\\mid b$ 且中間沒有其他元素），其餘由遞移性推得。剩 ${cover.length} 條邊；層數＝質因數個數（含重數）。` }),
      Object.assign({}, base, { edges: cover, hl: chain, note: `最長鏈 ${chain.join(' | ')}，長度 ${chain.length}。依 Mirsky 定理，至少要 ${chain.length} 個反鏈才能蓋住整個集合。` }),
      Object.assign({}, base, { edges: cover, hl2: wide, note: `最大反鏈（兩兩不可比較）：{${wide.join(', ')}}，大小 ${wide.length}。依 **Dilworth 定理**，最少需要 ${wide.length} 條鏈才能覆蓋全部元素。` }),
      Object.assign({}, base, { edges: cover, hl: [x, y], hl2: [g, l], note: `$${x}\\wedge ${y}=\\gcd=${g}$（最大下界）、$${x}\\vee ${y}=\\operatorname{lcm}=${l}$（最小上界）。任兩元素都有 meet 與 join，所以是**格**。${sq ? `$n=${n}$ 沒有平方因數，這個格是布林代數（同構於 ${omega(n)} 個質因數的冪集合）。` : `$n=${n}$ 有平方因數，不是布林代數（有元素沒有補元）。`}` }),
    ];
  },
  render(f, st) {
    const W = 560, levels = Array.from({ length: f.H + 1 }, (_, i) => f.D.filter(d => f.lv[d] === i));
    const Hh = (f.H + 1) * 80 + 30; const P = {};
    levels.forEach((ds, i) => ds.forEach((d, j) => { P[d] = [W / 2 + (j - (ds.length - 1) / 2) * Math.min(90, (W - 60) / ds.length), Hh - 40 - i * 80]; }));
    const on = (arr, d) => arr && arr.includes(d);
    let g = f.edges.map(([a, b]) => { const hlE = f.hl && on(f.hl, a) && on(f.hl, b) && f.hl.indexOf(b) === f.hl.indexOf(a) + 1; return `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" style="stroke:${hlE ? 'var(--accent)' : 'var(--ink-2)'};stroke-width:${hlE ? 4 : 1.4};opacity:${f.edges.length > 40 ? 0.45 : 0.9}"/>`; }).join('');
    for (const d of f.D) g += `<g class="gnode ${on(f.hl, d) ? 'cur' : ''}"><circle cx="${P[d][0]}" cy="${P[d][1]}" r="19" style="${on(f.hl2, d) ? 'fill:var(--hl)' : ''}"/><text x="${P[d][0]}" y="${P[d][1] + 5}">${d}</text></g>`;
    st.innerHTML = `<div class="svgwrap"><svg class="graph" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}">${g}</svg></div>`;
  },
});

/* ============ 延伸歐幾里得 ============ */
Labs.reg({
  id: 'euclid', title: '延伸歐幾里得與模反元素', subject: 'dm', lessons: ['dm-nt-algebra'], desc: '一列一列算 q、r、s、t，最後得到 gcd = sa + tb 與反元素',
  form: [{ id: 'a', label: 'a', type: 'number', value: '252', size: 7 }, { id: 'b', label: 'b', type: 'number', value: '198', size: 7 }],
  presets: [{ name: '252, 198', v: { a: '252', b: '198' } }, { name: '求 17 在模 3120 的反元素（RSA）', v: { a: '3120', b: '17' } }, { name: 'Fibonacci（最壞情況）', v: { a: '89', b: '55' } }],
  build(v) {
    const a0 = Math.abs(Math.trunc(+v.a)), b0 = Math.abs(Math.trunc(+v.b)); if (!a0 || !b0) throw new Error('請輸入正整數');
    const rows = [[a0, '', 1, 0], [b0, '', 0, 1]]; const F = [];
    const head = ['i', 'r', 'q', 's', 't', 's·a + t·b'];
    const view = (hl) => ({ head, rows: rows.map((r, i) => [i, r[0], r[1], r[2], r[3], `${r[2]}·${a0} + ${r[3]}·${b0} = ${r[2] * a0 + r[3] * b0}`]), hl });
    F.push(Object.assign(view([0, 1]), { note: `初始：$r_0=${a0}=1\\cdot a+0\\cdot b$，$r_1=${b0}=0\\cdot a+1\\cdot b$。不變量：每一列都滿足 $r_i=s_ia+t_ib$。` }));
    while (rows[rows.length - 1][0] !== 0) {
      const [r1, , s1, t1] = rows[rows.length - 2], [r2, , s2, t2] = rows[rows.length - 1];
      const q = Math.floor(r1 / r2); rows[rows.length - 1][1] = q;
      rows.push([r1 - q * r2, '', s1 - q * s2, t1 - q * t2]);
      F.push(Object.assign(view([rows.length - 1]), { note: `$q=\\lfloor ${r1}/${r2}\\rfloor=${q}$；新的一列＝上上列 − ${q}×上一列：$r=${r1 - q * r2}$，$s=${s1 - q * s2}$，$t=${t1 - q * t2}$。` }));
    }
    const k = rows.length - 2; const [g, , s, t] = rows[k];
    let tail = `$\\gcd(${a0},${b0})=${g}=(${s})\\cdot${a0}+(${t})\\cdot${b0}$（Bézout），共 ${rows.length - 2} 次除法。`;
    if (g === 1) tail += ` 因為 gcd = 1：$${b0}^{-1}\\equiv ${((t % a0) + a0) % a0}\\pmod{${a0}}$，$${a0}^{-1}\\equiv ${((s % b0) + b0) % b0}\\pmod{${b0}}$。`;
    else tail += ` gcd ≠ 1，所以兩者在彼此的模下都沒有乘法反元素。`;
    F.push(Object.assign(view([k]), { note: tail }));
    return F;
  },
  render(f, st) { st.innerHTML = htmlTable(f.rows, { head: f.head, cls: i => f.hl.includes(i) ? 'chg' : '' }); },
});
