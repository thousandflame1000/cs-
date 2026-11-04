/* 資工所衝刺站 — 動畫實驗室核心 + 資料結構／演算法動畫 */
'use strict';

const Labs = {
  list: [],
  live: [],
  reg(def) { this.list.push(def); },
  get(id) { return this.list.find(x => x.id === id); },
  stopAll() { this.live.forEach(p => p.stop && p.stop()); this.live = []; },
  mountEmbeds(root) {
    $$('.lab-embed', root).forEach(el => {
      const lab = this.get(el.dataset.lab); if (!lab) { el.remove(); return; }
      el.innerHTML = `<div class="lab-teaser" style="--sc:var(--s-${lab.subject})"><div><b>動畫：${esc(lab.title)}</b><span>${esc(lab.desc)}</span></div><button class="btn">展開動畫</button></div>`;
      $('button', el).onclick = () => { el.innerHTML = ''; this.mount(lab.id, el, el.dataset.params || ''); const L = S.day(); if (!L.labs.includes(lab.id)) { L.labs.push(lab.id); S.save(); } };
    });
  },
  mount(id, host, params = '', full = false) {
    const lab = this.get(id);
    const P = Object.fromEntries((params || '').split(/\s+/).filter(Boolean).map(kv => kv.split('=')));
    const box = h('div', { class: 'lab' + (full ? ' full' : '') });
    host.appendChild(box);
    if (lab.custom) { lab.custom(box, P); return; }
    const form = h('div', { class: 'lab-form' });
    for (const f of lab.form) {
      const fid = 'lf-' + id + '-' + f.id + '-' + Math.random().toString(36).slice(2, 6);
      let input;
      const val = P[f.id] != null ? decodeURIComponent(P[f.id]).replace(/_/g, ' ') : f.value;
      if (f.type === 'select') input = h('select', { id: fid, 'data-k': f.id }, ...f.options.map(([v, t]) => h('option', { value: v, selected: String(v) === String(val) }, t)));
      else if (f.type === 'check') input = h('input', { id: fid, type: 'checkbox', 'data-k': f.id, checked: val === true || val === 'true' });
      else if (f.type === 'area') input = h('textarea', { id: fid, rows: f.rows || 4, 'data-k': f.id }, val);
      else input = h('input', { id: fid, 'data-k': f.id, value: val, type: f.type === 'number' ? 'number' : 'text', size: f.size || 30 });
      form.appendChild(h('div', { class: 'lf ' + (f.wide ? 'wide' : '') }, h('label', { for: fid }, f.label), input));
    }
    const presets = lab.presets ? h('div', { class: 'lab-presets' }, '範例：', ...lab.presets.map(p => h('button', { class: 'btn sm', type: 'button', onclick: () => { for (const [k, v] of Object.entries(p.v)) { const el = $(`[data-k="${k}"]`, form); if (el) { if (el.type === 'checkbox') el.checked = v; else el.value = v; } } run(); } }, p.name))) : null;
    const runBtn = h('button', { class: 'btn primary', type: 'button' }, '套用並重播');
    form.appendChild(h('div', { class: 'lf' }, runBtn));
    const stage = h('div', { class: 'lab-stage' });
    const note = h('div', { class: 'lab-note', 'aria-live': 'polite' });
    const ctrl = h('div', { class: 'lab-ctrl' });
    box.append(form); if (presets) box.append(presets); box.append(ctrl, note, stage);
    const read = () => Object.fromEntries($$('[data-k]', form).map(el => [el.dataset.k, el.type === 'checkbox' ? el.checked : el.value]));
    let player = null;
    const run = () => {
      let frames;
      try { frames = lab.build(read()); } catch (e) { note.innerHTML = `<span class="bad-t">輸入有誤：${esc(e.message)}</span>`; stage.innerHTML = ''; return; }
      if (player) player.stop();
      player = makePlayer(ctrl, note, stage, frames, lab.render);
      this.live.push(player);
    };
    runBtn.onclick = run;
    run();
  },
};

function makePlayer(ctrl, note, stage, frames, render) {
  let i = 0, timer = null, speed = 900;
  ctrl.innerHTML = `<button class="btn sm" data-a="first" aria-label="第一步">⏮</button><button class="btn sm" data-a="prev" aria-label="上一步">◀ 上一步</button><button class="btn sm primary" data-a="play">▶ 播放</button><button class="btn sm" data-a="next" aria-label="下一步">下一步 ▶</button><button class="btn sm" data-a="last" aria-label="最後">⏭</button>
    <label class="spd">速度<input type="range" min="150" max="2000" step="50" value="${2150 - speed}" aria-label="速度"></label><span class="stepc"></span>`;
  const show = () => {
    const f = frames[i];
    note.innerHTML = f.note ? md(f.note) : '';
    render(f, stage);
    $('.stepc', ctrl).textContent = `步驟 ${i + 1} / ${frames.length}`;
  };
  const stop = () => { clearInterval(timer); timer = null; const b = $('[data-a="play"]', ctrl); if (b) b.textContent = '▶ 播放'; };
  const play = () => {
    if (timer) return stop();
    if (i >= frames.length - 1) i = 0;
    $('[data-a="play"]', ctrl).textContent = '⏸ 暫停';
    timer = setInterval(() => { if (i < frames.length - 1) { i++; show(); } else stop(); }, speed);
  };
  ctrl.onclick = e => {
    const a = e.target.closest('[data-a]'); if (!a) return;
    const act = a.dataset.a;
    if (act === 'play') return play();
    stop();
    if (act === 'first') i = 0; if (act === 'last') i = frames.length - 1;
    if (act === 'prev') i = Math.max(0, i - 1); if (act === 'next') i = Math.min(frames.length - 1, i + 1);
    show();
  };
  $('input[type=range]', ctrl).oninput = e => { speed = 2150 - +e.target.value; if (timer) { stop(); play(); } };
  show();
  return { stop };
}

/* ---------- shared parsing ---------- */
function nums(s) { const a = String(s).split(/[\s,，;]+/).filter(Boolean).map(Number); if (a.some(isNaN)) throw new Error('請輸入以逗號或空白分隔的數字'); return a; }
function matrix(s) { return String(s).trim().split(/\n|;/).map(r => r.trim()).filter(Boolean).map(r => nums(r)); }

/* ---------- SVG helpers ---------- */
function svgTree(root, opt = {}) {
  if (!root) return '<p class="muted">（空樹）</p>';
  const nodes = []; let idx = 0, maxD = 0;
  (function walk(n, d) { if (!n) return; walk(n.l, d + 1); n._x = idx++; n._d = d; maxD = Math.max(maxD, d); nodes.push(n); walk(n.r, d + 1); })(root, 0);
  const W = Math.max(320, idx * 46 + 20), H = (maxD + 1) * 62 + 20;
  const X = n => 30 + n._x * 46, Y = n => 28 + n._d * 62;
  const hl = new Set(opt.hl || []), hl2 = new Set(opt.hl2 || []);
  let e = '', v = '';
  for (const n of nodes) for (const c of [n.l, n.r]) if (c) e += `<line x1="${X(n)}" y1="${Y(n)}" x2="${X(c)}" y2="${Y(c)}" class="edge"/>`;
  for (const n of nodes) {
    const cls = ['node', n.c === 'R' ? 'red' : n.c === 'B' ? 'black' : '', hl.has(n.k) ? 'hl' : '', hl2.has(n.k) ? 'hl2' : ''].join(' ');
    v += `<g class="${cls}"><circle cx="${X(n)}" cy="${Y(n)}" r="17"/><text x="${X(n)}" y="${Y(n) + 5}">${n.k}</text>${opt.sub ? `<text class="sub" x="${X(n)}" y="${Y(n) + 32}">${opt.sub(n)}</text>` : ''}</g>`;
  }
  return `<div class="svgwrap"><svg viewBox="0 0 ${W} ${H + (opt.sub ? 14 : 0)}" width="${W}" height="${H + (opt.sub ? 14 : 0)}" class="tree" role="img" aria-label="樹">${e}${v}</svg></div>`;
}
function svgArray(arr, opt = {}) {
  const w = 40, W = arr.length * w + 10;
  const cls = k => (opt.cls && opt.cls(k)) || '';
  return `<div class="svgwrap"><svg viewBox="0 0 ${W} 58" width="${W}" height="58" class="arr">${arr.map((x, k) => `<g class="cell ${cls(k)}"><rect x="${5 + k * w}" y="6" width="${w - 2}" height="32" rx="4"/><text x="${5 + k * w + (w - 2) / 2}" y="27">${x == null ? '' : x}</text><text class="idx" x="${5 + k * w + (w - 2) / 2}" y="52">${(opt.base ?? 0) + k}</text></g>`).join('')}</svg></div>`;
}
function svgBars(arr, opt = {}) {
  const n = arr.length, w = Math.max(14, Math.min(40, Math.floor(640 / n))), W = n * w + 10, max = Math.max(...arr, 1), H = 180;
  return `<div class="svgwrap"><svg viewBox="0 0 ${W} ${H + 24}" width="${W}" height="${H + 24}" class="bars">${arr.map((x, k) => { const bh = Math.max(3, x / max * H); return `<g class="bar ${(opt.cls && opt.cls(k)) || ''}"><rect x="${5 + k * w}" y="${H - bh}" width="${w - 3}" height="${bh}" rx="2"/><text x="${5 + k * w + (w - 3) / 2}" y="${H + 16}">${x}</text></g>`; }).join('')}</svg></div>`;
}
function htmlTable(rows, opt = {}) {
  return `<div class="tbl"><table class="lab-tbl">${opt.head ? `<thead><tr>${opt.head.map(c => `<th>${c}</th>`).join('')}</tr></thead>` : ''}<tbody>${rows.map((r, i) => `<tr>${r.map((c, j) => `<td class="${(opt.cls && opt.cls(i, j)) || ''}">${c == null ? '' : c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

/* =================== 排序 =================== */
const SortSim = {
  run(arr0, alg) {
    const a = arr0.slice(), F = [], sorted = new Set(); let cmp = 0, mov = 0;
    const snap = (note, hl = {}) => F.push({ a: a.slice(), note: note + `　｜比較 ${cmp} 次、交換／搬移 ${mov} 次`, hl, sorted: new Set(sorted) });
    snap('初始陣列');
    const sw = (i, j) => { [a[i], a[j]] = [a[j], a[i]]; mov++; };
    if (alg === 'bubble') {
      for (let i = 0; i < a.length - 1; i++) {
        let swapped = false;
        for (let j = 0; j < a.length - 1 - i; j++) {
          cmp++; if (a[j] > a[j + 1]) { sw(j, j + 1); swapped = true; snap(`a[${j}] > a[${j + 1}]，交換`, { swap: [j, j + 1] }); }
          else snap(`比較 a[${j}]、a[${j + 1}]，不換`, { cmp: [j, j + 1] });
        }
        sorted.add(a.length - 1 - i);
        if (!swapped) { for (let k = 0; k < a.length; k++) sorted.add(k); snap('這一輪沒有交換 → 已排好（最佳情況 O(n)）'); break; }
      }
    } else if (alg === 'insertion') {
      sorted.add(0);
      for (let i = 1; i < a.length; i++) {
        const key = a[i]; let j = i - 1;
        snap(`取 key = ${key}，往左找插入位置`, { cur: [i] });
        while (j >= 0) { cmp++; if (a[j] > key) { a[j + 1] = a[j]; mov++; snap(`${a[j]} > ${key}，右移`, { swap: [j, j + 1] }); j--; } else break; }
        a[j + 1] = key; for (let k = 0; k <= i; k++) sorted.add(k);
        snap(`把 ${key} 放到位置 ${j + 1}（左側 ${i + 1} 個已排序；逆序對數＝搬移次數）`, { cur: [j + 1] });
      }
    } else if (alg === 'selection') {
      for (let i = 0; i < a.length - 1; i++) {
        let m = i;
        for (let j = i + 1; j < a.length; j++) { cmp++; if (a[j] < a[m]) m = j; snap(`在 a[${i}..] 找最小：目前最小 a[${m}] = ${a[m]}`, { cmp: [j], cur: [m] }); }
        if (m !== i) sw(i, m); sorted.add(i);
        snap(`把最小值換到位置 ${i}（不穩定：長距離交換可能打亂相同鍵值的順序）`, { swap: [i, m] });
      }
    } else if (alg === 'merge') {
      const aux = [];
      const merge = (lo, mid, hi) => {
        for (let k = lo; k <= hi; k++) aux[k] = a[k];
        let i = lo, j = mid + 1;
        for (let k = lo; k <= hi; k++) {
          if (i > mid) a[k] = aux[j++]; else if (j > hi) a[k] = aux[i++];
          else { cmp++; if (aux[j] < aux[i]) a[k] = aux[j++]; else a[k] = aux[i++]; }
          mov++;
        }
        snap(`合併 [${lo}..${mid}] 與 [${mid + 1}..${hi}]（相等時取左邊 → 穩定）`, { range: [lo, hi] });
      };
      const sortR = (lo, hi) => { if (lo >= hi) return; const mid = (lo + hi) >> 1; sortR(lo, mid); sortR(mid + 1, hi); merge(lo, mid, hi); };
      sortR(0, a.length - 1);
    } else if (alg === 'quick') {
      const part = (p, r) => {
        const x = a[r]; let i = p - 1;
        snap(`Partition A[${p}..${r}]，pivot = A[${r}] = ${x}（CLRS Lomuto）`, { range: [p, r], cur: [r] });
        for (let j = p; j < r; j++) {
          cmp++;
          if (a[j] <= x) { i++; sw(i, j); snap(`A[${j}] ≤ pivot → i = ${i}，交換 A[${i}]、A[${j}]`, { range: [p, r], swap: [i, j], cur: [r] }); }
          else snap(`A[${j}] > pivot，跳過`, { range: [p, r], cmp: [j], cur: [r] });
        }
        sw(i + 1, r); sorted.add(i + 1);
        snap(`pivot 歸位到 ${i + 1}`, { range: [p, r], cur: [i + 1] });
        return i + 1;
      };
      const qs = (p, r) => { if (p < r) { const q = part(p, r); qs(p, q - 1); qs(q + 1, r); } else if (p === r) sorted.add(p); };
      qs(0, a.length - 1);
    } else if (alg === 'heap') {
      let n = a.length;
      const sift = (i, n2) => { for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < n2) { cmp++; if (a[l] > a[m]) m = l; } if (r < n2) { cmp++; if (a[r] > a[m]) m = r; } if (m === i) return; sw(i, m); snap(`Max-Heapify：${a[m]} 下沉`, { swap: [i, m], range: [0, n2 - 1] }); i = m; } };
      for (let i = (n >> 1) - 1; i >= 0; i--) sift(i, n);
      snap('Build-Max-Heap 完成（O(n)）', { range: [0, n - 1] });
      for (let end = n - 1; end > 0; end--) { sw(0, end); sorted.add(end); snap(`把最大值 ${a[end]} 換到尾端`, { swap: [0, end] }); sift(0, end); }
      sorted.add(0);
    } else if (alg === 'radix') {
      const max = Math.max(...a); let exp = 1;
      if (a.some(x => x < 0 || !Number.isInteger(x))) throw new Error('基數排序請用非負整數');
      while (Math.floor(max / exp) > 0) {
        const buckets = Array.from({ length: 10 }, () => []);
        for (const x of a) buckets[Math.floor(x / exp) % 10].push(x);
        let k = 0; for (const b of buckets) for (const x of b) { a[k++] = x; mov++; }
        snap(`依第 ${String(exp).length} 位數（${exp} 位）做穩定的計數排序：${buckets.map((b, d) => b.length ? d + ':[' + b.join(',') + ']' : '').filter(Boolean).join(' ')}`);
        exp *= 10;
      }
    }
    for (let k = 0; k < a.length; k++) sorted.add(k);
    snap('完成');
    return F;
  },
};
Labs.reg({
  id: 'sort', title: '排序演算法', subject: 'ds', lessons: ['ds-sort'], desc: '泡沫、插入、選擇、合併、快速（Lomuto）、堆積、基數排序，逐步看比較與交換',
  form: [
    { id: 'alg', label: '演算法', type: 'select', value: 'quick', options: [['bubble', '泡沫'], ['insertion', '插入'], ['selection', '選擇'], ['merge', '合併'], ['quick', '快速（CLRS Lomuto）'], ['heap', '堆積'], ['radix', '基數（LSD）']] },
    { id: 'arr', label: '輸入陣列', value: '38, 27, 43, 3, 9, 82, 10, 27', wide: true },
  ],
  presets: [{ name: '已排序（看最壞／最佳）', v: { arr: '1,2,3,4,5,6,7,8' } }, { name: '反序', v: { arr: '8,7,6,5,4,3,2,1' } }, { name: '基數排序', v: { alg: 'radix', arr: '170, 45, 75, 90, 802, 24, 2, 66' } }],
  build: v => SortSim.run(nums(v.arr), v.alg),
  render(f, st) {
    const hl = f.hl || {};
    st.innerHTML = svgBars(f.a, { cls: k => [hl.swap && hl.swap.includes(k) ? 'swap' : '', hl.cmp && hl.cmp.includes(k) ? 'cmp' : '', hl.cur && hl.cur.includes(k) ? 'cur' : '', f.sorted.has(k) ? 'done' : '', hl.range && (k < hl.range[0] || k > hl.range[1]) ? 'dim' : ''].join(' ') });
  },
});

/* =================== Heap =================== */
const HeapSim = {
  run(ops, kind) {
    const a = [], F = []; const better = (x, y) => kind === 'max' ? x > y : x < y;
    const toTree = (i = 0) => i < a.length ? { k: a[i], l: toTree(2 * i + 1), r: toTree(2 * i + 2) } : null;
    const snap = (note, hl = []) => F.push({ a: a.slice(), tree: toTree(), note, hl: hl.map(i => a[i]) , hli: hl});
    const up = i => { while (i > 0) { const p = (i - 1) >> 1; if (better(a[i], a[p])) { [a[i], a[p]] = [a[p], a[i]]; snap(`${a[p]} 比父節點${kind === 'max' ? '大' : '小'}，上浮`, [p]); i = p; } else break; } };
    const down = i => { for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && better(a[l], a[m])) m = l; if (r < a.length && better(a[r], a[m])) m = r; if (m === i) return; [a[i], a[m]] = [a[m], a[i]]; snap(`${a[m]} 與較${kind === 'max' ? '大' : '小'}的子節點交換，下沉`, [m]); i = m; } };
    snap('空堆積');
    for (const op of ops) {
      if (op.t === 'build') {
        a.length = 0; a.push(...op.v); snap(`Build-Heap（Floyd）：先照順序放入陣列，再從最後一個內部節點 ${(a.length >> 1) - 1} 往前做下沉`);
        for (let i = (a.length >> 1) - 1; i >= 0; i--) { snap(`對索引 ${i}（值 ${a[i]}）做 Heapify`, [i]); down(i); }
        snap('Build 完成：總成本 Σ(節點高度) = O(n)');
      } else if (op.t === 'ins') { a.push(op.v); snap(`插入 ${op.v} 到陣列尾端（索引 ${a.length - 1}）`, [a.length - 1]); up(a.length - 1); snap(`插入 ${op.v} 完成`); }
      else if (op.t === 'del') {
        if (!a.length) { snap('空了'); continue; }
        const top = a[0]; const last = a.pop();
        if (a.length) { a[0] = last; snap(`取出根 ${top}；把最後一個元素 ${last} 移到根`, [0]); down(0); }
        snap(`Extract 完成，取出 ${top}`);
      }
    }
    return F;
  },
  parse(s) {
    return s.split(/[;\n]+/).map(x => x.trim()).filter(Boolean).map(x => {
      const m = x.match(/^(build|ins|insert|del|extract|pop)\s*(.*)$/i); if (!m) throw new Error('指令：build 1,2,3 / ins 5 / del');
      const t = /build/i.test(m[1]) ? 'build' : /ins/i.test(m[1]) ? 'ins' : 'del';
      return t === 'build' ? { t, v: nums(m[2]) } : t === 'ins' ? { t, v: Number(m[2]) } : { t };
    }).flatMap(o => o.t === 'ins' && isNaN(o.v) ? [] : [o]);
  },
};
Labs.reg({
  id: 'heap', title: '二元堆積', subject: 'ds', lessons: ['ds-heap'], desc: 'Build-Heap 的 O(n) 下沉、插入上浮、Extract 下沉，樹與陣列同步',
  form: [{ id: 'kind', label: '種類', type: 'select', value: 'min', options: [['min', 'Min-Heap'], ['max', 'Max-Heap']] },
    { id: 'ops', label: '操作（分號分隔）', value: 'build 9,4,7,1,8,2,6,3,5; ins 0; del; del', wide: true }],
  presets: [{ name: '逐一插入 vs Build', v: { ops: 'ins 9; ins 4; ins 7; ins 1; ins 8; ins 2' } }],
  build: v => HeapSim.run(HeapSim.parse(v.ops), v.kind),
  render(f, st) { st.innerHTML = svgTree(f.tree, { hl: f.hl }) + svgArray(f.a, { cls: k => f.hli && f.hli.includes(k) ? 'hl' : '' }); },
});

/* =================== BST / AVL / RB =================== */
const TreeSim = {
  clone(n) { return n ? { k: n.k, c: n.c, h: n.h, l: TreeSim.clone(n.l), r: TreeSim.clone(n.r) } : null; },
  ht(n) { return n ? n.h : 0; },
  upd(n) { if (n) n.h = 1 + Math.max(TreeSim.ht(n.l), TreeSim.ht(n.r)); },
  rotR(z) { const y = z.l; const zr = z.r; z.l = y.l; y.l = y.r; y.r = zr;[z.k, y.k] = [y.k, z.k];[z.c, y.c] = [y.c, z.c]; z.r = y; TreeSim.upd(y); TreeSim.upd(z); },
  rotL(z) { const y = z.r; z.r = y.r; y.r = y.l; y.l = z.l;[z.k, y.k] = [y.k, z.k];[z.c, y.c] = [y.c, z.c]; z.l = y; TreeSim.upd(y); TreeSim.upd(z); },
  run(ops, kind) {
    const F = []; const T = { root: null };
    const snap = (note, hl = [], hl2 = []) => F.push({ tree: kind === 'rb' ? TreeSim.cloneRB(T.root) : TreeSim.clone(T.root), note, hl, hl2, kind });
    snap(kind === 'rb' ? '空的紅黑樹' : kind === 'avl' ? '空的 AVL 樹' : '空的 BST');
    for (const op of ops) {
      if (kind === 'rb') { if (op.t === 'ins') TreeSim.rbIns(T, op.v, snap); else snap('紅黑樹刪除較複雜，這裡只示範插入（台大常考插入的 case 1/2/3）'); continue; }
      if (op.t === 'ins') {
        if (!T.root) { T.root = { k: op.v, h: 1, l: null, r: null }; snap(`插入 ${op.v} 為根`, [op.v]); continue; }
        TreeSim.ins(T.root, op.v, kind === 'avl', snap);
      } else {
        if (!T.root) { snap('樹是空的'); continue; }
        const r = TreeSim.del(T.root, op.v, kind === 'avl', snap);
        if (r === 'REMOVE') T.root = null;
        snap(`刪除 ${op.v} 完成`);
      }
    }
    return F;
  },
  balance(n, avl, snap, why) {
    TreeSim.upd(n);
    if (!avl) return;
    const bf = TreeSim.ht(n.l) - TreeSim.ht(n.r);
    if (bf > 1) {
      const lbf = TreeSim.ht(n.l.l) - TreeSim.ht(n.l.r);
      if (lbf >= 0) { snap(`節點 ${n.k} 的平衡因子 = +2，左子 ${n.l.k} 的平衡因子 = ${lbf} → **LL 型**：對 ${n.k} 右旋`, [n.k], [n.l.k]); TreeSim.rotR(n); snap(`右旋完成，${n.k} 成為這棵子樹的根`, [n.k]); }
      else { snap(`節點 ${n.k} 的平衡因子 = +2，左子 ${n.l.k} 的平衡因子 = −1 → **LR 型**：先對 ${n.l.k} 左旋，再對 ${n.k} 右旋`, [n.k], [n.l.k]); TreeSim.rotL(n.l); snap('第一次旋轉（左旋）後變成 LL 型', [n.k]); TreeSim.rotR(n); snap(`第二次旋轉（右旋）完成，${n.k} 上升為子樹根`, [n.k]); }
    } else if (bf < -1) {
      const rbf = TreeSim.ht(n.r.l) - TreeSim.ht(n.r.r);
      if (rbf <= 0) { snap(`節點 ${n.k} 的平衡因子 = −2，右子 ${n.r.k} 的平衡因子 = ${rbf} → **RR 型**：對 ${n.k} 左旋`, [n.k], [n.r.k]); TreeSim.rotL(n); snap(`左旋完成，${n.k} 成為子樹的根`, [n.k]); }
      else { snap(`節點 ${n.k} 的平衡因子 = −2，右子 ${n.r.k} 的平衡因子 = +1 → **RL 型**：先對 ${n.r.k} 右旋，再對 ${n.k} 左旋`, [n.k], [n.r.k]); TreeSim.rotR(n.r); snap('第一次旋轉（右旋）後變成 RR 型', [n.k]); TreeSim.rotL(n); snap(`第二次旋轉（左旋）完成，${n.k} 上升為子樹根`, [n.k]); }
    }
  },
  ins(n, k, avl, snap) {
    if (k === n.k) { snap(`${k} 已存在，不插入`, [k]); return; }
    const side = k < n.k ? 'l' : 'r';
    if (!n[side]) { n[side] = { k, h: 1, l: null, r: null }; snap(`${k} ${k < n.k ? '<' : '>'} ${n.k}，插入為 ${n.k} 的${side === 'l' ? '左' : '右'}子`, [k]); }
    else { snap(`${k} ${k < n.k ? '<' : '>'} ${n.k}，往${side === 'l' ? '左' : '右'}走`, [n.k]); TreeSim.ins(n[side], k, avl, snap); }
    TreeSim.balance(n, avl, snap);
  },
  del(n, k, avl, snap) {
    if (!n) { snap(`找不到 ${k}`); return null; }
    if (k < n.k || k > n.k) {
      const side = k < n.k ? 'l' : 'r';
      if (!n[side]) { snap(`找不到 ${k}`); return n; }
      const r = TreeSim.del(n[side], k, avl, snap); if (r === 'REMOVE') n[side] = null;
      TreeSim.balance(n, avl, snap); return n;
    }
    if (n.l && n.r) {
      let s = n.r; while (s.l) s = s.l;
      snap(`${k} 有兩個子節點：用右子樹最小值（中序後繼）${s.k} 取代`, [k], [s.k]);
      const sk = s.k; n.k = sk;
      const r = TreeSim.del(n.r, sk, avl, snap); if (r === 'REMOVE') n.r = null;
      TreeSim.balance(n, avl, snap); return n;
    }
    const child = n.l || n.r;
    snap(child ? `${k} 只有一個子節點，用子節點 ${child.k} 頂替` : `${k} 是葉節點，直接刪除`, [k]);
    if (!child) return 'REMOVE';
    n.k = child.k; n.l = child.l; n.r = child.r; n.h = child.h; n.c = child.c; return n;
  },
  cloneRB(n) { return n ? { k: n.k, c: n.c, l: TreeSim.cloneRB(n.l), r: TreeSim.cloneRB(n.r) } : null; },
  rbIns(T, k, snap) {
    let y = null, x = T.root;
    while (x) { y = x; if (k === x.k) { snap(`${k} 已存在`); return; } x = k < x.k ? x.l : x.r; }
    let z = { k, c: 'R', l: null, r: null, p: y };
    if (!y) T.root = z; else if (k < y.k) y.l = z; else y.r = z;
    snap(`插入 ${k}，新節點塗紅色`, [k]);
    const rotL = x2 => { const y2 = x2.r; x2.r = y2.l; if (y2.l) y2.l.p = x2; y2.p = x2.p; if (!x2.p) T.root = y2; else if (x2 === x2.p.l) x2.p.l = y2; else x2.p.r = y2; y2.l = x2; x2.p = y2; };
    const rotR = x2 => { const y2 = x2.l; x2.l = y2.r; if (y2.r) y2.r.p = x2; y2.p = x2.p; if (!x2.p) T.root = y2; else if (x2 === x2.p.r) x2.p.r = y2; else x2.p.l = y2; y2.r = x2; x2.p = y2; };
    while (z.p && z.p.c === 'R') {
      const gp = z.p.p; const left = z.p === gp.l; const u = left ? gp.r : gp.l;
      if (u && u.c === 'R') {
        snap(`Case 1：父 ${z.p.k} 與叔 ${u.k} 都是紅 → 父、叔塗黑，祖父 ${gp.k} 塗紅，問題上移到祖父`, [z.k], [z.p.k, u.k, gp.k]);
        z.p.c = 'B'; u.c = 'B'; gp.c = 'R'; z = gp; snap('重新著色完成', [z.k]);
      } else {
        if (left ? z === z.p.r : z === z.p.l) {
          snap(`Case 2：叔叔是黑，且 ${z.k} 是「內側」孫子 → 對父 ${z.p.k} ${left ? '左' : '右'}旋，轉成 Case 3`, [z.k], [z.p.k]);
          z = z.p; left ? rotL(z) : rotR(z); snap('旋轉後成為外側', [z.k]);
        }
        snap(`Case 3：叔叔是黑、${z.k} 在外側 → 父 ${z.p.k} 塗黑、祖父 ${z.p.p.k} 塗紅，對祖父${left ? '右' : '左'}旋`, [z.k], [z.p.k, z.p.p.k]);
        z.p.c = 'B'; z.p.p.c = 'R'; left ? rotR(z.p.p) : rotL(z.p.p); snap('Case 3 完成，迴圈結束', [z.p ? z.p.k : z.k]);
      }
    }
    if (T.root.c === 'R') { T.root.c = 'B'; snap('根塗黑（性質 2）', [T.root.k]); }
  },
  parse(s) { return s.split(/[;,\s]+/).filter(Boolean).map(t => { const m = t.match(/^(-|d|del)?(-?\d+)$/i); if (!m) throw new Error('輸入數字表示插入，前面加 d 表示刪除，如 d30'); return { t: m[1] ? 'del' : 'ins', v: Number(m[2]) }; }); },
};
Labs.reg({
  id: 'bst', title: 'BST／AVL／紅黑樹', subject: 'ds', lessons: ['ds-bst'], desc: '插入與刪除，看 LL、LR、RR、RL 旋轉，以及紅黑樹的 Case 1/2/3',
  form: [{ id: 'kind', label: '樹種', type: 'select', value: 'avl', options: [['bst', 'BST'], ['avl', 'AVL'], ['rb', '紅黑樹（插入）']] },
    { id: 'ops', label: '序列（d 開頭＝刪除）', value: '30 20 40 10 25 22 5 4 d40', wide: true }],
  presets: [{ name: 'AVL 四種旋轉', v: { kind: 'avl', ops: '50 40 30 60 70 35 33 80 75' } }, { name: '紅黑樹 1..10', v: { kind: 'rb', ops: '1 2 3 4 5 6 7 8 9 10' } }, { name: 'CLRS 13.3 例', v: { kind: 'rb', ops: '11 2 14 1 7 15 5 8 4' } }],
  build: v => TreeSim.run(TreeSim.parse(v.ops), v.kind),
  render(f, st) { st.innerHTML = svgTree(f.tree, { hl: f.hl, hl2: f.hl2, sub: f.kind === 'avl' ? n => 'h' + (n.h || '') : null }); },
});

/* =================== Hashing =================== */
const HashSim = {
  run(keys, m, method, c1 = 1, c2 = 3) {
    const T = Array(m).fill(null), F = [], chains = Array.from({ length: m }, () => []);
    const snap = (note, hl = [], probe = []) => F.push({ T: method === 'chain' ? chains.map(c => c.join('→') || null) : T.slice(), note, hl, probe });
    snap(`m = ${m}，h(k) = k mod ${m}` + (method === 'double' ? `，h₂(k) = 1 + (k mod ${m - 1})` : method === 'quad' ? `，探測 h(k) + ${c1}i + ${c2}i²` : ''));
    let total = 0;
    for (const k of keys) {
      const h0 = ((k % m) + m) % m;
      if (method === 'chain') { chains[h0].push(k); total++; snap(`${k} mod ${m} = ${h0}，接到串列尾端`, [h0]); continue; }
      const h2 = 1 + (((k % (m - 1)) + (m - 1)) % (m - 1));
      const probes = [];
      let placed = false;
      for (let i = 0; i < m; i++) {
        const j = method === 'linear' ? (h0 + i) % m : method === 'quad' ? (h0 + c1 * i + c2 * i * i) % m : (h0 + i * h2) % m;
        probes.push(j); total++;
        if (T[j] == null) { T[j] = k; snap(`插入 ${k}：第 ${i} 次探測位置 ${j}${i ? '（前面都被占）' : ''}${method === 'double' ? `，h₂ = ${h2}` : ''}`, [j], probes.slice()); placed = true; break; }
        snap(`插入 ${k}：位置 ${j} 已被 ${T[j]} 占用`, [], probes.slice());
      }
      if (!placed) snap(`${k} 插不進去（探測序列沒有走遍所有位置${method === 'quad' ? '：二次探測在 m 非質數或表半滿以上時可能失敗' : ''}）`);
    }
    snap(`完成：總探測 ${total} 次，負載因子 α = ${(keys.length / m).toFixed(2)}`);
    return F;
  },
};
Labs.reg({
  id: 'hash', title: '雜湊：開放定址與鏈結', subject: 'ds', lessons: ['ds-hash'], desc: '線性探測的初級叢集、二次探測、雙重雜湊，逐次看探測序列',
  form: [{ id: 'method', label: '方法', type: 'select', value: 'linear', options: [['linear', '線性探測'], ['quad', '二次探測'], ['double', '雙重雜湊'], ['chain', '鏈結法']] },
    { id: 'm', label: '表大小 m', type: 'number', value: '11', size: 4 },
    { id: 'keys', label: '鍵值', value: '10, 22, 31, 4, 15, 28, 17, 88, 59', wide: true }],
  presets: [{ name: 'CLRS 11.4-1', v: { m: '11', keys: '10,22,31,4,15,28,17,88,59' } }],
  build: v => HashSim.run(nums(v.keys), Math.max(2, +v.m | 0), v.method),
  render(f, st) { st.innerHTML = svgArray(f.T, { cls: k => f.hl.includes(k) ? 'hl' : f.probe.includes(k) ? 'probe' : '' }) + (f.probe.length ? `<p class="muted small">探測序列：${f.probe.join(' → ')}</p>` : ''); },
});

/* =================== Union-Find =================== */
Labs.reg({
  id: 'uf', title: 'Disjoint Set（Union-Find）', subject: 'ds', lessons: ['ds-unionfind'], desc: 'Union by rank + path compression 的森林變化',
  form: [{ id: 'n', label: '元素數 n', type: 'number', value: '10', size: 4 },
    { id: 'ops', label: '操作', value: 'u 1 2; u 3 4; u 2 4; u 5 6; u 6 7; u 7 4; f 1; u 8 9; u 9 0; u 0 1; f 5', wide: true },
    { id: 'rank', label: 'Union by rank', type: 'check', value: true }, { id: 'pc', label: 'Path compression', type: 'check', value: true }],
  build(v) {
    const n = Math.min(16, Math.max(2, +v.n | 0)); const p = Array.from({ length: n }, (_, i) => i), rk = Array(n).fill(0); const F = [];
    const snap = (note, hl = []) => F.push({ p: p.slice(), rk: rk.slice(), note, hl });
    snap('每個元素自成一棵樹');
    const find = x => { const path = []; while (p[x] !== x) { path.push(x); x = p[x]; } if (v.pc) for (const y of path) p[y] = x; return { root: x, path }; };
    for (const t of v.ops.split(/[;\n]+/).map(s => s.trim()).filter(Boolean)) {
      const [c, a, b] = t.split(/\s+/); const A = +a, B = +b;
      if (A >= n || (c === 'u' && B >= n)) throw new Error('元素超出範圍');
      if (c === 'f') { const r = find(A); snap(`Find(${A}) → 根 ${r.root}${v.pc && r.path.length > 1 ? `；路徑上 ${r.path.join(',')} 直接接到根（path compression）` : ''}`, [A, r.root]); }
      else { const ra = find(A).root, rb = find(B).root; if (ra === rb) { snap(`${A}、${B} 已在同一集合`); continue; }
        let x = ra, y = rb; if (v.rank && rk[x] < rk[y]) [x, y] = [y, x];
        p[y] = x; if (v.rank && rk[x] === rk[y]) rk[x]++;
        snap(`Union(${A},${B})：根 ${y} 接到根 ${x} 底下${v.rank ? `（rank ${rk[y]} 接到 rank ${rk[x]}）` : ''}`, [x, y]); }
    }
    return F;
  },
  render(f, st) {
    const n = f.p.length; const kids = Array.from({ length: n }, () => []); const roots = [];
    f.p.forEach((q, i) => q === i ? roots.push(i) : kids[q].push(i));
    let x = 0; const pos = {}; let maxD = 0;
    const lay = (u, d) => { maxD = Math.max(maxD, d); if (!kids[u].length) { pos[u] = [x++, d]; return pos[u][0]; } const xs = kids[u].map(c => lay(c, d + 1)); pos[u] = [(Math.min(...xs) + Math.max(...xs)) / 2, d]; return pos[u][0]; };
    roots.forEach(r => { lay(r, 0); x += 0.6; });
    const W = x * 46 + 30, H = (maxD + 1) * 60 + 30; const X = u => 26 + pos[u][0] * 46, Y = u => 26 + pos[u][1] * 60;
    let e = '', v2 = '';
    f.p.forEach((q, i) => { if (q !== i) e += `<line class="edge" x1="${X(i)}" y1="${Y(i)}" x2="${X(q)}" y2="${Y(q)}"/>`; });
    for (let i = 0; i < n; i++) v2 += `<g class="node ${f.hl.includes(i) ? 'hl' : ''}"><circle cx="${X(i)}" cy="${Y(i)}" r="16"/><text x="${X(i)}" y="${Y(i) + 5}">${i}</text>${f.p[i] === i ? `<text class="sub" x="${X(i)}" y="${Y(i) - 22}">r${f.rk[i]}</text>` : ''}</g>`;
    st.innerHTML = `<div class="svgwrap"><svg class="tree" viewBox="0 -10 ${W} ${H + 10}" width="${W}" height="${H + 10}">${e}${v2}</svg></div>` + svgArray(f.p.map(String)) + '<p class="muted small">下排是 parent 陣列；r 是 rank。</p>';
  },
});

/* =================== 圖演算法 =================== */
const GraphSim = {
  parse(txt, directed) {
    const E = []; const V = [];
    const add = x => { if (!V.includes(x)) V.push(x); };
    for (const line of txt.split(/[\n;]+/).map(s => s.trim()).filter(Boolean)) {
      const [a, b, w] = line.split(/[\s,]+/); if (!b) { add(a); continue; }
      add(a); add(b); E.push({ u: a, v: b, w: w == null ? 1 : Number(w) });
    }
    return { V, E, directed };
  },
  adj(G) { const A = Object.fromEntries(G.V.map(v => [v, []])); for (const e of G.E) { A[e.u].push({ v: e.v, w: e.w, e }); if (!G.directed) A[e.v].push({ v: e.u, w: e.w, e }); } for (const k in A) A[k].sort((x, y) => String(x.v).localeCompare(String(y.v), 'en', { numeric: true })); return A; },
  run(G, alg, s) {
    const F = []; const A = GraphSim.adj(G); const V = G.V;
    if (!V.includes(s)) s = V[0];
    const lab = {}, es = new Map(), vs = {};
    const snap = (note, extra = {}) => F.push(Object.assign({ note, lab: Object.assign({}, lab), es: new Map(es), vs: Object.assign({}, vs) }, extra));
    const inf = '∞';
    if (alg === 'bfs') {
      V.forEach(v => lab[v] = inf); lab[s] = 0; vs[s] = 'gray'; const Q = [s]; snap(`從 ${s} 開始，d[${s}] = 0，放入佇列`, { q: Q.slice() });
      while (Q.length) { const u = Q.shift(); vs[u] = 'cur'; snap(`取出 ${u}`, { q: Q.slice() });
        for (const { v, e } of A[u]) { if (lab[v] === inf) { lab[v] = lab[u] + 1; vs[v] = 'gray'; es.set(e, 'tree'); Q.push(v); snap(`${v} 未拜訪：d[${v}] = ${lab[v]}，π[${v}] = ${u}`, { q: Q.slice() }); } else if (!es.has(e)) es.set(e, 'dim'); }
        vs[u] = 'black'; }
      snap('BFS 完成：樹邊構成最短路徑樹（無權重）');
    } else if (alg === 'dfs') {
      let time = 0; const d = {}, f = {};
      const visit = u => { d[u] = ++time; vs[u] = 'gray'; lab[u] = d[u] + '/'; snap(`發現 ${u}（d = ${d[u]}），塗灰`);
        for (const { v, e } of A[u]) {
          if (!G.directed && es.get(e) === 'tree') continue;
          if (!vs[v]) { es.set(e, 'tree'); snap(`(${u},${v}) 是樹邊`); visit(v); }
          else if (!es.has(e)) {
            const kind = vs[v] === 'gray' ? 'back' : (G.directed ? (d[u] < d[v] ? 'fwd' : 'cross') : 'back');
            es.set(e, kind); snap(`(${u},${v})：${v} 是${vs[v] === 'gray' ? '灰色（在遞迴堆疊上）→ 後向邊，有環' : `黑色，d[${u}]${d[u] < d[v] ? '<' : '>'}d[${v}] → ${kind === 'fwd' ? '前向邊' : '交叉邊'}`}`);
          }
        }
        f[u] = ++time; vs[u] = 'black'; lab[u] = d[u] + '/' + f[u]; snap(`${u} 完成（f = ${f[u]}），塗黑`); };
      for (const u of [s, ...V.filter(x => x !== s)]) if (!vs[u]) visit(u);
      snap('DFS 完成。括號定理：任兩點的 [d,f] 區間不是包含就是不相交。依 f 遞減排就是拓撲順序（若為 DAG）');
    } else if (alg === 'dijkstra' || alg === 'prim') {
      const isP = alg === 'prim';
      V.forEach(v => lab[v] = inf); lab[s] = 0; const done = new Set(); const pi = {};
      snap(isP ? `Prim：key[${s}] = 0，其餘 ∞` : `Dijkstra：d[${s}] = 0，其餘 ∞（要求邊權 ≥ 0）`);
      while (done.size < V.length) {
        let u = null; for (const v of V) if (!done.has(v) && lab[v] !== inf && (u === null || lab[v] < lab[u])) u = v;
        if (u === null) break;
        done.add(u); vs[u] = 'black'; if (pi[u]) es.set(pi[u], 'tree');
        snap(`Extract-Min → ${u}（${isP ? 'key' : 'd'} = ${lab[u]}），從此${isP ? '加入樹' : '距離確定'}`);
        for (const { v, w, e } of A[u]) {
          if (done.has(v)) continue;
          const cand = isP ? w : lab[u] + w;
          if (lab[v] === inf || cand < lab[v]) { const old = lab[v]; lab[v] = cand; if (pi[v]) es.set(pi[v], 'dim'); pi[v] = e; es.set(e, 'cand'); vs[v] = 'gray'; snap(`${isP ? '更新' : '鬆弛'} (${u},${v})：${old} → ${cand}`); }
          else { if (!es.has(e)) es.set(e, 'dim'); snap(`(${u},${v})：${cand} ≥ ${lab[v]}，不更新`); }
        }
      }
      let tot = 0; if (isP) for (const [e, k] of es) if (k === 'tree') tot += e.w;
      snap(isP ? `Prim 完成，MST 總權重 ${tot}` : 'Dijkstra 完成：粗邊是最短路徑樹');
    } else if (alg === 'bellman') {
      V.forEach(v => lab[v] = inf); lab[s] = 0; const pi = {};
      snap(`Bellman-Ford：做 |V|−1 = ${V.length - 1} 輪，每輪依序鬆弛所有邊`);
      for (let it = 1; it < V.length; it++) {
        let ch = false;
        for (const e of G.E) { const pairs = G.directed ? [[e.u, e.v]] : [[e.u, e.v], [e.v, e.u]];
          for (const [u, v] of pairs) if (lab[u] !== inf && (lab[v] === inf || lab[u] + e.w < lab[v])) { lab[v] = lab[u] + e.w; if (pi[v]) es.set(pi[v], 'dim'); pi[v] = e; es.set(e, 'tree'); ch = true; snap(`第 ${it} 輪：鬆弛 (${u},${v})，d[${v}] = ${lab[v]}`); } }
        snap(`第 ${it} 輪結束${ch ? '' : '：沒有變動，可提早停止'}`); if (!ch) break;
      }
      let neg = false; for (const e of G.E) if (lab[e.u] !== inf && lab[e.u] + e.w < lab[e.v]) { neg = true; es.set(e, 'back'); }
      snap(neg ? '第 |V| 輪仍可鬆弛 → 有從源點可達的負環，最短路徑無定義' : '再檢查一輪沒有可鬆弛的邊 → 沒有負環');
    } else if (alg === 'kruskal') {
      const p = Object.fromEntries(V.map(v => [v, v])); const find = x => p[x] === x ? x : (p[x] = find(p[x]));
      const sorted = G.E.slice().sort((a, b) => a.w - b.w); let tot = 0, k = 0;
      snap('Kruskal：邊依權重排序：' + sorted.map(e => `${e.u}${e.v}(${e.w})`).join(' '));
      for (const e of sorted) { const a = find(e.u), b = find(e.v);
        if (a !== b) { p[a] = b; es.set(e, 'tree'); tot += e.w; k++; snap(`(${e.u},${e.v}) w=${e.w}：兩端在不同集合 → 加入（cut property）`); if (k === V.length - 1) break; }
        else { es.set(e, 'dim'); snap(`(${e.u},${e.v}) w=${e.w}：會形成環 → 捨棄`); } }
      snap(`完成，MST 總權重 ${tot}`);
    } else if (alg === 'topo') {
      const indeg = Object.fromEntries(V.map(v => [v, 0])); for (const e of G.E) indeg[e.v]++;
      V.forEach(v => lab[v] = 'in' + indeg[v]); const Q = V.filter(v => indeg[v] === 0).sort(); const order = [];
      snap(`Kahn：入度為 0 的點進佇列：${Q.join(',')}`, { q: Q.slice() });
      while (Q.length) { const u = Q.shift(); order.push(u); vs[u] = 'black'; lab[u] = '#' + order.length;
        for (const { v, e } of A[u]) { indeg[v]--; es.set(e, 'tree'); if (vs[v] !== 'black') lab[v] = 'in' + indeg[v]; if (indeg[v] === 0) { Q.push(v); Q.sort(); } }
        snap(`輸出 ${u}，順序：${order.join(' → ')}`, { q: Q.slice() }); }
      snap(order.length === V.length ? `拓撲排序：${order.join(' → ')}` : '有點始終入度 > 0 → 圖中有環，不是 DAG');
    } else if (alg === 'floyd') {
      const n = V.length, I = Object.fromEntries(V.map((v, i) => [v, i]));
      const d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity));
      for (const e of G.E) { d[I[e.u]][I[e.v]] = Math.min(d[I[e.u]][I[e.v]], e.w); if (!G.directed) d[I[e.v]][I[e.u]] = Math.min(d[I[e.v]][I[e.u]], e.w); }
      const mat = (k, ch) => ({ mat: d.map(r => r.map(x => x === Infinity ? '∞' : x)), ch, k });
      snap('D⁽⁰⁾ = 邊權矩陣', mat(-1, []));
      for (let k = 0; k < n; k++) { const ch = [];
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (d[i][k] + d[k][j] < d[i][j]) { d[i][j] = d[i][k] + d[k][j]; ch.push(i + ',' + j); }
        snap(`D⁽${k + 1}⁾：允許經過 ${V[k]}，更新 ${ch.length} 格：d[i][j] = min(d[i][j], d[i][${V[k]}] + d[${V[k]}][j])`, mat(k, ch)); }
    }
    F.forEach(f => f.G = G);
    return F;
  },
  layout(G) {
    const P = {}; const n = G.V.length;
    const preset = GraphSim.presetPos[G.V.join('')];
    G.V.forEach((v, i) => { P[v] = preset && preset[v] ? preset[v] : [260 + 190 * Math.cos(2 * Math.PI * i / n - Math.PI / 2), 210 + 170 * Math.sin(2 * Math.PI * i / n - Math.PI / 2)]; });
    return P;
  },
  presetPos: {
    stxyz: { s: [60, 200], t: [220, 80], x: [420, 80], y: [220, 320], z: [420, 320] },
    abhcigfde: { a: [40, 200], b: [140, 80], h: [140, 320], c: [280, 80], i: [210, 200], g: [280, 320], f: [420, 320], d: [420, 80], e: [520, 200] },
  },
  render(f, st) {
    if (f.mat) {
      const V = f.G.V;
      st.innerHTML = htmlTable(f.mat.map((r, i) => [`<b>${V[i]}</b>`, ...r]), { head: ['', ...V], cls: (i, j) => j > 0 && f.ch.includes(i + ',' + (j - 1)) ? 'chg' : (j - 1 === f.k || i === f.k) ? 'kk' : '' });
      return;
    }
    const G = f.G; const P = GraphSim.layout(G);
    let e = '';
    for (const ed of G.E) {
      const [x1, y1] = P[ed.u], [x2, y2] = P[ed.v]; const k = f.es.get(ed) || '';
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1; const ux = dx / L, uy = dy / L;
      const bend = G.directed && G.E.some(o => o.u === ed.v && o.v === ed.u) ? 14 : 0;
      const mx = (x1 + x2) / 2 - uy * bend, my = (y1 + y2) / 2 + ux * bend;
      const sx = x1 + ux * 20, sy = y1 + uy * 20, tx = x2 - ux * 22, ty = y2 - uy * 22;
      e += `<g class="gedge ${k}"><path d="M${sx},${sy} Q${mx},${my} ${tx},${ty}" ${G.directed ? 'marker-end="url(#arr)"' : ''}/><text x="${mx - uy * 10}" y="${my + ux * 10 + 4}">${ed.w}</text></g>`;
    }
    let v = '';
    for (const x of G.V) { const [cx, cy] = P[x]; v += `<g class="gnode ${f.vs[x] || ''}"><circle cx="${cx}" cy="${cy}" r="19"/><text x="${cx}" y="${cy + 5}">${x}</text>${f.lab[x] != null ? `<text class="glab" x="${cx}" y="${cy - 26}">${f.lab[x]}</text>` : ''}</g>`; }
    st.innerHTML = `<div class="svgwrap"><svg class="graph" viewBox="0 0 560 420" width="560" height="420"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="ah"/></marker></defs>${e}${v}</svg></div>
      ${f.q ? `<p class="muted small">佇列：[ ${f.q.join(', ')} ]</p>` : ''}<p class="legend small"><span class="lg tree">樹邊／採用</span><span class="lg cand">候選</span><span class="lg back">後向邊／負環</span><span class="lg fwd">前向</span><span class="lg cross">交叉</span></p>`;
  },
};
Labs.reg({
  id: 'graph', title: '圖演算法', subject: 'al', lessons: ['ds-graph', 'al-sp', 'al-mst-flow'], desc: 'BFS、DFS（d/f 時間與邊分類）、Dijkstra、Bellman-Ford、Floyd-Warshall、Prim、Kruskal、拓撲排序',
  form: [{ id: 'alg', label: '演算法', type: 'select', value: 'dijkstra', options: [['bfs', 'BFS'], ['dfs', 'DFS（邊分類）'], ['dijkstra', 'Dijkstra'], ['bellman', 'Bellman-Ford'], ['floyd', 'Floyd-Warshall'], ['prim', 'Prim'], ['kruskal', 'Kruskal'], ['topo', '拓撲排序（Kahn）']] },
    { id: 'src', label: '起點', value: 's', size: 4 }, { id: 'dir', label: '有向圖', type: 'check', value: true },
    { id: 'edges', label: '邊（u v w，一行一條）', type: 'area', rows: 5, value: 's t 10\ns y 5\nt x 1\nt y 2\ny t 3\ny x 9\ny z 2\nx z 4\nz x 6\nz s 7', wide: true }],
  presets: [
    { name: 'CLRS Dijkstra', v: { alg: 'dijkstra', src: 's', dir: true, edges: 's t 10\ns y 5\nt x 1\nt y 2\ny t 3\ny x 9\ny z 2\nx z 4\nz x 6\nz s 7' } },
    { name: 'CLRS MST（無向）', v: { alg: 'kruskal', src: 'a', dir: false, edges: 'a b 4\na h 8\nb h 11\nb c 8\nc i 2\nc f 4\nc d 7\nd f 14\nd e 9\ne f 10\nf g 2\ng i 6\ng h 1\nh i 7' } },
    { name: '負權邊', v: { alg: 'bellman', src: 's', dir: true, edges: 's t 6\ns y 7\nt x 5\nt y 8\nt z -4\nx t -2\ny x -3\ny z 9\nz s 2\nz x 7' } },
    { name: 'DAG（課程先修）', v: { alg: 'topo', src: 'a', dir: true, edges: 'a c 1\nb c 1\nb d 1\nc e 1\nd e 1\ne f 1\nd f 1' } },
  ],
  build: v => GraphSim.run(GraphSim.parse(v.edges, v.dir), v.alg, v.src.trim()),
  render: GraphSim.render,
});

/* =================== 動態規劃 =================== */
Labs.reg({
  id: 'dp', title: '動態規劃填表', subject: 'al', lessons: ['al-dp'], desc: 'LCS、編輯距離、0/1 背包：看表格依賴關係與回溯',
  form: [{ id: 'alg', label: '問題', type: 'select', value: 'lcs', options: [['lcs', 'LCS'], ['edit', '編輯距離'], ['knap', '0/1 背包']] },
    { id: 'x', label: 'X（或物品重量）', value: 'ABCBDAB' }, { id: 'y', label: 'Y（或物品價值）', value: 'BDCABA' }, { id: 'W', label: '背包容量 W', type: 'number', value: '10', size: 4 }],
  presets: [{ name: 'CLRS LCS', v: { alg: 'lcs', x: 'ABCBDAB', y: 'BDCABA' } }, { name: '編輯距離', v: { alg: 'edit', x: 'INTENTION', y: 'EXECUTION' } }, { name: '背包', v: { alg: 'knap', x: '5,4,6,3', y: '10,40,30,50', W: '10' } }],
  build(v) {
    const F = [];
    if (v.alg === 'knap') {
      const w = nums(v.x), val = nums(v.y), W = Math.min(30, +v.W | 0), n = w.length;
      if (val.length !== n) throw new Error('重量與價值個數要相同');
      const K = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
      const snap = (note, cur, dep = [], path = []) => F.push({ head: ['i \\ w', ...Array.from({ length: W + 1 }, (_, j) => j)], rows: K.map((r, i) => [i ? `${i}（w${w[i - 1]},v${val[i - 1]}）` : '0', ...r.map(String)]), note, cur, dep, path, off: 1 });
      snap('K[i][c] = 前 i 個物品、容量 c 的最大價值');
      for (let i = 1; i <= n; i++) for (let c = 0; c <= W; c++) {
        const no = K[i - 1][c]; const yes = w[i - 1] <= c ? K[i - 1][c - w[i - 1]] + val[i - 1] : -1;
        K[i][c] = Math.max(no, yes);
        snap(`K[${i}][${c}] = max(不拿 ${no}${yes >= 0 ? `, 拿 ${K[i - 1][c - w[i - 1]]}+${val[i - 1]}=${yes}` : '，放不下'}) = ${K[i][c]}`, [i, c], yes >= 0 ? [[i - 1, c], [i - 1, c - w[i - 1]]] : [[i - 1, c]]);
      }
      const path = []; let c = W; const take = [];
      for (let i = n; i > 0; i--) { path.push([i, c]); if (K[i][c] !== K[i - 1][c]) { take.push(i); c -= w[i - 1]; } }
      snap(`最大價值 ${K[n][W]}，拿物品 ${take.reverse().join(', ')}。時間 O(nW) 是「偽多項式」：W 以 lg W 位元表示`, null, [], path);
      return F;
    }
    const X = v.x.trim(), Y = v.y.trim(), m = X.length, n = Y.length;
    if (m > 14 || n > 14) throw new Error('字串請在 14 字以內');
    const C = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0)); const B = Array.from({ length: m + 1 }, () => Array(n + 1).fill(''));
    const isE = v.alg === 'edit';
    if (isE) { for (let i = 0; i <= m; i++) C[i][0] = i; for (let j = 0; j <= n; j++) C[0][j] = j; }
    const snap = (note, cur, dep = [], path = []) => F.push({ head: ['', 'ε', ...Y.split('')], rows: C.map((r, i) => [i ? X[i - 1] : 'ε', ...r.map((x, j) => (B[i][j] ? `<small>${B[i][j]}</small>` : '') + x)]), note, cur, dep, path, off: 1 });
    snap(isE ? 'E[i][j] = X[1..i] 變成 Y[1..j] 的最少編輯數；第一列／行是全刪／全插' : 'c[i][j] = X[1..i] 與 Y[1..j] 的 LCS 長度');
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      if (isE) { const sub = C[i - 1][j - 1] + (X[i - 1] === Y[j - 1] ? 0 : 1), del = C[i - 1][j] + 1, ins = C[i][j - 1] + 1; C[i][j] = Math.min(sub, del, ins); B[i][j] = C[i][j] === sub ? '↖' : C[i][j] === del ? '↑' : '←';
        snap(`E[${i}][${j}] = min(${X[i - 1] === Y[j - 1] ? '相同免費' : '替換'} ${sub}, 刪 ${del}, 插 ${ins}) = ${C[i][j]}`, [i, j], [[i - 1, j - 1], [i - 1, j], [i, j - 1]]); }
      else if (X[i - 1] === Y[j - 1]) { C[i][j] = C[i - 1][j - 1] + 1; B[i][j] = '↖'; snap(`X${i} = Y${j} = ${X[i - 1]} → c = c[${i - 1}][${j - 1}] + 1 = ${C[i][j]}`, [i, j], [[i - 1, j - 1]]); }
      else { C[i][j] = Math.max(C[i - 1][j], C[i][j - 1]); B[i][j] = C[i - 1][j] >= C[i][j - 1] ? '↑' : '←'; snap(`${X[i - 1]} ≠ ${Y[j - 1]} → max(上 ${C[i - 1][j]}, 左 ${C[i][j - 1]}) = ${C[i][j]}`, [i, j], [[i - 1, j], [i, j - 1]]); }
    }
    let i = m, j = n; const path = [], s = [];
    while (i > 0 && j > 0) { path.push([i, j]); const b = B[i][j]; if (b === '↖') { if (!isE || X[i - 1] === Y[j - 1]) s.push(X[i - 1]); i--; j--; } else if (b === '↑') i--; else j--; }
    snap(isE ? `編輯距離 = ${C[m][n]}（沿箭頭回溯得到操作序列）` : `LCS 長度 ${C[m][n]}，回溯得到「${s.reverse().join('')}」（LCS 不一定唯一）`, null, [], path);
    return F;
  },
  render(f, st) {
    st.innerHTML = htmlTable(f.rows, { head: f.head, cls: (i, j) => { const jj = j - f.off; if (f.cur && f.cur[0] === i && f.cur[1] === jj) return 'cur'; if (f.dep.some(([a, b]) => a === i && b === jj)) return 'dep'; if (f.path.some(([a, b]) => a === i && b === jj)) return 'path'; return ''; } });
  },
});
