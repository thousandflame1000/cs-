/* 資工所衝刺站 — 題目表第二批（2026-11-10）：事實表型、邏輯推理型、情境包裝
   事實表：一張「東西 × 性質」的表，每次隨機挑一格或一個性質，組出選擇／是非題；表本身就是唯一的資料來源。
   邏輯推理：命題公式、關係、偏序、MESI 序列都由程式判斷答案。 */
'use strict';
(() => {
  const range = n => Array.from({ length: n }, (_, i) => i);
  const must = (ok, msg) => { if (!ok) throw new Error('驗算失敗：' + msg); };
  function mc(r, right, wrongs, n = 4) {
    const seen = new Set([String(right)]), w = [];
    for (const x of r.shuffle(wrongs)) { if (w.length >= n - 1) break; if (!seen.has(String(x))) { seen.add(String(x)); w.push(x); } }
    if (w.length < n - 1) return null;
    const opts = r.shuffle([right, ...w]); return { type: 'single', opts, ans: [opts.indexOf(right)] };
  }
  const Y = '是', N = '否';
  const tf = (ok) => ({ type: 'single', opts: ['對', '不對'], ans: [ok ? 0 : 1] });

  /* ---------- 事實表引擎 ----------
     rows：[名稱, {性質: 值}]；props：{性質: 問句樣板}。三種問法：
     (a) 問某列某性質的值（選擇：干擾項取同一性質的其他值）
     (b) 問「哪一個的性質是 v」（選擇：干擾項取性質不是 v 的列）
     (c) 是非：「X 的性質是 v」對不對 */
  function factTable(d) {
    Gen.tpl({ id: d.id, kp: d.kp, title: d.title, diff: d.diff || 1,
      draw(r) { return { form: r.int(0, 2), row: r.int(0, d.rows.length - 1), prop: r.pick(Object.keys(d.props)), alt: r.int(0, d.rows.length - 1) }; },
      build({ form, row, prop, alt }, r) {
        const [name, P] = d.rows[row], v = P[prop], ask = d.props[prop]; if (v == null) return null;
        const vals = [...new Set(d.rows.map(x => x[1][prop]).filter(x => x != null))];
        if (form === 0) { if (vals.length < 4 && !d.vals?.[prop]) return null; const q = mc(r, v, (d.vals?.[prop] || vals).filter(x => x !== v)); if (!q) return null;
          return Object.assign(q, { stem: ask.q(name), expl: `${name}：${ask.label}＝**${v}**。\n\n${d.note || ''}` }); }
        if (form === 1) { const yes = d.rows.filter(x => x[1][prop] === v).map(x => x[0]), no = d.rows.filter(x => x[1][prop] != null && x[1][prop] !== v).map(x => x[0]); if (yes.length !== 1 && no.length < 3) return null;
          if (yes.length === 1) { const q = mc(r, name, no); if (!q) return null; return Object.assign(q, { stem: v === Y ? `下列哪一個符合「${ask.label}」？` : v === N ? `下列哪一個**不**符合「${ask.label}」？` : `下列哪一個的${ask.label}是「${v}」？`, expl: `只有 ${name} 是 ${v}。其他：${no.map(x => `${x}＝${d.rows.find(y => y[0] === x)[1][prop]}`).join('、')}。` }); }
          if (no.length < 1 || yes.length < 3) return null; const odd = r.pick(no); const q = mc(r, odd, yes); if (!q) return null; return Object.assign(q, { stem: v === Y ? `下列哪一個**不**符合「${ask.label}」？` : v === N ? `下列哪一個符合「${ask.label}」？` : `下列哪一個的${ask.label}**不是**「${v}」？`, expl: `${odd} 的${ask.label}是 ${d.rows.find(y => y[0] === odd)[1][prop]}；其他都是 ${v}。` }); }
        const [n2, P2] = d.rows[alt], v2 = P2[prop]; if (v2 == null) return null; const claim = r() < .5 ? v : v2;
        return Object.assign(tf(claim === v), { stem: claim === Y || claim === N ? `「${name}${claim === Y ? '' : '不'}符合「${ask.label}」」，這句話對嗎？` : `「${name}的${ask.label}是 ${claim}」，這句話對嗎？`, expl: `${name}的${ask.label}是 **${v}**。` });
      } });
  }
    factTable({ id: 'sortT', kp: 'ds-sort#1', title: '排序法性質表', diff: 1,
    rows: [['插入排序', { s: Y, ip: Y, best: 'Θ(n)', avg: 'Θ(n²)', worst: 'Θ(n²)', cmp: Y }], ['選擇排序', { s: N, ip: Y, best: 'Θ(n²)', avg: 'Θ(n²)', worst: 'Θ(n²)', cmp: Y }], ['泡沫排序', { s: Y, ip: Y, avg: 'Θ(n²)', worst: 'Θ(n²)', cmp: Y }],
      ['合併排序', { s: Y, ip: N, best: 'Θ(n lg n)', avg: 'Θ(n lg n)', worst: 'Θ(n lg n)', cmp: Y }], ['快速排序', { s: N, ip: Y, best: 'Θ(n lg n)', avg: 'Θ(n lg n)', worst: 'Θ(n²)', cmp: Y }], ['堆積排序', { s: N, ip: Y, best: 'Θ(n lg n)', avg: 'Θ(n lg n)', worst: 'Θ(n lg n)', cmp: Y }],
      ['計數排序', { s: Y, ip: N, worst: 'Θ(n+k)', cmp: N }], ['基數排序', { s: Y, ip: N, worst: 'Θ(d(n+k))', cmp: N }]],
    props: { s: { label: '穩定', q: n => `${n}是穩定的嗎？` }, ip: { label: '原地（只用 O(1) 或 O(lg n) 額外空間）', q: n => `${n}是原地排序嗎？` }, best: { label: '最好情況時間', q: n => `${n}最好情況的時間是？` }, avg: { label: '平均時間', q: n => `${n}平均的時間是？` }, worst: { label: '最壞情況時間', q: n => `${n}最壞情況的時間是？` }, cmp: { label: '比較排序', q: n => `${n}是比較排序嗎？` } },
    vals: { s: [Y, N, '看實作', '只在 n 小時'], ip: [Y, N, '看實作', '只有遞迴版'], cmp: [Y, N, '看資料', '只在 k 小時'], best: ['Θ(n)', 'Θ(n lg n)', 'Θ(n²)', 'Θ(lg n)'], avg: ['Θ(n)', 'Θ(n lg n)', 'Θ(n²)', 'Θ(n^1.5)'] },
    note: '快速排序原地但不穩定；合併排序穩定但要 Θ(n) 額外空間；計數、基數排序不是比較排序，所以不受 Ω(n lg n) 限制。' });
  factTable({ id: 'heapT', kp: 'ds-heap#2', title: '優先佇列操作時間表', diff: 2,
    rows: [['沒排序的陣列', { ins: 'O(1)', ext: 'O(n)', dec: 'O(1)', uni: 'O(1)' }], ['二元堆積', { ins: 'O(lg n)', ext: 'O(lg n)', dec: 'O(lg n)', uni: 'O(n)' }], ['Binomial heap', { ins: 'O(lg n)', ext: 'O(lg n)', dec: 'O(lg n)', uni: 'O(lg n)' }], ['Fibonacci heap（攤銷）', { ins: 'O(1)', ext: 'O(lg n)', dec: 'O(1)', uni: 'O(1)' }]],
    props: { ins: { label: 'Insert 時間', q: n => `${n}的 Insert 要多少時間？` }, ext: { label: 'Extract-min 時間', q: n => `${n}的 Extract-min 要多少時間？` }, dec: { label: 'Decrease-key 時間', q: n => `${n}的 Decrease-key 要多少時間？` }, uni: { label: 'Union（合併兩個）時間', q: n => `${n}的 Union 要多少時間？` } },
    vals: { ins: ['O(1)', 'O(lg n)', 'O(n)', 'O(n lg n)'], ext: ['O(1)', 'O(lg n)', 'O(n)', 'O(√n)'], dec: ['O(1)', 'O(lg n)', 'O(n)', 'O(lg lg n)'], uni: ['O(1)', 'O(lg n)', 'O(n)', 'O(n lg n)'] },
    note: 'Dijkstra 用 Fibonacci heap 變 O(E + V lg V)，就是因為 Decrease-key 攤銷 O(1)。' });
  factTable({ id: 'spT', kp: 'al-sp#2', title: '最短路徑演算法比較表', diff: 2,
    rows: [['BFS', { t: 'O(V+E)', neg: '不行（沒有權重）', k: '單源' }], ['Dijkstra（二元堆積）', { t: 'O((V+E) lg V)', neg: '不行', k: '單源' }], ['Dijkstra（Fibonacci 堆積）', { t: 'O(E+V lg V)', neg: '不行', k: '單源' }], ['Bellman-Ford', { t: 'O(VE)', neg: '可以，還能抓負環', k: '單源' }],
      ['DAG 拓撲序鬆弛', { t: 'O(V+E)', neg: '可以（無環）', k: '單源' }], ['Floyd–Warshall', { t: 'O(V³)', neg: '可以（不能有負環）', k: '所有點對' }], ['Johnson', { t: 'O(V² lg V+VE)', neg: '可以（不能有負環）', k: '所有點對' }]],
    props: { t: { label: '時間', q: n => `${n}的時間複雜度是？` }, neg: { label: '能不能處理負邊', q: n => `${n}能處理負的邊權嗎？` }, k: { label: '解的問題', q: n => `${n}解的是哪一種最短路徑問題？` } },
    vals: { k: ['單源', '所有點對', '單一點對', '最長路徑'] } });
  factTable({ id: 'schedT', kp: 'os-sched#2', title: 'CPU 排程法性質表', diff: 1,
    rows: [['FCFS', { pre: N, st: N, opt: N }], ['SJF（非搶先）', { pre: N, st: Y, opt: '非搶先裡平均等待最短' }], ['SRTF', { pre: Y, st: Y, opt: '平均等待最短' }], ['RR', { pre: Y, st: N, opt: N }], ['優先權（搶先，沒有 aging）', { pre: Y, st: Y, opt: N }], ['MLFQ', { pre: Y, st: Y, opt: N }]],
    props: { pre: { label: '搶先式', q: n => `${n}是搶先式（preemptive）嗎？` }, st: { label: '可能飢餓', q: n => `${n}可能讓某個行程飢餓嗎？` } },
    vals: { pre: [Y, N, '看時間片', '看優先權'], st: [Y, N, '只有 I/O 多時', '只有時間片很大時'] } });
  factTable({ id: 'raidT', kp: 'os-storage#2', title: 'RAID 等級比較表', diff: 1,
    rows: [['RAID 0', { cap: 'n', fail: '0 顆', how: '只條帶化' }], ['RAID 1', { cap: 'n/2', fail: '每組 1 顆', how: '鏡像' }], ['RAID 4', { cap: 'n−1', fail: '1 顆', how: '同位元集中在一顆' }], ['RAID 5', { cap: 'n−1', fail: '1 顆', how: '同位元分散' }], ['RAID 6', { cap: 'n−2', fail: '2 顆', how: '兩組同位元' }], ['RAID 1+0', { cap: 'n/2', fail: '每組 1 顆', how: '先鏡像再條帶' }]],
    props: { cap: { label: '可用容量（n 顆）', q: n => `${n}用 n 顆硬碟，可用容量是幾顆？` }, fail: { label: '保證能壞幾顆', q: n => `${n}保證能壞幾顆還救得回來？` }, how: { label: '做法', q: n => `${n}的做法是？` } },
    vals: { cap: ['n', 'n/2', 'n−1', 'n−2'], fail: ['0 顆', '1 顆', '2 顆', '每組 1 顆'] } });
  factTable({ id: 'pageT', kp: 'os-vm#2', title: '頁替換演算法性質表', diff: 1,
    rows: [['FIFO', { bel: Y, need: N, how: '換最早進來的' }], ['OPT', { bel: N, need: Y, how: '換最久以後才會用到的' }], ['LRU', { bel: N, need: N, how: '換最久沒用的' }], ['Clock（第二次機會）', { bel: Y, need: N, how: '參考位元是 0 的才換，1 就清成 0 再給一次機會' }], ['LFU', { bel: Y, need: N, how: '換用最少次的' }]],
    props: { bel: { label: '可能有 Belady 異常', q: n => `${n}可能發生 Belady 異常（frame 變多、缺頁反而變多）嗎？` }, need: { label: '需要知道未來', q: n => `${n}需要知道未來的參考串嗎？` }, how: { label: '換掉誰', q: n => `${n}換掉哪一頁？` } },
    vals: { bel: [Y, N, '只在 frame 是奇數時', '只在參考串很長時'], need: [Y, N, '要知道一半', '只要知道下一個'] },
    note: 'LRU、OPT 是堆疊演算法（frame 多時存的頁一定包含 frame 少時的），所以不會有 Belady 異常。' });
  factTable({ id: 'npT', kp: 'al-np#3', title: '在 P 還是 NP-complete', diff: 2,
    rows: [['2-SAT', { c: 'P' }], ['3-SAT', { c: 'NP-complete' }], ['最短路徑（非負邊）', { c: 'P' }], ['最長簡單路徑', { c: 'NP-complete' }], ['二分圖最大匹配', { c: 'P' }], ['3-著色', { c: 'NP-complete' }], ['2-著色', { c: 'P' }], ['歐拉迴路', { c: 'P' }], ['漢米頓迴路', { c: 'NP-complete' }], ['最小生成樹', { c: 'P' }], ['TSP（決策版）', { c: 'NP-complete' }], ['子集合和', { c: 'NP-complete' }], ['頂點覆蓋（決策版）', { c: 'NP-complete' }], ['最大流', { c: 'P' }], ['線性規劃', { c: 'P' }], ['CLIQUE', { c: 'NP-complete' }]],
    props: { c: { label: '複雜度類別', q: n => `${n}屬於哪一類（就目前所知）？` } }, vals: { c: ['P', 'NP-complete', '不可判定', 'NP-hard 但不在 NP'] },
    note: '看起來很像的一對常常一個 P、一個 NPC：2-SAT／3-SAT、2-著色／3-著色、歐拉／漢米頓、最短／最長路徑。' });

  /* ---------- 漸近成長比較 ---------- */
  const GROW = [['\\lg\\lg n', 1], ['\\sqrt{\\lg n}', 2], ['\\lg n', 3], ['(\\lg n)^2', 4], ['n^{0.01}', 5], ['\\sqrt n', 6], ['n/\\lg n', 7], ['n', 8], ['n\\lg n', 9], ['n^{1.5}', 10], ['n^{\\lg 3}', 11], ['n^2', 12], ['n^2\\lg n', 13], ['n^3', 14], ['n^{\\lg n}', 15], ['2^n', 16], ['3^n', 17], ['n!', 18], ['n^n', 19], ['2^{2^n}', 20]];
  Gen.tpl({ id: 'grow', kp: 'al-recurrence#1', title: '誰長得比較快', diff: 2,
    draw(r) { return { pick: r.shuffle(range(GROW.length)).slice(0, 4), kind: r.int(0, 2) }; },
    build({ pick, kind }, r) {
      const fs = pick.map(i => GROW[i]), srt = fs.slice().sort((a, b) => a[1] - b[1]);
      if (kind === 2) { const [f, g] = fs, ok = f[1] < g[1]; return Object.assign(tf(ok), { stem: `$${f[0]} = o(${g[0]})$（$${f[0]}$ 長得比 $${g[0]}$ 慢得多）對嗎？`, expl: `由慢到快：$${GROW.filter(x => x === f || x === g).sort((a, b) => a[1] - b[1]).map(x => x[0]).join(' \\ll ')}$。` }); }
      const right = kind ? srt[3] : srt[0], q = mc(r, `$${right[0]}$`, fs.filter(x => x !== right).map(x => `$${x[0]}$`)); if (!q) return null;
      return Object.assign(q, { stem: `下列哪一個長得最${kind ? '快' : '慢'}（n 很大時）？`, expl: `由慢到快：$${srt.map(x => x[0]).join(' \\ll ')}$。對數 ≪ 任何正次方 ≪ 多項式 ≪ 指數 ≪ 階乘。` });
    } });

  /* ---------- 命題邏輯：程式算真值表 ---------- */
  const OPS = [['∧', (a, b) => a && b, '\\land'], ['∨', (a, b) => a || b, '\\lor'], ['→', (a, b) => !a || b, '\\to'], ['↔', (a, b) => a === b, '\\leftrightarrow']];
  function formula(r, d) { if (d === 0 || r() < .25) { const v = r.pick(['p', 'q', 'r']); return r() < .3 ? { n: true, x: { v } } : { v }; } const op = r.int(0, 3); return { op, a: formula(r, d - 1), b: formula(r, d - 1), n: r() < .2 }; }
  const ev = (f, e) => (f.v ? e[f.v] : f.op == null ? !ev(f.x, e) : (f.n ? !OPS[f.op][1](ev(f.a, e), ev(f.b, e)) : OPS[f.op][1](ev(f.a, e), ev(f.b, e))));
  const tx = f => (f.v ? f.v : f.op == null ? `\\lnot ${tx(f.x)}` : `${f.n ? '\\lnot' : ''}(${tx(f.a)} ${OPS[f.op][2]} ${tx(f.b)})`);
  const envs = range(8).map(m => ({ p: !!(m & 4), q: !!(m & 2), r: !!(m & 1) }));
  Gen.tpl({ id: 'logic', kp: 'dm-logic#1', title: '恆真、矛盾、還是都有可能', diff: 2,
    draw(r) { return { f: formula(r, r.int(2, 3)), g: formula(r, 2), kind: r.int(0, 1) }; },
    build({ f, g, kind }, r) {
      const vf = envs.map(e => ev(f, e)), t = vf.filter(Boolean).length; if (tx(f).length > 70) return null;
      if (kind === 0) { const cls = t === 8 ? '恆真（tautology）' : t === 0 ? '矛盾（contradiction）' : '可能真可能假（contingency）'; if (t > 0 && t < 8 && r() < .6) return null;
        const q = mc(r, cls, ['恆真（tautology）', '矛盾（contradiction）', '可能真可能假（contingency）', '要看 p、q、r 的意思'], 4); if (!q) return null;
        return Object.assign(q, { stem: `$${tx(f)}$ 是哪一種？`, expl: `列真值表 8 列：真的有 ${t} 列（${envs.map((e, i) => (vf[i] ? 'T' : 'F')).join('')}，依 pqr = FFF…TTT）。所以是**${cls}**。` }); }
      const vg = envs.map(e => ev(g, e)), eq = vf.every((x, i) => x === vg[i]); if (tx(g).length > 50 || (!eq && r() < .5)) return null;
      return Object.assign(tf(eq), { stem: `$${tx(f)}$ 和 $${tx(g)}$ 邏輯等價嗎？`, expl: `兩邊的真值表（pqr = FFF…TTT）：${vf.map(x => (x ? 'T' : 'F')).join('')} 與 ${vg.map(x => (x ? 'T' : 'F')).join('')}，${eq ? '每一列都一樣，等價' : '有列不一樣，不等價'}。` });
    } });

  /* ---------- 關係的性質、閉包、偏序 ---------- */
  Gen.tpl({ id: 'relprop', kp: 'dm-relations#1', title: '關係有哪些性質', diff: 2,
    draw(r) { const R = []; for (let a = 1; a <= 4; a++) for (let b = 1; b <= 4; b++) if (r() < (a === b ? .6 : .3)) R.push([a, b]); return { R }; },
    build({ R }) {
      const has = (a, b) => R.some(p => p[0] === a && p[1] === b), S = [1, 2, 3, 4];
      const ref = S.every(a => has(a, a)), sym = R.every(([a, b]) => has(b, a)), anti = R.every(([a, b]) => a === b || !has(b, a)), tra = R.every(([a, b]) => R.every(([c, d]) => c !== b || has(a, d)));
      const props = [['自反', ref], ['對稱', sym], ['反對稱', anti], ['遞移', tra]], opts = [...props.map(p => p[0]), '四個都沒有'], ans = props.map((p, i) => (p[1] ? i : -1)).filter(i => i >= 0);
      if (R.length < 3) return null;
      return { type: 'multi', opts, ans: ans.length ? ans : [4], stem: `集合 {1,2,3,4} 上的關係 R = {${R.map(([a, b]) => `(${a},${b})`).join(', ')}}。R 有哪些性質？（可複選）`,
        expl: props.map(([n, v]) => `${n}：${v ? '有' : '沒有'}`).join('；') + '。\n\n自反要 (1,1)…(4,4) 都在；對稱要每對反過來也在；反對稱是 a≠b 時不能兩個方向都在；遞移是 (a,b)、(b,c) 在就要有 (a,c)。' };
    } });
  Gen.tpl({ id: 'closure', kp: 'dm-relations#2', title: '遞移閉包有幾對', diff: 2,
    draw(r) { const R = []; for (let a = 1; a <= 5; a++) for (let b = 1; b <= 5; b++) if (a !== b && r() < .18) R.push([a, b]); return { R, kind: r.int(0, 1) }; },
    build({ R, kind }) {
      const M = range(6).map(() => new Array(6).fill(false)); R.forEach(([a, b]) => (M[a][b] = true)); if (kind) for (let a = 1; a <= 5; a++) M[a][a] = true;
      for (let k = 1; k <= 5; k++) for (let i = 1; i <= 5; i++) for (let j = 1; j <= 5; j++) if (M[i][k] && M[k][j]) M[i][j] = true;
      const cnt = range(5).reduce((s, i) => s + range(5).filter(j => M[i + 1][j + 1]).length, 0); if (R.length < 3 || cnt === R.length + (kind ? 5 : 0)) return null;
      return { type: 'fill', stem: `{1,…,5} 上的關係 R = {${R.map(([a, b]) => `(${a},${b})`).join(', ')}}。它的${kind ? '自反遞移閉包' : '遞移閉包'}有幾個序對？`, ans: [cnt], expl: `用 Warshall（依序允許 1、2、…、5 當中間點）${kind ? '，再加上 5 個 (a,a)' : ''}：共 **${cnt}** 對。` };
    } });
  Gen.tpl({ id: 'divposet', kp: 'dm-relations#4', title: '因數偏序的 Hasse 圖', diff: 2,
    draw(r) { return { n: r.pick([12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 60, 72, 84, 90, 96, 100, 105, 108, 120, 126, 140, 144, 150, 168, 180, 210]), kind: r.int(0, 2) }; },
    build({ n, kind }) {
      const D = range(n + 1).filter(d => d && n % d === 0), cover = []; D.forEach(a => D.forEach(b => { if (b !== a && b % a === 0 && D.every(c => c === a || c === b || !(c % a === 0 && b % c === 0))) cover.push([a, b]); }));
      let m = n, om = 0; for (let p = 2; m > 1; p++) while (m % p === 0) { m /= p; om++; }
      if (kind === 0) return { type: 'fill', stem: `${n} 的正因數，用整除關係排成偏序。Hasse 圖有幾條邊？`, ans: [cover.length], expl: `因數 ${D.join('、')}。邊＝「a 整除 b、中間沒有別的因數」＝ b/a 是質數：共 **${cover.length}** 條。` };
      if (kind === 1) return { type: 'fill', stem: `${n} 的正因數用整除排成偏序，最長的鏈有幾個元素？`, ans: [om + 1], expl: `從 1 每次乘一個質因數到 ${n}：質因數（含重複）有 ${om} 個，鏈長 **${om + 1}**。` };
      return { type: 'fill', stem: `${n} 的正因數有幾個？（Hasse 圖有幾個點）`, ans: [D.length], expl: `${D.join('、')}，共 **${D.length}** 個。` };
    } });

  /* ---------- MESI：隨機讀寫序列 ---------- */
  Gen.tpl({ id: 'mesiseq', kp: 'co-vm-coherence#2', title: 'MESI 讀寫序列最後的狀態', diff: 3,
    draw(r) { return { ops: range(r.int(3, 6)).map(() => [r.int(0, 2), r() < .55 ? 'R' : 'W']) }; },
    build({ ops }) {
      const st = ['I', 'I', 'I'], log = [], n = ops.some(o => o[0] === 2) ? 3 : 2;
      for (const [p, o] of ops) { if (o === 'R') { if (st[p] === 'I') { const others = st.some((s, i) => i !== p && s !== 'I'); st.forEach((s, i) => { if (i !== p && (s === 'M' || s === 'E')) st[i] = 'S'; }); st[p] = others ? 'S' : 'E'; } } else { st.forEach((s, i) => { if (i !== p) st[i] = 'I'; }); st[p] = 'M'; } log.push(`P${p + 1} ${o === 'R' ? '讀' : '寫'} → ${st.slice(0, n).join(' ')}`); }
      return { type: 'fill', fmt: `P1${n === 3 ? ',P2,P3' : ',P2'} 的狀態，例如 S,I`, stem: `${n} 個核心用 MESI，$x$ 一開始都不在任何快取。依序：${ops.map(([p, o]) => `P${p + 1}${o === 'R' ? '讀' : '寫'} x`).join('、')}。最後 ${range(n).map(i => 'P' + (i + 1)).join('、')} 的狀態？`, ans: [st.slice(0, n).join(',')],
        expl: log.join('\n\n') + '\n\n讀：沒人有 → E；有人有 → 大家 S（M 要先寫回）。寫：別人全部 I，自己 M。' };
    } });

  /* ---------- 矩陣可逆的等價條件（隨機矩陣） ---------- */
  Gen.tpl({ id: 'invcond', kp: 'la-systems#2', title: '可逆的等價條件', diff: 2,
    draw(r) { const s = r() < .5; let A = range(3).map(() => range(3).map(() => r.int(-3, 3))); if (s) { const k = r.int(-2, 2), l = r.int(-2, 2); A[2] = A[0].map((x, j) => k * x + l * A[1][j]); } return { A }; },
    build({ A }, r) {
      const d = GU.det(A), inv = d !== 0, claims = [[`$\\det A\\ne0$`, inv], [`$A\\mathbf x=\\mathbf 0$ 只有零解`, inv], ['三個列向量線性獨立', inv], ['0 是 $A$ 的特徵值', !inv], ['$\\operatorname{rank}A=3$', inv], ['$A$ 的行空間是 $\\mathbb R^3$', inv]];
      const pick = r.shuffle(claims).slice(0, 4), ans = pick.map((c, i) => (c[1] ? i : -1)).filter(i => i >= 0); if (!ans.length) return null;
      return { type: 'multi', opts: pick.map(c => c[0]), ans, stem: `$A=${GU.tex(A)}$。下列哪些敘述成立？（可複選）`, expl: `$\\det A=${d}$，所以 $A$ ${inv ? '可逆：可逆的那一串等價條件全部成立，「0 是特徵值」不成立' : '不可逆：「0 是特徵值」成立，其他可逆條件都不成立'}。` };
    } });

  /* ---------- 情境包裝：同一個計算核心換故事 ---------- */
  const wrap = (id, stories) => { const g = Gen.get(id); if (!g) return; const mk = g.make; g.make = r => { const q = mk(r), s = r.pick(stories); if (!s) return q; return Object.assign(q, { stem: s(q.stem) }); }; };
  wrap('topo', [null, s => `**修課規劃**：每個點是一門課，A→B 表示 A 是 B 的先修。${s.replace('有向無環圖', '這張先修圖')}（拓撲排序＝一種合法的修課順序）`, s => `**編譯順序**：每個點是一個模組，A→B 表示 B 要用到 A，A 要先編。${s}`, s => `**專案工作**：A→B 表示 A 做完 B 才能開始，一次只做一件。${s}`]);
  wrap('actsel', [null, s => `**會議室**：只有一間會議室，下面是各組想借的時段。${s.replace('8 個活動', '8 個會議')}`, s => `**看電視**：只有一台電視，想看的節目時段如下。${s.replace('8 個活動', '8 個節目').replace('活動', '節目')}`]);
  wrap('maxflow', [null, s => `**物流**：每條路一天最多跑幾車貨（容量）。${s.replace('流量網路（容量）', '路網（每天車次上限）').replace('最大流是多少', '每天最多能送幾車到 t')}`, s => `**網路頻寬**：每條線路的頻寬（Gbps）如下。${s.replace('流量網路（容量）', '機房線路').replace('最大流是多少', '從 s 到 t 最多能傳多少 Gbps')}`, s => `**自來水**：水管每秒最多流幾噸。${s.replace('流量網路（容量）', '水管').replace('最大流是多少', '每秒最多送幾噸到 t')}`]);
  wrap('coin', [null, s => `**郵票**：${s.replace('硬幣面額', '郵票面額').replace('每種無限多', '每種買得到很多張').replace('湊出', '剛好貼出').replace('幾枚', '幾張').replace('幾枚', '幾張')}`]);
  wrap('huff', [null, s => `**簡訊壓縮**：${s.replace('個字元出現次數', '個符號在一則訊息裡出現的次數')}`, s => `**日誌壓縮**：伺服器日誌裡${s.replace('個字元出現次數', '種事件出現的次數').replace('字元', '事件')}`]);
  wrap('bfs', [null, s => `**社群網路**：點是人、邊是朋友關係。${s.replace('做 BFS', '一圈一圈找朋友、朋友的朋友（BFS）')}`, s => `**捷運**：點是站、邊是相鄰兩站。${s}`]);
  wrap('lis', [null, s => `**股價**：連續幾天的收盤價是 ${s.replace(/^數列 /, '').replace(' 的最長（嚴格）遞增子序列長度是？', '。挑出一些天（順序不變），價格要一天比一天高，最多能挑幾天？')}`]);
  wrap('ie3', [null, s => `**抽獎**：號碼 ${s.replace(/^1～/, '1～').replace('之中，', '的彩券裡，號碼').replace('都不能整除的數有幾個？', '都不能整除的才能兌獎，有幾張能兌？')}`]);
})();
