/* 資工所衝刺站 — 題目表：考卷分組標籤＋跨科綜合題（2026-11-10）
   台大筆試是兩科一張卷：計算機結構＋作業系統（sys）、資料結構＋演算法（dsa）、線代＋離散（math）。
   每一型都標 paper（哪一張卷）和 tags（主題）；跨科題用 kp＋also 標兩個知識點，兩個都學會才出。 */
'use strict';
(() => {
  const range = n => Array.from({ length: n }, (_, i) => i);
  const must = (ok, msg) => { if (!ok) throw new Error('驗算失敗：' + msg); };
  const PAPER = { co: 'sys', os: 'sys', ds: 'dsa', al: 'dsa', la: 'math', dm: 'math', en: 'en' };
  Gen.paperOf = s => PAPER[s] || s;
  Gen.forKP = (ok = () => true) => Gen.list.filter(g => g.kp && ok(g.kp) && (!g.also || ok(g.also)));
  const hex = (x, w) => '0x' + x.toString(16).toUpperCase().padStart(w, '0');

  /* ---------- sys：虛擬位址 → TLB／頁表 → 實體位址 → cache 的 set 與 tag ---------- */
  Gen.tpl({ id: 'vatrans', kp: 'co-vm-coherence#1', also: 'os-memory#3', title: '綜合：位址轉換＋cache 切割', diff: 3, tags: ['記憶體階層', '虛擬記憶體', 'cache'],
    draw(r) { const pg = r.pick([8, 10, 12]), va = 16, pa = r.pick([14, 15, 16]), npages = 1 << (va - pg), PT = {}; const used = r.shuffle(range(1 << (pa - pg))); range(Math.min(6, npages, used.length)).forEach(i => { const vpn = r.int(0, npages - 1); PT[vpn] = used[i]; }); const vpn = r.pick(Object.keys(PT).map(Number)); return { pg, va, pa, PT, vpn, off: r.int(0, (1 << pg) - 1), blk: r.pick([16, 32, 64]), sets: r.pick([16, 32, 64]) }; },
    build({ pg, va, pa, PT, vpn, off, blk, sets }) {
      const VA = vpn << pg | off, ppn = PT[vpn], PA = ppn << pg | off, ob = Math.log2(blk), ib = Math.log2(sets), tb = pa - ob - ib; if (tb < 1) return null;
      const set = PA >> ob & (sets - 1), tag = PA >> (ob + ib); must(((tag << ib | set) << ob | (PA & (blk - 1))) === PA, '切割');
      const rows = Object.keys(PT).map(Number).sort((a, b) => a - b).map(v => `| ${hex(v, 2)} | ${hex(PT[v], 2)} |`).join('\n');
      return { type: 'fill', fmt: '實體位址(16 進位),set,tag（例如 0x1A2B,5,3）', stem: `虛擬位址 ${va} 位元、頁大小 ${1 << pg} bytes、實體位址 ${pa} 位元。頁表（只列有效的）：\n\n| VPN | PPN |\n|---|---|\n${rows}\n\nCPU 讀虛擬位址 **${hex(VA, 4)}**。直接對映 cache：${sets} 個 set、區塊 ${blk} bytes（用實體位址切）。寫出實體位址、cache 的 set 編號、tag。`, ans: [`${hex(PA, 4)},${set},${tag}`, `${PA},${set},${tag}`],
        expl: `位移 ${pg} 位元：VPN = ${hex(vpn, 2)}、offset = ${hex(off, 3)}。查頁表 PPN = ${hex(ppn, 2)}，實體位址 = PPN·${1 << pg} + offset = **${hex(PA, 4)}**（${PA}）。\n\ncache：offset ${ob} 位、index ${ib} 位、tag ${tb} 位。set = (PA ≫ ${ob}) mod ${sets} = **${set}**，tag = PA ≫ ${ob + ib} = **${tag}**。` };
    } });

  /* ---------- sys：TLB＋頁表＋cache 的平均存取時間 ---------- */
  Gen.tpl({ id: 'eatcache', kp: 'co-cache#4', also: 'os-vm#1', title: '綜合：TLB、頁表、cache 一起算平均時間', diff: 3, tags: ['記憶體階層', '虛擬記憶體'],
    draw(r) { return { tlb: r.pick([1, 2]), th: r.pick([90, 95, 98, 99]), c: r.pick([1, 2, 4]), ch: r.pick([90, 95, 97]), m: r.pick([50, 80, 100, 120]), lv: r.int(1, 2) }; },
    build({ tlb, th, c, ch, m, lv }) {
      const amat = c + (1 - ch / 100) * m, eat = tlb + (th / 100) * amat + (1 - th / 100) * (lv * amat + amat), v = Math.round(eat * 1000) / 1000;
      return { type: 'fill', fmt: '奈秒（可到小數）', stem: `查 TLB ${tlb} ns，TLB 命中率 ${th}%。頁表有 ${lv} 層，存在記憶體裡（讀頁表也會經過 cache）。cache 命中 ${c} ns、命中率 ${ch}%、失誤時再加 ${m} ns 讀記憶體。沒有缺頁。一次記憶體存取的平均時間是幾 ns？`, ans: [String(v)],
        expl: `一次經過 cache 的存取：AMAT = ${c} + ${(1 - ch / 100).toFixed(2)}×${m} = ${amat}。TLB 命中：${tlb} + ${amat}；沒命中：${tlb} + ${lv}×${amat}（走頁表）+ ${amat}。平均 = ${tlb} + ${th / 100}×${amat} + ${(1 - th / 100).toFixed(2)}×${(lv + 1) * amat} = **${v}**。` };
    } });

  /* ---------- dsa：Heapsort 做到一半 ---------- */
  Gen.tpl({ id: 'heapsortk', kp: 'ds-sort#1', also: 'ds-heap#1', title: '綜合：Heapsort 取出 k 個之後的陣列', diff: 3, tags: ['排序', '堆積'],
    draw(r) { const s = new Set(); while (s.size < 8) s.add(r.int(1, 50)); return { A: r.shuffle([...s]), k: r.int(1, 3) }; },
    build({ A, k }) {
      const a = A.slice(), sift = (i, n) => { for (;;) { const l = 2 * i + 1, rr = l + 1; let m = i; if (l < n && a[l] > a[m]) m = l; if (rr < n && a[rr] > a[m]) m = rr; if (m === i) return; [a[i], a[m]] = [a[m], a[i]]; i = m; } };
      for (let i = 3; i >= 0; i--) sift(i, 8); const built = a.slice();
      for (let t = 0; t < k; t++) { const n = 8 - t; [a[0], a[n - 1]] = [a[n - 1], a[0]]; sift(0, n - 1); }
      must(a.slice(8 - k).every((x, i, s) => !i || s[i - 1] <= x) && Math.max(...a.slice(0, 8 - k)) <= a[8 - k], 'heapsort');
      return { type: 'fill', fmt: '8 個數，用逗號隔開', stem: `對 [${A.join(', ')}] 做 Heapsort（max-heap，先 Build-Heap，再每次把根和最後一個交換、縮小、往下調整）。Build-Heap 之後再取出 ${k} 個，陣列長什麼樣？`, ans: [a.join(','), a.join(' ')],
        expl: `Build-Heap 後：[${built.join(', ')}]。每取一次：根換到尾巴、堆積少一格、根往下調整。取 ${k} 次後：**[${a.join(', ')}]**（後 ${k} 格已排好）。` };
    } });

  /* ---------- math：鄰接矩陣的次方＝走法數 ---------- */
  Gen.tpl({ id: 'walks', kp: 'dm-graph#1', also: 'la-systems#1', title: '綜合：用矩陣次方數走法', diff: 3, tags: ['圖', '矩陣'],
    draw(r) { const n = 4, E = new Set(); while (E.size < r.int(4, 6)) { const a = r.int(0, 3), b = r.int(0, 3); if (a !== b) E.add(Math.min(a, b) * 4 + Math.max(a, b)); } return { E: [...E].map(x => [Math.floor(x / 4), x % 4]), k: r.int(2, 4), i: r.int(0, 3), j: r.int(0, 3) }; },
    build({ E, k, i, j }) {
      const A = range(4).map(a => range(4).map(b => (E.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a)) ? 1 : 0)));
      let P = A; for (let t = 1; t < k; t++) P = P.map((row, a) => range(4).map(b => row.reduce((s, x, c) => s + x * A[c][b], 0)));
      let cnt = 0; const walk = (u, d) => { if (d === k) { if (u === j) cnt++; return; } for (let v = 0; v < 4; v++) if (A[u][v]) walk(v, d + 1); }; walk(i, 0); must(cnt === P[i][j], '走法');
      return { type: 'fill', stem: `無向圖 4 個點 1～4，邊：${E.map(([a, b]) => `${a + 1}-${b + 1}`).join('、')}。從 ${i + 1} 走 ${k} 步（可以重複走點和邊）到 ${j + 1}，有幾種走法？`, ans: [cnt],
        expl: `鄰接矩陣 $A=${GU.tex(A)}$，走法數 $=(A^{${k}})_{${i + 1}${j + 1}}$。$A^{${k}}=${GU.tex(P)}$，答案 **${cnt}**。` };
    } });

  /* ---------- math：遞迴關係用矩陣次方 ---------- */
  Gen.tpl({ id: 'recmat', kp: 'dm-recur-gf#2', also: 'la-eigen#3', title: '綜合：遞迴關係寫成矩陣', diff: 3, tags: ['遞迴', '特徵值'],
    draw(r) { return { p: r.int(1, 4), q: r.int(1, 6), a0: r.int(0, 3), a1: r.int(1, 4), n: r.int(5, 8) }; },
    build({ p, q, a0, a1, n }) {
      const a = [a0, a1]; for (let i = 2; i <= n; i++) a.push(p * a[i - 1] + q * a[i - 2]); const disc = p * p + 4 * q, rt = Math.sqrt(disc);
      const nice = Number.isInteger(rt) && (p + rt) % 2 === 0;
      return { type: 'fill', stem: `$a_n=${p}a_{n-1}+${q}a_{n-2}$，$a_0=${a0}$、$a_1=${a1}$。寫成 $\\begin{bmatrix}a_n\\\\a_{n-1}\\end{bmatrix}=M\\begin{bmatrix}a_{n-1}\\\\a_{n-2}\\end{bmatrix}$。$a_{${n}}$ 是多少？`, ans: [a[n]],
        expl: `$M=\\begin{bmatrix}${p}&${q}\\\\1&0\\end{bmatrix}$，特徵方程式 $\\lambda^2-${p}\\lambda-${q}=0$${nice ? `，$\\lambda=${(p + rt) / 2},\\ ${(p - rt) / 2}$` : ''}。直接遞推：${a.map((x, i) => `a_${i}=${x}`).join('、')}，所以 $a_{${n}}=${a[n]}$。` };
    } });

  /* ---------- 所有題型補上 paper、tags ---------- */
  const TAGS = { os: '作業系統', co: '計算機結構', ds: '資料結構', al: '演算法', la: '線性代數', dm: '離散數學' };
  Gen.list.forEach(g => { g.paper = g.paper || PAPER[g.subject]; g.tags = g.tags || [TAGS[g.subject], g.title]; });
})();
