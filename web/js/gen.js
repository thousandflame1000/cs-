/* 資工所衝刺站 — 無限隨機題：題目隨機產生，答案由模擬器／公式精確計算 */
'use strict';

const GU = {
  fact: n => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; },
  C: (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); },
  gcd: (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; },
  frac: (n, d) => { if (d < 0) { n = -n; d = -d; } const g = GU.gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? String(n) : `${n}/${d}`; },
  modpow: (a, e, m) => { let r = 1n, b = BigInt(a) % BigInt(m); let E = BigInt(e); const M = BigInt(m); while (E > 0n) { if (E & 1n) r = r * b % M; b = b * b % M; E >>= 1n; } return Number(r); },
  det: M => { const n = M.length; if (n === 1) return M[0][0]; if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0]; let s = 0; for (let j = 0; j < n; j++) s += (j % 2 ? -1 : 1) * M[0][j] * GU.det(M.slice(1).map(r => r.filter((_, k) => k !== j))); return s; },
  tex: M => `\\begin{bmatrix}${M.map(r => r.join(' & ')).join(' \\\\ ')}\\end{bmatrix}`,
  round: (x, k = 4) => String(+x.toFixed(k)),
};

const Gen = {
  list: [],
  reg(d) { this.list.push(d); },
  get(id) { return this.list.find(x => x.id === id); },
  make(id, seed) {
    const g = this.get(id); if (!g) return null;
    const r = rng(seed * 2654435761 + id.length * 97);
    const q = g.make(r);
    return Object.assign({ id: `gen:${id}:${seed}`, ch: g.ch, subject: g.subject, diff: g.diff || 2, src: 'gen', opts: [], chTitle: g.title }, q, { ans: [].concat(q.ans).map(x => typeof x === 'number' && q.type !== 'fill' ? x : String(x)) });
  },
};

/* ======================= 作業系統 ======================= */
Gen.reg({ id: 'sched', subject: 'os', ch: 'os-sched', title: 'CPU 排程平均等待時間', desc: 'FCFS／SJF／SRTF／RR／優先權', diff: 2,
  make(r) {
    const n = r.int(4, 5); const algs = [['fcfs', 'FCFS'], ['sjf', '非搶先 SJF'], ['srtf', 'SRTF'], ['rr', 'RR'], ['prio', '非搶先優先權'], ['pprio', '可搶先優先權']];
    const [alg, name] = r.pick(algs); const q = r.int(2, 4);
    let t = 0; const P = Array.from({ length: n }, (_, i) => { if (i) t += r.int(0, 3); return { n: 'P' + (i + 1), at: t, bt: r.int(1, 9), pr: r.int(1, 5) }; });
    const res = Sim.cpu(P, alg, q);
    const avg = res.avgWT;
    return {
      type: 'fill', fmt: '平均等待時間（可填分數或小數）',
      stem: `以 **${name}${alg === 'rr' ? `（q = ${q}）` : ''}** 排程下列行程，求**平均等待時間**。\n\n| 行程 | 到達 | Burst | 優先權（小者優先） |\n|---|---|---|---|\n${P.map(p => `| ${p.n} | ${p.at} | ${p.bt} | ${p.pr} |`).join('\n')}\n\n慣例：平手時先到者優先、再比編號；可搶先演算法遇到相同條件不搶先；RR 中同一時刻新到達的行程排在被換下的行程前面。`,
      ans: [GU.round(avg), GU.frac(Math.round(avg * n), n)],
      expl: `甘特圖：${res.segs.map(s => `${s.p === 'idle' ? '閒置' : s.p}[${s.s},${s.e})`).join(' → ')}\n\n| 行程 | 完成 | 周轉 = 完成 − 到達 | 等待 = 周轉 − burst |\n|---|---|---|---|\n${res.stats.map(s => `| ${s.n} | ${s.ct} | ${s.tat} | ${s.wt} |`).join('\n')}\n\n平均等待 = ${res.stats.map(s => s.wt).join(' + ')} / ${n} = **${GU.frac(Math.round(avg * n), n)}**`,
    };
  } });

Gen.reg({ id: 'page', subject: 'os', ch: 'os-vm', title: '頁替換缺頁數', desc: 'FIFO／LRU／OPT', diff: 2,
  make(r) {
    const refs = Array.from({ length: r.int(13, 16) }, () => r.int(0, 6)); const n = r.int(3, 4);
    const [alg, name] = r.pick([['fifo', 'FIFO'], ['lru', 'LRU'], ['opt', 'OPT']]);
    const res = Sim.page(refs, n, alg);
    return { type: 'fill', stem: `參考串 \`${refs.join(' ')}\`，有 **${n}** 個 frame（一開始全空），使用 **${name}**，共發生幾次缺頁（含一開始的強制缺頁）？`, ans: [res.faults],
      expl: res.steps.map(s => `${s.ref}：[${s.fr.map(x => x == null ? '-' : x).join(',')}]${s.hit ? '' : ' **F**' + (s.victim != null ? `（換出 ${s.victim}）` : '')}`).join('　') + `\n\n共 **${res.faults}** 次。${alg === 'opt' ? 'OPT 換「未來最晚才用到（或不再用到）」的頁。' : alg === 'lru' ? 'LRU 換「最久沒被用到」的頁；它是堆疊演算法，不會有 Belady 異常。' : 'FIFO 換最早載入的頁，可能出現 Belady 異常。'}` };
  } });

Gen.reg({ id: 'disk', subject: 'os', ch: 'os-storage', title: '磁碟排程總移動量', desc: 'SSTF／SCAN／C-SCAN／LOOK／C-LOOK', diff: 2,
  make(r) {
    const set = new Set(); while (set.size < 8) set.add(r.int(1, 198)); const q = [...set];
    let head; do { head = r.int(20, 180); } while (set.has(head));
    const [alg, name] = r.pick([['sstf', 'SSTF'], ['scan', 'SCAN'], ['cscan', 'C-SCAN'], ['look', 'LOOK'], ['clook', 'C-LOOK']]); const dir = r.pick(['up', 'down']);
    const res = Sim.disk(q, head, alg, dir, 199);
    return { type: 'fill', stem: `磁碟柱面 0～199，磁頭在 **${head}**，${alg === 'sstf' ? '' : `目前往**${dir === 'up' ? '大' : '小'}**柱面移動，`}請求佇列（依到達順序）：\`${q.join(', ')}\`。用 **${name}**，總磁頭移動量是多少？（SCAN／C-SCAN 會走到磁碟端點；C-SCAN／C-LOOK 的回程跳躍**計入**；SSTF 距離相同選柱面號較小者。）`,
      ans: [res.total], expl: `路徑：${res.path.join(' → ')}\n\n總移動 = ${res.path.slice(1).map((p, k) => Math.abs(p - res.path[k])).join(' + ')} = **${res.total}**${res.jump ? `（其中回程跳躍 ${res.jump}；若題目說不計回程則為 ${res.totalNoJump}）` : ''}` };
  } });

Gen.reg({ id: 'eat', subject: 'os', ch: 'os-memory', title: 'TLB／缺頁有效存取時間', desc: 'EAT 計算與缺頁率上限', diff: 2,
  make(r) {
    if (r() < 0.6) {
      const m = r.pick([50, 80, 100, 120, 200]), t = r.pick([5, 10, 20]), h = r.pick([0.8, 0.9, 0.95, 0.98, 0.99]), L = r.pick([1, 2, 3]);
      const eat = h * (t + m) + (1 - h) * (t + (L + 1) * m);
      return { type: 'fill', fmt: 'ns', stem: `記憶體存取 ${m} ns，TLB 查詢 ${t} ns（先查 TLB，失誤後才走頁表），頁表為 **${L} 層**，TLB 命中率 ${h * 100}%。不考慮缺頁與 cache，有效存取時間 EAT 是多少 ns？`, ans: [GU.round(eat)],
        expl: `命中：TLB + 1 次記憶體 = ${t + m}；失誤：TLB + ${L} 次查頁表 + 1 次取資料 = ${t + (L + 1) * m}。\n\nEAT = ${h}×${t + m} + ${GU.round(1 - h)}×${t + (L + 1) * m} = **${GU.round(eat)} ns**` };
    }
    const ma = r.pick([100, 200, 250]), F = r.pick([5, 8, 10]) * 1e6, slow = r.pick([10, 20, 40]);
    const p = (slow / 100 * ma) / (F - ma);
    return { type: 'fill', fmt: '可用科學記號，如 2.5e-6', stem: `記憶體存取 ${ma} ns，處理一次缺頁平均 ${F / 1e6} ms。若要讓有效存取時間的變慢幅度不超過 ${slow}%，缺頁率 p 最大是多少？`, ans: [String(p)],
      expl: `(1−p)·${ma} + p·${F} ≤ ${ma}×${1 + slow / 100} ⇒ p·(${F} − ${ma}) ≤ ${slow / 100 * ma} ⇒ p ≤ **${p.toExponential(3)}**。缺頁率要低到約每 ${Math.round(1 / p).toLocaleString()} 次存取才 1 次，這就是為什麼 thrashing 一出現效能就崩潰。` };
  } });

Gen.reg({ id: 'ptsize', subject: 'os', ch: 'os-memory', title: '頁表大小與分層數', desc: '虛擬位址、頁大小、PTE 大小', diff: 3,
  make(r) {
    const va = r.pick([32, 36, 39, 48]), pg = r.pick([12, 13, 14]), pte = r.pick([2, 3]); // log2
    const vpn = va - pg;
    if (r() < 0.5) return { type: 'fill', fmt: '填 k（大小為 2^k bytes）', stem: `虛擬位址 ${va} bits，頁大小 ${2 ** (pg - 10)} KB，每個 PTE ${2 ** pte} bytes。單層頁表大小為 $2^k$ bytes，求 k。`, ans: [vpn + pte], expl: `offset = ${pg} bits，VPN = ${va} − ${pg} = ${vpn} bits，所以有 $2^{${vpn}}$ 個 PTE，大小 $2^{${vpn}} \\times 2^{${pte}} = 2^{${vpn + pte}}$ bytes。` };
    const per = pg - pte; const lv = Math.ceil(vpn / per);
    return { type: 'fill', stem: `虛擬位址 ${va} bits，頁大小 ${2 ** (pg - 10)} KB，PTE ${2 ** pte} bytes。若每一層頁表都必須剛好放進一個頁框，至少需要幾層頁表？`, ans: [lv],
      expl: `一頁可放 $2^{${pg}}/2^{${pte}} = 2^{${per}}$ 個 PTE，所以每層吃 ${per} 個 VPN bits。VPN = ${vpn} bits，層數 = ⌈${vpn}/${per}⌉ = **${lv}**。` };
  } });

Gen.reg({ id: 'fork', subject: 'os', ch: 'os-process', title: 'fork() 輸出次數', desc: '算行程數與印出次數', diff: 2,
  make(r) {
    if (r() < 0.4) {
      const n = r.int(2, 5); const inLoop = r() < 0.5;
      const code = inLoop ? `for (int i = 0; i < ${n}; i++) {\n    fork();\n    printf("X");\n}` : `for (int i = 0; i < ${n}; i++)\n    fork();\nprintf("X");`;
      const ans = inLoop ? 2 ** (n + 1) - 2 : 2 ** n;
      return { type: 'fill', stem: '下列程式（假設 printf 立即輸出、無緩衝問題）共印出幾個 X？\n\n```c\n' + code + '\n```', ans: [ans],
        expl: inLoop ? `第 i 輪（i=1..${n}）fork 後有 $2^i$ 個行程，各印一次：$\\sum_{i=1}^{${n}} 2^i = 2^{${n + 1}}-2 = ${ans}$。` : `迴圈結束時有 $2^{${n}}$ 個行程，各印一次 = ${ans}。` };
    }
    const k = r.int(3, 6); const stmts = []; let forks = 0, total = 0; const cnt = {};
    for (let i = 0; i < k; i++) { if (r() < 0.5 || i === k - 1) { const L = r.pick(['A', 'B']); stmts.push(`printf("${L}");`); cnt[L] = (cnt[L] || 0) + 2 ** forks; total += 2 ** forks; } else { stmts.push('fork();'); forks++; } }
    const L = Object.keys(cnt)[0];
    return { type: 'fill', stem: '下列程式從 main 開始執行（printf 立即輸出），字母 **' + L + '** 一共被印出幾次？\n\n```c\n' + stmts.join('\n') + '\n```', ans: [cnt[L]],
      expl: '每遇到一個 fork()，執行到那一行的行程數就加倍。每一行 printf 被執行的次數 = $2^{(\\text{之前的 fork 數})}$。' + `${L} 共 **${cnt[L]}** 次（全部字元共 ${total} 個）。` };
  } });

Gen.reg({ id: 'banker', subject: 'os', ch: 'os-deadlock', title: '銀行家演算法安全序列', desc: '判斷安全並給序列', diff: 2,
  make(r) {
    const n = 5, m = 3;
    const alloc = Array.from({ length: n }, () => Array.from({ length: m }, () => r.int(0, 3)));
    const need = Array.from({ length: n }, () => Array.from({ length: m }, () => r.int(0, 4)));
    const max = alloc.map((row, i) => row.map((x, j) => x + need[i][j]));
    const avail = Array.from({ length: m }, () => r.int(1, 4));
    const res = Sim.banker(avail, max, alloc);
    const seq = res.seq.map(i => 'P' + i).join(',');
    return { type: 'fill', fmt: '例：P1,P3,P4,P0,P2 或「不安全」',
      stem: `三種資源 A B C，Available = (${avail.join(', ')})。\n\n| 行程 | Allocation | Max |\n|---|---|---|\n${alloc.map((a, i) => `| P${i} | ${a.join(' ')} | ${max[i].join(' ')} |`).join('\n')}\n\n此狀態是否安全？若安全，寫出安全序列（每一步都挑**編號最小**且 Need ≤ Work 的行程）；不安全則填「不安全」。`,
      ans: res.safe ? [seq, res.seq.join(',')] : ['不安全', 'unsafe'],
      expl: `Need：${res.need.map((x, i) => `P${i}(${x.join(',')})`).join('、')}\n\n${res.steps.map(s => s.note).join('\n\n')}` };
  } });

/* ======================= 計算機組織 ======================= */
Gen.reg({ id: 'cachebits', subject: 'co', ch: 'co-cache', title: 'Cache 位址切割', desc: 'tag／index／offset 位元數與總位元', diff: 2,
  make(r) {
    const C = 2 ** r.int(12, 17), B = r.pick([16, 32, 64]), A = r.pick([1, 2, 4, 8, 'full']), m = r.pick([32, 32, 40]);
    const blocks = C / B, ways = A === 'full' ? blocks : A, sets = blocks / ways;
    const ob = Math.log2(B), ib = Math.log2(sets), tb = m - ob - ib;
    if (r() < 0.6) return { type: 'fill', fmt: 'tag,index,offset', stem: `${m}-bit byte 位址，cache 容量 ${C / 1024} KB，區塊 ${B} bytes，${A === 'full' ? '全關聯' : A === 1 ? '直接映射' : A + '-way 集合關聯'}。tag、index、offset 各幾 bits？`, ans: [`${tb},${ib},${ob}`],
      expl: `區塊數 = ${C}/${B} = ${blocks}；set 數 = ${blocks}/${ways} = ${sets}。offset = lg ${B} = ${ob}，index = lg ${sets} = ${ib}，tag = ${m} − ${ib} − ${ob} = **${tb}**。` };
    const bits = blocks * (8 * B + tb + 1);
    return { type: 'fill', fmt: '總位元數（整數）', stem: `${m}-bit byte 位址，${C / 1024} KB 資料容量，區塊 ${B} bytes，${A === 'full' ? '全關聯' : A === 1 ? '直接映射' : A + '-way'}。每個區塊有 1 個 valid bit（不計 dirty、LRU 位元）。cache 實際需要多少 bits（資料＋tag＋valid）？`, ans: [bits],
      expl: `tag = ${tb} bits。每塊 = ${8 * B}（資料）+ ${tb}（tag）+ 1（valid）= ${8 * B + tb + 1} bits，共 ${blocks} 塊 → **${bits}** bits（約資料量的 ${(bits / (8 * C)).toFixed(3)} 倍）。` };
  } });

Gen.reg({ id: 'cachesim', subject: 'co', ch: 'co-cache', title: 'Cache 命中次數', desc: '直接映射 vs 集合關聯，手算 hit／miss', diff: 2,
  make(r) {
    const conf = r.pick([{ C: 8, B: 1, A: 1, t: '直接映射，8 個區塊，每塊 1 word' }, { C: 8, B: 1, A: 2, t: '2-way 集合關聯（4 sets），每塊 1 word，LRU' }, { C: 16, B: 2, A: 1, t: '直接映射，8 個區塊，每塊 2 words' }, { C: 8, B: 1, A: 'full', t: '全關聯 8 塊，LRU' }]);
    const base = Array.from({ length: 5 }, () => r.int(0, 31)); const addrs = Array.from({ length: 10 }, () => r() < 0.6 ? r.pick(base) : r.int(0, 31));
    const res = Sim.cache({ C: conf.C, B: conf.B, A: conf.A, m: 8, addrs, policy: 'lru' });
    return { type: 'fill', stem: `Cache 為 ${conf.t}，一開始是空的。依序存取 word 位址：\`${addrs.join(', ')}\`。共命中幾次？`, ans: [res.hits],
      expl: res.steps.map(s => `${s.a}（塊 ${s.blk}→set ${s.idx}）${s.hit ? 'H' : 'M'}`).join('，') + `\n\n命中 **${res.hits}** 次。` };
  } });

Gen.reg({ id: 'amdahl', subject: 'co', ch: 'co-perf', title: 'Amdahl 定律', desc: '整體加速與所需加速倍數', diff: 2,
  make(r) {
    const f = r.pick([0.4, 0.5, 0.6, 0.75, 0.8, 0.9, 0.95]), s = r.pick([2, 4, 5, 8, 10, 20]);
    const S = 1 / ((1 - f) + f / s);
    if (r() < 0.6) return { type: 'fill', stem: `程式有 ${f * 100}% 的執行時間可以被加速 ${s} 倍，整體加速比是多少？（取到小數點後三位）`, ans: [GU.round(S, 3)], expl: `$S = \\frac{1}{(1-f) + f/s} = \\frac{1}{${GU.round(1 - f)} + ${f}/${s}} = ${GU.round(S, 4)}$。上限 $\\frac{1}{1-f} = ${GU.round(1 / (1 - f), 3)}$。` };
    const Smax = 1 / (1 - f); const target = +(1 + (Smax - 1) * r.pick([0.3, 0.5, 0.6])).toFixed(2);
    const need = f / (1 / target - (1 - f));
    return { type: 'fill', stem: `可加速部分占執行時間 ${f * 100}%。要讓整體加速比達到 ${target}，這部分至少要加速幾倍？（小數三位）`, ans: [GU.round(need, 3)], expl: `$\\frac{1}{${target}} = ${GU.round(1 - f)} + \\frac{${f}}{s}$ ⇒ $s = \\frac{${f}}{1/${target} - ${GU.round(1 - f)}} = ${GU.round(need, 4)}$。目標不能超過 $1/(1-f) = ${GU.round(Smax, 3)}$。` };
  } });

Gen.reg({ id: 'cpi', subject: 'co', ch: 'co-perf', title: 'CPI 與執行時間', desc: '指令組成 → 平均 CPI → CPU time', diff: 1,
  make(r) {
    const cls = [['ALU', r.int(1, 2)], ['Load/Store', r.int(2, 5)], ['Branch', r.int(2, 4)]]; let a = r.pick([40, 45, 50, 55]), b = r.pick([20, 25, 30]); const c = 100 - a - b;
    const fr = [a, b, c]; const cpi = cls.reduce((s, [, x], i) => s + x * fr[i] / 100, 0); const ic = r.pick([2, 5, 8]) * 1e8, f = r.pick([1, 2, 2.5, 4]);
    const t = ic * cpi / (f * 1e9) * 1000;
    return { type: 'fill', fmt: 'ms', stem: `處理器 ${f} GHz。指令組成：${cls.map(([n, x], i) => `${n} ${fr[i]}%（CPI ${x}）`).join('、')}。執行 ${ic / 1e8} × 10⁸ 條指令要多少 ms？`, ans: [GU.round(t, 3)], expl: `平均 CPI = ${cls.map(([, x], i) => `${fr[i] / 100}×${x}`).join(' + ')} = ${GU.round(cpi)}。時間 = IC × CPI / f = ${ic} × ${GU.round(cpi)} / ${f}×10⁹ = **${GU.round(t, 3)} ms**。` };
  } });

Gen.reg({ id: 'ieee', subject: 'co', ch: 'co-arith', title: 'IEEE 754 單精度', desc: '十六進位 ↔ 十進位', diff: 2,
  make(r) {
    const s = r.int(0, 1), e = r.int(-6, 8), k = r.int(0, 15);
    const val = (s ? -1 : 1) * (1 + k / 16) * 2 ** e;
    const bits = ((s << 31) | ((e + 127) << 23) | (k << 19)) >>> 0; const hex = bits.toString(16).toUpperCase().padStart(8, '0');
    const bin = bits.toString(2).padStart(32, '0');
    const ex = `符號 ${bin[0]}｜指數 ${bin.slice(1, 9)}（= ${e + 127}，減 bias 127 得 ${e}）｜小數 ${bin.slice(9, 13)}…0（= ${k}/16）。值 = $(-1)^{${s}} \\times (1 + ${k}/16) \\times 2^{${e}} = ${val}$`;
    if (r() < 0.5) return { type: 'fill', stem: `IEEE 754 單精度位元型樣 \`0x${hex}\` 代表的十進位值是？`, ans: [String(val)], expl: ex };
    return { type: 'fill', fmt: '8 位十六進位，如 0xC1480000', stem: `把 ${val} 以 IEEE 754 單精度表示，十六進位是？`, ans: ['0x' + hex, hex], expl: ex + `，所以是 **0x${hex}**。` };
  } });

Gen.reg({ id: 'twos', subject: 'co', ch: 'co-arith', title: '二補數與溢位', desc: '數值轉換、加法溢位判斷', diff: 1,
  make(r) {
    const n = r.pick([8, 8, 12, 16]); const lim = 2 ** (n - 1);
    if (r() < 0.5) {
      const v = r.int(-lim, lim - 1); const u = (v + 2 ** n) % 2 ** n; const b = u.toString(2).padStart(n, '0');
      return { type: 'fill', stem: `${n}-bit 二補數 \`${b}\` 的十進位值是？`, ans: [v], expl: `最高位權重是 $-2^{${n - 1}}$：${b[0] === '1' ? `$-${lim} + ${u - lim} = ${v}$` : `正數，直接 = ${v}`}。` };
    }
    const a = r.int(-lim, lim - 1), b = r.int(-lim, lim - 1); const sum = a + b; const ov = sum >= lim || sum < -lim;
    const wrap = ((sum % 2 ** n) + 2 ** n) % 2 ** n; const wv = wrap >= lim ? wrap - 2 ** n : wrap;
    return { type: 'fill', fmt: '溢位填「溢位」，否則填結果', stem: `${n}-bit 二補數計算 ${a} + (${b})。會溢位嗎？不溢位就寫出結果，溢位就填「溢位」。`, ans: ov ? ['溢位', 'overflow'] : [sum],
      expl: `範圍 [−${lim}, ${lim - 1}]。真正的和 ${sum}${ov ? ` 超出範圍 → **溢位**（硬體算出的位元型樣會被解讀成 ${wv}；判斷法：兩數同號而結果異號，或最高位的進位入 ≠ 進位出）` : ' 在範圍內，不溢位'}。` };
  } });

Gen.reg({ id: 'pipe', subject: 'co', ch: 'co-pipeline', title: '管線總時脈數', desc: '有／無 forwarding 的 stall 計算', diff: 3,
  make(r) {
    const R = () => '$' + r.int(1, 6);
    const tmpl = [() => `lw ${R()}, ${4 * r.int(0, 8)}(${R()})`, () => `add ${R()}, ${R()}, ${R()}`, () => `sub ${R()}, ${R()}, ${R()}`, () => `sw ${R()}, ${4 * r.int(0, 8)}(${R()})`, () => `or ${R()}, ${R()}, ${R()}`];
    const lines = Array.from({ length: r.int(4, 6) }, () => r.pick(tmpl)());
    const fwd = r() < 0.6; const ins = Sim.parseAsm(lines.join('\n')); const res = Sim.pipe(ins, fwd);
    return { type: 'fill', stem: `標準 5 級 MIPS 管線（IF ID EX MEM WB；暫存器前半寫、後半讀；記憶體分開，無結構危障），**${fwd ? '有' : '沒有'} forwarding**，靠 stall 解決資料危障。執行下列指令從第一條 IF 到最後一條 WB 共幾個 cycle？\n\n\`\`\`\n${lines.join('\n')}\n\`\`\``, ans: [res.cycles],
      expl: `理想：${ins.length} + 4 = ${ins.length + 4}。` + res.R.map((x, i) => x.stall ? `第 ${i + 1} 條 stall ${x.stall}（${x.why.map(w => `$${w.r} 來自第 ${w.j + 1} 條`).join('、')}）` : '').filter(Boolean).join('；') + `。共 **${res.cycles}** cycles。${fwd ? '有 forwarding 時只剩 load-use 需要 1 個 stall。' : '沒有 forwarding 時，相鄰相依要 stall 2，隔一條要 stall 1。'}` };
  } });

Gen.reg({ id: 'amat', subject: 'co', ch: 'co-cache', title: '兩層 cache 的 AMAT', desc: 'local／global miss rate', diff: 2,
  make(r) {
    const h1 = 1, m1 = r.pick([0.02, 0.04, 0.05, 0.08, 0.1]), h2 = r.pick([10, 12, 15, 20]), m2 = r.pick([0.2, 0.25, 0.4, 0.5]), mem = r.pick([100, 150, 200]);
    const amat = h1 + m1 * (h2 + m2 * mem);
    return { type: 'fill', fmt: 'cycles', stem: `L1 命中時間 ${h1} cycle、miss rate ${m1 * 100}%；L2 命中時間 ${h2} cycles、**local** miss rate ${m2 * 100}%；主記憶體 ${mem} cycles。AMAT 是多少 cycles？`, ans: [GU.round(amat)], expl: `AMAT = ${h1} + ${m1} × (${h2} + ${m2} × ${mem}) = **${GU.round(amat)}**。L2 的 global miss rate = ${m1} × ${m2} = ${GU.round(m1 * m2)}。` };
  } });

/* ======================= 資料結構與演算法 ======================= */
function distinct(r, n, lo, hi) { const s = new Set(); while (s.size < n) s.add(r.int(lo, hi)); return [...s]; }
Gen.reg({ id: 'heap', subject: 'ds', ch: 'ds-heap', title: 'Heap 操作後的陣列', desc: '逐一插入 vs Build-Heap', diff: 2,
  make(r) {
    const a = distinct(r, r.int(7, 9), 1, 60); const kind = r.pick(['min', 'max']); const build = r() < 0.5;
    const ops = build ? [{ t: 'build', v: a }] : a.map(v => ({ t: 'ins', v }));
    if (r() < 0.4) ops.push({ t: 'del' });
    const F = HeapSim.run(ops, kind); const res = F[F.length - 1].a;
    return { type: 'fill', fmt: '逗號分隔的陣列（索引 0 開始）', stem: `把 \`${a.join(', ')}\` ${build ? `用 Build-Heap（Floyd，自底向上 heapify）建成` : '依序逐一插入空的'} **${kind === 'min' ? 'Min' : 'Max'}-Heap**${ops[ops.length - 1].t === 'del' ? `，再做一次 Extract-${kind === 'min' ? 'Min' : 'Max'}` : ''}。最後的陣列內容是？`, ans: [res.join(',')],
      expl: `${build ? '從最後一個內部節點往前逐一下沉。' : '每次放到尾端再上浮。'}兩種方法的結果**通常不同**，這是常考點。\n\n結果：**${res.join(', ')}**` };
  } });

Gen.reg({ id: 'avl', subject: 'ds', ch: 'ds-bst', title: 'AVL 插入後的前序', desc: '判斷 LL／LR／RR／RL 並旋轉', diff: 3,
  make(r) {
    const a = distinct(r, r.int(7, 10), 1, 99); const T = { root: null }; const notes = [];
    const snap = n => { if (/型/.test(n)) notes.push(n.replace(/\*\*/g, '')); };
    for (const k of a) { if (!T.root) T.root = { k, h: 1, l: null, r: null }; else TreeSim.ins(T.root, k, true, snap); }
    const pre = []; (function w(n) { if (!n) return; pre.push(n.k); w(n.l); w(n.r); })(T.root);
    return { type: 'fill', fmt: '前序走訪，逗號分隔', stem: `依序把 \`${a.join(', ')}\` 插入空的 AVL 樹，最後的**前序走訪**是？`, ans: [pre.join(',')], expl: (notes.length ? notes.map(x => '- ' + x).join('\n') : '過程中沒有發生旋轉。') + `\n\n前序：**${pre.join(', ')}**` };
  } });

Gen.reg({ id: 'bsttrav', subject: 'ds', ch: 'ds-bst', title: 'BST 走訪互推', desc: '前序 → 後序', diff: 2,
  make(r) {
    const a = distinct(r, r.int(7, 10), 1, 99); const T = { root: { k: a[0], h: 1, l: null, r: null } };
    for (const k of a.slice(1)) TreeSim.ins(T.root, k, false, () => { });
    const pre = [], post = []; (function w(n) { if (!n) return; pre.push(n.k); w(n.l); w(n.r); post.push(n.k); })(T.root);
    return { type: 'fill', fmt: '逗號分隔', stem: `一棵**二元搜尋樹**的前序走訪是 \`${pre.join(', ')}\`。它的後序走訪是？`, ans: [post.join(',')], expl: `BST 的中序就是排序結果，前序＋中序可唯一決定樹。第一個元素是根，比根小的連續段是左子樹，其餘是右子樹，遞迴下去。\n\n後序：**${post.join(', ')}**` };
  } });

Gen.reg({ id: 'hashgen', subject: 'ds', ch: 'ds-hash', title: '開放定址雜湊表', desc: '線性／二次／雙重雜湊後的表', diff: 2,
  make(r) {
    for (;;) {
      const m = r.pick([11, 13]); const keys = distinct(r, 7, 10, 99); const [mt, name] = r.pick([['linear', '線性探測 h(k,i) = (k + i) mod m'], ['quad', '二次探測 h(k,i) = (k + i²) mod m'], ['double', `雙重雜湊 h(k,i) = (k + i·h₂(k)) mod m，h₂(k) = 1 + (k mod ${m - 1})`]]);
      const F = HashSim.run(keys, m, mt === 'quad' ? 'quad' : mt, 0, 1); const T = F[F.length - 1].T;
      if (T.filter(x => x != null).length < keys.length) continue;
      return { type: 'fill', fmt: '從位置 0 起逗號分隔，空位寫 -', stem: `m = ${m}，用${name}，依序插入 \`${keys.join(', ')}\`。最後的表內容？`, ans: [T.map(x => x == null ? '-' : x).join(',')], expl: F.slice(1, -1).filter(f => /插入/.test(f.note) && f.hl.length).map(f => f.note).join('；') + `\n\n表：**${T.map(x => x == null ? '-' : x).join(', ')}**` };
    }
  } });

Gen.reg({ id: 'master', subject: 'al', ch: 'al-recurrence', title: 'Master Theorem', desc: '判斷 case 並給 Θ', diff: 2,
  make(r) {
    const a = r.pick([1, 2, 3, 4, 7, 8, 9, 16]), b = r.pick([2, 3, 4]), k = r.pick([0, 0.5, 1, 1.5, 2, 3]), p = r.pick([0, 0, 1]);
    const c = Math.log(a) / Math.log(b); const eq = Math.abs(c - k) < 1e-9;
    const nk = k === 0 ? '1' : k === 1 ? 'n' : `n^{${k}}`; const lg = p ? (k === 0 ? '\\lg n' : '\\lg n') : '';
    const f = (k === 0 && p ? '\\lg n' : nk + (p ? ' \\lg n' : ''));
    const nc = Number.isInteger(+c.toFixed(9)) ? (Math.round(c) === 0 ? '1' : Math.round(c) === 1 ? 'n' : `n^{${Math.round(c)}}`) : `n^{\\log_{${b}} ${a}}`;
    let ans, why;
    if (eq) { ans = `\\Theta(${nc === '1' ? '' : nc + ' '}\\lg^{${p + 1}} n)`.replace('lg^{1}', 'lg'); why = `$f(n) = \\Theta(n^{\\log_b a} \\lg^{${p}} n)$，Case 2（延伸版）：乘上一個 lg。`; }
    else if (k < c) { ans = `\\Theta(${nc})`; why = `$f(n)$ 多項式地小於 $n^{\\log_b a} \\approx n^{${c.toFixed(3)}}$ → Case 1。`; }
    else { ans = `\\Theta(${f})`; why = `$f(n)$ 多項式地大於 $n^{${c.toFixed(3)}}$，且正則條件 $af(n/b) \\le cf(n)$ 成立 → Case 3。`; }
    const cands = new Set([ans, `\\Theta(${nc})`, `\\Theta(${nc === '1' ? '' : nc + ' '}\\lg n)`, `\\Theta(${f})`, `\\Theta(${f} \\lg n)`, `\\Theta(n^{${k + 1}})`]);
    const opts = r.shuffle([...cands]).slice(0, 4); if (!opts.includes(ans)) opts[0] = ans;
    const fin = r.shuffle(opts);
    return { type: 'single', opts: fin.map(x => `$${x}$`), ans: [fin.indexOf(ans)], stem: `$T(n) = ${a === 1 ? '' : a}T(n/${b}) + ${f}$，則 $T(n) = $ ？`, expl: `$\\log_{${b}} ${a} = ${c.toFixed(3)}$。${why} 答案 $${ans}$。` };
  } });

Gen.reg({ id: 'dijk', subject: 'al', ch: 'al-sp', title: 'Dijkstra 最短距離', desc: '有向圖單源最短路徑', diff: 2,
  make(r) {
    const V = ['A', 'B', 'C', 'D', 'E']; const E = []; const seen = new Set();
    const add = (u, v) => { const k = u + v; if (u === v || seen.has(k)) return; seen.add(k); E.push({ u, v, w: r.int(1, 9) }); };
    for (let i = 1; i < 5; i++) add(V[r.int(0, i - 1)], V[i]);
    while (E.length < 9) add(r.pick(V), r.pick(V));
    const F = GraphSim.run({ V, E, directed: true }, 'dijkstra', 'A'); const lab = F[F.length - 1].lab;
    return { type: 'fill', fmt: 'd(B),d(C),d(D),d(E)', stem: `有向圖的邊（u→v: w）：${E.map(e => `${e.u}→${e.v}:${e.w}`).join('、')}。從 A 出發，求到 B、C、D、E 的最短距離。`, ans: [['B', 'C', 'D', 'E'].map(v => lab[v]).join(',')], expl: F.filter(f => /Extract/.test(f.note)).map(f => f.note.replace(/從此.*/, '')).join(' → ') + `\n\n答案 **${['B', 'C', 'D', 'E'].map(v => lab[v]).join(', ')}**` };
  } });

Gen.reg({ id: 'mst', subject: 'al', ch: 'al-mst-flow', title: 'MST 總權重', desc: 'Kruskal／Prim', diff: 1,
  make(r) {
    const V = ['a', 'b', 'c', 'd', 'e', 'f']; const E = []; const seen = new Set(); const ws = r.shuffle(Array.from({ length: 15 }, (_, i) => i + 1));
    const add = (u, v) => { const k = [u, v].sort().join(''); if (u === v || seen.has(k)) return; seen.add(k); E.push({ u, v, w: ws[E.length] }); };
    for (let i = 1; i < 6; i++) add(V[r.int(0, i - 1)], V[i]);
    while (E.length < 10) add(r.pick(V), r.pick(V));
    const F = GraphSim.run({ V, E, directed: false }, 'kruskal', 'a'); const tot = +F[F.length - 1].note.match(/(\d+)$/)[1];
    return { type: 'fill', stem: `無向圖的邊：${E.map(e => `${e.u}${e.v}(${e.w})`).join('、')}。最小生成樹的總權重？（邊權互異，所以 MST 唯一）`, ans: [tot], expl: F.slice(1).map(f => f.note).join('\n\n') };
  } });

Gen.reg({ id: 'lcs', subject: 'al', ch: 'al-dp', title: 'LCS／編輯距離', desc: '填 DP 表', diff: 2,
  make(r) {
    const s = n => Array.from({ length: n }, () => r.pick(['A', 'B', 'C', 'D'])).join(''); const X = s(r.int(6, 8)), Y = s(r.int(6, 8));
    const edit = r() < 0.4; const m = X.length, n = Y.length; const C = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => edit ? (i === 0 ? j : j === 0 ? i : 0) : 0));
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) C[i][j] = edit ? Math.min(C[i - 1][j - 1] + (X[i - 1] === Y[j - 1] ? 0 : 1), C[i - 1][j] + 1, C[i][j - 1] + 1) : X[i - 1] === Y[j - 1] ? C[i - 1][j - 1] + 1 : Math.max(C[i - 1][j], C[i][j - 1]);
    return { type: 'fill', stem: edit ? `把 \`${X}\` 變成 \`${Y}\` 的編輯距離（插入、刪除、替換各成本 1）是多少？` : `\`${X}\` 與 \`${Y}\` 的最長共同子序列（LCS）長度是？`, ans: [C[m][n]], expl: `${edit ? 'E[i][j] = min(E[i−1][j−1] + [x_i≠y_j], E[i−1][j]+1, E[i][j−1]+1)' : 'c[i][j] = c[i−1][j−1]+1（相同），否則 max(c[i−1][j], c[i][j−1])'}。最後一列：${C[m].join(' ')}，答案 **${C[m][n]}**。` };
  } });

Gen.reg({ id: 'knap', subject: 'al', ch: 'al-dp', title: '0/1 背包', desc: '偽多項式 DP', diff: 2,
  make(r) {
    const n = 4; const w = Array.from({ length: n }, () => r.int(1, 8)), v = Array.from({ length: n }, () => r.int(5, 40)); const W = r.int(8, 15);
    const K = Array(W + 1).fill(0); for (let i = 0; i < n; i++) for (let c = W; c >= w[i]; c--) K[c] = Math.max(K[c], K[c - w[i]] + v[i]);
    return { type: 'fill', stem: `物品（重量, 價值）：${w.map((x, i) => `(${x}, ${v[i]})`).join('、')}，容量 ${W}，每件最多拿一次。最大總價值？`, ans: [K[W]], expl: `K[c] 由大到小更新：K[c] = max(K[c], K[c−w_i] + v_i)。最後 K = [${K.join(', ')}]，答案 **${K[W]}**。注意貪婪（依價值密度）對 0/1 背包不保證最佳。` };
  } });

Gen.reg({ id: 'postfix', subject: 'ds', ch: 'ds-amortized', title: '中序轉後序', desc: '堆疊與運算子優先順序', diff: 1,
  make(r) {
    const ops = ['+', '-', '*', '/', '^']; const vars = 'abcdefg'.split('');
    const gen = (d) => { if (d === 0 || r() < 0.25) return vars[r.int(0, 6)]; const L = gen(d - 1), R2 = gen(d - 1); const o = r.pick(ops); return r() < 0.35 ? `(${L}${o}${R2})` : `${L}${o}${R2}`; };
    let e; do { e = gen(3); } while (e.length < 7 || e.length > 17);
    const prec = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 }; const out = [], st = [];
    for (const c of e) { if (/[a-z]/.test(c)) out.push(c); else if (c === '(') st.push(c); else if (c === ')') { while (st[st.length - 1] !== '(') out.push(st.pop()); st.pop(); }
      else { while (st.length && st[st.length - 1] !== '(' && (prec[st[st.length - 1]] > prec[c] || (prec[st[st.length - 1]] === prec[c] && c !== '^'))) out.push(st.pop()); st.push(c); } }
    while (st.length) out.push(st.pop());
    return { type: 'fill', fmt: '不含空白', stem: `把中序式 \`${e}\` 轉成後序式（^ 為右結合，其餘左結合）。`, ans: [out.join('')], expl: `運算元直接輸出；遇到運算子時，把堆疊頂端優先序較高（或相同且左結合）的先彈出。答案 **${out.join('')}**` };
  } });

/* ======================= 離散數學 ======================= */
Gen.reg({ id: 'stars', subject: 'dm', ch: 'dm-counting', title: '整數解個數', desc: '重複組合＋排容', diff: 2,
  make(r) {
    const k = r.int(3, 4), n = r.int(8, 16); const lo = Array.from({ length: k }, () => r.pick([0, 0, 1, 2])); const cap = r() < 0.6 ? r.int(3, 6) : null;
    const dp = (i, rem) => { if (i === k) return rem === 0 ? 1 : 0; let s = 0; for (let x = lo[i]; x <= (cap != null ? Math.min(cap, rem) : rem); x++) s += dp(i + 1, rem - x); return s; };
    const ans = dp(0, n);
    return { type: 'fill', stem: `方程式 $${Array.from({ length: k }, (_, i) => `x_{${i + 1}}`).join(' + ')} = ${n}$ 有多少組整數解，其中 ${lo.map((l, i) => `$${l} \\le x_{${i + 1}}${cap != null ? ' \\le ' + cap : ''}$`).join('、')}？`, ans: [ans],
      expl: `先令 $y_i = x_i - ${'ℓ'}_i$ 去掉下界，剩 $${n - lo.reduce((a, b) => a + b, 0)}$ 分給 ${k} 個變數：$\\binom{m + k - 1}{k - 1}$。${cap != null ? `有上界時用排容：減去「至少一個超過上界」的情況，加回兩個超過的……` : ''}答案 **${ans}**。` };
  } });

Gen.reg({ id: 'derange', subject: 'dm', ch: 'dm-counting', title: '錯排與排容', desc: '恰好 k 個在原位', diff: 2,
  make(r) {
    const n = r.int(5, 9), k = r.int(0, 3); const D = [1, 0]; for (let i = 2; i <= n; i++) D[i] = (i - 1) * (D[i - 1] + D[i - 2]);
    const ans = GU.C(n, k) * D[n - k];
    return { type: 'fill', stem: `${n} 個人各自把帽子交出後隨機拿回一頂，**恰好 ${k} 個人**拿到自己帽子的拿法有幾種？`, ans: [ans], expl: `選出哪 ${k} 人拿對：$\\binom{${n}}{${k}}$；其餘 ${n - k} 人全錯排：$D_{${n - k}} = ${D[n - k]}$（$D_n = (n-1)(D_{n-1}+D_{n-2})$，或 $n!\\sum (-1)^i/i!$）。答案 ${GU.C(n, k)} × ${D[n - k]} = **${ans}**。` };
  } });

Gen.reg({ id: 'surj', subject: 'dm', ch: 'dm-counting', title: '映成函數個數', desc: '排容 ↔ 第二類 Stirling 數', diff: 2,
  make(r) {
    const m = r.int(4, 7), n = r.int(2, Math.min(4, m)); let s = 0; for (let i = 0; i <= n; i++) s += (i % 2 ? -1 : 1) * GU.C(n, i) * (n - i) ** m;
    return { type: 'fill', stem: `從 ${m} 個元素的集合到 ${n} 個元素的集合，有幾個**映成（onto）**函數？`, ans: [s], expl: `排容：$\\sum_{i=0}^{${n}} (-1)^i \\binom{${n}}{i} (${n}-i)^{${m}} = ${s}$，也等於 $n! \\cdot S(${m},${n})$，$S(${m},${n}) = ${s / GU.fact(n)}$。` };
  } });

Gen.reg({ id: 'recur', subject: 'dm', ch: 'dm-recur-gf', title: '線性遞迴', desc: '特徵根法／直接推', diff: 2,
  make(r) {
    let r1 = r.pick([-2, -1, 1, 2, 3, 4]), r2 = r.pick([-2, -1, 1, 2, 3]); if (r() < 0.25) r2 = r1;
    const c1 = r1 + r2, c2 = -r1 * r2; const d = r() < 0.3 ? r.int(1, 3) : 0; const a = [r.int(0, 3), r.int(1, 5)]; const K = r.int(6, 9);
    for (let i = 2; i <= K; i++) a[i] = c1 * a[i - 1] + c2 * a[i - 2] + d;
    const sgn = x => x < 0 ? `- ${-x}` : `+ ${x}`;
    return { type: 'fill', stem: `$a_n = ${c1}a_{n-1} ${sgn(c2)}a_{n-2}${d ? ' + ' + d : ''}$（n ≥ 2），$a_0 = ${a[0]}, a_1 = ${a[1]}$。求 $a_{${K}}$。`, ans: [a[K]],
      expl: `特徵方程 $x^2 - ${c1}x ${sgn(-c2)} = 0$ 的根 ${r1}${r1 === r2 ? '（重根 → 通解 $(A + Bn)r^n$）' : `、${r2}（通解 $A\\cdot${r1}^n + B\\cdot${r2}^n$）`}${d ? '，再加一個特解（常數項）' : ''}。直接推：${a.slice(0, K + 1).join(', ')}，所以 $a_{${K}} = ${a[K]}$。` };
  } });

Gen.reg({ id: 'modarith', subject: 'dm', ch: 'dm-nt-algebra', title: '模運算／CRT', desc: '快速冪、反元素、中國剩餘定理', diff: 2,
  make(r) {
    const t = r.int(0, 2);
    if (t === 0) { const p = r.pick([7, 11, 13, 17, 19, 23]); const a = r.int(2, p - 1); const e = r.int(100, 9999); const ans = GU.modpow(a, e, p); return { type: 'fill', stem: `求 $${a}^{${e}} \\bmod ${p}$。`, ans: [ans], expl: `${p} 是質數，費馬小定理 $a^{${p - 1}} \\equiv 1$。$${e} \\bmod ${p - 1} = ${e % (p - 1)}$，所以答案 $= ${a}^{${e % (p - 1)}} \\bmod ${p} = ${ans}$。` }; }
    if (t === 1) { let m, a; do { m = r.int(11, 60); a = r.int(2, m - 1); } while (GU.gcd(a, m) !== 1); let inv = 1; while (a * inv % m !== 1) inv++; return { type: 'fill', stem: `求 ${a} 在模 ${m} 下的乘法反元素（0 到 ${m - 1}）。`, ans: [inv], expl: `gcd(${a}, ${m}) = 1，用延伸歐幾里得求 ${a}x + ${m}y = 1：x ≡ **${inv}**（驗算 ${a}×${inv} = ${a * inv} ≡ 1）。` }; }
    const ms = r.pick([[3, 5, 7], [4, 5, 9], [5, 7, 8], [3, 7, 11]]); const as = ms.map(m => r.int(0, m - 1)); const M = ms.reduce((x, y) => x * y, 1);
    let x = 0; while (!ms.every((m, i) => x % m === as[i])) x++;
    return { type: 'fill', stem: `求最小非負整數 x：${ms.map((m, i) => `$x \\equiv ${as[i]} \\pmod{${m}}$`).join('，')}。`, ans: [x], expl: `模數兩兩互質，由中國剩餘定理在 [0, ${M}) 內唯一。$x = \\sum a_i M_i (M_i^{-1} \\bmod m_i)$，$M = ${M}$。答案 **${x}**。` };
  } });

Gen.reg({ id: 'relcount', subject: 'dm', ch: 'dm-relations', title: '關係的計數', desc: '自反、對稱、反對稱、等價關係個數', diff: 2,
  make(r) {
    const n = r.int(2, 5); const bell = [1, 1, 2, 5, 15, 52]; const pos = [1, 1, 3, 19, 219, 4231];
    const kinds = [
      ['自反', 2 ** (n * n - n), `$2^{n^2-n}$：對角線固定 n 個必選，其餘 $n^2-n$ 個任選`],
      ['對稱', 2 ** (n * (n + 1) / 2), `$2^{n(n+1)/2}$：對角線 n 個加上 $\\binom{n}{2}$ 對（每對同進同出）`],
      ['反對稱', 2 ** n * 3 ** (n * (n - 1) / 2), `$2^n 3^{\\binom n2}$：對角線任選；每對 (a,b),(b,a) 只有三種：都不選、只選一個`],
      ['自反且對稱', 2 ** (n * (n - 1) / 2), `$2^{\\binom n2}$`],
      ['非對稱（asymmetric）', 3 ** (n * (n - 1) / 2), `$3^{\\binom n2}$：對角線全不能選，每對三種`],
      ['等價', bell[n], `等價關係 ↔ 集合分割，數量是 Bell 數 $B_${n}$`],
      ['偏序（partial order）', pos[n], '標記偏序集的個數，n = 1..5 依序是 1, 3, 19, 219, 4231（要背或小 n 用列舉）'],
    ];
    const [name, ans, why] = r.pick(kinds);
    return { type: 'fill', stem: `集合 A 有 ${n} 個元素。A 上有幾個**${name}**關係？`, ans: [ans], expl: `${why}。n = ${n} 時為 **${ans}**。` };
  } });

Gen.reg({ id: 'chrom', subject: 'dm', ch: 'dm-graph', title: '色多項式求值', desc: '環、完全圖、樹、輪圖', diff: 2,
  make(r) {
    const k = r.int(3, 5); const t = r.int(0, 3); const n = r.int(4, 7);
    const ff = (x, m) => { let s = 1; for (let i = 0; i < m; i++) s *= x - i; return s; };
    const C = (m, x) => (x - 1) ** m + (m % 2 ? -1 : 1) * (x - 1);
    const cases = [
      [`環 $C_${n}$`, C(n, k), `$P(C_n,k) = (k-1)^n + (-1)^n(k-1)$`],
      [`完全圖 $K_${Math.min(n, k + 1)}$`, ff(k, Math.min(n, k + 1)), '$P(K_n,k) = k(k-1)\\cdots(k-n+1)$，n > k 時為 0'],
      [`有 ${n} 個點的樹`, k * (k - 1) ** (n - 1), '$P(T,k) = k(k-1)^{n-1}$'],
      [`輪圖 $W_${n}$（中心＋外圈 ${n} 點的環）`, k * C(n, k - 1), '$P(W_n,k) = k\\cdot P(C_n, k-1)$：中心先選色，外圈只能用剩下 k−1 色'],
    ];
    const [g, ans, why] = cases[t];
    return { type: 'fill', stem: `用 ${k} 種顏色對${g}做頂點著色（相鄰不同色），有幾種方法？`, ans: [ans], expl: `${why}。答案 **${ans}**。` };
  } });

/* ======================= 線性代數 ======================= */
Gen.reg({ id: 'det', subject: 'la', ch: 'la-det', title: '行列式', desc: '3×3／4×4 整數矩陣', diff: 1,
  make(r) {
    const n = r() < 0.6 ? 3 : 4; const M = Array.from({ length: n }, () => Array.from({ length: n }, () => r.int(-3, 4)));
    if (n === 4) M[r.int(0, 3)][r.int(0, 3)] = 0;
    const d = GU.det(M);
    return { type: 'fill', stem: `計算 $\\det ${GU.tex(M)}$。`, ans: [d], expl: `用列運算化成上三角（列取代不變、列交換變號）或沿 0 多的列做餘因子展開。答案 **${d}**。` };
  } });

Gen.reg({ id: 'rank', subject: 'la', ch: 'la-systems', title: '秩與零空間維度', desc: 'rank–nullity', diff: 2,
  make(r) {
    const m = r.int(3, 4), n = r.int(4, 5), rk = r.int(1, Math.min(m, n) - 1);
    const B = Array.from({ length: rk }, () => Array.from({ length: n }, () => r.int(-2, 3)));
    const M = Array.from({ length: m }, (_, i) => i < rk ? B[i].slice() : Array(n).fill(0).map((_, j) => B.reduce((s, row) => s + row[j] * r.int(-2, 2), 0)));
    const sh = r.shuffle(M); const res = Sim.rref(sh); const ask = r() < 0.5;
    return { type: 'fill', stem: `$A = ${GU.tex(sh)}$。求 ${ask ? '$\\operatorname{rank} A$' : '$\\dim N(A)$（零空間維度）'}。`, ans: [ask ? res.rank : n - res.rank], expl: `化到 RREF 後 pivot 有 ${res.rank} 個 → rank = ${res.rank}；rank–nullity：nullity = n − rank = ${n} − ${res.rank} = ${n - res.rank}。` };
  } });

const UNI = [[[1, 1], [0, 1]], [[1, 0], [1, 1]], [[2, 1], [1, 1]], [[1, 2], [1, 3]], [[3, 1], [2, 1]], [[1, 1], [1, 2]], [[2, 3], [1, 2]]];
function m2mul(A, B) { return [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]]; }
function m2inv1(P) { const d = P[0][0] * P[1][1] - P[0][1] * P[1][0]; return [[P[1][1] * d, -P[0][1] * d], [-P[1][0] * d, P[0][0] * d]]; }
Gen.reg({ id: 'eig2', subject: 'la', ch: 'la-eigen', title: '特徵值與矩陣冪次', desc: '對角化計算 Aⁿ', diff: 2,
  make(r) {
    const P = r.pick(UNI); let l1 = r.int(-2, 3), l2 = r.int(-2, 4); if (l1 === l2) l2 = l1 + 1;
    const A = m2mul(m2mul(P, [[l1, 0], [0, l2]]), m2inv1(P));
    if (r() < 0.5) { const s = [l1, l2].sort((a, b) => a - b); return { type: 'fill', fmt: '小,大', stem: `$A = ${GU.tex(A)}$ 的兩個特徵值（由小到大）？`, ans: [s.join(',')], expl: `tr A = ${A[0][0] + A[1][1]}，det A = ${GU.det(A)}，特徵方程 $\\lambda^2 - (${A[0][0] + A[1][1]})\\lambda + (${GU.det(A)}) = 0$，根為 ${s.join(', ')}。` }; }
    const n = r.int(4, 8); const An = m2mul(m2mul(P, [[l1 ** n, 0], [0, l2 ** n]]), m2inv1(P)); const i = r.int(0, 1), j = r.int(0, 1);
    return { type: 'fill', stem: `$A = ${GU.tex(A)}$，求 $A^{${n}}$ 的第 (${i + 1},${j + 1}) 個元素。`, ans: [An[i][j]], expl: `特徵值 ${l1}、${l2}，$A = PDP^{-1}$，$P = ${GU.tex(P)}$。$A^{${n}} = PD^{${n}}P^{-1} = ${GU.tex(An)}$。` };
  } });

Gen.reg({ id: 'eigprop', subject: 'la', ch: 'la-eigen', title: '用特徵值算行列式與跡', desc: 'f(A) 的特徵值是 f(λ)', diff: 3,
  make(r) {
    const L = [r.int(-2, 3), r.int(1, 3), r.int(-1, 2)].map(x => x === 0 ? 2 : x);
    const t = r.int(0, 3); const a = r.int(-2, 2), b = r.int(-3, 3);
    const poly = x => x * x + a * x + b;
    const sg = (c, s) => c === 0 ? '' : (c > 0 ? ' + ' : ' - ') + (Math.abs(c) === 1 && s ? '' : Math.abs(c)) + s;
    const cases = [
      [`$\\det(A^2${sg(a, 'A')}${sg(b, 'I')})$`, String(L.reduce((p, x) => p * poly(x), 1)), `特徵值 $\\lambda^2${sg(a, '\\lambda')}${sg(b, '')}$ 相乘：${L.map(poly).join(' × ')}`],
      [`$\\operatorname{tr}(A^3)$`, String(L.reduce((s, x) => s + x ** 3, 0)), `$\\sum \\lambda_i^3$ = ${L.map(x => x ** 3).join(' + ')}`],
      [`$\\det(\\operatorname{adj} A)$`, String(L.reduce((p, x) => p * x, 1) ** 2), `$\\det(\\operatorname{adj}A) = (\\det A)^{n-1} = (${L.reduce((p, x) => p * x, 1)})^2$`],
      [`$\\operatorname{tr}(A^{-1})$`, (() => { const num = L[1] * L[2] + L[0] * L[2] + L[0] * L[1], den = L[0] * L[1] * L[2]; return GU.frac(num, den); })(), `$\\sum 1/\\lambda_i$`],
    ];
    const [what, ans, why] = cases[t];
    return { type: 'fill', fmt: '整數或分數', stem: `3×3 矩陣 A 的特徵值為 ${L.join('、')}。求 ${what}。`, ans: [ans], expl: `若 $Av = \\lambda v$，則 $f(A)v = f(\\lambda)v$；行列式＝特徵值乘積，跡＝特徵值和。${why} = **${ans}**。` };
  } });

Gen.reg({ id: 'proj', subject: 'la', ch: 'la-ortho', title: '投影與最小平方', desc: '投影向量、最小平方直線', diff: 2,
  make(r) {
    if (r() < 0.5) {
      const a = [r.int(-2, 3), r.int(-2, 3), r.int(1, 3)], b = [r.int(-3, 4), r.int(-3, 4), r.int(-3, 4)];
      const ab = a.reduce((s, x, i) => s + x * b[i], 0), aa = a.reduce((s, x) => s + x * x, 0);
      const p = a.map(x => GU.frac(x * ab, aa));
      return { type: 'fill', fmt: '分量用分數，逗號分隔', stem: `把 $b = (${b.join(', ')})$ 投影到 $a = (${a.join(', ')})$ 所張的直線上，投影向量 p = ？`, ans: [p.join(',')], expl: `$p = \\frac{a^T b}{a^T a} a = \\frac{${ab}}{${aa}}(${a.join(', ')})$ = (${p.join(', ')})。誤差 b − p 與 a 正交。` };
    }
    const xs = [0, 1, 2, 3].slice(0, r.int(3, 4)); const ys = xs.map(() => r.int(0, 6)); const n = xs.length;
    const Sx = xs.reduce((a, b) => a + b, 0), Sy = ys.reduce((a, b) => a + b, 0), Sxx = xs.reduce((a, b) => a + b * b, 0), Sxy = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const den = n * Sxx - Sx * Sx; const d = GU.frac(n * Sxy - Sx * Sy, den), c = GU.frac(Sy * Sxx - Sx * Sxy, den);
    return { type: 'fill', fmt: 'C,D（分數）', stem: `用直線 $y = C + Dx$ 對資料點 ${xs.map((x, i) => `(${x}, ${ys[i]})`).join('、')} 做最小平方擬合，求 C、D。`, ans: [`${c},${d}`], expl: `正規方程 $A^TA\\hat x = A^Tb$：$\\begin{bmatrix}${n} & ${Sx} \\\\ ${Sx} & ${Sxx}\\end{bmatrix}\\begin{bmatrix}C\\\\D\\end{bmatrix} = \\begin{bmatrix}${Sy}\\\\${Sxy}\\end{bmatrix}$，解得 C = ${c}，D = ${d}。` };
  } });
