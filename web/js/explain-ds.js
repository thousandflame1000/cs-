/* 動畫講解：資料結構 */
'use strict';
(() => {
  const { def, C, PAL } = Explain;

  /* ============ Build-Heap 為什麼是 O(n) ============ */
  (() => {
    const LV = 4, NN = 15, TX = 30, TW = 630, Y0 = 78, DY = 122;
    const pos = i => { const l = Math.floor(Math.log2(i)), j = i - (1 << l); return [TX + (j + .5) * TW / (1 << l), Y0 + l * DY]; };
    const height = i => LV - 1 - Math.floor(Math.log2(i));
    // 每個內部節點的路線：先往右下一步，再一直往左下
    const route = v => { const r = [v]; if (2 * v > NN) return r; let c = 2 * v + 1; r.push(c); while (2 * c <= NN) { c = 2 * c; r.push(c); } return r; };
    const owner = {}; for (let v = 1; v <= NN; v++) { const r = route(v); for (let q = 1; q < r.length; q++) owner[r[q]] = v; }
    const col = v => PAL[(v * 3) % PAL.length];
    const rows = [[8, 0], [4, 1], [2, 2], [1, 3]];
    function tree(g, s, o = {}) {
      const { a } = s;
      for (let i = 2; i <= NN; i++) { const [x, y] = pos(i), [px, py] = pos(i >> 1); g.line(px, py, x, y, { color: C.faint, w: 2.5, u: g.E.out(g.seg(a(0), Math.floor(Math.log2(i)) * .22, Math.floor(Math.log2(i)) * .22 + .4)) }); }
      for (let i = 1; i <= NN; i++) {
        const [x, y] = pos(i), h = height(i), lv = LV - 1 - h, sc = g.E.back(g.seg(a(0), lv * .22, lv * .22 + .35));
        let stroke = C.dim, fill = '#17213a', color = C.ink;
        if (h === 0 && a(1) > 0) { stroke = g.lerp(0, 1, a(1)) > .5 ? '#3a4766' : C.dim; color = a(1) > .5 ? '#6f7c9c' : C.ink; }
        if (o.hl && o.hl(i)) { stroke = o.hl(i); }
        g.node(x, y, h === 0 ? 22 : 26, o.label ? o.label(i) : h, { stroke, fill, color, scale: sc, size: 23, glow: o.hl && o.hl(i) ? 12 : 0, lw: 3 });
      }
    }
    function routePts(v) { return route(v).map(pos); }
    function tally(g, s, show, opts = {}) {
      const x0 = 682, y0 = 100;
      g.text('高度', x0 + 4, y0 - 46, { size: 19, color: C.dim, align: 'left' }); g.text('個數 × 最多走幾步', x0 + 70, y0 - 46, { size: 19, color: C.dim, align: 'left' });
      rows.forEach(([n, h], r) => {
        const al = show[r]; if (al <= 0) return; const y = y0 + r * 56;
        g.alpha(al, () => {
          g.text(String(h), x0 + 18, y, { size: 26, weight: 700, color: h === 0 ? C.dim : C.soft });
          g.math(`${n} \\times ${h}`, x0 + 70, y, { size: 32, align: 'left', color: h === 0 ? C.dim : C.ink });
          g.math(`= ${n * h}`, x0 + 178, y, { size: 32, align: 'left', color: h === 0 ? C.dim : C.amber });
        });
      });
      if (opts.sum > 0) g.alpha(opts.sum, () => { g.line(x0, y0 + 4 * 56 - 24, x0 + 256, y0 + 4 * 56 - 24, { color: C.faint, w: 2 }); g.text('合計', x0 + 4, y0 + 4 * 56 + 10, { size: 24, color: C.soft, align: 'left' }); g.math('11', x0 + 200, y0 + 4 * 56 + 10, { size: 38, color: C.amber, align: 'left' }); });
      if (opts.vs > 0) g.alpha(opts.vs, () => { g.chip('節點有 15 個', x0 + 128, y0 + 4 * 56 + 70, { size: 22, color: C.teal, stroke: C.teal + '88' }); });
    }
    def({
      id: 'x-buildheap', lesson: 'ds-heap', subject: 'ds', title: 'Build-Heap 為什麼只要 O(n)',
      take: '矮的節點多、只走一兩步；高的節點少，就算走得遠也加不多。每條路線都不共用邊，所以總步數 $\\le n-1$。',
      steps: [
        { dur: 2.6, cap: '建 heap：**由下往上**，把每個節點往下沉到對的位置。總共要走幾步？', say: '建 heap 的做法是：由下往上，把每個節點往下沉到正確的位置。問題是，這樣總共要走幾步？' },
        { dur: 1.6, cap: '最底層 8 個是葉子：沒有小孩，**一步都不用走**。整棵樹有一半是葉子', say: '先看最底下一層。這 8 個是葉子，沒有小孩，一步都不用走。整棵樹有一半都是葉子。' },
        { dur: 2.2, cap: '上一層 4 個：每個最多往下沉 **1** 層', say: '上一層有 4 個節點，每個最多往下沉一層。' },
        { dur: 2.8, cap: '再上一層 2 個最多沉 **2** 層；根只有 1 個，最多沉 **3** 層', say: '再上一層只有 2 個，最多沉兩層。最上面的根只有 1 個，最多沉三層。' },
        { dur: 1.4, cap: '越高的節點走得越遠，但越高的節點越少', say: '越高的節點要走越遠，可是越高的節點越少。', ask: { q: '全部加起來，最多要走幾步？', opts: ['11 步：比節點數 15 還少', '大約 15 × 3 = 45 步', '大約 15 × 15 = 225 步'], ans: 0, why: '4×1 + 2×2 + 1×3 = 11。走得遠的人很少，走得近的人很多。' } },
        { dur: 2.2, cap: '加起來 $4\\cdot1+2\\cdot2+1\\cdot3=11$，比節點數 $n=15$ 還少', say: '四乘一，加二乘二，加一乘三，一共 11 步，比節點數 15 還少。' },
        { dur: 3.6, cap: '為什麼**一定** $\\le n$？把每條路線畫成「先往右下一步，再一路往左下」——**沒有兩條路共用同一條邊**', say: '為什麼一定不會超過 n？把每個節點的路線畫成：先往右下走一步，再一路往左下走到底。你看，這些彩色的路線，沒有任何兩條共用同一條邊。' },
        { dur: 2.4, cap: '每條邊最多被一條路線用到，而樹只有 $n-1$ 條邊 → 總步數 $\\le n-1$，所以是 $O(n)$', say: '每條邊最多被一條路線用到，而整棵樹只有 n 減 1 條邊。所以總步數一定不超過 n 減 1，Build-Heap 就是 O(n)。' },
        { dur: 3.2, cap: '對照：一個一個 insert 是往**上**浮。偏偏多數節點在最底層，每個都可能爬到頂 → $\\Theta(n\\lg n)$', say: '對照一下：如果一個一個插入，新元素是從底下往上浮。偏偏大多數節點都在最底層，每一個都可能爬到最上面，加起來就是 n log n。' },
      ],
      draw(g, s) {
        const { k, a, u } = s;
        const routeOn = v => { const h = height(v); if (h === 1) return a(2); if (h >= 2) return g.seg(a(3), h === 2 ? 0 : .5, h === 2 ? .5 : 1); return 0; };
        // 下沉路線（第 2–5 步：最短路線；第 6 步起：彩色、不重疊）
        if (k <= 7) {
          for (let v = 1; v <= 7; v++) {
            const r = routePts(v), on = routeOn(v); if (on <= 0) continue;
            const c = k >= 6 ? col(v) : C.amber, w = k >= 6 ? 8 : 5;
            if (k === 6) { const sv = g.seg(a(6), (v - 1) / 7, v / 7); if (sv <= 0) { g.path(routePts(v), { color: C.amber, w: 4, alpha: .35 }); continue; } g.path(routePts(v), { color: c, w, u: g.E.out(sv), glow: 10 }); continue; }
            const pts = r.map(([x, y], i) => [x + (k >= 6 ? 0 : 0), y]);
            g.path(pts, { color: c, w, u: g.E.out(on), alpha: k >= 6 ? g.lerp(.75, 1, a(6)) : .8, glow: k >= 6 ? 8 * a(6) : 0 });
          }
        }
        if (k >= 6 && k <= 7) { // 沒被用到的邊標出來
          for (let i = 2; i <= NN; i++) if (!owner[i]) { const [x, y] = pos(i), [px, py] = pos(i >> 1); g.line(px, py, x, y, { color: '#7d89a8', w: 3, dash: [6, 7], alpha: k === 7 ? 1 : g.seg(a(6), .9, 1) }); }
        }
        if (k === 8) { // 往上浮
          for (let i = 2; i <= NN; i++) { const d = Math.floor(Math.log2(i)), [x, y] = pos(i), [rx, ry] = pos(1); const pth = []; let c = i; while (c >= 1) { pth.push(pos(c)); c >>= 1; } g.path(pth, { color: C.coral, w: 3 + (d === 3 ? 1 : 0), u: g.E.out(g.seg(u, (3 - d) * .12, (3 - d) * .12 + .55)), alpha: .55 }); }
        }
        tree(g, s, { label: i => (k >= 8 ? '' : height(i)), hl: k >= 6 && k <= 7 ? (i => owner[i] || (i <= 7 && height(i) > 0) ? col(owner[i] && i > 1 ? owner[i] : i) : null) : null });
        if (k >= 8) for (let i = 1; i <= NN; i++) { const [x, y] = pos(i); g.text(String(Math.floor(Math.log2(i))), x, y + 1, { size: 18, weight: 700, color: C.coral, alpha: a(8) }); }
        // 右邊計數
        if (k < 8) {
          tally(g, s, [a(1), a(2), g.seg(a(3), 0, .5), g.seg(a(3), .5, 1)], { sum: a(5), vs: a(5) });
          if (k >= 7) g.alpha(a(7), () => { g.rect(668, 404, 280, 116, { fill: 'rgba(12,18,32,.96)', stroke: C.teal + '99', r: 14 }); g.text('用到的邊：11 條', 808, 438, { size: 24, color: C.ink }); g.text('全部的邊：14 條', 808, 482, { size: 24, color: C.teal }); });
        } else {
          g.alpha(a(8), () => {
            const x0 = 676; g.text('逐一 insert：往上爬幾層', x0 + 120, 64, { size: 18, color: C.dim });
            [[8, 3], [4, 2], [2, 1], [1, 0]].forEach(([n, h], r) => { const y = 108 + r * 52; g.math(`${n} \\times ${h} = ${n * h}`, x0 + 120, y, { size: 26, color: r === 0 ? C.coral : C.ink }); });
            g.line(x0, 108 + 4 * 52 - 22, x0 + 250, 108 + 4 * 52 - 22, { color: C.faint, w: 2 });
            g.math('34', x0 + 120, 108 + 4 * 52 + 10, { size: 32, color: C.coral });
            g.text('最多的那一層，偏偏走最遠', x0 + 120, 108 + 4 * 52 + 60, { size: 18, color: C.soft });
          });
        }
      },
      play: {
        params: [{ id: 'L', label: '樹有幾層', min: 2, max: 8, value: 5 }],
        draw(g, p) {
          const L = p.L, n = (1 << L) - 1, TWd = 600, x0 = 30, top = 50, dy = Math.min(70, 380 / (L - 1));
          const P = i => { const l = Math.floor(Math.log2(i)), j = i - (1 << l); return [x0 + (j + .5) * TWd / (1 << l), top + l * dy]; };
          for (let i = 2; i <= n; i++) { const [x, y] = P(i), [px, py] = P(i >> 1); g.line(px, py, x, y, { color: C.faint, w: 1.5 }); }
          for (let i = 1; i <= n; i++) { const [x, y] = P(i), h = L - 1 - Math.floor(Math.log2(i)); g.circle(x, y, Math.max(2.5, Math.min(12, 260 / (1 << (L - 1)))), { fill: h === 0 ? '#3a4766' : PAL[h % PAL.length] }); }
          let down = 0, up = 0; for (let i = 1; i <= n; i++) { down += L - 1 - Math.floor(Math.log2(i)); up += Math.floor(Math.log2(i)); }
          const mx = Math.max(up, n), bx = 690, bw = 230, by = 120;
          [['Build-Heap（往下沉）', down, C.teal], ['節點數 n', n, C.dim], ['逐一 insert（往上浮）', up, C.coral]].forEach(([t, v, c], r) => { const y = by + r * 110; g.text(t, bx, y, { size: 18, align: 'left', color: C.soft }); g.rect(bx, y + 18, Math.max(3, bw * v / mx), 30, { fill: c, r: 6 }); g.text(String(v), bx + Math.max(3, bw * v / mx) + 8, y + 33, { size: 20, align: 'left', weight: 700, color: c }); });
        },
        note(p) { const L = p.L, n = (1 << L) - 1; let d = 0, u = 0; for (let i = 1; i <= n; i++) { d += L - 1 - Math.floor(Math.log2(i)); u += Math.floor(Math.log2(i)); } return `$n=${n}$：往下沉總共 **${d}** 步（$\\le n-1=${n - 1}$），逐一插入最多 **${u}** 步，約是 $n\\lg n$ 的 ${(u / (n * Math.log2(n + 1))).toFixed(2)} 倍。層數越多，兩者差越大。`; },
      },
    });
  })();

  /* ============ 動態陣列：加倍搬家為什麼平均 O(1) ============ */
  (() => {
    const CW = 46, X0 = 60;
    def({
      id: 'x-doubling', lesson: 'ds-amortized', subject: 'ds', title: '滿了就加倍：為什麼平均每次 O(1)',
      take: '每次插入多收 2 塊錢存在新元素身上；表滿時，後半段存的錢剛好付搬家費。加倍讓「搬家」越來越少見。',
      steps: [
        { dur: 3.2, cap: '陣列滿了就換一個**兩倍大**的，把舊的全部搬過去。搬家很貴：一次要搬 $n$ 個', say: '陣列滿了，就換一個兩倍大的陣列，把舊的全部搬過去。搬家很貴，一次要搬 n 個。' },
        { dur: 2.4, cap: '把每次插入的成本畫成柱子：多數是 1，偶爾冒出一根高的', say: '把每一次插入的成本畫成柱子。大部分只要 1，偶爾冒出一根很高的。' },
        { dur: 2.6, cap: '高柱子越來越高，但也越來越**稀疏**：在 1、2、4、8、16… 才出現', say: '高的柱子越來越高，但出現得也越來越少，只在 1、2、4、8、16 的時候才出現。' },
        { dur: 1.2, cap: '換個看法：**每次插入收 3 塊錢**', say: '換一個看法，每次插入都收 3 塊錢。', ask: { q: '1 塊付「放進去」。剩下 2 塊存在新元素身上。表滿的時候，存的錢夠不夠付搬家？', opts: ['剛好夠', '不夠，差一點', '多很多'], ans: 0, why: '容量 8 滿了的時候，第 5～8 個元素各存了 2 塊，共 8 塊，剛好搬 8 個。' } },
        { dur: 3.2, cap: '容量 4 → 8 之後，第 5～8 個元素每個身上存 **2 塊**', say: '從容量 4 變成 8 之後，每放一個新元素，就在它身上存 2 塊錢。' },
        { dur: 3.4, cap: '滿了要搬 8 個：後半段 4 個人 × 2 塊 = **8 塊**，剛好付清', say: '滿了要搬 8 個。後半段 4 個元素，每個 2 塊，一共 8 塊，剛好付清搬家費。' },
        { dur: 3, cap: '所以總成本 $\\le 3n$，平均每次 $\\le 3$：這就是**攤銷** $O(1)$', say: '所以不管插入幾次，總成本都不超過 3n，平均每次不超過 3。這就叫攤銷 O(1)。' },
        { dur: 3.4, cap: '如果改成「滿了只多加 2 格」：搬家次數變成 $n/2$ 次，總成本變成三角形面積 $\\Theta(n^2)$', say: '如果改成滿了只多加兩格呢？搬家會變得非常頻繁，總成本變成一個三角形的面積，是 n 平方。' },
      ],
      draw(g, s) {
        const { k, a, u } = s;
        if (k === 0) {
          const cap = 4, fill = 4, mv = g.E.io(g.seg(u, .35, .9));
          for (let i = 0; i < cap; i++) g.rect(X0 + i * CW, 150, CW - 6, CW - 6, { stroke: C.faint, fill: '#141d33' });
          for (let i = 0; i < 8; i++) g.rect(X0 + i * CW, 300, CW - 6, CW - 6, { stroke: C.faint, fill: '#141d33', alpha: g.seg(u, .15, .35) });
          for (let i = 0; i < fill; i++) { const x = X0 + i * CW, y = g.lerp(150, 300, mv); g.rect(x + 4, y + 4, CW - 14, CW - 14, { fill: C.teal, r: 6 }); g.text(String(i + 1), x + CW / 2 - 3, y + CW / 2 - 3, { size: 18, weight: 700, color: '#08221d' }); }
          g.text('容量 4（滿了）', X0, 128, { size: 18, align: 'left', color: C.dim }); g.text('換成容量 8', X0, 278, { size: 18, align: 'left', color: C.dim, alpha: g.seg(u, .15, .35) });
          g.alpha(g.seg(u, .5, .9), () => g.chip('搬 4 個', X0 + 4 * CW + 90, 240, { color: C.coral, stroke: C.coral + '88' }));
          return;
        }
        // 柱狀圖：第 i 次插入的成本
        const NI = k >= 7 ? 24 : 32, bx = 60, bw = 820 / NI, base = 470, unit = k >= 7 ? 11 : 11;
        const cost = i => (k >= 7 ? (i > 2 && (i - 1) % 2 === 0 ? i : 1) : ((i > 1 && ((i - 1) & (i - 2)) === 0) ? i : 1));
        const show = k === 1 ? g.E.out(u) : 1;
        g.line(bx - 10, base, bx + 830, base, { color: C.faint, w: 2 });
        for (let i = 1; i <= NI; i++) {
          if ((i - 1) / NI > show) break; const c = cost(i), x = bx + (i - 1) * bw;
          const big = c > 1; const hgt = c * unit; const col = big ? (k >= 7 ? C.coral : C.amber) : C.teal;
          g.rect(x + 2, base - hgt, bw - 4, hgt, { fill: col, r: 3, alpha: k === 2 && !big ? .45 : 1, glow: big && k === 2 ? 10 * a(2) : 0 });
          if (big && (k === 2 || k >= 7) && i < NI) g.text(String(c - 1), x + bw / 2, base - hgt - 14, { size: 15, color: col, alpha: k === 2 ? a(2) : a(7) });
        }
        g.text('第幾次插入 →', bx + 830, base + 22, { size: 15, color: C.dim, align: 'right' });
        g.text('這一次的成本', bx - 10, 100, { size: 15, color: C.dim, align: 'left' });
        if (k >= 3 && k <= 6) {
          // 錢的看法：容量 8 的表
          g.rect(0, 0, 960, 540, { fill: 'rgba(12,18,32,' + (.9 * Math.min(1, a(3) * 2)) + ')', r: 0 });
          const tx = 210, ty = 230;
          for (let i = 0; i < 8; i++) g.rect(tx + i * 66, ty, 60, 60, { stroke: C.faint, fill: '#141d33', r: 8, alpha: a(3) });
          const nfill = k === 3 ? 4 : k === 4 ? 4 + Math.min(4, Math.floor(u * 4.99)) : 8;
          for (let i = 0; i < nfill; i++) { const x = tx + i * 66; g.rect(x + 6, ty + 6, 48, 48, { fill: i < 4 ? '#2a6f66' : C.teal, r: 7, alpha: a(3) }); g.text(String(i + 1), x + 30, ty + 30, { size: 20, weight: 800, color: '#08221d', alpha: a(3) }); }
          g.text('容量 8', tx, ty - 26, { size: 18, align: 'left', color: C.dim, alpha: a(3) });
          // 新元素身上的錢
          const coins = i => i >= 4 && i < nfill;
          const pay = k >= 5 ? g.E.io(g.seg(u, .2, .85)) : 0;
          for (let i = 4; i < 8; i++) if (coins(i)) for (let c = 0; c < 2; c++) {
            const sx = tx + i * 66 + 18 + c * 24, sy = ty - 18;
            const tgt = (i - 4) * 2 + c, dx = tx + tgt * 66 + 30, dy = ty + 108;
            const x = g.lerp(sx, dx, pay), y = g.lerp(sy, dy, pay) - Math.sin(Math.PI * pay) * 60;
            g.circle(x, y, 11, { fill: C.amber, stroke: '#7a5a10', lw: 2 }); g.text('$', x, y + 1, { size: 13, weight: 800, color: '#3a2a00' });
          }
          if (k >= 5) { for (let i = 0; i < 8; i++) g.alpha(g.seg(u, .75, 1), () => { g.text('搬', tx + i * 66 + 30, ty + 140, { size: 15, color: C.amber }); }); g.alpha(g.seg(u, .8, 1), () => g.chip('8 塊錢付 8 次搬家 ✓', 480, 440, { color: C.green, stroke: C.green + '88', size: 22 })); }
          if (k === 4) g.alpha(a(4), () => g.text('每次插入收 3 塊：1 塊放進去，2 塊存在自己身上', 480, 140, { size: 22, color: C.soft }));
          if (k === 3) g.text('每次插入收 3 塊', 480, 140, { size: 26, color: C.amber, alpha: a(3) });
        }
        if (k === 6) {
          // 總成本線 vs 3n
          const px = i => bx + (i - .5) * bw; let tot = 0; const pts = [], ref = [];
          for (let i = 1; i <= NI; i++) { tot += cost(i); pts.push([px(i), base - tot * 2.6]); ref.push([px(i), base - 3 * i * 2.6]); }
          g.path(ref, { color: C.green, w: 3, dash: [8, 6], u: g.E.out(u) }); g.path(pts, { color: C.ink, w: 3, u: g.E.out(u) });
          g.text('3n', px(NI) + 18, base - 3 * NI * 2.6, { size: 22, italic: true, color: C.green, alpha: a(6) }); g.text('累積總成本', px(NI) - 40, base - tot * 2.6 + 30, { size: 17, color: C.ink, alpha: a(6) });
        }
        if (k === 7) {
          let tot = 0, pts = []; for (let i = 1; i <= NI; i++) { tot += cost(i); pts.push([bx + (i - .5) * bw, base - tot * 1.1]); }
          g.path(pts, { color: C.coral, w: 3, u: g.E.out(g.seg(u, .4, 1)) });
          g.alpha(g.seg(u, .55, 1), () => { g.poly([[bx, base], [bx + 820, base], [bx + 820, base - 820 * .45]], { fill: 'rgba(255,107,139,.12)' }); g.text('搬家成本 ≈ 三角形面積 ∝ n²', 600, 160, { size: 22, color: C.coral }); });
          g.text('每次只多 2 格：每隔一次就要搬家', 480, 80, { size: 22, color: C.soft, alpha: a(7) });
        }
      },
      play: {
        params: [{ id: 'mode', type: 'choice', label: '滿了之後', value: 'x2', options: [['x2', '×2'], ['x1.5', '×1.5'], ['x3', '×3'], ['p4', '+4 格'], ['p16', '+16 格']] }, { id: 'n', label: '插入幾次 $n$', min: 16, max: 400, step: 4, value: 120 }],
        sim(p) { let cap = 1, size = 0, tot = 0; const per = []; for (let i = 1; i <= p.n; i++) { let c = 1; if (size === cap) { c += size; const m = p.mode; cap = m[0] === 'x' ? Math.max(cap + 1, Math.ceil(cap * parseFloat(m.slice(1)))) : cap + parseInt(m.slice(1)); } size++; tot += c; per.push(tot); } return per; },
        draw(g, p) {
          const per = this.sim(p), n = p.n, x0 = 70, y0 = 470, w = 820, h = 390, mx = Math.max(per[n - 1], 3 * n);
          g.line(x0, y0, x0 + w, y0, { color: C.faint }); g.line(x0, y0, x0, y0 - h, { color: C.faint });
          g.path([[x0, y0], [x0 + w, y0 - h * 3 * n / mx]], { color: C.green, w: 2.5, dash: [8, 6] }); g.text('3n', x0 + w + 8, y0 - h * 3 * n / mx, { size: 20, italic: true, color: C.green, align: 'left' });
          g.path(per.map((v, i) => [x0 + w * (i + 1) / n, y0 - h * v / mx]), { color: p.mode[0] === 'x' ? C.teal : C.coral, w: 3 });
          g.text('累積總成本', x0 + 6, y0 - h - 14, { size: 16, color: C.dim, align: 'left' }); g.text('插入次數', x0 + w, y0 + 22, { size: 16, color: C.dim, align: 'right' });
        },
        note(p) { const per = this.sim(p), t = per[p.n - 1]; return `插入 $${p.n}$ 次，總成本 **${t}**，平均每次 **${(t / p.n).toFixed(2)}**。${p.mode[0] === 'x' ? '乘上固定倍數：平均是常數（倍數越小，常數越大）。' : '加固定格數：平均會跟著 $n$ 一起長，把 $n$ 拉大看看。'}`; },
      },
    });
  })();

  /* ============ 比較排序下界：問是非題 ============ */
  (() => {
    const perms = ['abc', 'acb', 'bac', 'bca', 'cab', 'cba'];
    const lt = (p, x, y) => p.indexOf(x) < p.indexOf(y);
    // 決策：先比 a<b；左邊再比 b<c；右邊比 a<c
    const L1 = perms.filter(p => lt(p, 'a', 'b')), R1 = perms.filter(p => !lt(p, 'a', 'b'));
    const LL = L1.filter(p => lt(p, 'b', 'c')), LR = L1.filter(p => !lt(p, 'b', 'c')), RL = R1.filter(p => lt(p, 'a', 'c')), RR = R1.filter(p => !lt(p, 'a', 'c'));
    const card = (g, x, y, p, o = {}) => { const { alpha = 1, color = C.ink, stroke = C.faint, w = 70 } = o; g.rect(x - w / 2, y - 18, w, 36, { fill: '#18223b', stroke, r: 8, alpha }); g.math(p.split('').join('\\,'), x, y, { size: 22, color, alpha }); };
    const fact = n => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
    def({
      id: 'x-sortbound', lesson: 'ds-sort', subject: 'ds', title: '比較排序為什麼不能比 n lg n 快',
      take: '每比一次只能把「還可能的排列」分成兩堆。$n!$ 種排列要分到每堆只剩一種，至少要比 $\\lg n!\\approx n\\lg n$ 次。',
      steps: [
        { dur: 2.4, cap: '3 個數 $a,b,c$ 有 $3!=6$ 種排法。排序＝找出是哪一種', say: '三個數 a、b、c，可能的大小順序有 6 種。排序，其實就是找出是哪一種。' },
        { dur: 2.6, cap: '只能「比大小」：問一次 $a<b$?，6 種被分成兩堆', say: '我們只能問比大小的問題。問一次 a 小於 b 嗎，6 種可能就被分成兩堆。' },
        { dur: 1.2, cap: '每一堆剩 3 種，還要再問', say: '每一堆還剩三種，還得再問。', ask: { q: '比 2 次之後，最多能分成幾堆？', opts: ['4 堆', '6 堆', '8 堆'], ans: 0, why: '每問一次，每一堆最多一分為二：2 次 → 最多 2×2 = 4 堆。' } },
        { dur: 3, cap: '比 2 次最多分成 4 堆，可是有 6 種排法 → **一定有一堆擠了 2 種**，還分不出來', say: '比兩次最多只能分成 4 堆，可是有 6 種排法。所以一定有一堆擠了兩種，還分不出來。' },
        { dur: 2.4, cap: '第 3 次比較，才把每堆分到只剩一種：3 個數最壞要比 **3** 次', say: '要第三次比較，才能把每一堆分到只剩一種。三個數，最壞要比三次。' },
        { dur: 3.4, cap: '一般：比 $h$ 次最多分出 $2^h$ 堆，要裝下 $n!$ 種 → $2^h\\ge n!$，$h\\ge\\lg n!$', say: '一般來說，比 h 次最多分出 2 的 h 次方堆。要裝得下 n 階乘種排法，h 至少要是 log n 階乘。' },
        { dur: 3.6, cap: '$n!$ 至少有一半的因數 $\\ge \\frac n2$ → $n!\\ge(\\frac n2)^{n/2}$ → $\\lg n!\\ge\\frac n2\\lg\\frac n2=\\Omega(n\\lg n)$', say: 'n 階乘裡，至少有一半的因數大於等於 n 除以 2。所以 log n 階乘，至少是 n 除以 2，乘上 log n 除以 2，就是 n log n 這個等級。' },
      ],
      draw(g, s) {
        const { k, a, u } = s;
        if (k <= 4) {
          const top = 70, rootX = 480;
          // 第 0 步：6 張卡排一排
          const split1 = a(1), split2 = k >= 3 ? a(3) : 0, split3 = a(4);
          if (k >= 1) { g.chip('a < b ?', rootX, top + 10, { math: true, size: 22, color: C.violet, stroke: C.violet + '99', alpha: split1 }); }
          const lx = 250, rx = 710, y1 = 210, y2 = 380;
          perms.forEach((p, i) => {
            let x = 160 + i * 128, y = top + 80, col = C.ink;
            if (k >= 1) { const L = L1.includes(p), idx = (L ? L1 : R1).indexOf(p); const tx = (L ? lx : rx) + (idx - 1) * 80; x = g.lerp(x, tx, g.E.io(split1)); y = g.lerp(y, y1, g.E.io(split1)); col = L ? C.teal : C.amber; }
            if (k >= 3) { const grp = [LL, LR, RL, RR].findIndex(G => G.includes(p)), G = [LL, LR, RL, RR][grp], idx = G.indexOf(p); const gx = [130, 370, 590, 830][grp] + (idx - (G.length - 1) / 2) * 78; x = g.lerp(x, gx, g.E.io(split2)); y = g.lerp(y, y2, g.E.io(split2)); }
            if (k >= 4) { const grp = [LL, LR, RL, RR].findIndex(G => G.includes(p)), G = [LL, LR, RL, RR][grp]; if (G.length === 2) { const idx = G.indexOf(p); x += (idx - .5) * 30 * split3; y = g.lerp(y, 480, g.E.io(split3) * 1); } }
            card(g, x, y, p, { color: col, stroke: k >= 3 && [LL, LR, RL, RR].find(G => G.includes(p)).length > 1 ? C.coral + (k === 3 ? 'cc' : '66') : C.faint });
          });
          if (k >= 1) { g.line(rootX, top + 28, lx, y1 - 30, { color: C.teal, w: 2, u: split1, alpha: .6 }); g.line(rootX, top + 28, rx, y1 - 30, { color: C.amber, w: 2, u: split1, alpha: .6 }); g.text('是', 340, 128, { size: 18, color: C.teal, alpha: split1 }); g.text('否', 620, 128, { size: 18, color: C.amber, alpha: split1 }); }
          if (k >= 3) {
            g.chip('b < c ?', lx, 270, { math: true, size: 20, color: C.violet, stroke: C.violet + '88', alpha: split2 }); g.chip('a < c ?', rx, 270, { math: true, size: 20, color: C.violet, stroke: C.violet + '88', alpha: split2 });
            [[lx, 130], [lx, 370], [rx, 590], [rx, 830]].forEach(([fx, tx]) => g.line(fx, 290, tx, y2 - 26, { color: C.dim, w: 1.5, u: split2, alpha: .6 }));
            if (k === 3) g.alpha(g.seg(u, .5, 1), () => { g.text('4 堆裝 6 種：這兩堆還分不出來', 480, 470, { size: 22, color: C.coral }); });
          }
          if (k >= 4) g.alpha(split3, () => { g.chip('第 3 次', 370, 432, { size: 16, color: C.violet }); g.chip('第 3 次', 590, 432, { size: 16, color: C.violet }); });
          return;
        }
        if (k === 5) {
          const bx = 120, base = 470, n = 8, logs = [];
          g.text('每多比一次，堆數 ×2（對數刻度）', 480, 60, { size: 20, color: C.soft });
          const ln = Math.log2(fact(n)); const sc = 380 / 16;
          g.line(bx - 20, base, 880, base, { color: C.faint });
          g.alpha(1, () => { g.line(bx - 20, base - ln * sc, 880, base - ln * sc, { color: C.coral, w: 2.5, dash: [8, 6] }); g.math('n! = 8! = 40320', 760, base - ln * sc - 22, { size: 22, color: C.coral }); });
          for (let h = 1; h <= 16; h++) { const x = bx + (h - 1) * 46, on = g.seg(u, (h - 1) / 18, h / 18 + .02); const hh = h * sc * g.E.out(on); g.rect(x, base - hh, 34, hh, { fill: h >= Math.ceil(ln) ? C.green : C.violet, r: 4, alpha: on > 0 ? 1 : 0 }); g.text(String(h), x + 17, base + 18, { size: 14, color: C.dim, alpha: on }); }
          g.math('2^h', bx - 50, base - 200, { size: 24, color: C.violet, alpha: u });
          g.text('比 16 次才 ≥ 8!（lg 8! ≈ 15.3）', 480, 510, { size: 18, color: C.green, alpha: g.seg(u, .85, 1) });
          return;
        }
        if (k === 6) {
          const n = 10, bx = 120, base = 440, bw = 64;
          g.text('n! = 1 × 2 × … × n，看每一個因數', 480, 56, { size: 20, color: C.soft });
          for (let i = 1; i <= n; i++) { const x = bx + (i - 1) * (bw + 8), hh = i * 30 * g.E.out(g.seg(u, (i - 1) / 14, (i - 1) / 14 + .25)); const big = i > n / 2; g.rect(x, base - hh, bw, hh, { fill: big ? C.teal : '#34405f', r: 5 }); g.text(String(i), x + bw / 2, base + 20, { size: 18, color: C.dim }); }
          const half = base - (n / 2) * 30; g.alpha(g.seg(u, .55, .8), () => { g.line(bx - 10, half, bx + n * (bw + 8), half, { color: C.amber, w: 2.5, dash: [7, 6] }); g.math('n/2', bx - 40, half, { size: 22, color: C.amber }); });
          g.alpha(g.seg(u, .75, 1), () => g.text('右半邊 5 個因數都 ≥ n/2：連乘起來至少 (n/2)^(n/2)', 480, 500, { size: 20, color: C.teal }));
        }
      },
      play: {
        params: [{ id: 'n', label: '數字個數 $n$', min: 2, max: 14, value: 5 }],
        draw(g, p) {
          const n = p.n, ln = Math.log2(fact(n)), h = Math.ceil(ln), base = 470, x0 = 90, sc = 400 / Math.max(h + 2, 8);
          for (let i = 1; i <= h + 2; i++) { const x = x0 + (i - 1) * Math.min(56, 780 / (h + 2)); g.rect(x, base - i * sc, Math.min(44, 780 / (h + 2) - 8), i * sc, { fill: i >= h ? C.green : C.violet, r: 4, alpha: i > h ? .35 : 1 }); }
          g.line(x0 - 20, base - ln * sc, 900, base - ln * sc, { color: C.coral, w: 2.5, dash: [8, 6] }); g.text(`lg ${n}! ≈ ${ln.toFixed(1)}`, 900, base - ln * sc - 18, { size: 20, color: C.coral, align: 'right' });
          g.line(x0 - 20, base - n * Math.log2(n) * sc, 900, base - n * Math.log2(n) * sc, { color: C.amber, w: 1.5, dash: [3, 6], alpha: n * Math.log2(n) * sc < 460 ? 1 : 0 }); g.text(`n lg n ≈ ${(n * Math.log2(n)).toFixed(1)}`, 900, base - n * Math.log2(n) * sc + 18, { size: 16, color: C.amber, align: 'right', alpha: n * Math.log2(n) * sc < 460 ? 1 : 0 });
        },
        note(p) { const n = p.n, f = fact(n), h = Math.ceil(Math.log2(f)); return `$${n}!=${f.toLocaleString()}$ 種排列，比 $h$ 次最多分 $2^h$ 堆 → 最壞至少 **${h}** 次比較（$2^{${h}}=${Math.pow(2, h).toLocaleString()}$）。`; },
      },
    });
  })();

  /* ============ 線性探測為什麼會結塊 ============ */
  (() => {
    const M = 16, SX = 60, SW = 52, SY = 300;
    const seq = [3, 9, 4, 3, 13, 5, 4, 10, 3, 14, 6, 9];   // 雜湊值
    function place(n) { const t = Array(M).fill(-1), at = [], probes = []; for (let i = 0; i < n; i++) { let h = seq[i], c = 1; while (t[h] >= 0) { h = (h + 1) % M; c++; } t[h] = i; at.push(h); probes.push(c); } return { t, at, probes }; }
    def({
      id: 'x-probing', lesson: 'ds-hash', subject: 'ds', title: '線性探測：為什麼會越塞越慢',
      take: '一塊連續被佔的格子，會把「落在它任何一格」的新鍵都吸過來，所以大塊越長越快。$\\alpha$ 接近 1 時，平均探測次數會暴增。',
      steps: [
        { dur: 2.4, cap: '雜湊表 16 格。鍵算出位置 $h(k)$ 就丟進去', say: '這是一個 16 格的雜湊表。每個鍵算出一個位置，就丟進那一格。' },
        { dur: 3.4, cap: '撞到別人：**往右找下一個空格**（線性探測）', say: '如果那一格已經有人，就往右找下一個空格。這叫線性探測。' },
        { dur: 3, cap: '幾個鍵之後，出現一塊**連續被佔**的格子', say: '丟了幾個鍵之後，出現了一大塊連續被佔住的格子。' },
        { dur: 1.2, cap: '下一個鍵會落在哪？', say: '下一個鍵會落在哪裡？', ask: { q: '一塊 5 格長的連續區，和旁邊只有 1 格的小塊，哪個比較容易再變長？', opts: ['5 格的大塊', '1 格的小塊', '機會一樣'], ans: 0, why: '新鍵只要落在大塊的任何一格（或它右邊那一格），都會被推到大塊的尾巴。大塊的「吸力範圍」比較大。' } },
        { dur: 3.2, cap: '落在大塊任何一格的鍵，最後都**黏到它的尾巴** → 大的越來越大', say: '只要落在大塊裡任何一格，新鍵最後都會被推到它的尾巴，讓它再變長。大塊越來越大，這就是結塊。' },
        { dur: 3.4, cap: '代價：找空格要走過整塊。裝得越滿 $(\\alpha\\to1)$，平均探測次數暴增', say: '代價是，找空格要走過整塊。裝得越滿，平均要探測的次數就暴增。' },
      ],
      draw(g, s) {
        const { k, a, u } = s;
        const n = k === 0 ? 3 : k === 1 ? 6 : k <= 3 ? 9 : 12;
        const prevN = k === 0 ? 0 : k === 1 ? 3 : k === 2 ? 6 : k === 3 ? 9 : 9;
        const { t, at, probes } = place(Math.min(n, seq.length));
        for (let i = 0; i < M; i++) { g.rect(SX + i * SW, SY, SW - 6, SW - 6, { fill: '#141d33', stroke: C.faint, r: 7 }); g.text(String(i), SX + i * SW + SW / 2 - 3, SY + SW + 14, { size: 14, color: C.dim }); }
        // 結塊底色
        if (k >= 2 && k !== 5) { const occ = place(Math.min(k >= 4 ? 12 : 9, seq.length)).t; let i = 0; while (i < M) { if (occ[i] >= 0) { let j = i; while (j < M && occ[j] >= 0) j++; const len = j - i; if (len >= 3) g.rect(SX + i * SW - 4, SY - 8, len * SW - 2, SW + 10, { stroke: C.coral, lw: 2.5, r: 10, alpha: k === 2 ? a(2) : 1, glow: 10 }); i = j; } else i++; } }
        if (k === 3 || k === 4) { // 吸力範圍
          g.alpha(k === 3 ? 1 : 1, () => { for (let i = 3; i <= 8; i++) g.rect(SX + i * SW, SY - 70, SW - 6, 18, { fill: 'rgba(255,107,139,.35)', r: 5 }); g.text('落在這 6 格 → 都黏到大塊尾巴', SX + 5.5 * SW, SY - 92, { size: 18, color: C.coral }); });
        }
        for (let i = 0; i < Math.min(n, seq.length); i++) {
          const isNew = i >= prevN, lu = isNew ? g.seg(u, (i - prevN) / Math.max(1, n - prevN), (i - prevN + 1) / Math.max(1, n - prevN)) : 1;
          if (lu <= 0) continue; const h = seq[i], dst = at[i];
          let x, y; const drop = g.seg(lu, 0, .4), slide = g.seg(lu, .45, 1);
          const hx = SX + h * SW, dx = SX + dst * SW; x = g.lerp(hx, dx, g.E.io(slide)); y = g.lerp(150, SY, g.E.out(drop));
          const col = probes[i] > 1 ? C.amber : C.teal;
          g.rect(x + 5, y + 5, SW - 16, SW - 16, { fill: col, r: 6 }); g.text('k' + (i + 1), x + SW / 2 - 3, y + SW / 2 - 3, { size: 15, weight: 700, color: '#08221d' });
          if (isNew && lu < 1) { g.text(`h = ${h}`, hx + SW / 2, 120, { size: 16, color: C.soft, alpha: 1 - slide }); if (dst !== h) g.arrow(hx + SW / 2, SY - 20, dx + SW / 2, SY - 20, { color: C.amber, w: 2.5, u: slide, head: 10 }); }
        }
        if (k === 5) {
          g.rect(0, 0, 960, 540, { fill: 'rgba(12,18,32,.88)', r: 0, alpha: g.seg(u, 0, .2) });
          const x0 = 110, y0 = 470, w = 740, h = 370, ymax = 20;
          g.alpha(g.seg(u, .1, .3), () => { g.line(x0, y0, x0 + w, y0, { color: C.faint }); g.line(x0, y0, x0, y0 - h, { color: C.faint }); g.math('\\alpha', x0 + w + 16, y0, { size: 24, color: C.dim }); g.text('找不到時平均探測次數', x0, y0 - h - 16, { size: 16, color: C.dim, align: 'left' }); [.25, .5, .75, .9].forEach(v => g.text(String(v), x0 + w * v, y0 + 18, { size: 14, color: C.dim })); });
          const lp = [], ch = []; for (let i = 0; i <= 96; i++) { const al = i / 100; lp.push([x0 + w * al, y0 - h * Math.min(ymax, .5 * (1 + 1 / ((1 - al) * (1 - al)))) / ymax]); ch.push([x0 + w * al, y0 - h * (1 + al) / ymax]); }
          g.path(ch, { color: C.teal, w: 3, u: g.E.out(g.seg(u, .25, .7)) }); g.path(lp, { color: C.coral, w: 3.5, u: g.E.out(g.seg(u, .3, 1)) });
          g.text('鏈結法 1 + α', x0 + w * .55, y0 - h * 1.55 / ymax - 18, { size: 18, color: C.teal, alpha: g.seg(u, .6, .8) });
          g.text('線性探測 ½(1 + 1/(1−α)²)', x0 + w * .55, y0 - h * 13 / ymax, { size: 18, color: C.coral, alpha: g.seg(u, .8, 1) });
        }
      },
      play: {
        params: [{ id: 'al', label: '裝填率 $\\alpha$', min: .05, max: .95, step: .05, value: .6, fmt: v => v.toFixed(2) }, { id: 'go', type: 'button', label: '🎲 重新丟一次' }],
        run(p, S) {
          const key = p.al + ':' + (p.go || 0); if (S.key === key) return S.res; const m = 48, n = Math.round(p.al * m); let seed = 7 + (p.go || 0) * 101; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
          const t = Array(m).fill(0); let tot = 0; for (let i = 0; i < n; i++) { let h = Math.floor(r() * m), c = 1; while (t[h]) { h = (h + 1) % m; c++; } t[h] = 1; tot += c; }
          let uns = 0; for (let h = 0; h < m; h++) { let c = 1, x = h; while (t[x]) { x = (x + 1) % m; c++; } uns += c; }
          S.key = key; S.res = { t, m, n, avgIns: n ? tot / n : 0, avgUns: uns / m }; return S.res;
        },
        draw(g, p, T, S) {
          const R = this.run(p, S), cw = 820 / R.m; let i = 0;
          for (let x = 0; x < R.m; x++) g.rect(70 + x * cw, 200, cw - 3, 60, { fill: R.t[x] ? C.teal : '#141d33', stroke: C.faint, lw: 1, r: 3 });
          while (i < R.m) { if (R.t[i]) { let j = i; while (j < R.m && R.t[j]) j++; if (j - i >= 4) { g.rect(70 + i * cw - 2, 192, (j - i) * cw + 1, 76, { stroke: C.coral, lw: 2.5, r: 6 }); g.text(String(j - i), 70 + (i + j) / 2 * cw, 290, { size: 16, color: C.coral }); } i = j; } else i++; }
          g.text(`48 格裡放了 ${R.n} 個鍵（紅框：長度 ≥ 4 的結塊）`, 480, 150, { size: 20, color: C.soft });
          g.text(`找不到時平均要看 ${R.avgUns.toFixed(2)} 格`, 480, 360, { size: 26, weight: 700, color: C.amber });
          g.text(`理論值 ½(1 + 1/(1−α)²) = ${(.5 * (1 + 1 / Math.pow(1 - R.n / R.m, 2))).toFixed(2)}`, 480, 404, { size: 18, color: C.dim });
        },
        note(p) { return p.al >= .8 ? '超過 0.8 之後，塊和塊黏成一大片，一次找不到要走很遠。實務上線性探測會把 $\\alpha$ 控制在 0.5～0.7。' : '多按幾次「重新丟」：同樣的 $\\alpha$，結塊的樣子每次不同，但平均探測次數都差不多。'; },
      },
    });
  })();
})();
