/* 資工所衝刺站 — 計組／OS／線代 動畫 + 共用模擬器 Sim（隨機題也用它算答案） */
'use strict';

const Sim = {
  /* ---------- CPU 排程 ---------- */
  cpu(procs, alg, q = 2) {
    const P = procs.map((p, i) => Object.assign({ i, rem: p.bt, start: null }, p));
    const segs = [], notes = [];
    const push = (name, s, e, note) => { if (s === e) return; const last = segs[segs.length - 1]; if (last && last.p === name && last.e === s) last.e = e; else { segs.push({ p: name, s, e }); notes.push(note); } };
    const arrived = t => P.filter(p => p.at <= t && p.rem > 0);
    const byKey = (key) => (a, b) => key(a) - key(b) || a.at - b.at || a.i - b.i;
    let t = Math.min(...P.map(p => p.at));
    if (t > 0) push('idle', 0, t, `0～${t} 沒有行程到達，CPU 閒置`);
    if (alg === 'fcfs' || alg === 'sjf' || alg === 'prio') {
      while (P.some(p => p.rem > 0)) {
        let R = arrived(t);
        if (!R.length) { const nt = Math.min(...P.filter(p => p.rem > 0).map(p => p.at)); push('idle', t, nt, `閒置到 ${nt}`); t = nt; continue; }
        const key = alg === 'fcfs' ? (p => p.at) : alg === 'sjf' ? (p => p.bt) : (p => p.pr);
        R.sort(byKey(key)); const p = R[0];
        p.start = t; push(p.n, t, t + p.rem, `t=${t}：就緒 {${R.map(x => x.n).join(',')}}，選 ${p.n}（${alg === 'fcfs' ? '最早到' : alg === 'sjf' ? 'burst 最短 = ' + p.bt : '優先權最高 = ' + p.pr}），不可搶先，跑完 ${p.rem}`);
        t += p.rem; p.rem = 0; p.ct = t;
      }
    } else if (alg === 'srtf' || alg === 'pprio') {
      let cur = null;
      while (P.some(p => p.rem > 0)) {
        const R = arrived(t);
        if (!R.length) { const nt = Math.min(...P.filter(p => p.rem > 0).map(p => p.at)); push('idle', t, nt, `閒置到 ${nt}`); t = nt; cur = null; continue; }
        const key = alg === 'srtf' ? (p => p.rem) : (p => p.pr);
        R.sort(byKey(key));
        let p = R[0];
        if (cur && cur.rem > 0 && key(cur) === key(p)) p = cur; // 平手不搶先
        const why = cur && cur !== p && cur.rem > 0 ? `${p.n} 的${alg === 'srtf' ? '剩餘時間 ' + p.rem + ' < ' + cur.n + ' 的 ' + cur.rem : '優先權較高'} → 搶先` : `選 ${p.n}（${alg === 'srtf' ? '剩餘最短 ' + p.rem : '優先權 ' + p.pr}）`;
        if (p.start == null) p.start = t;
        const nextArr = Math.min(...P.filter(x => x.at > t).map(x => x.at), Infinity);
        const run = Math.min(p.rem, nextArr - t);
        push(p.n, t, t + run, `t=${t}：就緒 {${R.map(x => x.n + (alg === 'srtf' ? '(' + x.rem + ')' : '')).join(',')}}，${why}`);
        t += run; p.rem -= run; if (p.rem === 0) p.ct = t; cur = p;
      }
    } else if (alg === 'rr') {
      const Q = []; const inQ = new Set(); let idx = 0;
      const order = P.slice().sort((a, b) => a.at - b.at || a.i - b.i);
      const admit = upto => { while (idx < order.length && order[idx].at <= upto) { Q.push(order[idx]); inQ.add(order[idx]); idx++; } };
      admit(t);
      while (Q.length || idx < order.length) {
        if (!Q.length) { const nt = order[idx].at; push('idle', t, nt, `閒置到 ${nt}`); t = nt; admit(t); continue; }
        const p = Q.shift(); if (p.start == null) p.start = t;
        const run = Math.min(q, p.rem);
        const note = `t=${t}：佇列頭 ${p.n}（剩 ${p.rem}），跑 ${run}${p.rem > q ? '，時間片用完' : '，結束'}；佇列 [${Q.map(x => x.n).join(',')}]`;
        push(p.n, t, t + run, note);
        t += run; p.rem -= run;
        admit(t); // 同時到達的新行程排在被搶下來的行程前面
        if (p.rem > 0) Q.push(p); else p.ct = t;
      }
    }
    const stats = P.map(p => ({ n: p.n, at: p.at, bt: p.bt, pr: p.pr, ct: p.ct, tat: p.ct - p.at, wt: p.ct - p.at - p.bt, rt: p.start - p.at }));
    const avg = k => stats.reduce((s, x) => s + x[k], 0) / stats.length;
    const cs = segs.filter(s => s.p !== 'idle').length - 1;
    return { segs, notes, stats, avgWT: avg('wt'), avgTAT: avg('tat'), avgRT: avg('rt'), switches: cs };
  },
  /* ---------- 頁替換 ---------- */
  page(refs, n, alg) {
    const fr = Array(n).fill(null), last = {}, loaded = {}, bit = Array(n).fill(0); let ptr = 0, faults = 0;
    const steps = [];
    refs.forEach((r, t) => {
      let slot = fr.indexOf(r), victim = null, hit = slot >= 0;
      if (hit) { if (alg === 'clock') bit[slot] = 1; }
      else {
        faults++;
        slot = fr.indexOf(null);
        if (slot < 0) {
          if (alg === 'fifo') slot = fr.reduce((b, x, k) => loaded[x] < loaded[fr[b]] ? k : b, 0);
          else if (alg === 'lru') slot = fr.reduce((b, x, k) => last[x] < last[fr[b]] ? k : b, 0);
          else if (alg === 'opt') {
            let far = -1;
            fr.forEach((x, k) => { let nx = refs.indexOf(x, t + 1); if (nx < 0) nx = Infinity; if (nx > far) { far = nx; slot = k; } });
          } else if (alg === 'clock') { while (bit[ptr]) { bit[ptr] = 0; ptr = (ptr + 1) % n; } slot = ptr; ptr = (ptr + 1) % n; }
          victim = fr[slot];
        } else if (alg === 'clock') ptr = (slot + 1) % n;
        fr[slot] = r; loaded[r] = t; if (alg === 'clock') bit[slot] = 1;
      }
      last[r] = t;
      steps.push({ ref: r, fr: fr.slice(), hit, victim, slot, bit: bit.slice(), ptr });
    });
    return { steps, faults };
  },
  /* ---------- 磁碟排程 ---------- */
  disk(reqs, head, alg, dir = 'up', max = 199) {
    const path = [head]; let pos = head; let jump = 0; let pend = reqs.slice();
    const go = c => { path.push(c); pos = c; };
    const asc = (x, y) => x - y, desc = (x, y) => y - x;
    if (alg === 'fcfs') reqs.forEach(go);
    else if (alg === 'sstf') { while (pend.length) { const c = pend.slice().sort((x, y) => Math.abs(x - pos) - Math.abs(y - pos) || x - y)[0]; pend.splice(pend.indexOf(c), 1); go(c); } }
    else {
      const up = dir === 'up';
      const A = pend.filter(c => up ? c >= pos : c <= pos).sort(up ? asc : desc);
      const B = pend.filter(c => up ? c < pos : c > pos);
      A.forEach(go);
      if (B.length) {
        if (alg === 'scan') { const end = up ? max : 0; if (pos !== end) go(end); B.sort(up ? desc : asc).forEach(go); }
        else if (alg === 'look') B.sort(up ? desc : asc).forEach(go);
        else if (alg === 'cscan') { const end = up ? max : 0, start = up ? 0 : max; if (pos !== end) go(end); jump = Math.abs(end - start); go(start); B.sort(up ? asc : desc).forEach(c => { if (c !== pos) go(c); }); }
        else if (alg === 'clook') { B.sort(up ? asc : desc); jump = Math.abs(pos - B[0]); go(B[0]); B.slice(1).forEach(go); }
      }
    }
    let total = 0; for (let k = 1; k < path.length; k++) total += Math.abs(path[k] - path[k - 1]);
    return { path, total, totalNoJump: total - jump, jump };
  },
  /* ---------- Cache ---------- */
  cache({ C, B, A, m = 32, addrs, policy = 'lru' }) {
    const blocks = C / B; const ways = A === 'full' ? blocks : +A; const sets = blocks / ways;
    if (!Number.isInteger(sets) || sets < 1) throw new Error('容量／區塊／關聯度組合不合法');
    const ob = Math.log2(B), ib = Math.log2(sets); if (!Number.isInteger(ob) || !Number.isInteger(ib)) throw new Error('區塊大小與 set 數要是 2 的冪次');
    const tb = m - ob - ib;
    const SS = Array.from({ length: sets }, () => []); let hits = 0;
    const steps = addrs.map((a, t) => {
      const blk = Math.floor(a / B), idx = blk % sets, tag = Math.floor(blk / sets), off = a % B;
      const set = SS[idx]; const line = set.find(l => l.tag === tag); let victim = null;
      if (line) { hits++; if (policy === 'lru') line.used = t; }
      else {
        if (set.length >= ways) { const v = set.reduce((x, l) => (l.used < x.used ? l : x)); victim = v.tag; set.splice(set.indexOf(v), 1); }
        set.push({ tag, used: t, blk });
      }
      return { a, blk, idx, tag, off, hit: !!line, victim, snapshot: SS.map(q => q.map(l => ({ tag: l.tag, blk: l.blk }))) };
    });
    return { steps, hits, misses: addrs.length - hits, sets, ways, ob, ib, tb };
  },
  /* ---------- 5 級管線 ---------- */
  parseAsm(txt) {
    return txt.split(/\n|;/).map(s => s.trim()).filter(Boolean).map(line => {
      const m = line.match(/^(\w+)\s+(.*)$/); if (!m) throw new Error('看不懂：' + line);
      const op = m[1].toLowerCase(); const regs = (m[2].match(/\$?\w+/g) || []).filter(x => /^\$|^[rx]\d+$/i.test(x)).map(x => x.replace(/^\$/, '').toLowerCase());
      let dst = null, src = [];
      if (op === 'lw' || op === 'ld') { dst = regs[0]; src = [regs[1]]; }
      else if (op === 'sw' || op === 'sd') { src = [regs[0], regs[1]]; }
      else if (op === 'beq' || op === 'bne') { src = [regs[0], regs[1]]; }
      else if (/i$/.test(op) && op !== 'mul') { dst = regs[0]; src = [regs[1]]; }
      else { dst = regs[0]; src = regs.slice(1); }
      src = src.filter(r => r && r !== '0' && r !== 'zero' && r !== 'x0');
      return { line, op, dst: dst && dst !== '0' && dst !== 'zero' && dst !== 'x0' ? dst : null, src, load: op === 'lw' || op === 'ld', br: op === 'beq' || op === 'bne' };
    });
  },
  pipe(ins, fwd) {
    const R = [];
    ins.forEach((x, i) => {
      const IF = i ? R[i - 1].idS : 1;
      const idS = i ? Math.max(IF + 1, R[i - 1].idE + 1) : 2;
      let need = idS; const why = [];
      for (const r of x.src) {
        for (let j = i - 1; j >= 0; j--) if (ins[j].dst === r) {
          const p = R[j]; let t;
          if (!fwd) t = p.WB; else if (x.br) t = ins[j].load ? p.MEM + 1 : p.EX + 1; else t = ins[j].load ? p.MEM : p.EX;
          if (t > need) { need = t; }
          why.push({ j, r, t, kind: !fwd ? 'WB 寫入前半、讀取後半' : ins[j].load ? (x.br ? 'load→分支：等 MEM 結束再轉送到 ID' : 'load-use：MEM/WB 轉送到 EX') : (x.br ? 'ALU→分支（ID 比較）：EX/MEM 轉送到 ID' : 'EX/MEM 轉送到 EX') });
          break;
        }
      }
      const idE = need; const EX = idE + 1, MEM = EX + 1, WB = MEM + 1;
      R.push({ IF, idS, idE, EX, MEM, WB, stall: idE - idS, why });
    });
    return { R, cycles: R.length ? R[R.length - 1].WB : 0, stalls: R.reduce((s, r) => s + r.stall, 0) };
  },
  /* ---------- Banker ---------- */
  banker(avail, max, alloc) {
    const n = max.length, m = avail.length;
    const need = max.map((r, i) => r.map((x, j) => x - alloc[i][j]));
    if (need.some(r => r.some(x => x < 0))) throw new Error('Allocation 不能超過 Max');
    const work = avail.slice(), fin = Array(n).fill(false), seq = [], steps = [];
    steps.push({ work: work.slice(), fin: fin.slice(), note: `Need = Max − Allocation；Work = Available = (${work.join(',')})` });
    let progress = true;
    while (progress) {
      progress = false;
      for (let i = 0; i < n; i++) if (!fin[i] && need[i].every((x, j) => x <= work[j])) {
        for (let j = 0; j < m; j++) work[j] += alloc[i][j]; fin[i] = true; seq.push(i); progress = true;
        steps.push({ work: work.slice(), fin: fin.slice(), pick: i, note: `P${i} 的 Need (${need[i].join(',')}) ≤ Work → 讓它跑完，歸還 Allocation，Work = (${work.join(',')})` });
        break;
      }
    }
    const safe = fin.every(Boolean);
    steps.push({ work: work.slice(), fin: fin.slice(), note: safe ? `安全狀態，安全序列 <${seq.map(i => 'P' + i).join(', ')}>（每次挑編號最小的可執行行程）` : `找不到可以完成的行程：P${fin.map((f, i) => f ? null : i).filter(x => x != null).join(', P')} 卡住 → 不安全狀態（不一定已死結）` });
    return { need, safe, seq, steps };
  },
};

/* ===================== Labs: OS ===================== */
function parseProcs(txt) {
  return txt.split(/\n|;/).map(s => s.trim()).filter(Boolean).map((l, i) => { const p = l.split(/[\s,]+/); if (p.length < 3) throw new Error('每行：名稱 到達 burst [優先權]'); return { n: p[0], at: +p[1], bt: +p[2], pr: p[3] != null ? +p[3] : 0 }; });
}
function ganttSvg(segs, upto) {
  const end = Math.max(...segs.map(s => s.e)); const sc = Math.min(28, 640 / Math.max(end, 1)); const W = end * sc + 30;
  const names = [...new Set(segs.map(s => s.p))].filter(x => x !== 'idle');
  return `<div class="svgwrap"><svg class="gantt" viewBox="0 0 ${W} 70" width="${W}" height="70">${segs.slice(0, upto).map(s => `<g class="seg ${s.p === 'idle' ? 'idle' : 'p' + (names.indexOf(s.p) % 6)}"><rect x="${10 + s.s * sc}" y="8" width="${(s.e - s.s) * sc}" height="30"/><text x="${10 + (s.s + s.e) / 2 * sc}" y="28">${s.p === 'idle' ? '' : s.p}</text><text class="tick" x="${10 + s.s * sc}" y="56">${s.s}</text></g>`).join('')}${upto ? `<text class="tick" x="${10 + segs[upto - 1].e * sc}" y="56">${segs[upto - 1].e}</text>` : ''}</svg></div>`;
}
Labs.reg({
  id: 'cpu', title: 'CPU 排程（甘特圖）', subject: 'os', lessons: ['os-sched'], desc: 'FCFS、SJF、SRTF、RR、優先權（可搶先／不可搶先），自動算等待、周轉、回應時間',
  form: [{ id: 'alg', label: '演算法', type: 'select', value: 'srtf', options: [['fcfs', 'FCFS'], ['sjf', 'SJF（不可搶先）'], ['srtf', 'SRTF（可搶先 SJF）'], ['rr', 'Round Robin'], ['prio', '優先權（不可搶先）'], ['pprio', '優先權（可搶先）']] },
    { id: 'q', label: 'RR 時間片', type: 'number', value: '4', size: 4 },
    { id: 'procs', label: '行程（名稱 到達 burst 優先權；數字小＝優先）', type: 'area', rows: 5, value: 'P1 0 8 3\nP2 1 4 1\nP3 2 9 4\nP4 3 5 2', wide: true }],
  presets: [{ name: '恐龍書 SRTF', v: { alg: 'srtf', procs: 'P1 0 8 3\nP2 1 4 1\nP3 2 9 4\nP4 3 5 2' } }, { name: 'RR q=4', v: { alg: 'rr', q: '4', procs: 'P1 0 24 1\nP2 0 3 1\nP3 0 3 1' } }, { name: '含閒置', v: { alg: 'sjf', procs: 'P1 2 6 1\nP2 5 2 1\nP3 1 8 1\nP4 0 3 1\nP5 4 4 1' } }],
  build(v) {
    const r = Sim.cpu(parseProcs(v.procs), v.alg, Math.max(1, +v.q | 0));
    const F = r.segs.map((s, k) => ({ r, upto: k + 1, note: r.notes[k] }));
    F.push({ r, upto: r.segs.length, final: true, note: `平均等待 **${+r.avgWT.toFixed(3)}**、平均周轉 ${+r.avgTAT.toFixed(3)}、平均回應 ${+r.avgRT.toFixed(3)}；context switch ${r.switches} 次（不含閒置）。WT = TAT − burst，TAT = 完成 − 到達。` });
    return F;
  },
  render(f, st) {
    st.innerHTML = ganttSvg(f.r.segs, f.upto) + (f.final ? htmlTable(f.r.stats.map(s => [s.n, s.at, s.bt, s.pr, s.ct, s.tat, s.wt, s.rt]), { head: ['行程', '到達', 'Burst', '優先', '完成', '周轉', '等待', '回應'] }) : '');
  },
});

Labs.reg({
  id: 'page', title: '頁替換演算法', subject: 'os', lessons: ['os-vm'], desc: 'FIFO、LRU、OPT、Clock，逐次看 frame 內容與缺頁；可以重現 Belady 異常',
  form: [{ id: 'alg', label: '演算法', type: 'select', value: 'lru', options: [['fifo', 'FIFO'], ['lru', 'LRU'], ['opt', 'OPT（最佳）'], ['clock', 'Clock（第二次機會）']] },
    { id: 'n', label: 'Frame 數', type: 'number', value: '3', size: 4 },
    { id: 'refs', label: '參考串', value: '7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1', wide: true }],
  presets: [{ name: '恐龍書參考串', v: { refs: '7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1' } }, { name: 'Belady（FIFO 3 vs 4 frames）', v: { alg: 'fifo', refs: '1 2 3 4 1 2 5 1 2 3 4 5', n: '4' } }],
  build(v) {
    const refs = nums(v.refs), n = Math.max(1, Math.min(8, +v.n | 0)); const r = Sim.page(refs, n, v.alg);
    let f = 0;
    return r.steps.map((s, k) => { if (!s.hit) f++; return { refs, steps: r.steps, k, note: `參考 ${s.ref}：${s.hit ? '命中' : `**缺頁**（第 ${f} 次）` + (s.victim != null ? `，換出 ${s.victim}` + (v.alg === 'opt' ? '（未來最晚才用到）' : v.alg === 'lru' ? '（最久沒用）' : v.alg === 'fifo' ? '（最早載入）' : '（參考位元為 0）') : '，放入空 frame')}${k === refs.length - 1 ? `。總缺頁 ${r.faults} 次，缺頁率 ${(r.faults / refs.length * 100).toFixed(1)}%` : ''}`, clock: v.alg === 'clock' }; });
  },
  render(f, st) {
    const n = f.steps[0].fr.length;
    const head = f.refs.map((x, k) => `<span class="${k === f.k ? 'curh' : ''}">${x}</span>`);
    const rows = [];
    for (let j = 0; j < n; j++) rows.push(f.steps.map((s, k) => k > f.k ? '' : (s.fr[j] == null ? '' : s.fr[j] + (f.clock ? `<sup>${s.bit[j]}</sup>` : ''))));
    rows.push(f.steps.map((s, k) => k > f.k ? '' : s.hit ? '' : '<b class="bad-t">F</b>'));
    st.innerHTML = htmlTable(rows, { head, cls: (i, j) => j === f.k ? 'cur' : (i < n && f.steps[j] && !f.steps[j].hit && f.steps[j].slot === i && j <= f.k) ? 'chg' : '' }) + (f.clock ? '<p class="muted small">上標是參考位元；新載入的頁參考位元設為 1。</p>' : '');
  },
});

Labs.reg({
  id: 'disk', title: '磁碟排程', subject: 'os', lessons: ['os-storage'], desc: 'FCFS、SSTF、SCAN、C-SCAN、LOOK、C-LOOK，看磁頭軌跡與總移動量',
  form: [{ id: 'alg', label: '演算法', type: 'select', value: 'scan', options: [['fcfs', 'FCFS'], ['sstf', 'SSTF'], ['scan', 'SCAN'], ['cscan', 'C-SCAN'], ['look', 'LOOK'], ['clook', 'C-LOOK']] },
    { id: 'head', label: '磁頭位置', type: 'number', value: '53', size: 5 }, { id: 'dir', label: '方向', type: 'select', value: 'down', options: [['up', '往大'], ['down', '往小']] }, { id: 'max', label: '最大柱面', type: 'number', value: '199', size: 5 },
    { id: 'q', label: '請求佇列', value: '98 183 37 122 14 124 65 67', wide: true }],
  presets: [{ name: '恐龍書例題', v: { q: '98 183 37 122 14 124 65 67', head: '53' } }],
  build(v) {
    const r = Sim.disk(nums(v.q), +v.head, v.alg, v.dir, +v.max);
    return r.path.map((p, k) => ({ r, k, max: +v.max, note: k === 0 ? `磁頭從 ${p} 開始` : `${r.path[k - 1]} → ${p}，移動 ${Math.abs(p - r.path[k - 1])}` + (k === r.path.length - 1 ? `。總移動 **${r.total}**${r.jump ? `（不計回程跳躍則為 ${r.totalNoJump}；題目沒說清楚時兩種都寫並註明）` : ''}` : '') }));
  },
  render(f, st) {
    const W = 600, H = Math.max(160, f.r.path.length * 26 + 30); const X = c => 20 + c / f.max * (W - 40); const Y = k => 20 + k * 26;
    let d = ''; for (let k = 0; k <= f.k; k++) d += (k ? 'L' : 'M') + X(f.r.path[k]) + ',' + Y(k);
    st.innerHTML = `<div class="svgwrap"><svg class="disk" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><line class="axis" x1="20" y1="10" x2="${W - 20}" y2="10"/>${[0, f.max].map(c => `<text class="tick" x="${X(c)}" y="8">${c}</text>`).join('')}<path d="${d}" class="trail"/>${f.r.path.slice(0, f.k + 1).map((c, k) => `<g class="dpt ${k === f.k ? 'cur' : ''}"><circle cx="${X(c)}" cy="${Y(k)}" r="5"/><text x="${X(c) + 8}" y="${Y(k) + 4}">${c}</text></g>`).join('')}</svg></div>`;
  },
});

Labs.reg({
  id: 'banker', title: '銀行家演算法', subject: 'os', lessons: ['os-deadlock'], desc: '算 Need、找安全序列；判斷請求能不能立刻核准',
  form: [{ id: 'avail', label: 'Available', value: '3 3 2' },
    { id: 'max', label: 'Max（一行一個行程）', type: 'area', rows: 5, value: '7 5 3\n3 2 2\n9 0 2\n2 2 2\n4 3 3' },
    { id: 'alloc', label: 'Allocation', type: 'area', rows: 5, value: '0 1 0\n2 0 0\n3 0 2\n2 1 1\n0 0 2' },
    { id: 'req', label: '請求（選填，如 P1: 1 0 2）', value: 'P1: 1 0 2', wide: true }],
  build(v) {
    let avail = nums(v.avail), max = matrix(v.max), alloc = matrix(v.alloc); const F = [];
    const rq = v.req.trim().match(/^P?(\d+)\s*[:：]\s*(.+)$/i);
    if (rq) {
      const i = +rq[1], r = nums(rq[2]); const need = max[i].map((x, j) => x - alloc[i][j]);
      if (r.some((x, j) => x > need[j])) { F.push({ need: max.map((row, a) => row.map((x, j) => x - alloc[a][j])), work: avail, fin: [], note: `Request > Need：P${i} 超過宣告的最大需求 → 錯誤` }); return F; }
      if (r.some((x, j) => x > avail[j])) { F.push({ need: max.map((row, a) => row.map((x, j) => x - alloc[a][j])), work: avail, fin: [], note: `Request > Available → P${i} 必須等待` }); return F; }
      avail = avail.map((x, j) => x - r[j]); alloc = alloc.map((row, a) => a === i ? row.map((x, j) => x + r[j]) : row);
      F.push({ need: max.map((row, a) => row.map((x, j) => x - alloc[a][j])), work: avail, fin: [], note: `假裝核准 P${i} 的請求 (${r.join(',')})：Available → (${avail.join(',')})，再跑安全演算法` });
    }
    const res = Sim.banker(avail, max, alloc);
    res.steps.forEach(s => F.push(Object.assign({ need: res.need, alloc, max }, s)));
    if (rq) F[F.length - 1].note += res.safe ? '。所以這個請求可以**立刻核准**。' : '。所以請求**不能**核准，P 要等待並還原狀態。';
    return F;
  },
  render(f, st) {
    st.innerHTML = htmlTable(f.need.map((r, i) => [`P${i}`, r.join(' '), f.fin && f.fin[i] ? '✓' : '']), { head: ['行程', 'Need', '完成'], cls: (i) => f.pick === i ? 'cur' : '' }) + `<p><b>Work</b> = (${f.work.join(', ')})</p>`;
  },
});

/* ===================== Labs: 計組 ===================== */
Labs.reg({
  id: 'cache', title: 'Cache 模擬', subject: 'co', lessons: ['co-cache'], desc: '直接映射／n-way／全關聯，位址切成 tag、index、offset，逐次看命中與替換',
  form: [{ id: 'C', label: 'Cache 容量', type: 'number', value: '64', size: 6 }, { id: 'B', label: '區塊大小', type: 'number', value: '8', size: 4 },
    { id: 'A', label: '關聯度', type: 'select', value: '2', options: [['1', '直接映射'], ['2', '2-way'], ['4', '4-way'], ['full', '全關聯']] },
    { id: 'm', label: '位址位元數', type: 'number', value: '16', size: 4 }, { id: 'pol', label: '替換', type: 'select', value: 'lru', options: [['lru', 'LRU'], ['fifo', 'FIFO']] },
    { id: 'addrs', label: '位址序列（同單位，可用 0x）', value: '0 4 8 32 64 0 96 128 4 36 64 0', wide: true }],
  presets: [{ name: 'H&P 直接映射（word 位址、8 塊、1 word/塊）', v: { C: '8', B: '1', A: '1', m: '5', addrs: '22 26 22 26 16 3 16 18' } }, { name: '衝突 vs 關聯度', v: { C: '32', B: '4', A: '1', addrs: '0 32 0 32 0 32 64 0' } }],
  build(v) {
    const addrs = v.addrs.split(/[\s,]+/).filter(Boolean).map(x => parseInt(x, x.startsWith('0x') ? 16 : 10));
    const r = Sim.cache({ C: +v.C, B: +v.B, A: v.A, m: +v.m, addrs, policy: v.pol });
    const F = [{ r, k: -1, note: `${r.sets} 個 set × ${r.ways} way；位址 ${v.m} bits = tag ${r.tb} | index ${r.ib} | offset ${r.ob}` }];
    r.steps.forEach((s, k) => F.push({ r, k, note: `位址 ${s.a} → 區塊 ${s.blk}，set ${s.idx}，tag ${s.tag}，offset ${s.off}：${s.hit ? '**命中**' : '**失誤**' + (s.victim != null ? `，換出 tag ${s.victim}` : '')}` + (k === r.steps.length - 1 ? `。命中 ${r.hits}/${r.steps.length}（命中率 ${(r.hits / r.steps.length * 100).toFixed(1)}%）` : '') }));
    return F;
  },
  render(f, st) {
    const r = f.r; const snap = f.k >= 0 ? r.steps[f.k].snapshot : Array.from({ length: r.sets }, () => []);
    const bin = (x, n) => n > 0 ? x.toString(2).padStart(n, '0') : '';
    const s = f.k >= 0 ? r.steps[f.k] : null;
    st.innerHTML = (s ? `<div class="addr"><span class="t">${bin(s.tag, r.tb)}</span><span class="i">${bin(s.idx, r.ib)}</span><span class="o">${bin(s.off, r.ob)}</span><small>tag | index | offset</small></div>` : '') +
      htmlTable(snap.map((set, i) => [i, ...Array.from({ length: Math.min(r.ways, 8) }, (_, w) => set[w] ? `tag ${set[w].tag}<small>（塊 ${set[w].blk}）</small>` : '—')]), { head: ['set', ...Array.from({ length: Math.min(r.ways, 8) }, (_, w) => 'way ' + w)], cls: (i) => s && s.idx === i ? (s.hit ? 'ok' : 'chg') : '' }) +
      htmlTable([r.steps.map((x, k) => k > f.k ? '' : x.hit ? 'H' : '<b class="bad-t">M</b>')], { head: r.steps.map(x => x.a) });
  },
});

Labs.reg({
  id: 'pipe', title: '5 級管線與危障', subject: 'co', lessons: ['co-pipeline'], desc: 'IF/ID/EX/MEM/WB 管線圖，比較有無 forwarding 的 stall 數；分支在 ID 決定',
  form: [{ id: 'fwd', label: 'Forwarding', type: 'check', value: true },
    { id: 'asm', label: '指令（MIPS 語法）', type: 'area', rows: 6, value: 'lw $2, 20($1)\nand $4, $2, $5\nor $8, $2, $6\nadd $9, $4, $2\nslt $1, $6, $7\nbeq $1, $9, L', wide: true }],
  presets: [{ name: 'H&P load-use', v: { asm: 'lw $2, 20($1)\nand $4, $2, $5\nor $8, $2, $6\nadd $9, $4, $2\nslt $1, $6, $7' } }, { name: '連續相依（無 forwarding）', v: { fwd: false, asm: 'sub $2, $1, $3\nand $12, $2, $5\nor $13, $6, $2\nadd $14, $2, $2\nsw $15, 100($2)' } }],
  build(v) {
    const ins = Sim.parseAsm(v.asm); const r = Sim.pipe(ins, v.fwd);
    const F = [];
    for (let c = 1; c <= r.cycles; c++) {
      const ev = [];
      r.R.forEach((x, i) => { if (x.stall && c >= x.idS && c < x.idE) ev.push(`第 ${i + 1} 條在 ID stall`); x.why.forEach(w => { if ((v.fwd ? x.EX : x.idE) === c || (v.fwd && ins[i].br && x.idE === c)) ev.push(`第 ${i + 1} 條用 $${w.r}（來自第 ${w.j + 1} 條）：${w.kind}`); }); });
      F.push({ ins, r, c, note: `Cycle ${c}${ev.length ? '：' + ev.join('；') : ''}` + (c === r.cycles ? `。共 ${r.cycles} cycles，stall ${r.stalls} 次，CPI = ${r.cycles} / ${ins.length} 條 ≈ ${(r.cycles / ins.length).toFixed(2)}（含填滿管線的 4 cycle）` : '') });
    }
    return F;
  },
  render(f, st) {
    const head = ['指令', ...Array.from({ length: f.r.cycles }, (_, k) => k + 1)];
    const rows = f.r.R.map((x, i) => {
      const cells = Array(f.r.cycles).fill('');
      const put = (c, t) => { if (c <= f.c) cells[c - 1] = t; };
      for (let c = x.IF; c < x.idS; c++) put(c, 'IF');
      put(x.idS, 'ID'); for (let c = x.idS + 1; c <= x.idE; c++) put(c, '<i>stall</i>');
      put(x.EX, 'EX'); put(x.MEM, 'MEM'); put(x.WB, 'WB');
      return [`<code>${esc(f.ins[i].line)}</code>`, ...cells];
    });
    st.innerHTML = htmlTable(rows, { head, cls: (i, j) => (j === f.c ? 'cur ' : '') + (/stall/.test(rows[i][j]) ? 'stl' : '') });
  },
});

/* ===================== Labs: 線代 ===================== */
const Frac = {
  g(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; },
  mk(n, d = 1) { if (d < 0) { n = -n; d = -d; } const g = Frac.g(n, d); return { n: n / g, d: d / g }; },
  add(a, b) { return Frac.mk(a.n * b.d + b.n * a.d, a.d * b.d); }, sub(a, b) { return Frac.mk(a.n * b.d - b.n * a.d, a.d * b.d); },
  mul(a, b) { return Frac.mk(a.n * b.n, a.d * b.d); }, div(a, b) { return Frac.mk(a.n * b.d, a.d * b.n); },
  z(a) { return a.n === 0; }, s(a) { return a.d === 1 ? String(a.n) : `${a.n}/${a.d}`; },
};
Sim.rref = function (M0) {
  const M = M0.map(r => r.map(x => Frac.mk(x))); const rows = M.length, cols = M[0].length; const ops = [];
  const snap = (note, hl = []) => ops.push({ M: M.map(r => r.map(Frac.s)), note, hl });
  snap('原矩陣');
  let r = 0; const piv = [];
  for (let c = 0; c < cols && r < rows; c++) {
    let p = r; while (p < rows && Frac.z(M[p][c])) p++;
    if (p === rows) { snap(`第 ${c + 1} 行在第 ${r + 1} 列以下全為 0 → 不是 pivot 行（對應自由變數）`); continue; }
    if (p !== r) { [M[p], M[r]] = [M[r], M[p]]; snap(`R${r + 1} ↔ R${p + 1}（列交換：det 變號）`, [r, p]); }
    const pv = M[r][c]; if (!(pv.n === 1 && pv.d === 1)) { M[r] = M[r].map(x => Frac.div(x, pv)); snap(`R${r + 1} ÷ ${Frac.s(pv)}（列倍乘：det 乘上同倍數）`, [r]); }
    for (let i = 0; i < rows; i++) if (i !== r && !Frac.z(M[i][c])) { const f = M[i][c]; M[i] = M[i].map((x, j) => Frac.sub(x, Frac.mul(f, M[r][j]))); snap(`R${i + 1} − (${Frac.s(f)})·R${r + 1}（列取代：det 不變）`, [i]); }
    piv.push(c); r++;
  }
  snap(`RREF 完成：rank = ${piv.length}，pivot 在第 ${piv.map(c => c + 1).join(', ')} 行；nullity = ${cols - piv.length}`);
  return { ops, rank: piv.length, piv, M };
};
Labs.reg({
  id: 'gauss', title: '高斯消去法到 RREF', subject: 'la', lessons: ['la-systems'], desc: '分數精確計算，每一步列運算都標出對行列式的影響',
  form: [{ id: 'm', label: '矩陣（一行一列）', type: 'area', rows: 4, value: '1 2 -1 -4\n2 3 -1 -11\n-2 0 -3 22', wide: true }],
  presets: [{ name: '非滿秩', v: { m: '1 2 3\n2 4 6\n1 1 1' } }, { name: '3×5', v: { m: '1 3 0 2 0\n2 6 1 7 1\n0 0 1 3 2' } }],
  build: v => Sim.rref(matrix(v.m)).ops,
  render(f, st) { st.innerHTML = htmlTable(f.M, { cls: i => f.hl.includes(i) ? 'chg' : '' }); },
});

Labs.reg({
  id: 'lintrans', title: '2×2 線性變換與特徵向量', subject: 'la', lessons: ['la-eigen', 'la-det'], desc: '看網格被矩陣拉伸、旋轉、剪切；特徵向量方向不變，面積倍率＝|det|',
  custom(box) {
    box.innerHTML = `<div class="lab-form"><div class="lf"><label for="lt-a">矩陣 A（a b / c d）</label><input id="lt-a" value="2 1 1 2" size="14"></div>
      <div class="lf"><label for="lt-t">變換進度</label><input id="lt-t" type="range" min="0" max="100" value="100"></div><div class="lf"><button class="btn primary" id="lt-play" type="button">播放</button></div></div>
      <div class="lab-presets">範例：${[['對稱 2 1 1 2', '2 1 1 2'], ['剪切', '1 1 0 1'], ['旋轉 90°', '0 -1 1 0'], ['投影', '1 0 0 0'], ['重根不可對角化', '2 1 0 2'], ['反射', '0 1 1 0']].map(([n, v]) => `<button class="btn sm" data-v="${v}" type="button">${n}</button>`).join('')}</div>
      <div class="lab-note" id="lt-note"></div><div class="lab-stage"><canvas id="lt-c" width="520" height="520" style="max-width:100%"></canvas></div>`;
    const cv = $('#lt-c', box), ctx = cv.getContext('2d'); const inp = $('#lt-a', box), sl = $('#lt-t', box);
    const css = k => getComputedStyle(document.body).getPropertyValue(k).trim() || '#888';
    const draw = () => {
      const v = inp.value.split(/[\s,]+/).map(Number); if (v.length < 4 || v.some(isNaN)) return;
      const [a, b, c, d] = v; const t = sl.value / 100;
      const M = [1 + (a - 1) * t, b * t, c * t, 1 + (d - 1) * t];
      const W = cv.width, s = 40, O = W / 2; const P = (x, y) => [O + s * (M[0] * x + M[1] * y), O - s * (M[2] * x + M[3] * y)];
      ctx.clearRect(0, 0, W, W);
      ctx.strokeStyle = css('--line'); ctx.lineWidth = 1;
      for (let k = -12; k <= 12; k++) { ctx.beginPath(); ctx.moveTo(O + k * s, 0); ctx.lineTo(O + k * s, W); ctx.moveTo(0, O + k * s); ctx.lineTo(W, O + k * s); ctx.stroke(); }
      ctx.strokeStyle = css('--accent'); ctx.globalAlpha = .45;
      for (let k = -8; k <= 8; k++) { ctx.beginPath(); let p = P(k, -8); ctx.moveTo(...p); p = P(k, 8); ctx.lineTo(...p); ctx.stroke(); ctx.beginPath(); p = P(-8, k); ctx.moveTo(...p); p = P(8, k); ctx.lineTo(...p); ctx.stroke(); }
      ctx.globalAlpha = .25; ctx.fillStyle = css('--hl-strong'); ctx.beginPath(); [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([x, y], i) => { const p = P(x, y); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }); ctx.fill(); ctx.globalAlpha = 1;
      const arrow = (x, y, col, w = 3) => { const p = P(x, y); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(O, O); ctx.lineTo(...p); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 7); ctx.fill(); };
      arrow(1, 0, css('--s-co')); arrow(0, 1, css('--s-ds'));
      const tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det; let txt = `tr = ${tr}，det = ${det}（單位正方形面積 × ${Math.abs(det)}${det < 0 ? '，方向翻轉' : ''}）。`;
      if (disc >= 0) {
        const l1 = (tr + Math.sqrt(disc)) / 2, l2 = (tr - Math.sqrt(disc)) / 2;
        const ev = l => { if (Math.abs(b) > 1e-9) return [b, l - a]; if (Math.abs(c) > 1e-9) return [l - d, c]; return Math.abs(l - a) < 1e-9 ? [1, 0] : [0, 1]; };
        const vecs = [...new Set([l1, l2].map(x => +x.toFixed(6)))];
        ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.strokeStyle = css('--pen');
        vecs.forEach(l => { const [x, y] = ev(l); const L = Math.hypot(x, y) || 1; ctx.beginPath(); ctx.moveTo(O - 300 * x / L, O + 300 * y / L); ctx.lineTo(O + 300 * x / L, O - 300 * y / L); ctx.stroke(); });
        ctx.setLineDash([]);
        txt += ` λ = ${+l1.toFixed(3)}${l1 !== l2 ? '、' + (+l2.toFixed(3)) : '（重根）'}。紅虛線是特徵向量方向：變換前後只被伸縮、不轉向。` + (disc === 0 && (b !== 0 || c !== 0) ? ' 重根但只有一條特徵向量方向 → **不可對角化**（幾何重數 1 < 代數重數 2）。' : '');
      } else txt += ` 判別式 ${disc} < 0 → 特徵值是複數 ${tr / 2} ± ${(Math.sqrt(-disc) / 2).toFixed(3)}i，沒有實特徵向量（有旋轉成分）。`;
      $('#lt-note', box).textContent = txt + ' 橘色向量＝A 的第一行（e₁ 的像），青色＝第二行。';
    };
    let anim = null;
    $('#lt-play', box).onclick = () => { cancelAnimationFrame(anim); let t0 = null; const step = ts => { if (!t0) t0 = ts; const p = Math.min(1, (ts - t0) / 1600); sl.value = p * 100; draw(); if (p < 1) anim = requestAnimationFrame(step); }; anim = requestAnimationFrame(step); };
    $$('[data-v]', box).forEach(b => b.onclick = () => { inp.value = b.dataset.v; $('#lt-play', box).click(); });
    inp.oninput = draw; sl.oninput = draw; draw();
  },
});
