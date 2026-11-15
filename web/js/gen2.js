/* 資工所衝刺站 — 參數化題目表（2026-11-10）
   每一型題目＝「參數怎麼抽（界線）」＋「抽到的數字合不合格（判斷）」＋「解題程式（答案、詳解）」。
   數字每次隨機，答案永遠由程式算；寫死數字的題目背得起來，這裡的題目背不起來。
   tests/gen_selftest.js 會把每一型各抽幾百題：不能出錯、答案要合法、選項不能重複，並數出不重複的題數。 */
'use strict';
(() => {
  /* ---------- 共用 ---------- */
  const AZ = 'ABCDEFGHIJ';
  const sum = a => a.reduce((x, y) => x + y, 0);
  const range = n => Array.from({ length: n }, (_, i) => i);
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => a / gcd(a, b) * b;
  const C = (n, k) => GU.C(n, k);
  const fr = (n, d) => GU.frac(n, d);
  const must = (ok, msg) => { if (!ok) throw new Error('驗算失敗：' + msg); };
  /* 分數（BigInt 也不用，數字都小） */
  const Q = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; };
  const qadd = (a, b) => Q(a[0] * b[1] + b[0] * a[1], a[1] * b[1]), qmul = (a, b) => Q(a[0] * b[0], a[1] * b[1]), qsub = (a, b) => qadd(a, [-b[0], b[1]]), qdiv = (a, b) => Q(a[0] * b[1], a[1] * b[0]);
  const qs = a => (a[1] === 1 ? String(a[0]) : `${a[0]}/${a[1]}`);
  const qtex = a => (a[1] === 1 ? String(a[0]) : `${a[0] < 0 ? '-' : ''}\\tfrac{${Math.abs(a[0])}}{${a[1]}}`);
  /* 選擇題：正解＋干擾項 → 洗牌、去重 */
  function mc(r, right, wrongs, n = 4) {
    const seen = new Set([String(right)]), w = [];
    for (const x of r.shuffle(wrongs)) { if (w.length >= n - 1) break; if (!seen.has(String(x))) { seen.add(String(x)); w.push(x); } }
    must(w.length === n - 1, '干擾選項不夠');
    const opts = r.shuffle([right, ...w]);
    return { type: 'single', opts, ans: [opts.indexOf(right)] };
  }
  const tbl = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map(r => `| ${r.join(' | ')} |`).join('\n')}`;

  /* ---------- 模板註冊：draw 抽參數 → ok 判斷界線 → build 解題 ---------- */
  Gen.tpl = function (d) {
    const [ch] = d.kp.split('#');
    Gen.reg(Object.assign({ ch, subject: ch.split('-')[0], tpl: true }, d, {
      make(r) {
        for (let t = 0; t < 600; t++) {
          const p = d.draw(r); if (!p || (d.ok && !d.ok(p))) continue;
          const q = d.build(p, r); if (q) return q;
        }
        throw new Error(`題型 ${d.id}：抽 600 次都沒有合格的數字`);
      },
    }));
  };
  /* 舊的 37 種隨機題補上對應的知識點（練習只出學會的知識點，要知道它屬於哪個點） */
  const GK = { sched: 'os-sched#2', page: 'os-vm#2', disk: 'os-storage#1', eat: 'os-vm#1', ptsize: 'os-memory#4', fork: 'os-process#2', banker: 'os-deadlock#3', cachebits: 'co-cache#1', cachesim: 'co-cache#1', amdahl: 'co-perf#3', cpi: 'co-perf#1', ieee: 'co-arith#4', twos: 'co-arith#1', pipe: 'co-pipeline#2', amat: 'co-cache#4', heap: 'ds-heap#1', avl: 'ds-bst#3', bsttrav: 'ds-bst#1', hashgen: 'ds-hash#3', master: 'al-recurrence#2', dijk: 'al-sp#2', mst: 'al-mst-flow#1', lcs: 'al-dp#2', knap: 'al-dp#2', postfix: 'ds-amortized#2', stars: 'dm-counting#1', derange: 'dm-counting#3', surj: 'dm-counting#4', recur: 'dm-recur-gf#2', modarith: 'dm-nt-algebra#2', relcount: 'dm-relations#1', chrom: 'dm-graph#5', det: 'la-det#1', rank: 'la-vs#3', eig2: 'la-eigen#3', eigprop: 'la-eigen#1', proj: 'la-ortho#3' };
  Gen.list.forEach(g => { if (!g.kp && GK[g.id]) g.kp = GK[g.id]; });
  const mk0 = Gen.make.bind(Gen);
  Gen.make = (id, seed) => { const q = mk0(id, seed); if (q) { const g = Gen.get(id); q.kp = g.kp; q.diff = q.diff || g.diff || 2; q.tplTitle = g.title; } return q; };
  /* 練習用：某個知識點學會了沒（沒有 KP 物件時當作全部可用，例如自我測試） */
  Gen.forKP = (ok = () => true) => Gen.list.filter(g => g.kp && ok(g.kp));
  Gen.fresh = g => `gen:${g.id}:${Math.floor(Math.random() * 1e9)}`;

  /* ======================= 資料結構 ======================= */
  Gen.tpl({ id: 'topo', kp: 'ds-graph#4', title: '拓撲排序有幾種', diff: 3,
    draw(r) { const n = r.int(5, 6), E = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (r() < .33) E.push([i, j]); const lab = r.shuffle(range(n)); return { n, E: E.map(([a, b]) => [lab[a], lab[b]]) }; },
    build({ n, E }) {
      const pre = range(n).map(v => E.filter(e => e[1] === v).reduce((m, e) => m | 1 << e[0], 0)), dp = new Array(1 << n).fill(0); dp[0] = 1;
      for (let m = 0; m < 1 << n; m++) if (dp[m]) for (let v = 0; v < n; v++) if (!(m >> v & 1) && (pre[v] & m) === pre[v]) dp[m | 1 << v] += dp[m];
      const cnt = dp[(1 << n) - 1]; if (cnt < 2 || cnt > 60 || E.length < n - 1) return null;
      const order = []; let m = 0; while (order.length < n) { const v = range(n).find(v => !(m >> v & 1) && (pre[v] & m) === pre[v]); order.push(AZ[v]); m |= 1 << v; }
      return { type: 'fill', stem: `有向無環圖有 ${n} 個點 ${AZ.slice(0, n).split('').join('、')}，邊：${E.map(([a, b]) => AZ[a] + '→' + AZ[b]).join('、')}。共有幾種不同的拓撲排序？`, ans: [cnt],
        expl: `用「已經排進去的點的集合」做 DP：一個點可以排下一個，若它的前驅都已經排了。全部 ${1 << n} 種集合算完，答案 **${cnt}** 種。\n\n例如字典序最小的一種：${order.join(' ')}。` };
    } });

  Gen.tpl({ id: 'bfs', kp: 'ds-graph#2', title: 'BFS 走訪順序', diff: 2,
    draw(r) { const n = 7, E = new Set(); while (E.size < r.int(8, 10)) { const a = r.int(0, n - 1), b = r.int(0, n - 1); if (a !== b) E.add(Math.min(a, b) * 10 + Math.max(a, b)); } return { n, E: [...E].map(x => [Math.floor(x / 10), x % 10]), s: r.int(0, 2) }; },
    build({ n, E, s }) {
      const adj = range(n).map(v => E.filter(e => e.includes(v)).map(e => e[0] === v ? e[1] : e[0]).sort((a, b) => a - b));
      const seen = [s], q = [s], dist = { [s]: 0 }; while (q.length) { const u = q.shift(); for (const v of adj[u]) if (!seen.includes(v)) { seen.push(v); q.push(v); dist[v] = dist[u] + 1; } }
      if (seen.length < n) return null;
      const o = seen.map(v => AZ[v]);
      return { type: 'fill', fmt: '依序寫點名，例如 A B C', stem: `無向圖的邊：${E.map(([a, b]) => AZ[a] + AZ[b]).join('、')}。從 **${AZ[s]}** 做 BFS，相鄰的點照字母順序放進佇列。寫出拜訪順序。`, ans: [o.join(''), o.join(',')],
        expl: `相鄰串列：${range(n).map(v => `${AZ[v]}: ${adj[v].map(x => AZ[x]).join(' ')}`).join('；')}\n\n拜訪順序 **${o.join(' ')}**；距離 ${range(n).map(v => AZ[v] + '=' + dist[v]).join('、')}。` };
    } });

  Gen.tpl({ id: 'dfst', kp: 'ds-graph#3', title: 'DFS 發現與完成時間', diff: 3,
    draw(r) { const n = 6, E = new Set(); while (E.size < r.int(7, 9)) { const a = r.int(0, n - 1), b = r.int(0, n - 1); if (a !== b && !E.has(b * 10 + a)) E.add(a * 10 + b); } return { n, E: [...E].map(x => [Math.floor(x / 10), x % 10]), x: r.int(1, n - 1) }; },
    build({ n, E, x }) {
      const adj = range(n).map(v => E.filter(e => e[0] === v).map(e => e[1]).sort((a, b) => a - b)), d = [], f = []; let t = 0;
      const go = u => { d[u] = ++t; for (const v of adj[u]) if (d[v] == null) go(v); f[u] = ++t; };
      for (let v = 0; v < n; v++) if (d[v] == null) go(v);
      return { type: 'fill', fmt: '發現,完成（例如 3,8）', stem: `有向圖的邊：${E.map(([a, b]) => AZ[a] + '→' + AZ[b]).join('、')}。從 A 開始 DFS（外層迴圈和相鄰點都照字母順序，時間從 1 開始）。**${AZ[x]}** 的發現時間和完成時間是？`, ans: [`${d[x]},${f[x]}`],
        expl: tbl(['點', ...range(n).map(v => AZ[v])], [['發現', ...range(n).map(v => d[v])], ['完成', ...range(n).map(v => f[v])]]) + `\n\n${AZ[x]}：**${d[x]}/${f[x]}**。` };
    } });

  Gen.tpl({ id: 'ufind', kp: 'ds-unionfind#2', title: 'Union by rank＋路徑壓縮後的 parent', diff: 3,
    draw(r) { const ops = []; for (let i = 0; i < r.int(5, 6); i++) { const a = r.int(1, 8); let b = r.int(1, 8); while (b === a) b = r.int(1, 8); ops.push([a, b]); } return { ops }; },
    build({ ops }) {
      const P = range(9), R = new Array(9).fill(0), find = x => (P[x] === x ? x : (P[x] = find(P[x])));
      const log = []; for (const [a, b] of ops) { const ra = find(a), rb = find(b); if (ra !== rb) { if (R[ra] < R[rb]) P[ra] = rb; else { P[rb] = ra; if (R[ra] === R[rb]) R[ra]++; } } log.push(`union(${a},${b})：parent = [${P.slice(1).join(' ')}]`); }
      const ans = P.slice(1);
      if (new Set(ans).size > 6) return null;
      return { type: 'fill', fmt: '8 個數，用逗號隔開', stem: `元素 1～8，一開始各自一群（parent[i] = i、rank 0）。依序做 ${ops.map(([a, b]) => `union(${a},${b})`).join('、')}。union 先用 find 找兩邊的根（find 做**路徑壓縮**），再 **union by rank**（rank 小的掛到大的下面；一樣大時把第二個的根掛到第一個的根下面，第一個的 rank 加 1）。最後 parent[1..8] 是？`, ans: [ans.join(','), ans.join('')], expl: log.join('\n\n') };
    } });

  Gen.tpl({ id: 'qpart', kp: 'ds-sort#3', title: 'Lomuto partition 一次之後', diff: 2,
    draw(r) { const s = new Set(); while (s.size < 8) s.add(r.int(1, 40)); return { A: r.shuffle([...s]) }; },
    build({ A }) {
      const a = A.slice(), x = a[7]; let i = -1; const st = [];
      for (let j = 0; j < 7; j++) if (a[j] <= x) { i++; [a[i], a[j]] = [a[j], a[i]]; st.push(`j=${j}：${a[j] === x ? '' : ''}${A[j]} ≤ ${x}，i=${i}，交換後 [${a.join(' ')}]`); }
      [a[i + 1], a[7]] = [a[7], a[i + 1]];
      if (i < 1 || i > 5) return null;
      return { type: 'fill', fmt: '8 個數，用逗號隔開', stem: `對陣列 [${A.join(', ')}] 做一次 **Lomuto partition**（pivot 取最後一個 ${x}，i 從 −1 開始，A[j] ≤ pivot 就 i++ 並交換 A[i]、A[j]，最後把 pivot 換到 A[i+1]）。結果是？`, ans: [a.join(','), a.join(' ')],
        expl: st.join('\n\n') + `\n\n最後 pivot 換到位置 ${i + 1}：**[${a.join(', ')}]**。` };
    } });

  Gen.tpl({ id: 'sortlb', kp: 'ds-sort#2', title: '比較排序的下界', diff: 2,
    draw(r) { return { n: r.int(4, 14), kind: r.int(0, 1) }; },
    build({ n, kind }) {
      let f = 1; for (let i = 2; i <= n; i++) f *= i; const h = Math.ceil(Math.log2(f) - 1e-12);
      if (kind) return { type: 'fill', stem: `排序 ${n} 個不同的數的決策樹，至少要有幾片葉子？`, ans: [f], expl: `每一種排列都要有一片葉子：${n}! = **${f}**。` };
      return { type: 'fill', stem: `任何比較排序，排 ${n} 個不同的數，最壞情況下**至少**要比較幾次？`, ans: [h], expl: `決策樹至少 ${n}! = ${f} 片葉子，高度 ≥ ⌈lg ${f}⌉ = **${h}**。` };
    } });

  Gen.tpl({ id: 'huff', kp: 'al-greedy#3', title: 'Huffman 總位元數', diff: 2,
    draw(r) { const k = r.int(5, 7), s = new Set(); while (s.size < k) s.add(r.int(1, 40)); return { f: [...s] }; },
    build({ f }) {
      let q = f.slice(), tot = 0; const st = []; while (q.length > 1) { q.sort((a, b) => a - b); const [a, b] = q.splice(0, 2); tot += a + b; st.push(`${a}+${b}=${a + b}`); q.push(a + b); }
      return { type: 'fill', stem: `${f.length} 個字元出現次數：${f.map((x, i) => `${AZ[i]}:${x}`).join('、')}。用 Huffman 編碼，總共要幾個位元？`, ans: [tot],
        expl: `每次合併最小的兩個：${st.join('、')}。總位元數＝每次合併的和加起來＝**${tot}**（每個字的次數×碼長，加起來一樣）。` };
    } });

  /* ======================= 演算法 ======================= */
  const INF = 1e9, fmtD = x => (x >= INF / 2 ? '∞' : String(x));
  Gen.tpl({ id: 'floydk', kp: 'al-sp#5', title: 'Floyd–Warshall 中間矩陣', diff: 3,
    draw(r) { const W = range(4).map(i => range(4).map(j => (i === j ? 0 : r() < .55 ? r.int(-3, 9) : INF))); return { W, k: r.int(1, 3), i: r.int(0, 3), j: r.int(0, 3) }; },
    build({ W, k, i, j }) {
      if (i === j) return null;
      let D = W.map(r => r.slice()); const Ds = [D];
      for (let m = 0; m < 4; m++) { D = D.map((row, a) => row.map((v, b) => Math.min(v, D[a][m] + D[m][b] >= INF / 2 ? INF : D[a][m] + D[m][b]))); Ds.push(D); }
      if (range(4).some(a => Ds[4][a][a] < 0)) return null;
      const v = Ds[k][i][j]; if (v === W[i][j]) return null;
      return { type: 'fill', fmt: '數字，到不了寫 ∞', stem: `4 個點的有向圖，邊權（列 → 行，∞ 表示沒有邊）：\n\n${tbl(['', '1', '2', '3', '4'], W.map((row, a) => [String(a + 1), ...row.map(fmtD)]))}\n\nFloyd–Warshall 做完 k = ${k}（中間點只能用 1～${k}）之後，$d^{(${k})}_{${i + 1}${j + 1}}$ 是多少？`, ans: [fmtD(v), v >= INF / 2 ? 'inf' : String(v)],
        expl: range(k + 1).map(m => `$D^{(${m})}$ 第 ${i + 1} 列：${Ds[m][i].map(fmtD).join('、')}`).join('\n\n') + `\n\n答案 **${fmtD(v)}**。` };
    } });

  Gen.tpl({ id: 'bellman', kp: 'al-sp#3', title: 'Bellman-Ford 最短距離', diff: 3,
    draw(r) { const n = 5, E = []; const seen = new Set(); while (E.length < r.int(7, 9)) { const a = r.int(0, n - 1), b = r.int(1, n - 1); if (a === b || seen.has(a * 10 + b)) continue; seen.add(a * 10 + b); E.push([a, b, r() < .3 ? r.int(-4, -1) : r.int(1, 8)]); } return { n, E }; },
    build({ n, E }) {
      const d = new Array(n).fill(INF); d[0] = 0;
      for (let it = 0; it < n - 1; it++) for (const [a, b, w] of E) if (d[a] < INF / 2 && d[a] + w < d[b]) d[b] = d[a] + w;
      if (E.some(([a, b, w]) => d[a] < INF / 2 && d[a] + w < d[b])) return null; // 有負環
      if (d.some(x => x >= INF / 2) || !E.some(e => e[2] < 0)) return null;
      // 驗算：列舉所有簡單路徑
      const best = new Array(n).fill(INF); const dfs = (u, c, vis) => { best[u] = Math.min(best[u], c); for (const [a, b, w] of E) if (a === u && !(vis >> b & 1)) dfs(b, c + w, vis | 1 << b); }; dfs(0, 0, 1);
      must(best.every((x, i) => x === d[i]), 'Bellman-Ford 與窮舉路徑不一致');
      const nm = ['s', 'a', 'b', 'c', 'd'];
      return { type: 'fill', fmt: 'a,b,c,d 的距離', stem: `有向圖（有負邊、沒有負環）：${E.map(([a, b, w]) => `${nm[a]}→${nm[b]} (${w})`).join('、')}。從 s 出發，到 a、b、c、d 的最短距離依序是？`, ans: [d.slice(1).join(',')],
        expl: `鬆弛 ${n - 1} 輪後：${nm.slice(1).map((x, i) => `${x}=${d[i + 1]}`).join('、')}；再鬆弛一輪都不會變，代表沒有負環。答案 **${d.slice(1).join(', ')}**。` };
    } });

  Gen.tpl({ id: 'maxflow', kp: 'al-mst-flow#2', title: '最大流的值', diff: 3,
    draw(r) { const n = 6, E = []; const seen = new Set(); while (E.length < r.int(8, 10)) { const a = r.int(0, 4), b = r.int(1, 5); if (a >= b || seen.has(a * 10 + b) || (a === 0 && b === 5)) continue; seen.add(a * 10 + b); E.push([a, b, r.int(1, 9)]); } return { n, E }; },
    build({ n, E }) {
      const cap = range(n).map(() => new Array(n).fill(0)); E.forEach(([a, b, c]) => (cap[a][b] = c)); const f = range(n).map(() => new Array(n).fill(0)); let tot = 0;
      for (;;) { const prev = new Array(n).fill(-1); prev[0] = 0; const q = [0]; while (q.length) { const u = q.shift(); for (let v = 0; v < n; v++) if (prev[v] < 0 && cap[u][v] - f[u][v] > 0) { prev[v] = u; q.push(v); } } if (prev[5] < 0) break; let b = INF; for (let v = 5; v; v = prev[v]) b = Math.min(b, cap[prev[v]][v] - f[prev[v]][v]); for (let v = 5; v; v = prev[v]) { f[prev[v]][v] += b; f[v][prev[v]] -= b; } tot += b; }
      let mc = INF; for (let m = 0; m < 16; m++) { const S = [0, ...range(4).filter(i => m >> i & 1).map(i => i + 1)]; mc = Math.min(mc, sum(E.filter(([a, b]) => S.includes(a) && !S.includes(b)).map(e => e[2]))); }
      must(mc === tot, '最大流≠最小割'); if (tot < 3) return null;
      const nm = ['s', 'a', 'b', 'c', 'd', 't'];
      return { type: 'fill', stem: `流量網路（容量）：${E.map(([a, b, c]) => `${nm[a]}→${nm[b]}:${c}`).join('、')}。從 s 到 t 的最大流是多少？`, ans: [tot],
        expl: `用 BFS 找擴增路徑（Edmonds–Karp）直到找不到為止，總共送 **${tot}**；而且所有 s-t 割裡最小的容量也是 ${mc}（最大流＝最小割）。` };
    } });

  Gen.tpl({ id: 'mcm', kp: 'al-dp#2', title: '矩陣鏈乘最少乘法次數', diff: 3,
    draw(r) { return { p: range(r.int(5, 6)).map(() => r.int(2, 30)) }; },
    build({ p }) {
      const n = p.length - 1, m = range(n + 1).map(() => new Array(n + 1).fill(0)), s = range(n + 1).map(() => new Array(n + 1).fill(0));
      for (let L = 2; L <= n; L++) for (let i = 1; i + L - 1 <= n; i++) { const j = i + L - 1; m[i][j] = Infinity; for (let k = i; k < j; k++) { const c = m[i][k] + m[k + 1][j] + p[i - 1] * p[k] * p[j]; if (c < m[i][j]) { m[i][j] = c; s[i][j] = k; } } }
      const brute = (i, j) => (i === j ? 0 : Math.min(...range(j - i).map(t => brute(i, i + t) + brute(i + t + 1, j) + p[i - 1] * p[i + t] * p[j])));
      must(brute(1, n) === m[1][n], 'DP 與窮舉不一致');
      const par = (i, j) => (i === j ? `A${i}` : `(${par(i, s[i][j])}${par(s[i][j] + 1, j)})`);
      return { type: 'fill', stem: `${n} 個矩陣 ${range(n).map(i => `$A_${i + 1}$: ${p[i]}×${p[i + 1]}`).join('、')}。相乘最少要幾次純量乘法？`, ans: [m[1][n]],
        expl: `$m[i,j]=\\min_k(m[i,k]+m[k+1,j]+p_{i-1}p_kp_j)$。最佳順序 ${par(1, n)}，共 **${m[1][n]}** 次。` };
    } });

  Gen.tpl({ id: 'lis', kp: 'al-dp#5', title: '最長遞增子序列', diff: 2,
    draw(r) { return { a: range(r.int(9, 11)).map(() => r.int(1, 25)) }; },
    build({ a }) {
      const L = a.map(() => 1); for (let i = 0; i < a.length; i++) for (let j = 0; j < i; j++) if (a[j] < a[i]) L[i] = Math.max(L[i], L[j] + 1);
      const best = Math.max(...L); let br = 0; for (let m = 1; m < 1 << a.length; m++) { const s = range(a.length).filter(i => m >> i & 1).map(i => a[i]); if (s.every((x, i) => !i || s[i - 1] < x)) br = Math.max(br, s.length); }
      must(br === best, 'LIS'); if (best < 3) return null;
      return { type: 'fill', stem: `數列 ${a.join(', ')} 的最長（嚴格）遞增子序列長度是？`, ans: [best], expl: `L[i]＝以第 i 個結尾的最長長度：${L.join(' ')}。最大 **${best}**。` };
    } });

  Gen.tpl({ id: 'coin', kp: 'al-greedy#6', title: '找零：DP 和貪婪', diff: 3,
    draw(r) { const a = r.int(2, 6), b = r.int(a + 2, 15); return { c: [1, a, b], v: r.int(12, 45), want: r() < .6 }; },
    build({ c, v, want }) {
      const dp = new Array(v + 1).fill(INF); dp[0] = 0; for (let x = 1; x <= v; x++) for (const k of c) if (k <= x) dp[x] = Math.min(dp[x], dp[x - k] + 1);
      let g = 0, rest = v; for (const k of c.slice().sort((p, q) => q - p)) { g += Math.floor(rest / k); rest %= k; }
      if (want && g === dp[v]) return null;
      return { type: 'fill', fmt: '最少枚數,貪婪枚數', stem: `硬幣面額 ${c.join('、')}（每種無限多），湊出 ${v}。最少要幾枚？每次拿最大的（貪婪）會用幾枚？`, ans: [`${dp[v]},${g}`],
        expl: `DP：$f(x)=1+\\min_k f(x-k)$，$f(${v})=${dp[v]}$。貪婪：${g} 枚。${g === dp[v] ? '這次剛好一樣。' : '貪婪比較多：這組面額貪婪不保證最佳。'}` };
    } });

  Gen.tpl({ id: 'actsel', kp: 'al-greedy#2', title: '活動選擇最多幾個', diff: 2,
    draw(r) { return { I: range(8).map(() => { const s = r.int(0, 14); return [s, s + r.int(1, 5)]; }) }; },
    build({ I }) {
      const srt = I.map((x, i) => [...x, i]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); let end = -1; const pick = []; for (const [s, f, i] of srt) if (s >= end) { pick.push(i); end = f; }
      let br = 0; for (let m = 1; m < 256; m++) { const s = range(8).filter(i => m >> i & 1).map(i => I[i]).sort((a, b) => a[0] - b[0]); if (s.every((x, i) => !i || s[i - 1][1] <= x[0])) br = Math.max(br, s.length); }
      must(br === pick.length, '活動選擇'); if (br < 3) return null;
      return { type: 'fill', stem: `8 個活動的 [開始, 結束)：${I.map((x, i) => `${AZ[i]}[${x[0]},${x[1]})`).join('、')}。最多能選幾個互不重疊的活動？`, ans: [br],
        expl: `照結束時間排序，每次選最早結束、又不跟已選的重疊的：${pick.map(i => AZ[i]).join(' → ')}，共 **${br}** 個。` };
    } });

  Gen.tpl({ id: 'hire', kp: 'al-prob#1', title: '指示隨機變數算期望', diff: 2,
    draw(r) { return { kind: r.int(0, 2), n: r.int(3, 12), k: r.int(8, 40), d: r.pick([365, 100, 30, 12]) }; },
    build({ kind, n, k, d }) {
      if (kind === 0) { let a = [0, 1]; for (let i = 1; i <= n; i++) a = qadd(a, [1, i]); return { type: 'fill', fmt: '分數 a/b', stem: `${n} 個應徵者隨機順序來面試，遇到比目前最好的還好就雇用。期望雇用幾次？`, ans: [qs(a)], expl: `第 i 個被雇 ⇔ 他是前 i 個裡最好的，機率 $1/i$。期望 $=\\sum_{i=1}^{${n}} 1/i = ${qtex(a)}$。` }; }
      if (kind === 1) { const v = Q(k * (k - 1), 2 * d); if (k > d) return null; return { type: 'fill', fmt: '分數 a/b', stem: `${k} 個人，每人生日在 ${d} 天裡隨機（獨立、均勻）。「同一天生日的人有幾對」的期望值是？`, ans: [qs(v)], expl: `每一對一個指示變數，同天機率 $1/${d}$；共 $\\binom{${k}}{2}=${k * (k - 1) / 2}$ 對。期望 $=${qtex(v)}$。` }; }
      return { type: 'fill', stem: `${n} 個人把帽子丟在一起，隨機各拿一頂。期望有幾個人拿到自己的帽子？`, ans: ['1'], expl: `第 i 人拿到自己的機率 $1/${n}$，${n} 個加起來 $=1$。跟人數無關。` };
    } });

  /* ======================= 離散數學 ======================= */
  Gen.tpl({ id: 'phi', kp: 'dm-nt-algebra#2', title: 'Euler φ 函數', diff: 2,
    draw(r) { return { n: r.int(30, 999) }; },
    build({ n }) {
      const fs = []; let m = n; for (let p = 2; p * p <= m; p++) if (m % p === 0) { let e = 0; while (m % p === 0) { m /= p; e++; } fs.push([p, e]); } if (m > 1) fs.push([m, 1]);
      if (fs.length < 2) return null; let ph = n; for (const [p] of fs) ph = ph / p * (p - 1);
      must(range(n).filter(i => i && gcd(i, n) === 1).length === ph, 'φ');
      return { type: 'fill', stem: `$\\varphi(${n})$ 是多少？`, ans: [ph], expl: `$${n}=${fs.map(([p, e]) => (e > 1 ? `${p}^{${e}}` : p)).join('\\cdot')}$，$\\varphi(n)=n\\prod(1-1/p)=${ph}$。` };
    } });

  Gen.tpl({ id: 'inv', kp: 'dm-nt-algebra#1', title: '模反元素（擴展歐幾里得）', diff: 2,
    draw(r) { const m = r.int(11, 199); return { a: r.int(2, m - 1), m }; },
    build({ a, m }) {
      if (gcd(a, m) !== 1) return null;
      let [r0_, r1] = [m, a], [t0, t1] = [0, 1]; const st = []; while (r1) { const q = Math.floor(r0_ / r1); st.push(`${r0_} = ${q}·${r1} + ${r0_ - q * r1}`); [r0_, r1] = [r1, r0_ - q * r1]; [t0, t1] = [t1, t0 - q * t1]; }
      const x = ((t0 % m) + m) % m; must(a * x % m === 1, '反元素');
      return { type: 'fill', stem: `求 ${a} 在模 ${m} 下的反元素（0～${m - 1}）。`, ans: [x], expl: `${st.join('\n\n')}\n\n倒推得 ${a}·${x} ≡ 1 (mod ${m})，答案 **${x}**。` };
    } });

  Gen.tpl({ id: 'ballot', kp: 'dm-counting#5', title: '不越線的路（Catalan／投票）', diff: 3,
    draw(r) { const m = r.int(3, 9); return { m, n: r.int(2, m) }; },
    build({ m, n }) {
      const dp = range(m + 1).map(() => new Array(n + 1).fill(0)); dp[0][0] = 1;
      for (let x = 0; x <= m; x++) for (let y = 0; y <= n; y++) { if (y > x || (!x && !y)) continue; dp[x][y] = (x ? dp[x - 1][y] : 0) + (y ? dp[x][y - 1] : 0); }
      const v = dp[m][n], f = (m - n + 1) * C(m + n, n) / (m + 1); must(v === f, '投票公式');
      return { type: 'fill', stem: `從 (0,0) 走到 (${m},${n})，每步往右或往上一格，而且途中永遠 $y \\le x$。有幾條路？`, ans: [v],
        expl: `反射法：$\\binom{${m + n}}{${n}}-\\binom{${m + n}}{${n - 1}}=\\frac{${m}-${n}+1}{${m}+1}\\binom{${m + n}}{${n}}=${v}$。${m === n ? `（$m=n$ 時就是 Catalan 數 $C_{${n}}$）` : ''}` };
    } });

  const S2 = (n, k) => { const s = range(n + 1).map(() => new Array(k + 1).fill(0)); s[0][0] = 1; for (let i = 1; i <= n; i++) for (let j = 1; j <= k; j++) s[i][j] = j * s[i - 1][j] + s[i - 1][j - 1]; return s[n][k]; };
  Gen.tpl({ id: 'stir2', kp: 'dm-counting#4', title: '球放箱子：Stirling 數', diff: 3,
    draw(r) { const n = r.int(4, 8); return { n, k: r.int(2, n - 1), kind: r.int(0, 2) }; },
    build({ n, k, kind }) {
      if (n <= 7) { let cnt = 0; const rec = (i, mx, used) => { if (i === n) { if (used === k) cnt++; return; } for (let b = 0; b <= Math.min(mx + 1, k - 1); b++) rec(i + 1, Math.max(mx, b), Math.max(used, b + 1)); }; rec(0, -1, 0); must(cnt === S2(n, k), 'Stirling'); }
      if (kind === 0) return { type: 'fill', stem: `${n} 顆**不同**的球放進 ${k} 個**相同**的箱子，每箱至少一顆。有幾種放法？`, ans: [S2(n, k)], expl: `第二類 Stirling 數 $S(${n},${k})=k\\,S(n-1,k)+S(n-1,k-1)=${S2(n, k)}$。` };
      if (kind === 1) { const v = sum(range(k).map(j => S2(n, j + 1))); return { type: 'fill', stem: `${n} 顆**不同**的球放進 ${k} 個**相同**的箱子，可以有空箱。有幾種放法？`, ans: [v], expl: `用到 1～${k} 個箱子：$\\sum_{j=1}^{${k}}S(${n},j)=${v}$。` }; }
      let f = 1; for (let i = 2; i <= k; i++) f *= i; return { type: 'fill', stem: `${n} 顆**不同**的球放進 ${k} 個**不同**的箱子，每箱至少一顆。有幾種放法？`, ans: [f * S2(n, k)], expl: `先分成 ${k} 群（$S(${n},${k})=${S2(n, k)}$），再排到 ${k} 個箱子（${k}!）：${f * S2(n, k)}。` };
    } });

  Gen.tpl({ id: 'ie3', kp: 'dm-counting#3', title: '排容：都不整除', diff: 2,
    draw(r) { const s = r.shuffle([2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13]).slice(0, 3).sort((a, b) => a - b); return { N: r.int(100, 1000), s }; },
    build({ N, s }) {
      const [a, b, c] = s, f = x => Math.floor(N / x); const v = N - f(a) - f(b) - f(c) + f(lcm(a, b)) + f(lcm(a, c)) + f(lcm(b, c)) - f(lcm(lcm(a, b), c));
      must(v === range(N).map(i => i + 1).filter(i => i % a && i % b && i % c).length, '排容');
      return { type: 'fill', stem: `1～${N} 之中，${a}、${b}、${c} 都不能整除的數有幾個？`, ans: [v],
        expl: `${N} − (${f(a)}+${f(b)}+${f(c)}) + (${f(lcm(a, b))}+${f(lcm(a, c))}+${f(lcm(b, c))}) − ${f(lcm(lcm(a, b), c))} = **${v}**（兩兩、三個一起要用最小公倍數）。` };
    } });

  Gen.tpl({ id: 'cayley', kp: 'dm-graph#3', title: '標號樹的個數', diff: 3,
    draw(r) { const n = r.int(4, 8); return { n, d: r.int(1, n - 2), kind: r.int(0, 1) }; },
    build({ n, d, kind }) {
      if (kind === 0) return { type: 'fill', stem: `${n} 個有標號的點，可以形成幾棵不同的樹？`, ans: [n ** (n - 2)], expl: `Cayley：$n^{n-2}=${n}^{${n - 2}}=${n ** (n - 2)}$（Prüfer 序列長 ${n - 2}，每格 ${n} 種）。` };
      const v = C(n - 2, d - 1) * (n - 1) ** (n - d - 1);
      if (n <= 7) { let cnt = 0; const L = n - 2, tot = n ** L; for (let x = 0; x < tot; x++) { let y = x, c1 = 0; for (let i = 0; i < L; i++) { if (y % n === 0) c1++; y = Math.floor(y / n); } if (c1 === d - 1) cnt++; } must(cnt === v, 'Prüfer'); }
      return { type: 'fill', stem: `${n} 個有標號的點形成的樹中，點 1 的度數剛好是 ${d} 的有幾棵？`, ans: [v], expl: `Prüfer 序列裡 1 出現 ${d - 1} 次：$\\binom{${n - 2}}{${d - 1}}(${n - 1})^{${n - d - 1}}=${v}$。` };
    } });

  Gen.tpl({ id: 'planarf', kp: 'dm-graph#4', title: '平面圖的面數', diff: 2,
    draw(r) { return { v: r.int(6, 30), k: r.int(3, 5) }; },
    build({ v, k }) {
      if ((v * k) % 2 || v <= k) return null; const e = v * k / 2; if (e > 3 * v - 6) return null; const f = 2 - v + e;
      return { type: 'fill', stem: `一個連通的簡單平面圖有 ${v} 個點，每個點的度數都是 ${k}。它有幾個面（含外面那塊）？`, ans: [f], expl: `握手：$e=${v}\\cdot${k}/2=${e}$；歐拉：$f=2-v+e=${f}$。（檢查 $e\\le3v-6=${3 * v - 6}$ ✓）` };
    } });

  Gen.tpl({ id: 'gfcnt', kp: 'dm-recur-gf#5', title: '有限制的整數解（生成函數）', diff: 3,
    draw(r) { return { s: r.int(8, 20), a: r.int(2, 6), b: r.int(3, 9), kind: r.int(0, 1) }; },
    build({ s, a, b, kind }) {
      let cnt = 0; for (let x = 0; x <= a; x++) for (let y = 0; y <= s; y += 2) { const z = s - x - y; if (z >= 1 && z <= b) cnt++; }
      if (kind) { cnt = 0; for (let x = 0; x <= a; x++) for (let y = 0; y <= s; y += 2) { const z = s - x - y; if (z >= 1 && z <= b && z % 3 !== 0) cnt++; } }
      if (cnt < 2) return null;
      const c3 = kind ? '，而且 $z$ 不是 3 的倍數' : '';
      return { type: 'fill', stem: `$x+y+z=${s}$，$0\\le x\\le ${a}$、$y$ 是非負偶數、$1\\le z\\le ${b}$${c3}。整數解有幾組？`, ans: [cnt],
        expl: `就是 $(1+x+\\dots+x^{${a}})(1+x^2+x^4+\\dots)(${kind ? 'x 的 1～' + b + ' 次方裡不是 3 倍數的那些' : `x+\\dots+x^{${b}}`})$ 裡 $x^{${s}}$ 的係數。對每個 $x$、$y$ 數 $z$：共 **${cnt}** 組。` };
    } });

  Gen.tpl({ id: 'pigeon', kp: 'dm-logic#4', title: '鴿籠：至少幾個', diff: 1,
    draw(r) { return { c: r.int(0, 3), k: r.int(2, 6) }; },
    build({ c, k }) {
      const [m, what, box] = [[12, '人', '出生月份'], [7, '人', '星期幾出生'], [4, '張撲克牌', '花色'], [26, '個英文單字', '開頭字母']][c];
      const v = (k - 1) * m + 1;
      return { type: 'fill', stem: `至少要有幾${what}，才能保證有 ${k} ${what.replace(/^個/, '個')}的${box}相同？`, ans: [v], expl: `${m} 個箱子，每箱放 ${k - 1} 個還不會有 ${k} 個；再多 1 個就一定有：$(${k}-1)\\cdot${m}+1=${v}$。` };
    } });

  /* ======================= 線性代數 ======================= */
  const det3 = M => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  const minor = (M, i, j) => { const S = M.filter((_, a) => a !== i).map(r => r.filter((_, b) => b !== j)); return S[0][0] * S[1][1] - S[0][1] * S[1][0]; };
  const randM = (r, lo = -3, hi = 4) => range(3).map(() => range(3).map(() => r.int(lo, hi)));
  Gen.tpl({ id: 'inv3', kp: 'la-systems#2', title: '反矩陣的一個元素', diff: 2,
    draw(r) { return { A: randM(r), i: r.int(0, 2), j: r.int(0, 2) }; },
    build({ A, i, j }) {
      const d = det3(A); if (!d || Math.abs(d) > 6) return null;
      const inv = range(3).map(a => range(3).map(b => Q(((a + b) % 2 ? -1 : 1) * minor(A, b, a), d)));
      range(3).forEach(a => range(3).forEach(b => { let s = [0, 1]; range(3).forEach(t => (s = qadd(s, qmul([A[a][t], 1], inv[t][b])))); must(s[0] === (a === b ? 1 : 0) && s[1] === 1, 'A·A⁻¹=I'); }));
      return { type: 'fill', fmt: '整數或分數', stem: `$A=${GU.tex(A)}$。$(A^{-1})_{${i + 1}${j + 1}}$ 是多少？`, ans: [qs(inv[i][j])],
        expl: `$\\det A=${d}$。$(A^{-1})_{ij}=\\dfrac{C_{ji}}{\\det A}$（注意下標要對調）：$C_{${j + 1}${i + 1}}=${((i + j) % 2 ? -1 : 1) * minor(A, j, i)}$，所以 $(A^{-1})_{${i + 1}${j + 1}}=${qtex(inv[i][j])}$。` };
    } });

  Gen.tpl({ id: 'cramer', kp: 'la-det#3', title: 'Cramer 法則', diff: 2,
    draw(r) { return { A: randM(r), b: range(3).map(() => r.int(-6, 6)), k: r.int(0, 2) }; },
    build({ A, b, k }) {
      const d = det3(A); if (!d) return null; const Ak = A.map((row, i) => row.map((v, j) => (j === k ? b[i] : v))), dk = det3(Ak), x = Q(dk, d);
      const xs = range(3).map(c => Q(det3(A.map((row, i) => row.map((v, j) => (j === c ? b[i] : v)))), d));
      range(3).forEach(i => { let s = [0, 1]; range(3).forEach(j => (s = qadd(s, qmul([A[i][j], 1], xs[j])))); must(s[0] === b[i] && s[1] === 1, 'Ax=b'); });
      return { type: 'fill', fmt: '整數或分數', stem: `解 $A\\mathbf x=\\mathbf b$，$A=${GU.tex(A)}$、$\\mathbf b=${GU.tex(b.map(v => [v]))}$。$x_${k + 1}$ 是多少？`, ans: [qs(x)],
        expl: `Cramer：$x_${k + 1}=\\dfrac{\\det A_${k + 1}}{\\det A}=\\dfrac{${dk}}{${d}}=${qtex(x)}$（$A_${k + 1}$ 是把第 ${k + 1} 行換成 $\\mathbf b$）。` };
    } });

  Gen.tpl({ id: 'svd2', kp: 'la-sym-svd#4', title: '2×2 的奇異值', diff: 3,
    draw(r) { return { A: [[r.int(-4, 4), r.int(-4, 4)], [r.int(-4, 4), r.int(-4, 4)]], big: r.int(0, 1) }; },
    build({ A, big }) {
      const [[a, b], [c, d]] = A, det = a * d - b * c; if (!det || (b === c && b === 0)) return null;
      const t = a * a + b * b + c * c + d * d, disc = Math.sqrt(t * t - 4 * det * det), l1 = (t + disc) / 2, l2 = (t - disc) / 2, s1 = Math.sqrt(l1), s2 = Math.sqrt(Math.max(0, l2));
      must(Math.abs(s1 * s2 - Math.abs(det)) < 1e-9 && Math.abs(s1 * s1 + s2 * s2 - t) < 1e-9, '奇異值');
      const v = big ? s1 : s2;
      return { type: 'fill', fmt: '小數三位', stem: `$A=${GU.tex(A)}$。它${big ? '最大' : '最小'}的奇異值是多少？（小數三位）`, ans: [v.toFixed(3)],
        expl: `$A^TA$ 的特徵值滿足 $\\lambda_1+\\lambda_2=\\|A\\|_F^2=${t}$、$\\lambda_1\\lambda_2=(\\det A)^2=${det * det}$，得 $\\lambda=${GU.round(l1, 4)},\\ ${GU.round(l2, 4)}$；奇異值開根號：${s1.toFixed(3)}、${s2.toFixed(3)}。` };
    } });

  Gen.tpl({ id: 'coord3', kp: 'la-vs#4', title: '在基底下的座標', diff: 2,
    draw(r) { let B = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; for (let t = 0; t < 4; t++) { const i = r.int(0, 2); let j = r.int(0, 2); if (i === j) j = (i + 1) % 3; const k = r.pick([-2, -1, 1, 2]); B = B.map((row, a) => (a === i ? row.map((v, b) => v + k * B[j][b]) : row)); } return { B, c: range(3).map(() => r.int(-3, 3)) }; },
    build({ B, c }) {
      if (det3(B) === 0 || B.flat().some(x => Math.abs(x) > 6) || c.every(x => !x)) return null;
      const cols = range(3).map(j => B.map(row => row[j])), v = range(3).map(i => sum(range(3).map(j => B[i][j] * c[j])));
      return { type: 'fill', fmt: 'c1,c2,c3', stem: `基底 $\\mathbf b_1=${GU.tex(cols[0].map(x => [x]))}$、$\\mathbf b_2=${GU.tex(cols[1].map(x => [x]))}$、$\\mathbf b_3=${GU.tex(cols[2].map(x => [x]))}$。$\\mathbf v=${GU.tex(v.map(x => [x]))}$ 在這組基底下的座標 $(c_1,c_2,c_3)$ 是？`, ans: [c.join(',')],
        expl: `解 $[\\mathbf b_1\\ \\mathbf b_2\\ \\mathbf b_3]\\mathbf c=\\mathbf v$，得 $\\mathbf c=(${c.join(',')})$。驗算：$${c.map((x, j) => `${x}\\mathbf b_${j + 1}`).join('+')}=\\mathbf v$。` };
    } });

  Gen.tpl({ id: 'gs', kp: 'la-ortho#5', title: 'Gram–Schmidt 第二個向量', diff: 2,
    draw(r) { return { a: range(3).map(() => r.int(-3, 3)), b: range(3).map(() => r.int(-4, 4)) }; },
    build({ a, b }) {
      const aa = sum(a.map(x => x * x)), ab = sum(a.map((x, i) => x * b[i])); if (!aa || !ab) return null;
      const u = b.map((x, i) => qsub([x, 1], Q(ab * a[i], aa))); if (u.every(x => x[0] === 0)) return null;
      let dot = [0, 1]; u.forEach((x, i) => (dot = qadd(dot, qmul(x, [a[i], 1])))); must(dot[0] === 0, '正交');
      return { type: 'fill', fmt: '三個分量，用逗號隔開', stem: `$\\mathbf a=(${a.join(',')})$、$\\mathbf b=(${b.join(',')})$。Gram–Schmidt：$\\mathbf u_2=\\mathbf b-\\dfrac{\\mathbf b\\cdot\\mathbf a}{\\mathbf a\\cdot\\mathbf a}\\mathbf a$（不用單位化）。$\\mathbf u_2$ 是？`, ans: [u.map(qs).join(',')],
        expl: `$\\mathbf b\\cdot\\mathbf a=${ab}$、$\\mathbf a\\cdot\\mathbf a=${aa}$，$\\mathbf u_2=(${u.map(qtex).join(',')})$；驗算 $\\mathbf u_2\\cdot\\mathbf a=0$。` };
    } });

  Gen.tpl({ id: 'pd2', kp: 'la-sym-svd#2', title: '正定的條件', diff: 2,
    draw(r) { return { a: r.int(1, 9), c: r.int(1, 12) }; },
    build({ a, c }) {
      let k = 0; while ((k + 1) * (k + 1) < a * c) k++;
      return { type: 'fill', stem: `$A=\\begin{bmatrix}${a}&k\\\\k&${c}\\end{bmatrix}$。讓 $A$ 正定的**最大整數** $k$ 是多少？`, ans: [k], expl: `2×2 對稱矩陣正定 ⇔ 左上角 $>0$ 且 $\\det>0$：$${a}\\cdot${c}-k^2>0$，$k^2<${a * c}$，最大整數 $k=${k}$。` };
    } });

  /* ======================= 計算機結構 ======================= */
  Gen.tpl({ id: 'bp2', kp: 'co-pipeline#3', title: '2-bit 分支預測錯幾次', diff: 2,
    draw(r) { const pat = r.pick(['TTTN', 'TTN', 'TTTTN', 'TNTN', 'TTNN', 'TNN']); return { s0: r.int(0, 3), seq: (pat.repeat(4)).slice(0, r.int(9, 12)), bits: r.pick([1, 2, 2]) }; },
    build({ s0, seq, bits }) {
      let s = bits === 1 ? (s0 >= 2 ? 1 : 0) : s0, miss = 0; const log = [];
      for (const o of seq) { const pred = bits === 1 ? (s ? 'T' : 'N') : (s >= 2 ? 'T' : 'N'); if (pred !== o) miss++; log.push(`${pred}${pred === o ? '' : '✗'}`); if (bits === 1) s = o === 'T' ? 1 : 0; else s = o === 'T' ? Math.min(3, s + 1) : Math.max(0, s - 1); }
      const nm = bits === 1 ? (s0 >= 2 ? '預測跳' : '預測不跳') : ['強不跳（00）', '弱不跳（01）', '弱跳（10）', '強跳（11）'][s0];
      return { type: 'fill', stem: `一個 ${bits}-bit 預測器，一開始是「${nm}」。實際結果依序是 ${seq.split('').join(' ')}（T＝跳）。預測錯幾次？`, ans: [miss], expl: `每次的預測：${log.join(' ')}，錯 **${miss}** 次。` };
    } });

  Gen.tpl({ id: 'mcyc', kp: 'co-datapath#3', title: '單週期 vs. 多週期', diff: 2,
    draw(r) { const lw = r.int(15, 35), sw = r.int(5, 15), br = r.int(10, 20); return { f: [lw, sw, 100 - lw - sw - br, br], st: r.pick([[200, 100, 200, 100, 50], [250, 150, 250, 100, 100], [300, 100, 200, 100, 50], [200, 150, 150, 100, 50]]) }; },
    build({ f, st }) {
      const [IF, ID, EX, MEM, WB] = st, Ts = IF + ID + EX + MEM + WB, Tm = Math.max(...st), cyc = [5, 4, 4, 3], cpi = sum(f.map((x, i) => x * cyc[i])) / 100, sp = Ts / (cpi * Tm);
      return { type: 'fill', fmt: '小數三位', stem: `五個階段的時間 IF ${IF}、ID ${ID}、EX ${EX}、MEM ${MEM}、WB ${WB} ps。指令比例 lw ${f[0]}%、sw ${f[1]}%、R 型 ${f[2]}%、beq ${f[3]}%；多週期時 lw 5 拍、sw 4、R 型 4、beq 3。單週期的平均每指令時間是多週期的幾倍？（小數三位）`, ans: [sp.toFixed(3)],
        expl: `單週期：時脈 = 全部加起來 ${Ts} ps，每條 ${Ts} ps。多週期：時脈 = 最慢階段 ${Tm} ps，CPI = ${cpi.toFixed(2)}，每條 ${(cpi * Tm).toFixed(1)} ps。倍數 ${Ts}/${(cpi * Tm).toFixed(1)} = **${sp.toFixed(3)}**。` };
    } });

  Gen.tpl({ id: 'booth', kp: 'co-arith#3', title: 'Booth 演算法加減幾次', diff: 2,
    draw(r) { return { m: r.int(-31, 31) }; },
    build({ m }) {
      if (!m) return null; const bits = ((m + 64) % 64).toString(2).padStart(6, '0'); let add = 0, subc = 0, prev = '0'; const st = [];
      for (let i = 5; i >= 0; i--) { const cur = bits[i]; if (cur === '1' && prev === '0') { subc++; st.push(`位 ${5 - i}：10 → 減`); } if (cur === '0' && prev === '1') { add++; st.push(`位 ${5 - i}：01 → 加`); } prev = cur; }
      if (add + subc < 2) return null;
      return { type: 'fill', fmt: '加的次數,減的次數', stem: `用 6 位元二補數的 Booth 演算法（radix-2），乘數是 ${m}（${bits}）。過程中要做幾次加法、幾次減法？`, ans: [`${add},${subc}`],
        expl: `看每一位和它右邊那位（最右邊補 0）：${st.join('；')}。共加 **${add}** 次、減 **${subc}** 次。` };
    } });

  Gen.tpl({ id: 'hazard', kp: 'co-pipeline#2', title: '有沒有 forwarding 的總時脈', diff: 3,
    draw(r) { const n = r.int(3, 4), I = []; for (let i = 0; i < n; i++) { const ld = r() < .4; I.push({ ld, dst: i + 1, src: range(2).map(() => (i && r() < .6 ? r.int(1, i) : 0)) }); } return { I }; },
    build({ I }) {
      const t = { no: [], fw: [] };
      for (const mode of ['no', 'fw']) I.forEach((x, i) => { let s = i ? t[mode][i - 1] + 1 : 0; for (const p of x.src) if (p) { const j = p - 1; s = Math.max(s, mode === 'no' ? t.no[j] + 3 : t.fw[j] + (I[j].ld ? 2 : 1)); } t[mode].push(s); });
      const tot = m => t[m][I.length - 1] + 5; if (!I.some(x => x.src.some(Boolean))) return null;
      const txt = (x, i) => `${x.ld ? `lw $r${x.dst}, 0($r${x.src[0] || 9})` : `add $r${x.dst}, $r${x.src[0] || 8}, $r${x.src[1] || 9}`}`;
      return { type: 'fill', fmt: '沒有 forwarding,有 forwarding', stem: `五級管線（暫存器前半拍寫、後半拍讀；分支不管）跑下面 ${I.length} 條指令，從第一條 IF 到最後一條 WB 共幾個時脈？分別寫沒有 forwarding、有 forwarding 的。\n\n\`\`\`\n${I.map(txt).join('\n')}\n\`\`\``, ans: [`${tot('no')},${tot('fw')}`],
        expl: `每條指令最早的 IF 時刻（第一條是 0）：沒有 forwarding ${t.no.join(', ')}（要等前面寫回：差 3 拍）；有 forwarding ${t.fw.join(', ')}（ALU 結果下一拍就能用，lw 的結果要多等 1 拍）。總時脈＝最後一條 IF 時刻＋5：**${tot('no')}、${tot('fw')}**。` };
    } });

  /* ======================= 作業系統 ======================= */
  Gen.tpl({ id: 'raidcap', kp: 'os-storage#2', title: 'RAID 可用容量', diff: 1,
    draw(r) { return { lv: r.pick([0, 1, 5, 6, 10]), n: r.int(2, 12), s: r.pick([1, 2, 4, 8, 12]) }; },
    build({ lv, n, s }) {
      if ((lv === 5 && n < 3) || (lv === 6 && n < 4) || ((lv === 1 || lv === 10) && n % 2) || (lv === 10 && n < 4)) return null;
      const v = { 0: n, 1: n / 2, 5: n - 1, 6: n - 2, 10: n / 2 }[lv] * s, k = { 0: 0, 1: '每組 1', 5: 1, 6: 2, 10: '每組 1' }[lv];
      return { type: 'fill', stem: `${n} 顆 ${s} TB 的硬碟組成 RAID ${lv}。可用容量是幾 TB？`, ans: [v], expl: `RAID ${lv} 可用 ${{ 0: 'n', 1: 'n/2', 5: 'n−1', 6: 'n−2', 10: 'n/2' }[lv]} 顆：**${v} TB**；能壞的顆數：${k}。` };
    } });

  Gen.tpl({ id: 'raidxor', kp: 'os-storage#2', title: 'RAID 5 同位元與還原', diff: 1,
    draw(r) { const w = r.pick([4, 8]); return { w, D: range(r.int(3, 4)).map(() => r.int(0, 2 ** w - 1)), lost: r.int(-1, 2) }; },
    build({ w, D, lost }) {
      const b = x => x.toString(2).padStart(w, '0'), P = D.reduce((a, x) => a ^ x, 0);
      if (lost < 0) return { type: 'fill', stem: `資料塊 ${D.map((x, i) => `D${i + 1}=${b(x)}`).join('、')}。同位元 P 是？`, ans: [b(P)], expl: `每一位做 XOR（每一欄 1 的個數湊成偶數）：**${b(P)}**。` };
      const others = D.filter((_, i) => i !== lost), v = others.reduce((a, x) => a ^ x, P); must(v === D[lost], '還原');
      return { type: 'fill', stem: `RAID 5：${D.map((x, i) => (i === lost ? `D${i + 1}=????` : `D${i + 1}=${b(x)}`)).join('、')}、P=${b(P)}。D${lost + 1} 壞了，算回來是？`, ans: [b(v)], expl: `剩下的全部 XOR：**${b(v)}**。` };
    } });

  Gen.tpl({ id: 'inode', kp: 'os-storage#3', title: 'inode 最大檔案大小', diff: 3,
    draw(r) { return { B: r.pick([512, 1024, 2048, 4096]), p: r.pick([4, 8]), nd: r.pick([10, 12]), tri: r.int(0, 1) }; },
    build({ B, p, nd, tri }) {
      const k = B / p, blocks = nd + k + k * k + (tri ? k ** 3 : 0);
      return { type: 'fill', stem: `inode 有 ${nd} 個直接指標、1 個單層間接、1 個雙層間接${tri ? '、1 個三層間接' : ''}。區塊 ${B} bytes、指標 ${p} bytes。一個檔案最多有幾個資料區塊？`, ans: [blocks],
        expl: `一個區塊放 ${B}/${p} = ${k} 個指標：${nd} + ${k} + ${k}² ${tri ? `+ ${k}³ ` : ''}= **${blocks}** 個區塊（× ${B} bytes 就是最大檔案大小）。` };
    } });

  Gen.tpl({ id: 'twolvl', kp: 'os-memory#4', title: '兩層頁表的位址切割', diff: 3,
    draw(r) { return { va: r.pick([32, 34, 36, 38]), pg: r.pick([10, 11, 12, 13, 14]), pte: r.pick([2, 3]) }; },
    build({ va, pg, pte }) {
      const inner = pg - pte, outer = va - pg - inner; if (outer < 2 || outer > pg) return null;
      return { type: 'fill', fmt: 'p1,p2,d', stem: `虛擬位址 ${va} 位元、頁大小 ${2 ** pg} bytes、頁表項 ${2 ** pte} bytes。用兩層頁表，而且每一張內層頁表剛好放滿一頁。外層索引 p1、內層索引 p2、位移 d 各幾位元？`, ans: [`${outer},${inner},${pg}`],
        expl: `位移 d = lg ${2 ** pg} = ${pg}。一頁放 ${2 ** pg}/${2 ** pte} = $2^{${inner}}$ 個項，p2 = ${inner}。p1 = ${va} − ${pg} − ${inner} = **${outer}**。` };
    } });
})();
