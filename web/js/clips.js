/* 資工所衝刺站 — 直式短影音（9:16）：程式即時算出每一幀 + Web Audio 合成音樂與音效 */
'use strict';

/* ======================= 音樂與音效（全部即時合成） ======================= */
const Sound = {
  ac: null, master: null, mus: null, fx: null, on: false, timer: null, step: 0, next: 0, users: 0,
  init() {
    if (this.ac) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ac = new AC(); this.master = this.ac.createGain(); this.master.gain.value = .85; this.master.connect(this.ac.destination);
    const comp = this.ac.createDynamicsCompressor(); comp.connect(this.master);
    this.mus = this.ac.createGain(); this.mus.gain.value = .4; this.mus.connect(comp);
    this.fx = this.ac.createGain(); this.fx.gain.value = .8; this.fx.connect(comp);
    const len = this.ac.sampleRate; const b = this.ac.createBuffer(1, len, this.ac.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.noise = b;
  },
  toggle() { this.init(); if (!this.ac) return false; this.on = !this.on; if (this.on) { this.ac.resume(); if (this.users > 0) this.startMusic(); } else this.stopMusic(); try { localStorage.setItem('csgrad.sound', this.on ? '1' : '0'); } catch (e) { } document.querySelectorAll('.snd-btn').forEach(b => { b.classList.toggle('on', this.on); b.textContent = this.on ? '🔊' : '🔇'; }); return this.on; },
  env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); },
  osc(type, f, t, dur, peak, dest, a = .005) { const o = this.ac.createOscillator(), g = this.ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(g); g.connect(dest); this.env(g, t, a, peak, dur); o.start(t); o.stop(t + a + dur + .05); return o; },
  noiseHit(t, dur, peak, type, freq, dest, q = 1) { const s = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), g = this.ac.createGain(); s.buffer = this.noise; f.type = type; f.frequency.value = freq; f.Q.value = q; s.connect(f); f.connect(g); g.connect(dest); this.env(g, t, .003, peak, dur); s.start(t, Math.random() * .5); s.stop(t + dur + .05); return f; },
  /* 背景音樂：92 BPM、Am–F–C–G 的 lo-fi 小品 */
  musicStep(st, t, s16) {
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12), chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], bass = [45, 41, 48, 43], arp = [0, 1, 2, 1, 2, 0, 1, 2];
    const bar = Math.floor(st / 16) % 4, s = st % 16, ch = chords[bar];
    if (s === 0) { // pad
      for (const m of ch) for (const det of [-6, 6]) { const o = this.ac.createOscillator(), g = this.ac.createGain(), f = this.ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det; f.type = 'lowpass'; f.frequency.value = 900; o.connect(f); f.connect(g); g.connect(this.mus); const e = t + 16 * s16; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.032, t + .45); g.gain.setValueAtTime(.032, e - .05); g.gain.linearRampToValueAtTime(.0001, e + .5); o.start(t); o.stop(e + .6); }
      this.osc('sine', mtof(bass[bar]), t, 1.6, .32, this.mus, .01);
    }
    if (s === 8) this.osc('sine', mtof(bass[bar]), t, .9, .25, this.mus, .01);
    if (s % 2 === 0) this.osc('triangle', mtof(ch[arp[(st / 2) % 8]] + 12), t, .26, .1, this.mus);
    if (s === 0 || s === 10) { const o = this.osc('sine', 120, t, .32, .55, this.mus, .002); o.frequency.exponentialRampToValueAtTime(42, t + .25); }
    if (s === 4 || s === 12) this.noiseHit(t, .18, .16, 'bandpass', 1800, this.mus, .8);
    if (s % 2 === 0) this.noiseHit(t + (s % 4 === 2 ? s16 * .12 : 0), .04, s % 4 === 2 ? .07 : .045, 'highpass', 7000, this.mus);
  },
  BPM: 92,
  /* 背景音樂：92 BPM、Am–F–C–G 的 lo-fi 小品 */
  startMusic() {
    if (!this.on || !this.ac || this.timer) return;
    const s16 = 60 / this.BPM / 4; this.step = 0; this.next = this.ac.currentTime + .08;
    this.timer = setInterval(() => { while (this.next < this.ac.currentTime + .15) { this.musicStep(this.step, this.next, s16); this.step++; this.next += s16; } }, 25);
  },
  stopMusic() { clearInterval(this.timer); this.timer = null; },
  /* 離線把整支短片的配樂＋音效算成 WAV（匯出 MP4 用） */
  async renderClip(clip, sr = 44100) {
    const ac = new OfflineAudioContext(2, Math.ceil(sr * clip.dur), sr), o = Object.create(Sound);
    o.ac = ac; o.on = true; o.master = ac.createGain(); o.master.connect(ac.destination);
    o.master.gain.setValueAtTime(0, 0); o.master.gain.linearRampToValueAtTime(.85, .4); o.master.gain.setValueAtTime(.85, clip.dur - .8); o.master.gain.linearRampToValueAtTime(0, clip.dur - .05);
    const comp = ac.createDynamicsCompressor(); comp.connect(o.master);
    o.mus = ac.createGain(); o.mus.gain.value = .4; o.mus.connect(comp); o.fx = ac.createGain(); o.fx.gain.value = .8; o.fx.connect(comp);
    const b = ac.createBuffer(1, sr, sr), d = b.getChannelData(0), r = (() => { let a = 7; return () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x3fffffff) - 1; })(); for (let i = 0; i < sr; i++) d[i] = r(); o.noise = b;
    const s16 = 60 / this.BPM / 4; for (let st = 0, t = .05; t < clip.dur; st++, t += s16) o.musicStep(st, t, s16);
    for (const [ts, nm] of clip.sfx || []) o.sfx(nm, ts);
    const buf = await ac.startRendering(), L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length, out = new DataView(new ArrayBuffer(44 + n * 4));
    const w = (o2, s2) => { for (let i = 0; i < s2.length; i++) out.setUint8(o2 + i, s2.charCodeAt(i)); };
    w(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, sr, true); out.setUint32(28, sr * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) { out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
    let bin = ''; const u8 = new Uint8Array(out.buffer); for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(bin);
  },
  use(d) { this.users = Math.max(0, this.users + d); if (this.users > 0) this.startMusic(); else this.stopMusic(); },
  sfx(name, at) {
    if (!this.on || !this.ac) return; const t = (at == null ? this.ac.currentTime : at) + .005, F = this.fx;
    if (name === 'pop') { const o = this.osc('sine', 520, t, .12, .5, F, .003); o.frequency.exponentialRampToValueAtTime(980, t + .08); }
    else if (name === 'tick') this.osc('square', 1400, t, .03, .12, F, .001);
    else if (name === 'whoosh') { const f = this.noiseHit(t, .45, .35, 'bandpass', 500, F, 1.4); f.frequency.exponentialRampToValueAtTime(3500, t + .4); }
    else if (name === 'land') { const o = this.osc('triangle', 330, t, .18, .35, F, .002); o.frequency.exponentialRampToValueAtTime(180, t + .15); }
    else if (name === 'ding') { this.osc('sine', 1320, t, .9, .32, F); this.osc('sine', 1980, t, .6, .12, F); }
    else if (name === 'success') [0, .09, .18, .3].forEach((d, i) => this.osc('triangle', [523, 659, 784, 1047][i], t + d, .35, .3, F));
    else if (name === 'error') { this.osc('square', 140, t, .28, .22, F); this.osc('square', 147, t, .28, .18, F); }
    else if (name === 'rise') { const o = this.osc('sawtooth', 200, t, .7, .12, F, .05); o.frequency.exponentialRampToValueAtTime(900, t + .6); }
    else if (name === 'boom') { const o = this.osc('sine', 90, t, .7, .6, F, .002); o.frequency.exponentialRampToValueAtTime(35, t + .5); this.noiseHit(t, .4, .25, 'lowpass', 800, F); }
  },
};
try { Sound.wanted = localStorage.getItem('csgrad.sound') !== '0'; } catch (e) { Sound.wanted = true; }
/* 瀏覽器規定要先有一次點擊才能出聲：第一次點頁面任何地方就自動開聲音（除非之前按過靜音） */
document.addEventListener('pointerdown', e => { if (Sound.wanted && !Sound.on && !(e.target.closest && e.target.closest('.snd-btn'))) Sound.toggle(); }, true);
document.addEventListener('visibilitychange', () => { if (!Sound.ac) return; if (document.hidden) Sound.ac.suspend(); else if (Sound.on) Sound.ac.resume(); });

/* ======================= 繪圖引擎 ======================= */
const Clips = (() => {
  const W = 720, H = 1280;
  let ctx = null;
  const C = { ink: '#eef3ff', dim: '#8390ab', faint: '#2a3552', teal: '#2ee6c9', amber: '#ffc547', coral: '#ff6b8b', violet: '#a98bff', green: '#5cf28a', blue: '#5aa8ff' };
  const SUBC = { ds: C.teal, al: C.violet, co: C.amber, os: C.coral, dm: C.green, la: C.blue };
  const SANS = '"Noto Sans TC","Noto Sans CJK TC","Microsoft JhengHei","PingFang TC",sans-serif', SERIF = '"Noto Serif TC","Noto Serif CJK TC","PMingLiU",serif', MONO = '"JetBrains Mono","DejaVu Sans Mono",Consolas,monospace';
  const E = { io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out: t => 1 - Math.pow(1 - t, 3), back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }, lin: t => t };
  const cl = x => Math.max(0, Math.min(1, x)), L = (a, b, u) => a + (b - a) * u;
  const P = (t, s, d, e = E.io) => e(cl((t - s) / d));
  const win = (t, s, e, f = .35) => Math.min(cl((t - s) / f), cl((e - t) / f));
  const bell = (t, s, d) => { const u = (t - s) / d; return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u); };
  const count = (t, s, d, a, b) => Math.round(L(a, b, P(t, s, d, E.out)));
  function rnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const STARS = (() => { const r = rnd(9); return Array.from({ length: 120 }, () => ({ x: r() * W, y: r() * H, s: r() * 1.7 + .4, p: r() * 6.28, v: r() * .8 + .3 })); })();

  function bg(t, acc) {
    const g = ctx.createLinearGradient(0, 0, W * .4, H); g.addColorStop(0, '#060a14'); g.addColorStop(1, '#0e1832'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const [bx, by, br, col] of [[.15, .18, 420, acc], [.9, .45, 460, C.violet], [.3, .95, 480, C.blue]]) {
      const x = bx * W + Math.sin(t * .27 + bx * 9) * 50, y = by * H + Math.cos(t * .21 + by * 7) * 40;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, br); rg.addColorStop(0, col + '24'); rg.addColorStop(1, col + '00'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    }
    for (const s of STARS) { ctx.globalAlpha = .2 + .35 * (.5 + .5 * Math.sin(t * s.v * 1.3 + s.p)); ctx.fillStyle = '#d4e4ff'; ctx.fillRect(s.x, (s.y - t * 6 * s.v + H * 4) % H, s.s, s.s); }
    ctx.globalAlpha = 1;
  }
  function txt(s, x, y, o = {}) {
    const { size = 30, color = C.ink, align = 'center', weight = 600, font = SANS, alpha = 1, glow = 0, grad = null, spacing = 0 } = o;
    if (alpha <= .003 || s === '' || s == null) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; if (spacing) ctx.letterSpacing = spacing + 'px';
    if (grad) { const w = ctx.measureText(s).width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x; const lg = ctx.createLinearGradient(x0, 0, x0 + w, 0); grad.forEach((c, i) => lg.addColorStop(i / (grad.length - 1), c)); ctx.fillStyle = lg; } else ctx.fillStyle = color;
    if (glow) { ctx.shadowColor = grad ? grad[0] : color; ctx.shadowBlur = glow; }
    ctx.fillText(String(s), x, y); ctx.restore();
  }
  function wrap(s, maxW, size, weight = 600, font = SANS) {
    ctx.save(); ctx.font = `${weight} ${size}px ${font}`; const toks = String(s).match(/[A-Za-z0-9_.,()'^+\-=·×→⟷|∣∧∨≥≤/]+|\s+|./gu) || []; const lines = []; let cur = '';
    for (const tk of toks) { if (ctx.measureText(cur + tk).width > maxW && cur.trim()) { lines.push(cur.trim()); cur = tk.trim() ? tk : ''; } else cur += tk; }
    if (cur.trim()) lines.push(cur.trim()); ctx.restore(); return lines;
  }
  const typeIn = (s, u) => [...s].slice(0, Math.floor([...s].length * cl(u))).join('');
  function rrect(x, y, w, h, r, fill, stroke, lw = 1.5) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } }
  function node(x, y, r, label, o = {}) {
    const { stroke = C.dim, scale = 1, alpha = 1, glow = 0, size = 22, lw = 2.5, fill = '#121b31', color = C.ink } = o;
    if (scale <= .001 || alpha <= .003) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(scale, scale);
    if (glow) { ctx.shadowColor = stroke; ctx.shadowBlur = glow; }
    const g = ctx.createRadialGradient(-r * .3, -r * .4, 2, 0, 0, r); g.addColorStop(0, '#26375e'); g.addColorStop(1, fill); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); ctx.shadowBlur = 0;
    txt(label, 0, 1, { size, weight: 700, font: MONO, color }); ctx.restore();
  }
  function line(x1, y1, x2, y2, u = 1, o = {}) { if (u <= 0) return; const { color = C.dim, w = 2, glow = 0, alpha = 1, dash = null } = o; ctx.save(); ctx.globalAlpha *= alpha; if (dash) ctx.setLineDash(dash); if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; } ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(L(x1, x2, u), L(y1, y2, u)); ctx.stroke(); ctx.restore(); }
  function arrow(x1, y1, x2, y2, u, o = {}) { if (u <= 0) return; const { color = C.ink, w = 4, glow = 14, alpha = 1 } = o; const ex = L(x1, x2, u), ey = L(y1, y2, u); line(x1, y1, ex, ey, 1, { color, w, glow, alpha }); const a = Math.atan2(ey - y1, ex - x1); ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = glow; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 16 * Math.cos(a - .45), ey - 16 * Math.sin(a - .45)); ctx.lineTo(ex - 16 * Math.cos(a + .45), ey - 16 * Math.sin(a + .45)); ctx.closePath(); ctx.fill(); ctx.restore(); }
  function poly(pts, u, o = {}) {
    if (u <= 0 || pts.length < 2) return null; const { color = C.blue, w = 5, glow = 16, alpha = 1 } = o; const seg = []; let tot = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
    let rem = tot * cl(u), head = pts[0]; ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.shadowColor = color; ctx.shadowBlur = glow; ctx.beginPath(); ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length && rem > 0; i++) { const f = Math.min(1, rem / (seg[i - 1] || 1)); head = [L(pts[i - 1][0], pts[i][0], f), L(pts[i - 1][1], pts[i][1], f)]; ctx.lineTo(...head); rem -= seg[i - 1]; }
    ctx.stroke(); ctx.restore(); return head;
  }
  function curve(x1, y1, x2, y2, hgt, u, o) { const pts = []; const cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - hgt; for (let i = 0; i <= 28; i++) { const s = i / 28; pts.push([(1 - s) * (1 - s) * x1 + 2 * (1 - s) * s * cx + s * s * x2, (1 - s) * (1 - s) * y1 + 2 * (1 - s) * s * cy + s * s * y2]); } return poly(pts, u, o); }
  function burst(x, y, t, t0, col, n = 18, seed = 1, spread = 90) { const u = (t - t0) / 1.1; if (u <= 0 || u >= 1) return; const r = rnd(seed); ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 10; for (let i = 0; i < n; i++) { const a = r() * 6.283, d = E.out(u) * (r() * .6 + .4) * spread; ctx.globalAlpha = (1 - u) * .9; ctx.fillStyle = i % 3 ? col : '#fff'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d - 20 * u * u, 2.8 * (1 - u) + .6, 0, 7); ctx.fill(); } ctx.restore(); }
  function ring(x, y, t, t0, col, r0 = 18, r1 = 70) { const u = (t - t0) / .9; if (u <= 0 || u >= 1) return; ctx.save(); ctx.globalAlpha = 1 - u; ctx.strokeStyle = col; ctx.lineWidth = 3 * (1 - u) + 1; ctx.shadowColor = col; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(x, y, L(r0, r1, E.out(u)), 0, 7); ctx.stroke(); ctx.restore(); }
  function pop(t, s, x, y, fn, d = .6) { const u = P(t, s, d, E.back); if (u <= 0) return; ctx.save(); ctx.globalAlpha *= cl(u); ctx.translate(x, y); ctx.scale(L(.4, 1, Math.min(u, 1.15)), L(.4, 1, Math.min(u, 1.15))); fn(); ctx.restore(); }
  function hook(t, clip) {
    const acc = SUBC[clip.subject] || C.teal; const a = P(t, .05, .5, E.out);
    ctx.save(); ctx.globalAlpha = a; ctx.font = `700 22px ${SANS}`; const w = ctx.measureText(clip.chip).width + 40; rrect(W / 2 - w / 2, 62, w, 40, 20, acc + '22', acc + 'aa', 1.5); ctx.restore();
    txt(clip.chip, W / 2, 83, { size: 22, weight: 700, color: acc, alpha: a });
    clip.hook.forEach((ln, i) => { const u = P(t, .15 + i * .18, .6, E.back); txt(ln, W / 2, 158 + i * 66 + (1 - cl(u)) * 40, { size: i === 0 ? 50 : 42, weight: 900, font: SERIF, grad: i === 0 ? [acc, C.violet] : null, color: C.ink, alpha: cl(u), glow: i === 0 ? 22 : 0 }); });
  }
  function caps(t, list) {
    for (const [s, e, c] of list) {
      const a = win(t, s, e, .3); if (a <= 0) continue; const yo = (1 - P(t, s, .4, E.out)) * 18; const lines = wrap(c, 610, 34, 700); const h = lines.length * 48 + 36, y0 = 1118 - h / 2 + yo;
      ctx.save(); ctx.globalAlpha = a * .9; rrect(40, y0, W - 80, h, 22, 'rgba(8,13,28,.82)', 'rgba(255,255,255,.08)'); ctx.restore();
      lines.forEach((ln, i) => txt(ln, W / 2, y0 + 18 + 24 + i * 48, { size: 34, weight: 700, alpha: a, color: '#f5f8ff' }));
    }
  }
  const LIST = [];
  const def = c => LIST.push(c);

  /* ================= 離散：鴿籠 ================= */
  (() => {
    const a = [5, 3, 8, 1, 9, 2, 7, 4, 6, 10], N = 10, n = 3, inc = [], dec = [];
    for (let k = N - 1; k >= 0; k--) { inc[k] = 1; dec[k] = 1; for (let j = k + 1; j < N; j++) { if (a[j] > a[k]) inc[k] = Math.max(inc[k], inc[j] + 1); if (a[j] < a[k]) dec[k] = Math.max(dec[k], dec[j] + 1); } }
    const X = k => 72 + k * 64, Y = 350, over = a.map((_, k) => inc[k] > n || dec[k] > n), gx = 180, gy = 500, cw = 120, ch = 76;
    let oi = 0; const tgt = a.map((_, k) => over[k] ? [168 + (oi++) * 128, 852] : [gx + (dec[k] - .5) * cw, gy + (inc[k] - .5) * ch]);
    const scan = k => 2.2 + (N - 1 - k) * .62, fly = k => 9 + k * .5, lis = [3, 5, 7, 8, 9];
    def({ id: 'dm-pigeon', subject: 'dm', lesson: 'dm-logic', chip: '離散數學 · 鴿籠原理', hook: ['10 個亂數裡', '一定藏著長度 4 的單調序列？'], dur: 27,
      sfx: [...a.map((_, k) => [.6 + k * .06, 'tick']), ...a.map((_, k) => [scan(k) + .3, 'pop']), [8.7, 'whoosh'], ...a.map((_, k) => [fly(k) + .8, over[k] ? 'error' : 'land']), ...lis.map((_, q) => [17.6 + q * .8, 'pop']), [21, 'success']],
      draw(t) {
        const gridA = win(t, 8.6, 17.2, .7), dimRow = 1 - .45 * gridA;
        for (let k = 0; k < N; k++) { const w = win(t, scan(k), scan(k) + .62, .2); if (w > 0) for (let j = k + 1; j < N; j++) curve(X(k), Y - 28, X(j), Y - 28, 18 + (j - k) * 7, 1, { color: a[j] > a[k] ? C.teal : C.violet, w: 1.6, glow: 8, alpha: w * .6 }); }
        for (let k = 0; k < N; k++) {
          const li = lis.indexOf(k), lit = li >= 0 ? P(t, 17.6 + li * .8, .4) : 0, act = win(t, scan(k), scan(k) + .62, .15);
          node(X(k), Y, 25, a[k], { scale: P(t, .6 + k * .06, .5, E.back), stroke: lit > 0 ? C.amber : act > 0 ? C.teal : C.dim, glow: 26 * Math.max(act, lit), alpha: Math.max(dimRow, lit), size: 20 });
          const lab = P(t, scan(k) + .3, .4, E.back); txt(`(${inc[k]},${dec[k]})`, X(k), Y + 46, { size: 15, font: MONO, weight: 700, color: over[k] ? C.coral : C.ink, alpha: cl(lab) * Math.max(dimRow, lit) });
          burst(X(k), Y + 46, t, scan(k) + .3, over[k] ? C.coral : C.teal, 9, k + 3, 36);
        }
        for (let k = 0; k < N; k++) { const w = win(t, scan(k), scan(k) + .62, .12); if (w <= 0 || t > 8.6) continue;
          node(360, 570, 62, a[k], { stroke: C.teal, glow: 30, size: 52, alpha: w, scale: L(.85, 1, w) });
          txt(`↗ 往右最長遞增  i = ${inc[k]}`, 360, 690, { size: 34, weight: 800, color: C.teal, alpha: w });
          txt(`↘ 往右最長遞減  d = ${dec[k]}`, 360, 745, { size: 34, weight: 800, color: C.violet, alpha: w });
          if (over[k]) txt('超過 3 了！', 360, 810, { size: 30, weight: 900, color: C.coral, alpha: w, glow: 16 }); }
        if (gridA > 0) { ctx.save(); ctx.globalAlpha = gridA;
          for (let i = 0; i < 3; i++) for (let d = 0; d < 3; d++) rrect(gx + d * cw + 5, gy + i * ch + 5, cw - 10, ch - 10, 12, 'rgba(46,230,201,.07)', 'rgba(46,230,201,.4)');
          for (let i = 0; i < 3; i++) txt(`i=${i + 1}`, gx - 34, gy + (i + .5) * ch, { size: 18, color: C.dim, font: MONO });
          for (let d = 0; d < 3; d++) txt(`d=${d + 1}`, gx + (d + .5) * cw, gy - 20, { size: 18, color: C.dim, font: MONO });
          rrect(90, 795, 540, 114, 20, 'rgba(255,107,139,.08)', 'rgba(255,107,139,.55)'); txt('擠不進 9 個鴿籠', 360, 772, { size: 22, color: C.coral, weight: 700 }); ctx.restore(); }
        for (let k = 0; k < N; k++) { const u = P(t, fly(k), .8); if (u <= 0 || t > 17.2) continue; const [tx, ty] = tgt[k];
          node(L(X(k), tx, u), L(Y, ty, u) - Math.sin(Math.PI * u) * 80, 24, a[k], { stroke: over[k] ? C.coral : C.teal, glow: over[k] ? 26 : 14, size: 19, alpha: gridA });
          if (u >= 1) { ring(tx, ty, t, fly(k) + .8, over[k] ? C.coral : C.teal); burst(tx, ty, t, fly(k) + .8, over[k] ? C.coral : C.teal, 12, k * 7 + 1, 55); } }
        for (let q = 0; q < 4; q++) curve(X(lis[q]), Y - 30, X(lis[q + 1]), Y - 30, 46, P(t, 17.6 + q * .8, .7), { color: C.amber, w: 4, glow: 20 });
        txt('1 → 2 → 4 → 6 → 10', W / 2, 600, { size: 44, font: MONO, weight: 800, color: C.amber, glow: 18, alpha: P(t, 18.4, .6) });
        pop(t, 21, W / 2, 720, () => txt('長度 5 ≥ 4 ✓', 0, 0, { size: 66, weight: 900, font: SERIF, grad: [C.amber, C.coral], glow: 30 }));
        burst(W / 2, 720, t, 21.1, C.amber, 40, 5, 260);
        caps(t, [[.4, 8.4, '從右往左，替每個數算出 (i, d)：以它開頭的最長遞增、遞減長度'], [8.6, 13.4, 'i、d 都 ≤ 3 的話只有 9 個鴿籠，卻有 10 隻鴿子'], [13.5, 17.2, '有人擠不進去：同一格的兩數會互相矛盾'], [17.4, 26.7, '所以一定有長度 ≥ 4 的單調子序列']]);
      } });
  })();

  /* ================= 離散：排容 ================= */
  (() => {
    const R = 135, CI = { A: [300, 520, C.teal], B: [417, 520, C.violet], C: [358, 621, C.amber] };
    const RG = { a: [9, 232, 488, 'A'], b: [13, 488, 488, 'B'], c: [8, 360, 704, 'C'], ab: [5, 360, 468, 'AB'], ac: [3, 291, 597, 'AC'], bc: [4, 429, 597, 'BC'], abc: [3, 360, 554, 'ABC'] };
    const steps = [['+', 'A', 20], ['+', 'B', 25], ['+', 'C', 18], ['−', 'AB', 8], ['−', 'AC', 6], ['−', 'BC', 7], ['+', 'ABC', 3]], st = j => 4 + j * 1.9, tot = [20, 45, 63, 55, 49, 42, 45];
    const clipFill = (sets, col, al) => { ctx.save(); for (const s of sets) { ctx.beginPath(); ctx.arc(CI[s][0], CI[s][1], R, 0, 7); ctx.clip(); } ctx.globalAlpha = al; ctx.fillStyle = col; ctx.fillRect(-W, -H, 3 * W, 3 * H); ctx.restore(); };
    def({ id: 'dm-venn', subject: 'dm', lesson: 'dm-counting', chip: '離散數學 · 排容原理', hook: ['排容原理', '為什麼要「加加減減」？'], dur: 25,
      sfx: [[.7, 'whoosh'], [1.1, 'whoosh'], [1.5, 'whoosh'], ...steps.map(([sg], j) => [st(j), sg === '+' ? 'pop' : 'land']), [15.6, 'ding'], [17.6, 'success']],
      draw(t) {
        ctx.save(); ctx.translate(360, 560); ctx.scale(1.18, 1.18); ctx.translate(-360, -560);
        Object.entries(CI).forEach(([nm, [x, y, c]], i) => { const u = P(t, .6 + i * .4, 1.1); clipFill([nm], c, .08 * u); ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 3.5; ctx.shadowColor = c; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(x, y, R, -Math.PI / 2, -Math.PI / 2 + 6.2832 * u); ctx.stroke(); ctx.restore();
          const lp = { A: [175, 400], B: [545, 400], C: [358, 790] }[nm]; txt(nm, lp[0], lp[1], { size: 40, weight: 900, font: SERIF, color: c, alpha: u, glow: 14 }); });
        steps.forEach(([sg, S], j) => { const b = bell(t, st(j), 1.5); if (b > 0) clipFill([...S], sg === '+' ? C.green : C.coral, .34 * b); });
        const cnt = { a: 0, b: 0, c: 0, ab: 0, ac: 0, bc: 0, abc: 0 }; steps.forEach(([sg, S], j) => { if (t >= st(j) + .6) for (const k in cnt) if ([...S].every(z => RG[k][3].includes(z))) cnt[k] += sg === '+' ? 1 : -1; });
        for (const [k, [v, x, y]] of Object.entries(RG)) { const c = cnt[k], col = c === 1 ? C.green : c === 0 ? C.dim : C.coral; const pulse = Math.max(0, ...steps.map(([, S], j) => [...S].every(z => RG[k][3].includes(z)) ? bell(t, st(j) + .5, .6) : 0));
          pop(t, 2.5, x, y, () => { ctx.scale(1 + .25 * pulse, 1 + .25 * pulse); txt(String(v), 0, -11, { size: 26, weight: 800, font: MONO }); rrect(-28, 6, 56, 24, 12, col + '33', col); txt('×' + c, 0, 18.5, { size: 16, weight: 700, font: MONO, color: col }); }); }
        if (t > 17.5) Object.values(RG).forEach(([, x, y], i) => burst(x, y, t, 17.5 + i * .07, C.green, 10, i * 9 + 4, 45));
        ctx.restore();
        let s = ''; ctx.save(); ctx.font = `700 30px ${MONO}`; const full = '20 + 25 + 18 − 8 − 6 − 7 + 3'; const fw = ctx.measureText(full).width; ctx.restore();
        let x = W / 2 - fw / 2; ['20', ' + 25', ' + 18', ' − 8', ' − 6', ' − 7', ' + 3'].forEach((tk, j) => { ctx.save(); ctx.font = `700 30px ${MONO}`; const w = ctx.measureText(tk).width; ctx.restore(); txt(tk, x, 885, { size: 30, font: MONO, weight: 700, align: 'left', color: j >= 3 && j <= 5 ? C.coral : C.green, alpha: P(t, st(j), .4) }); x += w; });
        let total = 0; for (let j = 0; j < 7; j++) if (t >= st(j)) total = count(t, st(j), .7, j ? tot[j - 1] : 0, tot[j]);
        if (t > st(0)) txt('= ' + total, W / 2, 968, { size: 84, weight: 900, font: SERIF, grad: t > 17.4 ? [C.green, C.teal] : [C.ink, C.violet], glow: t > 17.4 ? 30 : 8 });
        caps(t, [[.4, 3.9, '把三個集合直接相加，重疊的地方會被重複算'], [4, 9.6, '加上 A、B、C：重疊區算了 2 次、正中間 3 次'], [9.7, 15.3, '減掉兩兩交集：正中間被扣成 0 次'], [15.4, 19.6, '加回三者交集：每一塊都剛好 ×1'], [19.7, 24.7, '口訣：奇數個交集加、偶數個交集減']]);
      } });
  })();

  /* ================= 離散：Catalan ================= */
  (() => {
    const path = 'RUURURRU', n = 4, s = 96, ox = 168, oy = 805, X = x => ox + x * s, Y = y => oy - y * s;
    const pts = [[0, 0]]; for (const c of path) { const [x, y] = pts[pts.length - 1]; pts.push(c === 'R' ? [x + 1, y] : [x, y + 1]); }
    const ref = pts.map((p, i) => i < 3 ? p : [p[1] - 1, p[0] + 1]), tT = 4 + .7 * 3;
    def({ id: 'dm-catalan', subject: 'dm', lesson: 'dm-counting', chip: '離散數學 · Catalan 數', hook: ['不越過對角線的路徑', '用一面鏡子數完'], dur: 28,
      sfx: [[1, 'whoosh'], ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => [4 + i * .7, 'tick']), [tT, 'error'], [10.5, 'rise'], [13.4, 'land'], [14.3, 'pop'], [19.2, 'success']],
      draw(t) {
        const g = P(t, .6, 1.2); for (let i = 0; i <= n + 1; i++) line(X(0), Y(i), X(n), Y(i), g, { color: C.faint, w: 1.5 }); for (let i = 0; i <= n; i++) line(X(i), Y(0), X(i), Y(n + 1), g, { color: C.faint, w: 1.5 });
        line(X(0), Y(0), X(n), Y(n), P(t, 1.4, 1), { color: C.green, w: 3, glow: 12 }); line(X(0), Y(1), X(n), Y(n + 1), P(t, 1.9, 1), { color: C.coral, w: 3, glow: 10 + 26 * win(t, 10.3, 14, .5), dash: [12, 9] });
        txt('y = x + 1', X(0) - 10, Y(1) - 16, { size: 20, font: MONO, color: C.coral, align: 'right', alpha: P(t, 2.4, .5) });
        const P0 = pts.map(([x, y]) => [X(x), Y(y)]), u = P(t, 4, 5.6, E.lin), ru = P(t, 10.5, 2.9);
        const head = poly(P0, u, { color: C.blue, w: 6, glow: 18, alpha: ru > 0 ? L(1, .3, ru) : 1 });
        if (head && u < 1) { ctx.save(); ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(...head, 8, 0, 7); ctx.fill(); ctx.restore(); }
        if (t > tT) { ring(X(1), Y(2), t, tT, C.coral, 10, 90); burst(X(1), Y(2), t, tT, C.coral, 26, 5, 120); node(X(1), Y(2), 11, '', { stroke: C.coral, fill: C.coral, glow: 28 }); }
        if (ru > 0) { const M = pts.map((p, i) => i < 3 ? [X(p[0]), Y(p[1])] : [X(L(p[0], ref[i][0], ru)), Y(L(p[1], ref[i][1], ru))]); poly(M, 1, { color: C.amber, w: 6.5, glow: 28 }); const e = M[M.length - 1];
          node(e[0], e[1], 11, '', { stroke: C.amber, fill: C.amber, glow: 30 }); txt(ru < .5 ? '(4,4)' : '(3,5)', e[0] + 18, e[1] - 26, { size: 24, font: MONO, weight: 800, color: C.amber, align: 'left' }); burst(e[0], e[1], t, 13.4, C.amber, 26, 8, 120); }
        txt(`全部 C(8,4) = ${count(t, 2.5, 1.3, 0, 70)}`, W / 2, 868, { size: 30, font: MONO, weight: 700, alpha: P(t, 2.5, .5) });
        txt(`壞路徑 C(8,5) = ${count(t, 14.3, 1.3, 0, 56)}`, W / 2, 914, { size: 30, font: MONO, weight: 700, color: C.amber, alpha: P(t, 14.3, .5) });
        pop(t, 19, W / 2, 985, () => txt(`好路徑 = ${count(t, 19.2, 1, 70, 14)} = C₄`, 0, 0, { size: 46, weight: 900, font: SERIF, grad: [C.green, C.teal], glow: 26 }));
        burst(W / 2, 985, t, 19.4, C.green, 36, 13, 240);
        caps(t, [[.4, 3.9, '從 (0,0) 走到 (4,4)，不越過對角線的路徑有幾條？'], [4, 10.3, '這條碰到了虛線 y = x + 1：它是壞路徑'], [10.4, 14.1, '把碰到之後的每一步鏡射：終點變成 (3,5)'], [14.2, 18.8, '壞路徑 ↔ 走到 (3,5) 的路徑，一一對應'], [18.9, 27.7, '70 − 56 = 14，正是 Catalan 數']]);
      } });
  })();

  /* ================= 離散：Hasse ================= */
  (() => {
    const D = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60], om = m => { let c = 0; for (let p = 2; p * p <= m; p++) while (m % p === 0) { m /= p; c++; } return c + (m > 1 ? 1 : 0); };
    const lv = {}; D.forEach(d => lv[d] = om(d)); const levels = [0, 1, 2, 3, 4].map(l => D.filter(d => lv[d] === l)), Pp = {};
    levels.forEach((ds, l) => ds.forEach((d, j) => { Pp[d] = [360 + (j - (ds.length - 1) / 2) * 128, 900 - l * 132]; }));
    const all = [], cov = []; for (const a of D) for (const b of D) if (a < b && b % a === 0) { all.push([a, b]); if (!D.some(c => c !== a && c !== b && c % a === 0 && b % c === 0)) cov.push([a, b]); }
    const isCov = (a, b) => cov.some(([x, y]) => x === a && y === b), chain = [1, 2, 4, 12, 60], anti = [4, 6, 10, 15];
    def({ id: 'dm-hasse', subject: 'dm', lesson: 'dm-relations', chip: '離散數學 · 偏序與格', hook: ['60 的 12 個因數', '排成一棟樓'], dur: 26,
      sfx: [...D.map((d, i) => [.6 + lv[d] * .45 + levels[lv[d]].indexOf(d) * .08, 'tick']), [3.2, 'error'], [6.2, 'whoosh'], [8.6, 'ding'], ...[0, 1, 2, 3].map(i => [9.4 + i * .9, 'pop']), [14.2, 'rise'], [19.2, 'pop'], [21, 'success']],
      draw(t) {
        const allA = P(t, 3.1, 1.4), red = P(t, 6.1, 2.4), chainOn = win(t, 9, 13.9, .5), aw = win(t, 14, 18.9, .5), mj = win(t, 19, 26, .5);
        for (const [a, b] of all) { if (!isCov(a, b)) { line(...Pp[a], ...Pp[b], 1, { color: C.coral, w: 1.4, alpha: allA * (1 - red) * .6 }); continue; }
          let col = C.dim, w = 2, glow = 0, al = Math.max(allA * .6, red * .95); const ci = chain.indexOf(a);
          if (chainOn > 0 && ci >= 0 && chain[ci + 1] === b) { line(...Pp[a], ...Pp[b], 1, { color: col, w, alpha: al }); line(...Pp[a], ...Pp[b], P(t, 9.4 + ci * .9, .7), { color: C.teal, w: 6, glow: 24, alpha: chainOn }); continue; }
          if (mj > 0 && a === 4 && (b === 12 || b === 20)) { col = C.teal; w = 6; glow = 24; al = mj; } if (mj > 0 && b === 60 && (a === 12 || a === 20)) { col = C.coral; w = 6; glow = 24; al = mj; }
          line(...Pp[a], ...Pp[b], 1, { color: col, w, glow, alpha: al }); }
        for (const d of D) { const l = lv[d], j = levels[l].indexOf(d); let stroke = C.dim, glow = 0; const ci = chain.indexOf(d);
          if (ci >= 0 && chainOn > 0 && t > 9.4 + Math.max(0, ci - 1) * .9 + (ci ? .7 : 0)) { stroke = C.teal; glow = 26; }
          if (anti.includes(d) && aw > 0) { stroke = C.amber; glow = 30 * aw * (.7 + .3 * Math.sin(t * 7)); }
          if (mj > 0 && (d === 12 || d === 20)) { stroke = C.violet; glow = 26; } if (mj > 0 && d === 4) { stroke = C.teal; glow = 30; } if (mj > 0 && d === 60) { stroke = C.coral; glow = 30; }
          node(...Pp[d], 30, d, { scale: P(t, .6 + l * .45 + j * .08, .5, E.back), stroke, glow, size: 21 }); }
        if (aw > 0) line(80, Pp[4][1], 640, Pp[4][1], P(t, 14, .6), { color: C.amber, w: 2, dash: [8, 9], alpha: aw * .7 });
        const ph = [[9, 13.9, '1 ∣ 2 ∣ 4 ∣ 12 ∣ 60　長度 5', C.teal], [14, 18.9, '{4, 6, 10, 15}　兩兩不能整除', C.amber], [19, 26, '12 ∧ 20 = 4　　12 ∨ 20 = 60', C.violet]];
        for (const [s, e, str, col] of ph) txt(str, W / 2, 985, { size: 32, font: MONO, weight: 800, color: col, alpha: win(t, s, e, .4), glow: 12 });
        burst(360, 640, t, 8.6, C.green, 34, 21, 300);
        caps(t, [[.4, 3, '把 60 的因數依「整除」排起來'], [3.1, 5.9, '所有可比較的對都連起來：一團亂'], [6, 8.9, '擦掉能由遞移推出的邊，就是 Hasse 圖'], [9, 13.9, '最長鏈：長度 5'], [14, 18.9, '同一層互相不能整除：最大反鏈 4 個'], [19, 25.7, '往下 gcd、往上 lcm：任兩元素都有 → 這是「格」']]);
      } });
  })();

  /* ================= 離散：歐幾里得 ================= */
  (() => {
    const k = 2.3, ox = 70, oy = 330, R = (x, y, w, h) => [ox + x * k, oy + y * k, w * k, h * k];
    const sq = [[0, 0, 198, C.teal, 2.5], [198, 0, 54, C.amber, 5.4], [198, 54, 54, C.amber, 5.9], [198, 108, 54, C.amber, 6.4], [198, 162, 36, C.violet, 9.4], [234, 162, 18, C.coral, 12], [234, 180, 18, C.coral, 12.5]];
    const eq = [['252 = 1 × 198 + 54', C.teal, 3], ['198 = 3 × 54 + 36', C.amber, 7], ['54 = 1 × 36 + 18', C.violet, 10], ['36 = 2 × 18 + 0', C.coral, 13]];
    def({ id: 'dm-euclid', subject: 'dm', lesson: 'dm-nt-algebra', chip: '離散數學 · 歐幾里得演算法', hook: ['gcd 其實是', '在鋪地磚'], dur: 27,
      sfx: [[.7, 'whoosh'], ...sq.map(s => [s[4] + .3, 'land']), [14.8, 'ding'], [15.2, 'rise'], [20.5, 'success']],
      draw(t) {
        const [rx, ry, rw, rh] = R(0, 0, 252, 198), o = P(t, .6, 1.4);
        ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.shadowColor = C.ink; ctx.shadowBlur = 10; ctx.setLineDash([2 * (rw + rh) * o, 5000]); ctx.strokeRect(rx, ry, rw, rh); ctx.restore();
        txt('252', rx + rw / 2, ry - 26, { size: 26, font: MONO, color: C.dim, alpha: P(t, 1.2, .5) }); txt('198', rx + rw + 34, ry + rh / 2, { size: 26, font: MONO, color: C.dim, alpha: P(t, 1.4, .5) });
        sq.forEach(([x, y, s, col, t0], i) => { const u = P(t, t0, .7, E.back); if (u <= 0) return; const [sx, sy, sw] = R(x, y, s, s); const sc = Math.min(u, 1.1);
          ctx.save(); ctx.translate(sx, sy); ctx.scale(sc, sc); ctx.globalAlpha = cl(u); const g = ctx.createLinearGradient(0, 0, sw, sw); g.addColorStop(0, col + '5a'); g.addColorStop(1, col + '18'); ctx.fillStyle = g; ctx.fillRect(2, 2, sw - 4, sw - 4); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.strokeRect(2, 2, sw - 4, sw - 4); ctx.restore();
          if (s >= 36) txt(String(s), sx + sw / 2, sy + sw / 2, { size: s > 100 ? 64 : 26, font: MONO, weight: 800, color: col, alpha: cl(u) * (1 - .6 * P(t, 15, .8)), glow: 12 });
          burst(sx + sw / 2, sy + sw / 2, t, t0 + .3, col, 14, i * 17 + 2, 50 + s * .3); });
        const gu = P(t, 15.2, 2.2); if (gu > 0) { ctx.save(); ctx.globalAlpha = .6; ctx.strokeStyle = C.coral; ctx.lineWidth = 1.2; ctx.shadowColor = C.coral; ctx.shadowBlur = 6;
          for (let i = 1; i < 14; i++) { const x = rx + i * 18 * k; ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x, ry + rh * cl(gu * 1.4 - i * .03)); ctx.stroke(); }
          for (let j = 1; j < 11; j++) { const y = ry + j * 18 * k; ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx + rw * cl(gu * 1.4 - j * .03), y); ctx.stroke(); } ctx.restore(); }
        const fe = 1 - P(t, 14.6, .5); eq.forEach(([s, col, t0], i) => txt(typeIn(s, P(t, t0, .9, E.lin)), W / 2, 835 + i * 46, { size: 30, font: MONO, weight: 800, color: col, alpha: fe, glow: 8 }));
        pop(t, 14.8, W / 2, 860, () => txt('gcd(252, 198) = 18', 0, 0, { size: 52, weight: 900, font: SERIF, grad: [C.coral, C.amber], glow: 28 }));
        txt('14 × 18 = 252　　11 × 18 = 198', W / 2, 930, { size: 26, font: MONO, color: C.coral, weight: 700, alpha: P(t, 16.5, .6) });
        pop(t, 20.3, W / 2, 990, () => txt('18 = 4 · 252 − 5 · 198', 0, 0, { size: 38, font: MONO, weight: 800, color: C.amber, glow: 18 }));
        burst(W / 2, 860, t, 14.9, C.coral, 34, 31, 240);
        caps(t, [[.4, 4.9, 'gcd(252, 198)：先用最大的正方形去鋪'], [5, 9.2, '剩下的長條，用它的短邊再鋪'], [9.3, 14.5, '一直鋪到剛好填滿為止'], [14.6, 20.1, '最後的正方形邊長 18，能同時量盡兩邊'], [20.2, 26.7, '倒推回去得到 Bézout 等式：RSA 的私鑰就是這樣算的']]);
      } });
  })();

  /* ================= 資結：Build-Heap ================= */
  (() => {
    const pos = (l, j) => [40 + (j + .5) * 640 / Math.pow(2, l), 360 + l * 118], lvOn = [3.1, 6.1, 9.1, 12.1];
    def({ id: 'ds-heap', subject: 'ds', lesson: 'ds-heap', chip: '資料結構 · 堆積', hook: ['Build-Heap 為什麼', '是 O(n) 不是 O(n lg n)？'], dur: 26,
      sfx: [...[0, 1, 2, 3].map(l => [.5 + l * .35, 'tick']), [3.1, 'pop'], [6.1, 'whoosh'], [9.1, 'whoosh'], [12.1, 'whoosh'], [15.2, 'ding'], [19.2, 'rise'], [23, 'success']],
      draw(t) {
        const cols = [C.coral, C.amber, C.violet, C.teal];
        for (let l = 1; l < 4; l++) for (let j = 0; j < Math.pow(2, l); j++) { const [x, y] = pos(l, j), [px, py] = pos(l - 1, j >> 1); line(px, py, x, y, P(t, .5 + l * .35, .5), { color: C.faint, w: 2 }); }
        for (let l = 0; l < 4; l++) for (let j = 0; j < Math.pow(2, l); j++) { const [x, y] = pos(l, j), h = 3 - l, on = t > lvOn[3 - l] && t < 19;
          node(x, y, l === 3 ? 20 : 24, h, { scale: P(t, .4 + l * .35 + j * .02, .45, E.back), stroke: on ? cols[l] : C.dim, glow: on ? 18 : 0, size: 17 });
          if (h > 0 && t > lvOn[h] && t < 19) { const u = P(t, lvOn[h] + .2, 1.2); arrow(x, y + 28, x, y + 28 + h * 118 - 56, u, { color: cols[l], w: 3, glow: 10, alpha: .85 }); } }
        txt('高度 h（數字）＝最多下沉幾層', W / 2, 300, { size: 22, color: C.dim, alpha: win(t, 2, 19, .4) });
        const terms = ['8×0', ' + 4×1', ' + 2×2', ' + 1×3']; ctx.save(); ctx.font = `800 36px ${MONO}`; const ws = terms.map(z => ctx.measureText(z).width); ctx.restore(); let x = W / 2 - ws.reduce((a, b) => a + b) / 2;
        terms.forEach((z, i) => { txt(z, x, 850, { size: 36, font: MONO, weight: 800, color: cols[3 - i], align: 'left', alpha: P(t, lvOn[i] + .3, .5), glow: 8 }); x += ws[i]; });
        pop(t, 15.2, W / 2, 935, () => txt('= 11 ＜ n = 15', 0, 0, { size: 54, weight: 900, font: SERIF, grad: [C.teal, C.green], glow: 26 }));
        txt('一般：Σ (n / 2ʰ⁺¹) · h ≤ n · Σ h/2ʰ⁺¹ = n', W / 2, 1000, { size: 26, font: MONO, alpha: P(t, 16.5, .6) });
        if (t > 19) { const ua = P(t, 19.2, 1.4); for (let j = 0; j < 8; j++) { const [xx, yy] = pos(3, j); arrow(xx, yy - 26, xx, yy - 26 - 3 * 118 * ua + 30 * ua, ua, { color: C.coral, w: 3, glow: 12, alpha: .8 }); } }
        pop(t, 21.5, W / 2, 680, () => { rrect(-300, -52, 600, 104, 24, 'rgba(8,13,28,.85)', C.coral, 2); txt('逐一插入：8 個葉子 × 爬 3 層', 0, -18, { size: 28, weight: 700 }); txt('→ Θ(n lg n)', 0, 24, { size: 32, font: MONO, weight: 800, color: C.coral }); });
        burst(W / 2, 935, t, 15.3, C.green, 36, 41, 250);
        caps(t, [[.4, 3, '建 heap：從最後一個內部節點往前，逐一往下沉'], [3.1, 6, '一半的節點是葉子，完全不用動'], [6.1, 15, '越高的節點越少：高度 h 的最多 n/2ʰ⁺¹ 個'], [15.1, 19, '把「個數 × 高度」加起來，總和不超過 n'], [19.1, 25.7, '逐一插入就不一樣：多數節點在底部，卻要往上爬 lg n']]);
      } });
  })();

  /* ================= 演算法：Master theorem ================= */
  (() => {
    const cases = [{ f: 'T(n) = 4T(n/2) + n', w: [1, 2, 4, 8], col: C.coral, v: '葉子主導 → Θ(n²)', s: 2.6 }, { f: 'T(n) = 2T(n/2) + n', w: [3, 3, 3, 3], col: C.amber, v: '每層一樣 → Θ(n lg n)', s: 9.4 }, { f: 'T(n) = 2T(n/2) + n²', w: [8, 4, 2, 1], col: C.teal, v: '根主導 → Θ(n²)', s: 16.4 }];
    def({ id: 'al-master', subject: 'al', lesson: 'al-recurrence', chip: '演算法 · Master Theorem', hook: ['遞迴式的成本', '到底集中在哪一層？'], dur: 28,
      sfx: [[2.6, 'whoosh'], [9.4, 'whoosh'], [16.4, 'whoosh'], ...[0, 1, 2].map(i => [[2.6, 9.4, 16.4][i] + 4, 'ding']), [23.6, 'success']],
      draw(t) {
        let ci = 0; for (let i = 0; i < 3; i++) if (t >= cases[i].s) ci = i;
        const cur = cases[ci], prev = cases[Math.max(0, ci - 1)], u = ci === 0 ? 1 : P(t, cur.s, 1);
        const a = [4, 2, 2][ci];
        txt(cur.f, W / 2, 330, { size: 40, font: MONO, weight: 800, color: cur.col, alpha: t < 23.5 ? win(t, cur.s, ci < 2 ? cases[ci + 1].s : 23.5, .4) : 0, glow: 14 });
        for (let j = 0; j < 4; j++) { const y = 430 + j * 120, nd = Math.min(Math.pow(a, j), 16);
          for (let q = 0; q < nd; q++) { const x = W / 2 + (q - (nd - 1) / 2) * Math.min(40, 600 / nd); node(x, y - 30, Math.max(6, 16 - j * 3), '', { stroke: cur.col, alpha: P(t, .5 + j * .3, .5) * (t < 23.5 ? 1 : .3), scale: 1, lw: 2 }); }
          txt(j < 3 ? `第 ${j} 層` : '葉子層', 70, y + 22, { size: 20, color: C.dim, align: 'left', alpha: P(t, .5 + j * .3, .5) });
          const ww = L(prev.w[j], cur.w[j], u) / 8 * 470; const g = ctx.createLinearGradient(170, 0, 170 + ww, 0); g.addColorStop(0, cur.col + '55'); g.addColorStop(1, cur.col);
          ctx.save(); ctx.globalAlpha = P(t, 1.2 + j * .2, .6) * (t < 23.5 ? 1 : .3); ctx.shadowColor = cur.col; ctx.shadowBlur = 16; rrect(170, y + 10, Math.max(6, ww), 26, 13, g); ctx.restore(); }
        txt(cur.v, W / 2, 935, { size: 42, weight: 900, font: SERIF, color: cur.col, glow: 22, alpha: t < 23.5 ? P(t, cur.s + 4, .6) * win(t, cur.s, ci < 2 ? cases[ci + 1].s : 23.5, .4) : 0 });
        if (t >= 23.5) cases.forEach((c, i) => pop(t, 23.6 + i * .35, W / 2, 470 + i * 120, () => { rrect(-300, -44, 600, 88, 22, 'rgba(8,13,28,.85)', c.col, 2); txt(c.f, 0, -14, { size: 26, font: MONO, weight: 800, color: c.col }); txt(c.v, 0, 22, { size: 26, weight: 700 }); }));
        caps(t, [[.4, 2.5, '畫出遞迴樹，看每一層的總成本'], [2.6, 9.3, '每層成本越來越大：最下面的葉子說了算'], [9.4, 16.3, '每層成本一樣：乘上層數 lg n'], [16.4, 23.4, '每層越來越小：根那一層說了算'], [23.5, 27.7, '比較 f(n) 和 n^(log_b a)，就知道是哪一種']]);
      } });
  })();

  /* ================= 計組：Load-use ================= */
  (() => {
    const cx = c => 140 + c * 82, stg = ['IF', 'ID', 'EX', 'MEM', 'WB'], scol = [C.blue, C.violet, C.amber, C.coral, C.green];
    function block(x, y, s, a, col, label) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.shadowColor = col; ctx.shadowBlur = 14; rrect(x - 36, y - 30, 72, 60, 12, col + '30', col, 2.2); ctx.restore(); txt(label || s, x, y, { size: 19, weight: 800, font: MONO, color: col, alpha: a }); }
    def({ id: 'co-pipe', subject: 'co', lesson: 'co-pipeline', chip: '計算機結構 · 管線危障', hook: ['Load-use 危障', 'forwarding 也救不了的那一拍'], dur: 26,
      sfx: [...[0, 1, 2, 3, 4].map(i => [1 + i * .45, 'tick']), [5.2, 'error'], [9.2, 'whoosh'], [11.4, 'ding'], [14.4, 'pop'], [16.6, 'ding'], [20.3, 'success']],
      draw(t) {
        for (let c = 0; c < 7; c++) txt(String(c + 1), cx(c), 330, { size: 20, font: MONO, color: C.dim, alpha: P(t, .5, .5) });
        txt('lw  $1', 60, 420, { size: 20, font: MONO, align: 'left', color: C.ink, alpha: P(t, .6, .4) }); txt('add $1', 60, 520, { size: 20, font: MONO, align: 'left', alpha: P(t, .6, .4) });
        const sh = P(t, 9.2, 1.2);
        stg.forEach((s, i) => { block(cx(i) + 30, 420, s, P(t, 1 + i * .45, .4, E.back), scol[i]); const c2 = i < 2 ? i + 1 : i + 1 + sh; block(cx(c2) + 30, 520, s, P(t, 1.2 + i * .45, .4, E.back), scol[i]); });
        if (sh > 0) block(cx(3) + 30, 520, '', sh, C.dim, 'stall');
        const bad = win(t, 5, 9.4, .3), shake = bad > 0 ? Math.sin(t * 40) * 4 * bell(t, 5.1, .8) : 0;
        if (bad > 0) { arrow(cx(3) + 66 + shake, 440, cx(3) - 6 + shake, 505, P(t, 5, .5), { color: C.coral, w: 4, glow: 20, alpha: bad }); txt('往回指 ✗ 時間不能倒流', W / 2, 640, { size: 32, weight: 800, color: C.coral, alpha: bad, glow: 14 }); }
        const good = win(t, 11.2, 14.2, .3); if (good > 0) { arrow(cx(3) + 66, 440, cx(4) - 6, 505, P(t, 11.2, .5), { color: C.green, w: 4, glow: 20, alpha: good }); txt('MEM/WB → EX ✓ 等一拍就能轉送', W / 2, 640, { size: 30, weight: 800, color: C.green, alpha: good, glow: 14 }); }
        const cmp = P(t, 14.3, .6);
        if (cmp > 0) { txt('對照：add 後面接 sub', W / 2, 640, { size: 26, color: C.dim, alpha: cmp * win(t, 14.3, 20, .3) });
          txt('add $1', 60, 720, { size: 20, font: MONO, align: 'left', alpha: cmp }); txt('sub', 60, 820, { size: 20, font: MONO, align: 'left', alpha: cmp });
          stg.forEach((s, i) => { block(cx(i) + 30, 720, s, P(t, 14.4 + i * .12, .3), scol[i]); block(cx(i + 1) + 30, 820, s, P(t, 14.5 + i * .12, .3), scol[i]); });
          arrow(cx(2) + 66, 740, cx(3) - 6, 805, P(t, 16.4, .5), { color: C.green, w: 4, glow: 20 }); txt('EX 結束就有結果 → 直接轉送', W / 2, 900, { size: 28, weight: 800, color: C.green, alpha: P(t, 16.6, .5) }); }
        pop(t, 20.2, W / 2, 985, () => txt('只剩 load-use 要 stall 1 拍', 0, 0, { size: 40, weight: 900, font: SERIF, grad: [C.amber, C.coral], glow: 24 }));
        caps(t, [[.4, 4.9, 'lw 的資料要到 MEM 結束才拿得到'], [5, 9.1, '下一條同一拍就要用：箭頭往回指，不可能'], [9.2, 14.2, '插入一個 bubble，再從 MEM/WB 轉送'], [14.3, 20.1, 'ALU 指令的結果在 EX 結束就有，不用等'], [20.2, 25.7, '所以有 forwarding 之後，只剩 load-use 要停一拍']]);
      } });
  })();

  /* ================= OS：SRTF ================= */
  (() => {
    const procs = [['P1', 0, 8, C.blue], ['P2', 1, 4, C.amber], ['P3', 2, 9, C.violet], ['P4', 3, 5, C.green]];
    const segs = [['P1', 0, 1], ['P2', 1, 5], ['P4', 5, 10], ['P1', 10, 17], ['P3', 17, 26]];
    const T0 = 2.5, sp = .66, gx = 60, sc = 600 / 26, tt = t => (t - T0) / sp;
    def({ id: 'os-srtf', subject: 'os', lesson: 'os-sched', chip: '作業系統 · CPU 排程', hook: ['SRTF 排程', '更短的一來就搶'], dur: 28,
      sfx: [[T0, 'pop'], [T0 + sp * 1, 'error'], [T0 + sp * 2, 'tick'], [T0 + sp * 3, 'tick'], [T0 + sp * 5, 'land'], [T0 + sp * 10, 'land'], [T0 + sp * 17, 'land'], [T0 + sp * 26, 'ding'], [22.5, 'success']],
      draw(t) {
        const now = Math.max(0, Math.min(26, tt(t)));
        procs.forEach(([nm, at, bt, col], i) => { const y = 340 + i * 92, arrived = now >= at; let used = 0; for (const [p, s, e] of segs) if (p === nm) used += Math.max(0, Math.min(e, now) - s);
          const rem = bt - used, running = segs.some(([p, s, e]) => p === nm && now >= s && now < e) && t < T0 + 26 * sp, a = P(t, .5 + i * .15, .5);
          ctx.save(); ctx.globalAlpha = a * (arrived ? 1 : .35); rrect(60, y - 36, 600, 72, 18, running ? col + '22' : 'rgba(255,255,255,.04)', running ? col : 'rgba(255,255,255,.12)', running ? 2.5 : 1.2); ctx.restore();
          txt(`${nm}`, 100, y, { size: 26, weight: 800, font: MONO, color: col, alpha: a * (arrived ? 1 : .35) }); txt(`到 ${at}`, 170, y, { size: 20, color: C.dim, align: 'left', alpha: a });
          ctx.save(); ctx.globalAlpha = a * (arrived ? 1 : .35); ctx.shadowColor = col; ctx.shadowBlur = running ? 16 : 0; rrect(260, y - 12, 320 * rem / 9, 24, 12, col); ctx.restore(); txt(`剩 ${Math.ceil(rem - 1e-9)}`, 625, y, { size: 22, font: MONO, weight: 700, alpha: a * (arrived ? 1 : .35) });
          if (nm === 'P2' && t > T0 + sp && t < T0 + sp * 4) txt('搶先！', 620, y - 40, { size: 24, weight: 900, color: C.coral, glow: 16, alpha: win(t, T0 + sp, T0 + sp * 4, .2) }); });
        line(gx, 790, gx + 600, 790, P(t, 1, .8), { color: C.faint, w: 2 });
        for (const [p, s, e] of segs) { if (now <= s) continue; const col = procs.find(q => q[0] === p)[3], w = (Math.min(e, now) - s) * sc; ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 14; rrect(gx + s * sc, 735, w, 50, 8, col + '55', col, 2); ctx.restore(); if (w > 40) txt(p, gx + s * sc + w / 2, 760, { size: 20, weight: 800, font: MONO }); txt(String(s), gx + s * sc, 812, { size: 16, font: MONO, color: C.dim }); }
        if (now > 0 && now < 26) line(gx + now * sc, 720, gx + now * sc, 800, 1, { color: '#fff', w: 2, glow: 14 }); if (now >= 26) txt('26', gx + 600, 812, { size: 16, font: MONO, color: C.dim });
        pop(t, 20.3, W / 2, 900, () => txt('等待：9 · 0 · 15 · 2', 0, 0, { size: 36, font: MONO, weight: 800 }));
        pop(t, 22.4, W / 2, 975, () => txt('平均 = 26 / 4 = 6.5', 0, 0, { size: 50, weight: 900, font: SERIF, grad: [C.coral, C.amber], glow: 24 }));
        burst(W / 2, 975, t, 22.5, C.amber, 36, 51, 240);
        caps(t, [[.4, 2.9, 'SRTF：永遠先跑「剩下最少」的那個'], [3, 5.5, 't = 1：P2 只要 4，比 P1 剩下的 7 短，立刻搶先'], [5.6, 9.5, 'P2 跑完，挑剩最少的 P4'], [9.6, 20.2, '接著 P1（剩 7），最後 P3（9）'], [20.3, 27.7, '等待 = 完成 − 到達 − burst，平均 6.5']]);
      } });
  })();

  /* ================= 線代：特徵向量 ================= */
  (() => {
    const A = [2, 1, 1, 2], ox = 360, oy = 640, s = 64;
    const M = u => [L(1, A[0], u), L(0, A[1], u), L(0, A[2], u), L(1, A[3], u)];
    const tr = (m, x, y) => [ox + s * (m[0] * x + m[1] * y), oy - s * (m[2] * x + m[3] * y)];
    def({ id: 'la-eigen', subject: 'la', lesson: 'la-eigen', chip: '線性代數 · 特徵值', hook: ['特徵向量', '被拉長，但不轉向'], dur: 24,
      sfx: [[.8, 'whoosh'], [3, 'rise'], [7.2, 'ding'], [8.2, 'pop'], [9.2, 'pop'], [11.6, 'whoosh'], [14.2, 'rise'], [18.2, 'pop'], [20, 'success']],
      draw(t) {
        const u = Math.max(P(t, 3, 4), 0) * (1 - P(t, 11.6, 2.2)) + P(t, 14.2, 3) * (t > 14.2 ? 1 : 0), m = M(cl(u));
        ctx.save(); ctx.beginPath(); ctx.rect(20, 280, 680, 740); ctx.clip();
        const ga = P(t, .5, 1); for (let k = -8; k <= 8; k++) { const a1 = tr(m, k, -8), b1 = tr(m, k, 8), a2 = tr(m, -8, k), b2 = tr(m, 8, k); line(...a1, ...b1, 1, { color: k === 0 ? C.dim : C.faint, w: k === 0 ? 2 : 1.3, alpha: ga }); line(...a2, ...b2, 1, { color: k === 0 ? C.dim : C.faint, w: k === 0 ? 2 : 1.3, alpha: ga }); }
        const ev = win(t, 7, 23.9, .5);
        line(...tr([1, 0, 0, 1], -6, -6), ...tr([1, 0, 0, 1], 6, 6), 1, { color: C.amber, w: 2, dash: [10, 8], alpha: ev * .8, glow: 10 }); line(...tr([1, 0, 0, 1], -6, 6), ...tr([1, 0, 0, 1], 6, -6), 1, { color: C.teal, w: 2, dash: [10, 8], alpha: ev * .8, glow: 10 });
        for (let i = 0; i < 16; i++) { const th = i * Math.PI / 8, x = Math.cos(th) * 1.6, y = Math.sin(th) * 1.6, isE = i % 4 === 2; const [ex, ey] = tr(m, x, y);
          const col = i % 8 === 2 ? C.amber : i % 8 === 6 ? C.teal : C.blue; const al = P(t, .8 + i * .04, .4) * (isE ? 1 : 1 - .65 * ev);
          if (t > 18) continue; arrow(ox, oy, ex, ey, 1, { color: isE ? col : C.blue, w: isE ? 5 : 2.5, glow: isE ? 22 : 6, alpha: al }); }
        const sq = P(t, 18.2, .6); if (sq > 0) { const pts = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => tr(m, x, y)); ctx.save(); ctx.globalAlpha = sq; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fillStyle = C.violet + '55'; ctx.strokeStyle = C.violet; ctx.lineWidth = 3; ctx.shadowColor = C.violet; ctx.shadowBlur = 20; ctx.fill(); ctx.stroke(); ctx.restore(); }
        ctx.restore();
        ctx.save(); ctx.globalAlpha = P(t, .6, .5); rrect(W / 2 - 150, 290, 300, 52, 26, 'rgba(8,13,28,.85)', 'rgba(90,168,255,.6)'); ctx.restore();
        txt('A = [2 1; 1 2]', W / 2, 316, { size: 30, font: MONO, weight: 800, alpha: P(t, .6, .5) });
        pop(t, 8.2, 600, 560, () => txt('λ = 3', 0, 0, { size: 40, font: MONO, weight: 900, color: C.amber, glow: 20 })); pop(t, 9.2, 120, 560, () => txt('λ = 1', 0, 0, { size: 40, font: MONO, weight: 900, color: C.teal, glow: 20 }));
        pop(t, 20, W / 2, 985, () => txt('det A = λ₁ · λ₂ = 3 × 1 = 3', 0, 0, { size: 44, weight: 900, font: SERIF, grad: [C.violet, C.blue], glow: 24 }));
        burst(W / 2, 985, t, 20.1, C.violet, 36, 61, 240);
        caps(t, [[.4, 2.9, '矩陣就是一個拉伸、扭轉整個平面的動作'], [3, 7, '大部分向量都被轉了方向……'], [7.1, 11.5, '只有特徵向量：方向不變，只被拉長 λ 倍'], [11.6, 18.1, '(1,1) 方向拉長 3 倍，(1,−1) 方向不變'], [18.2, 23.7, '單位正方形的面積放大 det A = λ₁λ₂ 倍']]);
      } });
  })();

  /* ================= 資結：AVL 旋轉 ================= */
  (() => {
    const S0 = { 30: [360, 420], 10: [200, 580], 20: [290, 740] }, S1 = { 30: [360, 420], 20: [200, 580], 10: [110, 740] }, S2 = { 20: [360, 420], 10: [200, 580], 30: [520, 580] };
    const E0 = [[30, 10], [10, 20]], E1 = [[30, 20], [20, 10]], E2 = [[20, 10], [20, 30]];
    const BF = [{ 30: 2, 10: -1, 20: 0 }, { 30: 2, 20: 1, 10: 0 }, { 20: 0, 10: 0, 30: 0 }];
    const cards = [['LL', '右旋 1 次', [[0, 0], [-1, 1], [-2, 2]], C.teal], ['RR', '左旋 1 次', [[0, 0], [1, 1], [2, 2]], C.teal], ['LR', '先左旋再右旋', [[0, 0], [-1, 1], [0, 2]], C.amber], ['RL', '先右旋再左旋', [[0, 0], [1, 1], [0, 2]], C.amber]];
    def({ id: 'ds-avl', subject: 'ds', lesson: 'ds-bst', chip: '資料結構 · AVL 樹', hook: ['插 3 個數', '樹就歪了怎麼辦？'], dur: 26,
      sfx: [[.8, 'pop'], [1.6, 'pop'], [2.4, 'pop'], [3.6, 'error'], [6.5, 'whoosh'], [8.5, 'land'], [10, 'whoosh'], [12, 'success'], [14.1, 'whoosh'], ...[0, 1, 2, 3].map(i => [14.5 + i * .5, 'pop']), [19.6, 'ding']],
      draw(t) {
        const u1 = P(t, 6.5, 2), u2 = P(t, 10, 2), fade = 1 - P(t, 13.9, .6);
        const pos = k => { const a = S0[k], b = S1[k], c = S2[k]; const x = L(L(a[0], b[0], u1), c[0], u2), y = L(L(a[1], b[1], u1), c[1], u2); return [x, y]; };
        const ins = { 30: .8, 10: 1.6, 20: 2.4 };
        [[E0, (1 - u1)], [E1, u1 * (1 - u2)], [E2, u2]].forEach(([es, a]) => es.forEach(([p, c]) => { if (t < ins[c]) return; line(...pos(p), ...pos(c), P(t, ins[c], .4), { color: u2 > .99 ? C.green : C.dim, w: 3, alpha: a * fade, glow: u2 > .99 ? 12 : 0 }); }));
        const ph = u2 > .5 ? 2 : u1 > .5 ? 1 : 0;
        for (const k of [30, 10, 20]) { const [x, y] = pos(k), bf = BF[ph][k], bad = Math.abs(bf) >= 2 && t > 3.5;
          node(x, y, 40, k, { scale: P(t, ins[k], .5, E.back), stroke: bad ? C.coral : u2 > .99 ? C.green : C.teal, glow: bad ? 30 * (.7 + .3 * Math.sin(t * 8)) : u2 > .99 ? 22 : 10, size: 28, alpha: fade });
          if (t > 3.3) { ctx.save(); ctx.globalAlpha = P(t, 3.3, .5) * fade; rrect(x + 34, y - 58, 52, 30, 15, 'rgba(8,13,28,.9)', bad ? C.coral : C.dim, 1.5); ctx.restore(); txt((bf > 0 ? '+' : '') + bf, x + 60, y - 43, { size: 18, font: MONO, weight: 800, color: bad ? C.coral : C.ink, alpha: P(t, 3.3, .5) * fade }); } }
        burst(...S0[30], t, 3.6, C.coral, 24, 3, 110);
        if (t > 3.5 && t < 6.5) poly([[360, 420], [200, 580], [290, 740]], P(t, 3.8, 1.2), { color: C.amber, w: 4, glow: 18, alpha: win(t, 3.5, 6.5, .3) * .8 });
        txt('拐彎 → LR 型', 520, 700, { size: 32, weight: 900, color: C.amber, alpha: win(t, 4.2, 6.5, .3), glow: 14 });
        txt('① 對 10 左旋', 520, 700, { size: 32, weight: 900, color: C.teal, alpha: win(t, 6.5, 9.8, .3), glow: 14 });
        txt('② 對 30 右旋', 520, 760, { size: 32, weight: 900, color: C.violet, alpha: win(t, 10, 13.8, .3), glow: 14 });
        burst(360, 420, t, 12, C.green, 30, 7, 160);
        cards.forEach(([nm, how, pts, col], i) => { const cx = i % 2 ? 530 : 190, cy = i < 2 ? 470 : 690; pop(t, 14.5 + i * .5, cx, cy, () => {
          rrect(-150, -95, 300, 190, 22, 'rgba(8,13,28,.88)', col, 2); txt(nm, -95, -50, { size: 40, weight: 900, font: MONO, color: col, glow: 12 });
          const P2 = pts.map(([x, y]) => [60 + x * 34, -70 + y * 42]); for (let j = 1; j < 3; j++) line(...P2[j - 1], ...P2[j], 1, { color: C.dim, w: 2.5 }); P2.forEach(([x, y]) => node(x, y, 13, '', { stroke: col, lw: 2 }));
          txt(how, 0, 58, { size: 28, weight: 800 }); }); });
        pop(t, 19.6, W / 2, 900, () => txt('高度 ≤ 1.44 lg n', 0, 0, { size: 54, weight: 900, font: SERIF, grad: [C.teal, C.green], glow: 26 }));
        txt('搜尋、插入、刪除都保證 O(lg n)', W / 2, 970, { size: 28, weight: 700, alpha: P(t, 20.4, .6) });
        caps(t, [[.4, 3.4, '依序插入 30、10、20'], [3.5, 6.4, '30 的左右高度差 2：失衡！'], [6.5, 9.9, '先對 10 左旋，把彎拉直成 LL 型'], [10, 13.8, '再對 30 右旋：20 升上來，全部平衡'], [13.9, 19.4, '四種失衡，只靠「左旋、右旋」兩招'], [19.5, 25.7, '所以 AVL 不會退化成一條鏈']]);
      } });
  })();

  /* ================= 演算法：Dijkstra ================= */
  (() => {
    const N = { S: [110, 560], A: [330, 400], B: [330, 730], C: [580, 460], D: [580, 770] };
    const Ed = [['S', 'A', 4], ['S', 'B', 1], ['B', 'A', 2], ['A', 'C', 1], ['B', 'C', 5], ['C', 'D', 3], ['B', 'D', 8]];
    const Ex = [['S', 2.5], ['B', 5.3], ['A', 8.6], ['C', 11.9], ['D', 15.2]];
    const up = [[3.2, 'A', 4, 'S'], [3.9, 'B', 1, 'S'], [6, 'A', 3, 'B'], [6.7, 'C', 6, 'B'], [7.4, 'D', 9, 'B'], [9.3, 'C', 4, 'A'], [12.6, 'D', 7, 'C']];
    const tree = [['S', 'B'], ['B', 'A'], ['A', 'C'], ['C', 'D']];
    const X = { X: [150, 560], Y: [560, 420], Z: [560, 740] };
    def({ id: 'al-dijkstra', subject: 'al', lesson: 'al-sp', chip: '演算法 · 最短路徑', hook: ['Dijkstra', '為什麼一定要「挑最近的」？'], dur: 28,
      sfx: [...Ex.map(([, t]) => [t, 'ding']), ...up.map(([t, , , ], i) => [t, i === 2 || i === 5 || i === 6 ? 'rise' : 'pop']), [16.8, 'success'], [19.4, 'whoosh'], [21.2, 'pop'], [22.4, 'pop'], [24, 'error']],
      draw(t) {
        const ma = 1 - P(t, 19.2, .6);
        if (ma > 0) {
          const fin = n => { const e = Ex.find(x => x[0] === n); return e && t >= e[1]; };
          for (const [a, b, w] of Ed) { const inTree = t > 16.6 && tree.some(([p, q]) => (p === a && q === b) || (p === b && q === a)); const rl = up.filter(u => (u[1] === a && u[3] === b) || (u[1] === b && u[3] === a)).map(u => bell(t, u[0] - .3, .9)).reduce((x, y) => Math.max(x, y), 0);
            line(...N[a], ...N[b], P(t, .6, .8), { color: inTree ? C.teal : rl > 0 ? C.amber : C.faint, w: inTree ? 6 : 3 + 3 * rl, glow: inTree ? 20 : 18 * rl, alpha: ma * (t > 16.6 && !inTree ? .35 : 1) });
            const mx = (N[a][0] + N[b][0]) / 2, my = (N[a][1] + N[b][1]) / 2; ctx.save(); ctx.globalAlpha = ma * P(t, 1, .5); ctx.beginPath(); ctx.arc(mx, my, 17, 0, 7); ctx.fillStyle = '#0b1226'; ctx.fill(); ctx.restore(); txt(String(w), mx, my, { size: 20, font: MONO, weight: 800, color: C.dim, alpha: ma * P(t, 1, .5) }); }
          for (const n of Object.keys(N)) { const cur = Ex.find(e => e[0] === n), act = cur ? bell(t, cur[1] - .1, 1.2) : 0, f = fin(n);
            node(...N[n], 34, n, { scale: P(t, .5, .5, E.back), stroke: f ? C.teal : C.dim, fill: f ? '#0f3a3a' : '#121b31', glow: f ? 18 + 20 * act : 0, size: 26, alpha: ma });
            if (cur) ring(...N[n], t, cur[1], C.amber, 34, 90);
            let d = n === 'S' ? 0 : null, prev = null, last = -9; for (const u of up) if (u[1] === n && t >= u[0]) { prev = d; d = u[2]; last = u[0]; }
            const bx = N[n][0], by = N[n][1] - 62, fl = bell(t, last, .8);
            ctx.save(); ctx.globalAlpha = ma * P(t, 1.2, .5); rrect(bx - 38, by - 20, 76, 40, 12, 'rgba(8,13,28,.92)', fl > 0 ? C.amber : f ? C.teal : 'rgba(255,255,255,.2)', 1.8); ctx.restore();
            txt(d == null ? '∞' : String(d), bx, by + 1, { size: 26, font: MONO, weight: 900, color: f ? C.teal : fl > 0 ? C.amber : C.ink, alpha: ma * P(t, 1.2, .5), glow: fl * 18 });
            if (prev != null && fl > 0) { txt(String(prev), bx + 52, by - 12, { size: 20, font: MONO, color: C.coral, alpha: fl * ma }); line(bx + 42, by - 12, bx + 62, by - 12, 1, { color: C.coral, w: 2, alpha: fl * ma }); } }
          txt('S → B → A → C → D', W / 2, 900, { size: 38, font: MONO, weight: 800, color: C.teal, glow: 16, alpha: P(t, 16.8, .6) * ma });
        }
        const cb = P(t, 19.4, .6); if (cb > 0) {
          const ce = [['X', 'Y', 2, 20.6], ['X', 'Z', 3, 20.6], ['Z', 'Y', -2, 22.4]];
          for (const [a, b, w, t0] of ce) { const [x1, y1] = X[a], [x2, y2] = X[b], d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d; const neg = w < 0;
            arrow(x1 + ux * 40, y1 + uy * 40, x2 - ux * 44, y2 - uy * 44, P(t, t0 - .6, .6), { color: neg ? C.coral : C.dim, w: neg ? 5 : 3, glow: neg ? 20 : 0, alpha: cb });
            txt(String(w), (x1 + x2) / 2 + (neg ? 34 : -10), (y1 + y2) / 2 - (neg ? 0 : 24), { size: 30, font: MONO, weight: 900, color: neg ? C.coral : C.ink, alpha: cb * P(t, t0 - .3, .4) }); }
          const yFin = t >= 21.2, zFin = t >= 22.4;
          node(...X.X, 38, 'X', { stroke: C.teal, fill: '#0f3a3a', glow: 16, size: 28, alpha: cb }); node(...X.Y, 38, 'Y', { stroke: yFin ? C.teal : C.dim, fill: yFin ? '#0f3a3a' : '#121b31', glow: yFin ? 18 : 0, size: 28, alpha: cb }); node(...X.Z, 38, 'Z', { stroke: zFin ? C.teal : C.dim, size: 28, alpha: cb, glow: zFin ? 18 : 0 });
          txt('Y 先定案 = 2', 560, 340, { size: 30, weight: 800, color: C.teal, alpha: P(t, 21.2, .4) });
          ring(...X.Y, t, 24, C.coral, 38, 110); burst(...X.Y, t, 24, C.coral, 26, 9, 120);
          pop(t, 24, W / 2, 900, () => { rrect(-300, -62, 600, 124, 24, 'rgba(8,13,28,.9)', C.coral, 2); txt('X→Z→Y 才是 1', 0, -20, { size: 34, weight: 900, color: C.coral }); txt('但 Y 已經定案，改不回來 ✗', 0, 26, { size: 28, weight: 700 }); });
        }
        caps(t, [[.4, 2.4, '從 S 出發，每次「定案」目前最近的點'], [2.5, 5.2, '定案 S，更新鄰居：B = 1、A = 4'], [5.3, 8.5, '定案 B：經過 B 到 A 只要 3，比 4 好，更新！'], [8.6, 16.6, '每次都挑最小的定案，之後不會再變'], [16.7, 19.2, '得到最短路徑樹，O((V+E) lg V)'], [19.3, 27.7, '負邊會破壞「定案後不變」：要改用 Bellman-Ford']]);
      } });
  })();

  /* ================= 計組：Cache 位址切割 ================= */
  (() => {
    const addr = 0x00401A7C, bits = [...addr.toString(2).padStart(32, '0')], bx = i => 40 + i * 20, BY = 420;
    const OFF = addr & 63, IDX = (addr >>> 6) & 255, TAG = addr >>> 14;
    def({ id: 'co-cache', subject: 'co', lesson: 'co-cache', chip: '計算機結構 · 快取', hook: ['一個 32-bit 位址', '怎麼在 cache 裡找到家？'], dur: 26,
      sfx: [...[0, 1, 2, 3, 4, 5, 6, 7].map(i => [1 + i * .25, 'tick']), [4.5, 'whoosh'], [5.6, 'pop'], [6.7, 'pop'], [7.8, 'pop'], [9.6, 'whoosh'], [11.2, 'ding'], [12.4, 'success'], [14.6, 'error'], [15.4, 'land'], [17.2, 'whoosh'], [19.2, 'rise'], [20, 'pop'], [21.6, 'ding']],
      draw(t) {
        const way4 = P(t, 17.2, 2), nIdx = 8 - 2 * way4, tagEnd = 32 - 6 - nIdx;
        bits.forEach((b, i) => { const a = P(t, 1 + (i / 32) * 2, .3); const grp = i >= 26 ? C.coral : i >= tagEnd ? C.amber : C.teal; const g = P(t, 4.5, .8);
          ctx.save(); ctx.globalAlpha = a; rrect(bx(i) + 1, BY - 20, 18, 40, 4, g > 0 ? grp + Math.round(0x22 + 0x22 * g).toString(16) : 'rgba(255,255,255,.06)', g > 0 ? grp : 'rgba(255,255,255,.2)', 1); ctx.restore();
          txt(b, bx(i) + 10, BY + 1, { size: 18, font: MONO, weight: 700, alpha: a, color: g > .5 ? '#fff' : C.ink }); });
        txt('0x0040_1A7C', W / 2, BY - 54, { size: 26, font: MONO, weight: 800, color: C.dim, alpha: P(t, .8, .5) });
        const brace = (i0, i1, col, lab, sub, t0) => { const a = P(t, t0, .5); if (a <= 0) return; const x0 = bx(i0) + 2, x1 = bx(i1) + 18; line(x0, BY + 30, x0, BY + 40, 1, { color: col, w: 2, alpha: a }); line(x1, BY + 30, x1, BY + 40, 1, { color: col, w: 2, alpha: a }); line(x0, BY + 40, x1, BY + 40, 1, { color: col, w: 2, alpha: a, glow: 8 });
          txt(lab, (x0 + x1) / 2, BY + 66, { size: 22, weight: 800, color: col, alpha: a }); txt(sub, (x0 + x1) / 2, BY + 96, { size: 17, font: MONO, color: C.dim, alpha: a }); };
        brace(26, 31, C.coral, 'offset', '6 bits', 5.6); brace(tagEnd, 25, C.amber, 'index', `${Math.round(nIdx)} bits`, 6.7); brace(0, tagEnd - 1, C.teal, 'tag', `${32 - 6 - Math.round(nIdx)} bits`, 7.8);
        txt('64 B 區塊 → 2⁶', 600, 590, { size: 22, font: MONO, color: C.coral, alpha: win(t, 5.6, 9.4, .3) }); txt('16 KiB / 64 B = 256 行 → 2⁸', W / 2, 630, { size: 24, font: MONO, color: C.amber, alpha: win(t, 6.7, 9.4, .3) });
        const ta = win(t, 9.6, 16.9, .4); if (ta > 0) { const rows = [103, 104, 105, 106, 107], ty = 640;
          txt(`index = ${IDX}`, 150, 600, { size: 26, font: MONO, weight: 800, color: C.amber, alpha: ta }); txt(`tag = 0x${TAG.toString(16)}`, 520, 600, { size: 26, font: MONO, weight: 800, color: C.teal, alpha: ta });
          ['行', 'V', 'Tag', 'Data（64 B）'].forEach((h, j) => txt(h, [110, 190, 300, 500][j], ty, { size: 20, color: C.dim, alpha: ta }));
          rows.forEach((r, j) => { const y = ty + 44 + j * 58, hit = r === IDX, hl = hit ? P(t, 10.6, .5) : 0, miss = hit && t > 14.4, rep = hit && t > 15.2;
            ctx.save(); ctx.globalAlpha = ta; rrect(70, y - 24, 580, 48, 10, hit ? (miss && !rep ? C.coral : hit && t > 12.3 ? C.green : C.amber) + (hl > 0 ? '33' : '00') : 'rgba(255,255,255,.04)', hit && hl > 0 ? (miss && !rep ? C.coral : t > 12.3 ? C.green : C.amber) : 'rgba(255,255,255,.1)', hit ? 2.5 : 1); ctx.restore();
            txt(String(r), 110, y, { size: 20, font: MONO, alpha: ta }); txt('1', 190, y, { size: 20, font: MONO, alpha: ta }); txt(hit ? (rep ? '0x2a7' : '0x100') : '0x' + (0x3c + j * 37).toString(16), 300, y, { size: 20, font: MONO, alpha: ta, color: hit ? C.teal : C.ink }); txt(hit ? '…' : '…', 500, y, { size: 20, alpha: ta * .6 }); });
          arrow(150, 616, 70, ty + 44 + 2 * 58, P(t, 10.2, .6), { color: C.amber, w: 3, alpha: ta });
          txt('tag 相同、V = 1 → Hit ✓', W / 2, 980, { size: 34, weight: 900, color: C.green, glow: 16, alpha: win(t, 12.3, 14.3, .3) });
          txt('換一個 tag = 0x2a7 的位址 → Miss，整塊換掉', W / 2, 980, { size: 28, weight: 800, color: C.coral, alpha: win(t, 14.4, 16.9, .3) });
          burst(360, ty + 44 + 2 * 58, t, 12.4, C.green, 28, 4, 200); }
        txt('改成 4-way：256 行 ÷ 4 = 64 組', W / 2, 640, { size: 30, weight: 800, color: C.amber, alpha: P(t, 17.4, .5) });
        txt('index 8 → 6 bits，tag 18 → 20 bits', W / 2, 700, { size: 28, font: MONO, weight: 700, alpha: P(t, 19.2, .5) });
        const wa = P(t, 19.8, .6); if (wa > 0) { txt(`index = ${IDX & 63}：去第 ${IDX & 63} 組`, W / 2, 770, { size: 26, font: MONO, weight: 800, color: C.amber, alpha: wa });
          for (let j = 0; j < 4; j++) { const x = 105 + j * 170, y = 840; pop(t, 19.9 + j * .15, x, y, () => { rrect(-70, -32, 140, 64, 12, 'rgba(8,13,28,.85)', j === 2 ? C.green : C.dim, j === 2 ? 2.5 : 1.5); txt(`way ${j}`, 0, -10, { size: 18, color: C.dim }); txt(j === 2 ? 'tag ✓' : 'tag ✗', 0, 14, { size: 20, font: MONO, weight: 800, color: j === 2 ? C.green : C.coral }); }); }
          txt('4 個 tag 同時比對', W / 2, 910, { size: 24, weight: 700, alpha: P(t, 20.6, .5) }); }
        pop(t, 21.6, W / 2, 985, () => txt('tag = 32 − index − offset', 0, 0, { size: 40, font: MONO, weight: 900, color: C.teal, glow: 22 }));
        caps(t, [[.4, 4.4, '16 KiB、direct-mapped、每塊 64 B'], [4.5, 9.5, '位址從右往左切：offset、index，剩下全是 tag'], [9.6, 12.2, 'index 直接告訴你去第 105 行'], [12.3, 16.9, 'tag 一樣而且 valid → 命中；不一樣 → miss'], [17, 25.7, '每多一倍 way，index 少 1 bit，tag 多 1 bit']]);
      } });
  })();

  /* ================= OS：LRU 頁面置換 ================= */
  (() => {
    const ref = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1], F = 3;
    const sim = kind => { let fr = [], cnt = 0, q = [], last = {}; const cols = []; ref.forEach((p, i) => { let fault = false, vict = -1; if (!fr.includes(p)) { fault = true; cnt++; if (fr.length < F) { fr.push(p); q.push(p); } else { let v;
      if (kind === 'fifo') v = q.shift(); else if (kind === 'lru') v = fr.reduce((a, b) => last[a] < last[b] ? a : b); else { v = fr.reduce((a, b) => { const na = ref.indexOf(a, i + 1), nb = ref.indexOf(b, i + 1); return (na < 0 ? 1e9 : na) >= (nb < 0 ? 1e9 : nb) ? a : b; }); }
      vict = fr.indexOf(v); fr[vict] = p; if (kind === 'fifo') q.push(p); } } last[p] = i; cols.push({ fr: fr.slice(), fault, vict, hit: fault ? -1 : fr.indexOf(p) }); }); return { cols, cnt }; };
    const LRU = sim('lru'), FIFO = sim('fifo'), OPT = sim('opt'), st = i => 2.4 + i * .65;
    def({ id: 'os-lru', subject: 'os', lesson: 'os-vm', chip: '作業系統 · 頁面置換', hook: ['記憶體滿了', '該把誰踢出去？'], dur: 28,
      sfx: [...ref.map((_, i) => [st(i), LRU.cols[i].fault ? 'land' : 'tick']), [15.6, 'whoosh'], [16.4, 'pop'], [17, 'pop'], [17.6, 'pop'], [18.6, 'success']],
      draw(t) {
        const fa = 1 - P(t, 15.4, .6); let faults = 0;
        if (fa > 0) for (let i = 0; i < 20; i++) { const blk = i < 10 ? 0 : 1, j = i % 10, x = 70 + j * 64, y0 = blk ? 650 : 330, c = LRU.cols[i], a = P(t, st(i), .3), cur = bell(t, st(i) - .1, .7);
          txt(String(ref[i]), x, y0, { size: 32, font: MONO, weight: 900, color: cur > 0 ? C.amber : C.ink, alpha: fa * P(t, .6 + i * .04, .3), glow: cur * 20 });
          if (t >= st(i) && c.fault) faults++;
          for (let k = 0; k < F; k++) { const v = c.fr[k], y = y0 + 48 + k * 46; if (a <= 0) { ctx.save(); ctx.globalAlpha = fa * .5; rrect(x - 26, y - 20, 52, 40, 8, null, 'rgba(255,255,255,.08)'); ctx.restore(); continue; }
            const isNew = c.fault && (c.vict === k || (c.vict < 0 && k === c.fr.length - 1)), isHit = c.hit === k; const col = isNew ? C.coral : isHit ? C.green : C.dim;
            ctx.save(); ctx.globalAlpha = fa * a * (c.fault ? 1 : .55); if (isNew || isHit) { ctx.shadowColor = col; ctx.shadowBlur = 14; } rrect(x - 26, y - 20, 52, 40, 8, (isNew || isHit) ? col + '30' : 'rgba(255,255,255,.04)', col, isNew || isHit ? 2 : 1); ctx.restore();
            if (v != null) txt(String(v), x, y + 1, { size: 22, font: MONO, weight: 800, alpha: fa * a * (c.fault ? 1 : .55), color: isNew ? '#fff' : C.ink }); }
          if (c.fault && a > 0) { ctx.save(); ctx.globalAlpha = fa * a; ctx.fillStyle = C.coral; ctx.shadowColor = C.coral; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(x, y0 + 200, 6, 0, 7); ctx.fill(); ctx.restore(); }
          if (c.fault && c.vict >= 0) burst(x, y0 + 48 + c.vict * 46, t, st(i), C.coral, 10, i + 5, 40); }
        if (fa > 0) txt(`LRU 缺頁：${faults}`, W / 2, 960, { size: 46, weight: 900, font: SERIF, color: C.coral, glow: 16, alpha: fa * P(t, 2.4, .5) });
        const bars = [['FIFO', FIFO.cnt, C.amber, 16.4], ['LRU', LRU.cnt, C.teal, 17], ['OPT', OPT.cnt, C.violet, 17.6]];
        bars.forEach(([nm, n, col, t0], i) => { const u = P(t, t0, 1, E.out); if (u <= 0) return; const y = 440 + i * 140;
          txt(nm, 70, y, { size: 34, weight: 900, font: MONO, color: col, align: 'left', alpha: cl(u * 3) }); ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 20; const g = ctx.createLinearGradient(190, 0, 190 + 26 * n, 0); g.addColorStop(0, col + '66'); g.addColorStop(1, col); rrect(190, y - 26, 26 * n * u, 52, 26, g); ctx.restore();
          txt(String(Math.round(n * u)), 190 + 26 * n * u + 34, y, { size: 34, font: MONO, weight: 900, alpha: cl(u * 3) }); });
        pop(t, 18.6, W / 2, 870, () => txt('OPT ≤ LRU ≤ FIFO', 0, 0, { size: 46, weight: 900, font: SERIF, grad: [C.violet, C.teal], glow: 22 }));
        txt('LRU 是 stack 演算法：加 frame 不會變差', W / 2, 950, { size: 26, weight: 700, alpha: P(t, 21.6, .6) });
        caps(t, [[.4, 2.3, '3 個 frame，參考串 20 個頁'], [2.4, 8.5, '命中：什麼都不用換；缺頁：踢掉「最久沒用」的'], [8.6, 15.4, '用過去預測未來：最近沒用的，之後也不太會用'], [15.5, 21.4, '同一串：FIFO 15、LRU 12、OPT 9'], [21.5, 27.7, 'OPT 要先知道未來，做不到；LRU 是最實用的近似']]);
      } });
  })();

  /* ================= 線代：投影與最小平方 ================= */
  (() => {
    const o = [150, 740], sc = 135, V = (x, y) => [o[0] + x * sc, o[1] - y * sc], a = [3, 1], b = [1, 2.6];
    const k = (a[0] * b[0] + a[1] * b[1]) / (a[0] * a[0] + a[1] * a[1]), p = [a[0] * k, a[1] * k];
    const pts = [[0, 6], [1, 0], [2, 0]], G = (tt, y) => [170 + tt * 180, 780 - y * 62];
    def({ id: 'la-proj', subject: 'la', lesson: 'la-ortho', chip: '線性代數 · 投影', hook: ['方程式無解時', '怎麼找「最接近」的答案？'], dur: 27,
      sfx: [[.8, 'whoosh'], [1.8, 'pop'], [3.4, 'whoosh'], [4.6, 'land'], [5.4, 'pop'], [7.2, 'ding'], [11.7, 'whoosh'], ...pts.map((_, i) => [12.6 + i * .3, 'pop']), [14.6, 'rise'], [17, 'success'], [18.6, 'ding']],
      draw(t) {
        const A1 = 1 - P(t, 11.4, .5);
        if (A1 > 0) { ctx.save(); ctx.globalAlpha = A1;
          line(...V(-0.6, -0.2), ...V(4, 1.333), P(t, .6, 1), { color: C.teal, w: 4, glow: 14 }); txt('A 的 column space', V(3, 1)[0], V(3, 1)[1] + 46, { size: 22, weight: 700, color: C.teal, alpha: P(t, 1.2, .5) });
          arrow(...o, ...V(...b), P(t, 1.8, .7), { color: C.amber, w: 5, glow: 18 }); txt('b', V(...b)[0] - 26, V(...b)[1] - 10, { size: 34, weight: 900, font: SERIF, color: C.amber, alpha: P(t, 2.2, .4) });
          line(...V(...b), ...V(...p), P(t, 3.4, 1.2), { color: C.coral, w: 3, dash: [10, 8], glow: 10 });
          if (t > 4.6) { const u = [a[0] / Math.hypot(...a), a[1] / Math.hypot(...a)], nv = [-u[1], u[0]], s = .22; const c1 = [p[0] - u[0] * s, p[1] - u[1] * s], c2 = [c1[0] + nv[0] * s, c1[1] + nv[1] * s], c3 = [p[0] + nv[0] * s, p[1] + nv[1] * s]; poly([V(...c1), V(...c2), V(...c3)], P(t, 4.6, .4), { color: C.ink, w: 2, glow: 0 }); }
          arrow(...o, ...V(...p), P(t, 5.4, .7), { color: C.violet, w: 5, glow: 18 }); txt('p = Ax̂', V(...p)[0] + 20, V(...p)[1] + 40, { size: 28, weight: 900, font: MONO, color: C.violet, alpha: P(t, 5.8, .4) });
          txt('e = b − p', (V(...b)[0] + V(...p)[0]) / 2 + 90, (V(...b)[1] + V(...p)[1]) / 2 - 10, { size: 26, weight: 800, font: MONO, color: C.coral, alpha: P(t, 4.4, .4) });
          ctx.restore();
          txt(typeIn('Aᵀ(b − Ax̂) = 0', P(t, 7.2, .9, E.lin)), W / 2, 880, { size: 34, font: MONO, weight: 800, color: C.coral, alpha: A1 });
          pop(t, 8.6, W / 2, 960, () => txt('AᵀA x̂ = Aᵀb', 0, 0, { size: 50, weight: 900, font: SERIF, grad: [C.violet, C.blue], glow: 24 })); }
        const A2 = P(t, 11.7, .6); if (A2 > 0) { ctx.save(); ctx.globalAlpha = A2;
          line(130, 780, 640, 780, 1, { color: C.dim, w: 2 }); line(170, 820, 170, 360, 1, { color: C.dim, w: 2 });
          for (let i = 0; i <= 2; i++) if (i) txt(String(i), G(i, 0)[0], 806, { size: 18, font: MONO, color: C.dim }); [2, 4, 6].forEach(y => txt(String(y), 146, G(0, y)[1], { size: 18, font: MONO, color: C.dim }));
          const lu = P(t, 14.6, 1.4); line(...G(-.15, 5.45), ...G(2.15, -1.45), lu, { color: C.teal, w: 4, glow: 16 });
          pts.forEach(([x, y], i) => { const [px, py] = G(x, y); const fit = 5 - 3 * x;
            if (t > 16) line(px, py, px, G(x, fit)[1], P(t, 16 + i * .3, .5), { color: C.coral, w: 4, glow: 12 });
            node(px, py, 14, '', { stroke: C.amber, fill: C.amber, glow: 20, scale: P(t, 12.6 + i * .3, .4, E.back) });
            if (t > 16.6) txt(['+1', '−2', '+1'][i], px + 34, (py + G(x, fit)[1]) / 2, { size: 24, font: MONO, weight: 800, color: C.coral, alpha: P(t, 16.6, .4) }); });
          ctx.restore();
          txt('b = 5 − 3t', 470, 470, { size: 40, font: MONO, weight: 900, color: C.teal, glow: 16, alpha: P(t, 15.4, .5) });
          pop(t, 18.6, W / 2, 930, () => txt('e = (1, −2, 1) ⊥ 兩個 column', 0, 0, { size: 34, weight: 900, font: MONO, color: C.coral, glow: 14 }));
          txt('誤差平方和 = 6，不可能更小', W / 2, 990, { size: 26, weight: 700, alpha: P(t, 20, .5) }); }
        caps(t, [[.4, 3.3, 'Ax = b 無解：b 不在 A 的 column space 裡'], [3.4, 7.1, '從 b 垂直投下去，落點 p 就是最接近的'], [7.2, 11.5, '誤差 e 垂直於每個 column → 正規方程'], [11.6, 17.9, '實戰：一條直線過三個點 (0,6)、(1,0)、(2,0)'], [18, 26.7, '最小平方解：x̂ = (5, −3)']]);
      } });
  })();

  /* ================= 線代：消去法與解的結構 ================= */
  (() => {
    const Ms = [[[1, 2, 2, 2, 1], [2, 4, 6, 8, 5], [3, 6, 8, 10, 6]], [[1, 2, 2, 2, 1], [0, 0, 2, 4, 3], [0, 0, 2, 4, 3]], [[1, 2, 2, 2, 1], [0, 0, 2, 4, 3], [0, 0, 0, 0, 0]], [[1, 2, 0, -2, -2], [0, 0, 1, 2, '3/2'], [0, 0, 0, 0, 0]]];
    const tr = [3.2, 6, 8.8], ops = [['R2 − 2R1', 'R3 − 3R1'], ['R3 − R2'], ['R2 ÷ 2', 'R1 − 2R2']], chRows = [[1, 2], [2], [1, 0]];
    const cx = j => j < 4 ? 150 + j * 100 : 610, ry = i => 440 + i * 90, piv = [[0, 0], [1, 2]];
    const fmt = v => typeof v === 'number' && v < 0 ? '−' + (-v) : String(v);
    def({ id: 'la-systems', subject: 'la', lesson: 'la-systems', chip: '線性代數 · 消去法', hook: ['Ax = b 的解', '長什麼樣子？'], dur: 27,
      sfx: [[.7, 'whoosh'], [3.2, 'whoosh'], [3.9, 'pop'], [6, 'whoosh'], [6.7, 'pop'], [8.8, 'whoosh'], [9.5, 'pop'], [10.6, 'ding'], [12, 'pop'], [13.4, 'tick'], [15, 'rise'], [20.5, 'success']],
      draw(t) {
        let k = 0; for (let q = 0; q < 3; q++) if (t >= tr[q]) k = q + 1;
        const u = k ? P(t, tr[k - 1], .9) : 1, A = Ms[k], B = k ? Ms[k - 1] : Ms[0], ma = P(t, .6, .6);
        ctx.save(); ctx.globalAlpha = ma; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (const [x, d] of [[95, 1], [665, -1]]) { ctx.beginPath(); ctx.moveTo(x + 14 * d, 395); ctx.lineTo(x, 395); ctx.lineTo(x, 665); ctx.lineTo(x + 14 * d, 665); ctx.stroke(); }
        ctx.setLineDash([6, 8]); ctx.strokeStyle = C.dim; ctx.beginPath(); ctx.moveTo(560, 400); ctx.lineTo(560, 660); ctx.stroke(); ctx.restore();
        for (let q = 0; q < 3; q++) { const fl = bell(t, tr[q] - .1, 1.3); if (fl > 0) chRows[q].forEach(i => { ctx.save(); ctx.globalAlpha = fl * .9; rrect(105, ry(i) - 34, 550, 68, 14, C.amber + '22', C.amber, 2); ctx.restore(); }); }
        if (t > 12) [1, 3].forEach(j => { ctx.save(); ctx.globalAlpha = P(t, 12, .5) * (1 - P(t, 19.8, .5)); rrect(cx(j) - 38, 400, 76, 260, 16, C.amber + '1c', C.amber, 1.8); ctx.restore(); txt('自由', cx(j), 690, { size: 22, weight: 800, color: C.amber, alpha: P(t, 12, .5) * (1 - P(t, 19.8, .5)) }); });
        for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) { const o = B[i][j], n = A[i][j], x = cx(j), y = ry(i), col = j === 4 ? C.violet : C.ink;
          if (o !== n && u < 1) { txt(fmt(o), x, y - 34 * u, { size: 38, font: MONO, weight: 800, alpha: ma * (1 - u), color: col }); txt(fmt(n), x, y + 34 * (1 - u), { size: 38, font: MONO, weight: 800, alpha: ma * u, color: C.amber, glow: 14 }); }
          else txt(fmt(n), x, y, { size: 38, font: MONO, weight: 800, alpha: ma, color: col }); }
        if (t > 10.5) piv.forEach(([i, j], q) => { ring(cx(j), ry(i), t, 10.6 + q * .2, C.teal, 20, 60); ctx.save(); ctx.globalAlpha = P(t, 10.5, .4) * (1 - P(t, 19.8, .5)); ctx.strokeStyle = C.teal; ctx.lineWidth = 3; ctx.shadowColor = C.teal; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(cx(j), ry(i), 30, 0, 7); ctx.stroke(); ctx.restore(); });
        ['x₁', 'x₂', 'x₃', 'x₄', 'b'].forEach((s, j) => txt(s, cx(j), 370, { size: 22, font: MONO, color: C.dim, alpha: ma }));
        ops.forEach((op, q) => { const a = win(t, tr[q] - .2, tr[q] + 2.3, .3); op.forEach((s, r) => txt(s, W / 2, 740 + r * 46, { size: 32, font: MONO, weight: 800, color: C.amber, alpha: a, glow: 10 })); });
        txt('最後一列 0 = 0 → 有解 ✓', W / 2, 740, { size: 30, weight: 800, color: C.green, alpha: win(t, 13.4, 14.9, .3) });
        const sa = P(t, 15, .5); if (sa > 0) {
          txt(typeIn('x = xₚ + c₁s₁ + c₂s₂', P(t, 15, 1, E.lin)), W / 2, 745, { size: 34, font: MONO, weight: 900, color: C.teal, glow: 12 });
          txt('xₚ = (−2, 0, 3/2, 0)', W / 2, 800, { size: 26, font: MONO, weight: 700, color: C.violet, alpha: P(t, 16.3, .5) });
          txt('s₁ = (−2, 1, 0, 0)   s₂ = (2, 0, −2, 1)', W / 2, 846, { size: 24, font: MONO, weight: 700, color: C.amber, alpha: P(t, 17.4, .5) }); }
        pop(t, 20.5, W / 2, 940, () => txt('rank 2 + 零度 2 = n = 4', 0, 0, { size: 46, weight: 900, font: SERIF, grad: [C.blue, C.teal], glow: 24 }));
        burst(W / 2, 940, t, 20.6, C.teal, 34, 71, 240);
        caps(t, [[.4, 3.1, '3 個方程式、4 個未知數：先消去'], [3.2, 10.4, '列運算不改變解，一路化成 RREF'], [10.5, 13.3, 'pivot 欄被決定，其他欄是自由變數'], [13.4, 19.9, '特解 + 零空間的任意組合 = 全部的解'], [20, 26.7, '自由變數個數 = n − rank']]);
      } });
  })();

  /* ================= OS：fork ================= */
  (() => {
    const tf = [2.5, 5.5, 8.5], ly = k => 420 + k * 125;
    const lev = [[{ pid: 1, kid: false }]]; let np = 2; for (let k = 0; k < 3; k++) { const nx = []; lev[k].forEach(p => { nx.push({ pid: p.pid, kid: false }); nx.push({ pid: np++, kid: true }); }); lev.push(nx); }
    const lx = (k, i) => { const n = lev[k].length; return n === 1 ? 360 : 360 + (i - (n - 1) / 2) * (560 / Math.max(n - 1, 1)) * (n === 2 ? .5 : n === 4 ? .8 : 1); };
    def({ id: 'os-process', subject: 'os', lesson: 'os-process', chip: '作業系統 · 行程', hook: ['fork() 呼叫 3 次', '會印出幾個 hi？'], dur: 27,
      sfx: [[.8, 'pop'], ...tf.flatMap(t0 => [[t0, 'whoosh'], [t0 + .8, 'pop']]), [11.6, 'ding'], ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => [16.6 + i * .22, 'tick']), [19, 'success'], [21.6, 'ding']],
      draw(t) {
        const toks = ['fork();', 'fork();', 'fork();', 'printf("hi");']; ctx.save(); ctx.font = `800 26px ${MONO}`; const ws = toks.map(s => ctx.measureText(s + '  ').width); ctx.restore(); let x = W / 2 - ws.reduce((a, b) => a + b) / 2;
        ctx.save(); ctx.globalAlpha = P(t, .4, .5); rrect(40, 292, 640, 56, 14, 'rgba(8,13,28,.9)', 'rgba(255,255,255,.15)'); ctx.restore();
        toks.forEach((s, i) => { const on = i < 3 ? win(t, tf[i] - .1, tf[i] + 2, .2) : win(t, 16.3, 19, .2); txt(s, x, 320, { size: 26, font: MONO, weight: 800, align: 'left', color: on > 0 ? (i < 3 ? C.coral : C.amber) : C.ink, glow: on * 16, alpha: P(t, .4, .5) }); x += ws[i]; });
        for (let k = 0; k <= 3; k++) { const shown = k === 0 ? P(t, .8, .5, E.back) : P(t, tf[k - 1] + .3, .6); if (shown <= 0) continue;
          lev[k].forEach((p, i) => { let px = lx(k, i), py = ly(k);
            if (k > 0) { const pi = i >> 1, [ax, ay] = [lx(k - 1, pi), ly(k - 1)]; const g = P(t, tf[k - 1] + .3, .6); px = L(ax, px, g); py = L(ay, py, g); line(ax, ay + 24, px, py - 24, 1, { color: p.kid ? C.coral : C.teal, w: 2.5, alpha: .8, glow: 8 }); }
            const fresh = p.kid && k > 0 ? bell(t, tf[k - 1] + .6, 1.2) : 0;
            ctx.save(); ctx.translate(px, py); const sc = k === 0 ? shown : 1; ctx.scale(sc, sc); ctx.shadowColor = p.kid ? C.coral : C.teal; ctx.shadowBlur = 12 + 20 * fresh; rrect(-30, -22, 60, 44, 10, p.kid ? '#3a1424' : '#0f3a3a', p.kid ? C.coral : C.teal, 2); ctx.restore();
            txt(String(p.pid), px, py, { size: 20, font: MONO, weight: 800 }); }); }
        for (let k = 0; k < 3; k++) txt(`${1 << (k + 1)} 個`, 6, ly(k + 1), { size: 18, weight: 800, color: C.dim, align: 'left', alpha: P(t, tf[k] + .6, .5) * (1 - P(t, 11.4, .4)) });
        const rv = win(t, 11.6, 16.2, .4); if (rv > 0) { const [px, py] = [lx(0, 0), ly(0)], [ax, ay] = [lx(1, 0), ly(1)], [bx, by] = [lx(1, 1), ly(1)];
          ctx.save(); ctx.globalAlpha = rv; rrect(ax - 140, ay - 70, 120, 34, 10, 'rgba(8,13,28,.92)', C.teal, 1.5); rrect(bx + 20, by - 70, 120, 34, 10, 'rgba(8,13,28,.92)', C.coral, 1.5); ctx.restore();
          txt('回傳 2', ax - 80, ay - 53, { size: 20, font: MONO, weight: 800, color: C.teal, alpha: rv }); txt('回傳 0', bx + 80, by - 53, { size: 20, font: MONO, weight: 800, color: C.coral, alpha: rv }); }
        const ta = P(t, 16.3, .5); if (ta > 0) { ctx.save(); ctx.globalAlpha = ta; rrect(60, 860, 600, 64, 14, '#05070d', 'rgba(255,255,255,.2)'); ctx.restore(); txt('$', 84, 892, { size: 22, font: MONO, color: C.green, alpha: ta });
          for (let i = 0; i < 8; i++) { const u = P(t, 16.6 + i * .22, .45); if (u <= 0) continue; const [sx, sy] = [lx(3, i), ly(3)], ex = 130 + i * 66, ey = 892; txt('hi', L(sx, ex, u), L(sy + 30, ey, u), { size: 24, font: MONO, weight: 800, color: C.amber, glow: 10 * (1 - u) }); } }
        ctx.save(); ctx.globalAlpha = 1 - P(t, 21.3, .4); pop(t, 19, W / 2, 975, () => txt('8 個 hi = 2³', 0, 0, { size: 46, weight: 900, font: SERIF, grad: [C.amber, C.coral], glow: 24 })); ctx.restore();
        burst(W / 2, 975, t, 19.1, C.amber, 34, 81, 240);
        pop(t, 21.6, W / 2, 975, () => txt('n 次 fork → 2ⁿ 個行程', 0, 0, { size: 42, weight: 900, font: SERIF, grad: [C.teal, C.green], glow: 22 }));
        caps(t, [[.4, 2.4, '每一次 fork()，都把「當下所有行程」各複製一份'], [2.5, 11.5, '綠色是原本的，紅色是剛生出來的子行程'], [11.6, 16.2, '同一個 fork()：父拿到子 PID，子拿到 0'], [16.3, 21.5, '最後 8 個行程，各印一次'], [21.6, 26.7, '考題常把 fork 放進 if 或迴圈：一樣逐行數行程數']]);
      } });
  })();

  /* ================= 資結：攤銷分析 ================= */
  (() => {
    const N = 17, ti = i => 1.8 + i * .66, cost = [], capA = []; let cap = 1;
    for (let i = 0; i < N; i++) { let c = 1; if (i === cap) { c += i; cap *= 2; } cost.push(c); capA.push(cap); }
    const cellX = j => 72 + (j % 16) * 36, cellY = j => 400 + Math.floor(j / 16) * 46, bx = i => 80 + i * 34, base = 800;
    def({ id: 'ds-amortized', subject: 'ds', lesson: 'ds-amortized', chip: '資料結構 · 攤銷分析', hook: ['偶爾要搬家 O(n)', '為什麼平均還是 O(1)？'], dur: 27,
      sfx: [...cost.map((c, i) => [ti(i), c > 1 ? 'whoosh' : 'tick']), [13.6, 'ding'], [15, 'pop'], [15.5, 'pop'], [16, 'pop'], [16.5, 'pop'], [18, 'rise'], [19.2, 'success'], [21, 'ding']],
      draw(t) {
        let n = 0; for (let i = 0; i < N; i++) if (t >= ti(i)) n = i + 1; const cp = n ? capA[n - 1] : 1, ph1 = 1 - P(t, 13.8, .6);
        if (ph1 > 0) {
          let grow = 0, last = -9; for (let i = 0; i < N; i++) if (cost[i] > 1 && t >= ti(i)) last = ti(i); grow = P(t, last, .5, E.back);
          for (let j = 0; j < cp; j++) { const isNew = n && cost[n - 1] > 1 && j >= capA[n - 1] / 2; const sc = isNew ? Math.min(1, grow) : 1; const filled = j < n, mv = filled && j < n - 1 && n && cost[n - 1] > 1 ? bell(t, last, .9) : 0;
            ctx.save(); ctx.globalAlpha = ph1; ctx.translate(cellX(j) + 16, cellY(j) + 18); ctx.scale(sc, sc); rrect(-16, -18, 32, 36, 6, filled ? (mv > 0 ? C.amber + '66' : C.teal + '44') : 'rgba(255,255,255,.04)', filled ? (mv > 0 ? C.amber : C.teal) : 'rgba(255,255,255,.18)', 1.5); ctx.restore(); }
          txt(`容量 ${cp}`, W / 2, 350, { size: 26, weight: 800, color: C.dim, alpha: ph1 * P(t, .5, .5) });
          line(60, base, 660, base, 1, { color: C.dim, w: 2, alpha: ph1 }); line(60, base - 33, 660, base - 33, 1, { color: C.amber, w: 2, dash: [8, 8], alpha: ph1 * P(t, 9, .6) }); txt('3', 46, base - 33, { size: 20, font: MONO, weight: 800, color: C.amber, alpha: ph1 * P(t, 9, .6) });
          for (let i = 0; i < n; i++) { const h = cost[i] * 11 * P(t, ti(i), .4, E.back), col = cost[i] > 1 ? C.coral : C.teal; ctx.save(); ctx.globalAlpha = ph1; ctx.shadowColor = col; ctx.shadowBlur = cost[i] > 1 ? 16 : 6; rrect(bx(i) - 12, base - h, 24, h, 5, col); ctx.restore(); if (cost[i] > 1) txt(String(cost[i]), bx(i), base - h - 18, { size: 18, font: MONO, weight: 800, color: col, alpha: ph1 }); }
          const tot = cost.slice(0, n).reduce((a, b) => a + b, 0); if (n) txt(`總成本 ${tot} ÷ ${n} 次 = ${(tot / n).toFixed(2)}`, W / 2, 870, { size: 32, font: MONO, weight: 800, color: tot / n <= 3 ? C.green : C.coral, alpha: ph1 });
          txt('每次成本', 60, 560, { size: 20, color: C.dim, align: 'left', alpha: ph1 * P(t, 1.8, .5) });
        }
        const ph2 = P(t, 14.4, .6); if (ph2 > 0) {
          txt('會計法：每次插入收 3 元', W / 2, 380, { size: 34, weight: 900, color: C.amber, alpha: ph2, glow: 12 });
          txt('1 元付自己　2 元存起來', W / 2, 432, { size: 26, weight: 700, alpha: ph2 });
          for (let j = 0; j < 8; j++) { const x = 104 + j * 73, y = 640; ctx.save(); ctx.globalAlpha = ph2; rrect(x - 30, y - 30, 60, 60, 10, C.teal + '33', C.teal, 2); ctx.restore(); txt(String(j + 1), x, y, { size: 22, font: MONO, weight: 800, alpha: ph2 });
            if (j >= 4) for (let c = 0; c < 2; c++) { const tc = 15 + (j - 4) * .5, fly = P(t, 18, .9), tgt = (j - 4) * 2 + c; const sx = x, sy = y - 52 - c * 30, ex = 104 + tgt * 73, ey = y + 60;
              if (t < tc) continue; const ux = L(sx, ex, fly), uy = L(sy, ey, fly) - Math.sin(Math.PI * fly) * 60; ctx.save(); ctx.globalAlpha = ph2 * P(t, tc, .3); ctx.fillStyle = C.amber; ctx.shadowColor = C.amber; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(ux, uy, 12, 0, 7); ctx.fill(); ctx.restore(); txt('$', ux, uy, { size: 14, weight: 900, color: '#3a2a00', alpha: ph2 * P(t, tc, .3) }); } }
          txt('容量 8 剛滿：後 4 個各存了 2 元', W / 2, 500, { size: 26, weight: 700, color: C.dim, alpha: ph2 * (1 - P(t, 17.8, .4)) });
          txt('8 枚硬幣 → 剛好付 8 個元素搬家', W / 2, 760, { size: 30, weight: 900, color: C.green, alpha: P(t, 19.2, .5), glow: 12 });
          pop(t, 21, W / 2, 900, () => txt('n 次總成本 ≤ 3n', 0, 0, { size: 52, weight: 900, font: SERIF, grad: [C.teal, C.green], glow: 26 }));
          txt('→ 每次攤銷 O(1)', W / 2, 975, { size: 32, font: MONO, weight: 800, alpha: P(t, 21.8, .5) }); burst(W / 2, 900, t, 21.1, C.green, 34, 91, 240); }
        caps(t, [[.4, 1.7, '陣列滿了，就開兩倍大的，全部搬過去'], [1.8, 13.7, '搬家很貴，但越來越少發生'], [13.8, 20.9, '會計法：每次插入多付一點，存起來'], [21, 26.7, '存款剛好付得起搬家：平均 O(1)']]);
      } });
  })();

  /* ================= 計組：Amdahl ================= */
  (() => {
    const f = .8, sp = s => 1 / ((1 - f) + f / s), sAt = t => Math.pow(100, P(t, 3, 7));
    const gx = v => 110 + Math.log10(v) / 3 * 530, gy = v => 920 - v * 40;
    def({ id: 'co-perf', subject: 'co', lesson: 'co-perf', chip: '計算機結構 · 效能', hook: ['把 80% 加速 100 倍', '整體只快不到 5 倍？'], dur: 26,
      sfx: [[.8, 'whoosh'], [1.6, 'pop'], [3, 'rise'], [10.3, 'error'], [11.5, 'whoosh'], [15.3, 'ding'], [19.6, 'success']],
      draw(t) {
        const s = sAt(t), wP = 480 / s, a = P(t, .8, .6);
        ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = C.coral; ctx.shadowBlur = 16 + 16 * win(t, 10.3, 14, .4); rrect(60, 400, 120, 70, 12, C.coral + '88', C.coral, 2); ctx.shadowColor = C.teal; ctx.shadowBlur = 14; rrect(184, 400, Math.max(4, wP), 70, 12, C.teal + '88', C.teal, 2); ctx.restore();
        txt('20%', 120, 435, { size: 28, font: MONO, weight: 900, alpha: a }); if (wP > 80) txt('80%', 184 + wP / 2, 435, { size: 28, font: MONO, weight: 900, alpha: a });
        txt('序列：改不動', 120, 500, { size: 22, weight: 800, color: C.coral, alpha: P(t, 1.6, .5) }); txt(`可平行：加速 ${s < 10 ? s.toFixed(1) : Math.round(s)} 倍`, 184 + Math.max(160, wP / 2), 500, { size: 22, weight: 800, color: C.teal, alpha: P(t, 1.6, .5) });
        txt(`整體加速 ${sp(s).toFixed(2)}×`, W / 2, 590, { size: 56, weight: 900, font: SERIF, grad: t > 10.3 ? [C.coral, C.amber] : [C.ink, C.teal], glow: 18, alpha: P(t, 2.4, .5) });
        txt('= 1 / (0.2 + 0.8 / s)', W / 2, 650, { size: 28, font: MONO, weight: 700, color: C.dim, alpha: P(t, 2.8, .5) });
        const ga = P(t, 11.5, .6); if (ga > 0) { ctx.save(); ctx.globalAlpha = ga;
          line(110, 920, 650, 920, 1, { color: C.dim, w: 2 }); line(110, 920, 110, 715, 1, { color: C.dim, w: 2 });
          [1, 10, 100, 1000].forEach(v => txt(String(v), gx(v), 942, { size: 18, font: MONO, color: C.dim })); [1, 3, 5].forEach(v => txt(String(v), 92, gy(v), { size: 18, font: MONO, color: C.dim }));
          line(110, gy(5), 650, gy(5), P(t, 12, .8), { color: C.coral, w: 2.5, dash: [10, 8], glow: 10 }); txt('上限 5×', 600, gy(5) - 20, { size: 22, weight: 800, color: C.coral, alpha: P(t, 12.5, .5) });
          const pts = []; for (let q = 0; q <= 60; q++) { const v = Math.pow(1000, q / 60); pts.push([gx(v), gy(sp(v))]); } const hd = poly(pts, P(t, 12.4, 2.6), { color: C.teal, w: 5, glow: 18 });
          if (hd && t < 15.2) node(hd[0], hd[1], 8, '', { stroke: '#fff', fill: '#fff', glow: 20 }); ctx.restore();
          txt('s →', 668, 920, { size: 18, color: C.dim, alpha: ga }); }
        pop(t, 19.6, W / 2, 1000, () => txt('加速上限 = 1 / (1 − f)', 0, 0, { size: 44, weight: 900, font: SERIF, grad: [C.amber, C.coral], glow: 24 }));
        caps(t, [[.4, 2.9, '程式裡有 20% 是改不動的序列部分'], [3, 10.2, '把另外 80% 加速 100 倍……'], [10.3, 15.2, '整體只快 4.81 倍：剩下的 20% 變成瓶頸'], [15.3, 19.5, '就算無限多核心，也到不了 5 倍'], [19.6, 25.7, 'Amdahl 定律：先優化最常發生的部分']]);
      } });
  })();

  /* ================= 資結：比較排序下界 ================= */
  (() => {
    const nd = { r: [360, 390, 'a ≤ b?'], l: [200, 530, 'b ≤ c?'], rr: [520, 530, 'a ≤ c?'], lr: [290, 670, 'a ≤ c?'], rrr: [610, 670, 'b ≤ c?'] };
    const lf = { abc: [115, 670, 'a b c'], acb: [220, 810, 'a c b'], cab: [355, 810, 'c a b'], bac: [440, 670, 'b a c'], bca: [545, 810, 'b c a'], cba: [665, 810, 'c b a'] };
    const ed = [['r', 'l', 1], ['r', 'rr', 0], ['l', 'abc', 1], ['l', 'lr', 0], ['lr', 'acb', 1], ['lr', 'cab', 0], ['rr', 'bac', 1], ['rr', 'rrr', 0], ['rrr', 'bca', 1], ['rrr', 'cba', 0]];
    const lvl = k => ({ r: 0, l: 1, rr: 1, abc: 2, lr: 2, bac: 2, rrr: 2, acb: 3, cab: 3, bca: 3, cba: 3 })[k], at = k => .8 + lvl(k) * .8, pos = k => nd[k] || lf[k];
    const path = ['r', 'rr', 'rrr', 'bca'], pt = i => 7 + i * 1.1;
    def({ id: 'ds-sort', subject: 'ds', lesson: 'ds-sort', chip: '資料結構 · 排序下界', hook: ['為什麼比較排序', '不可能比 n lg n 快？'], dur: 27,
      sfx: [[.8, 'pop'], [1.6, 'pop'], [2.4, 'pop'], [3.2, 'pop'], [4.4, 'ding'], [6.2, 'whoosh'], ...path.slice(1).map((_, i) => [pt(i + 1), 'land']), [10.9, 'success'], [12.5, 'rise'], [16.6, 'ding'], [19.5, 'success']],
      draw(t) {
        for (const [a, b, y] of ed) { const [x1, y1] = pos(a), [x2, y2] = pos(b), on = path.indexOf(a) >= 0 && path[path.indexOf(a) + 1] === b, u = on ? P(t, pt(path.indexOf(b)) - .6, .6) : 0;
          line(x1, y1 + 22, x2, y2 - 22, P(t, at(b) - .3, .5), { color: C.faint, w: 2.5 }); if (u > 0) line(x1, y1 + 22, x2, y2 - 22, u, { color: C.amber, w: 5, glow: 18 });
          txt(y ? '是' : '否', (x1 + x2) / 2 + (y ? -16 : 16), (y1 + y2) / 2 - 4, { size: 17, weight: 800, color: y ? C.teal : C.coral, alpha: P(t, at(b), .4) }); }
        for (const [k, [x, y, s]] of Object.entries(nd)) { const on = path.includes(k) && t > pt(path.indexOf(k)) - .1; pop(t, at(k), x, y, () => { ctx.shadowColor = on ? C.amber : C.violet; ctx.shadowBlur = on ? 22 : 8; rrect(-58, -22, 116, 44, 12, '#141c36', on ? C.amber : C.violet, 2); ctx.shadowBlur = 0; txt(s, 0, 1, { size: 20, font: MONO, weight: 800 }); }, .5); }
        for (const [k, [x, y, s]] of Object.entries(lf)) { const on = k === 'bca' && t > pt(3) - .1; pop(t, at(k) + .4, x, y, () => { ctx.shadowColor = on ? C.green : C.amber; ctx.shadowBlur = on ? 26 : 10; rrect(-46, -22, 92, 44, 22, on ? C.green + '44' : C.amber + '22', on ? C.green : C.amber, 2); ctx.shadowBlur = 0; txt(s, 0, 1, { size: 20, font: MONO, weight: 800, color: on ? '#fff' : C.amber }); }, .5); }
        txt('6 片葉子 = 3! 種排列', W / 2, 890, { size: 30, weight: 800, color: C.amber, alpha: win(t, 4.4, 6.1, .3) });
        const ia = win(t, 6.2, 12.2, .4); txt('輸入 a = 3, b = 1, c = 2', W / 2, 890, { size: 30, font: MONO, weight: 800, alpha: ia }); txt('→ 輸出 1 2 3 ✓', W / 2, 940, { size: 30, font: MONO, weight: 800, color: C.green, alpha: ia * P(t, 10.9, .4) });
        burst(...lf.bca.slice(0, 2), t, 10.9, C.green, 26, 101, 100);
        const ha = P(t, 12.5, .6); if (ha > 0) { line(30, 390, 30, 810, ha, { color: C.teal, w: 3, glow: 12 }); txt('h', 30, 360, { size: 26, weight: 900, font: SERIF, color: C.teal, alpha: ha }); }
        txt('最壞比較次數 = 樹高 h', W / 2, 890, { size: 30, weight: 800, color: C.teal, alpha: win(t, 12.5, 16.5, .3) });
        txt('二元樹高 h 最多 2ʰ 片葉子', W / 2, 940, { size: 28, weight: 700, alpha: win(t, 13.5, 16.5, .3) });
        txt('2ʰ ≥ n!', W / 2, 890, { size: 40, font: MONO, weight: 900, color: C.amber, alpha: P(t, 16.6, .5), glow: 14 });
        pop(t, 19.5, W / 2, 965, () => txt('h ≥ lg n! = Θ(n lg n)', 0, 0, { size: 46, weight: 900, font: SERIF, grad: [C.violet, C.amber], glow: 26 }));
        burst(W / 2, 965, t, 19.6, C.amber, 34, 103, 240);
        caps(t, [[.4, 4.3, '把排序 3 個數的所有比較畫成一棵決策樹'], [4.4, 6.1, '每一種排列都要有自己的葉子'], [6.2, 12.4, '實際跑一次，就是從根走到一片葉子'], [12.5, 19.4, 'n 個數有 n! 種排列，樹高至少 lg n!'], [19.5, 26.7, '所以 counting / radix 這種「不比較」的排序才能做到 O(n)']]);
      } });
  })();

  /* ================= 線代：基底與座標 ================= */
  (() => {
    const o = [170, 840], s = 74, v1 = [2, 1], v2 = [1, 2], p = [4, 5], S = (x, y) => [o[0] + x * s, o[1] - y * s];
    def({ id: 'la-vs', subject: 'la', lesson: 'la-vs', chip: '線性代數 · 基底與座標', hook: ['同一個點', '換個基底，座標就變了'], dur: 26,
      sfx: [[.8, 'whoosh'], [2, 'pop'], [4.2, 'pop'], [4.8, 'pop'], [6.5, 'rise'], [9.8, 'land'], [11, 'land'], [12.2, 'land'], [13, 'ding'], [15.2, 'pop'], [16.6, 'error'], [20.6, 'success']],
      draw(t) {
        const u = P(t, 6.5, 2.4), e1 = [L(1, v1[0], u), L(0, v1[1], u)], e2 = [L(0, v2[0], u), L(1, v2[1], u)], B = (a, b) => S(a * e1[0] + b * e2[0], a * e1[1] + b * e2[1]);
        ctx.save(); ctx.beginPath(); ctx.rect(20, 280, 680, 740); ctx.clip(); const ga = P(t, .5, 1);
        for (let k = -10; k <= 12; k++) { line(...B(k, -10), ...B(k, 12), 1, { color: k === 0 ? C.dim : u > .5 ? C.violet + '55' : C.faint, w: k === 0 ? 2 : 1.3, alpha: ga }); line(...B(-10, k), ...B(12, k), 1, { color: k === 0 ? C.dim : u > .5 ? C.amber + '55' : C.faint, w: k === 0 ? 2 : 1.3, alpha: ga }); }
        ctx.restore();
        const pa = P(t, 2, .5, E.back); node(...S(...p), 12, '', { stroke: '#fff', fill: '#fff', glow: 24, scale: pa });
        const lab = (str, x, y, col, a) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.font = `800 26px ${MONO}`; const w = ctx.measureText(str).width + 26; rrect(x - w / 2, y - 22, w, 44, 22, 'rgba(8,13,28,.9)', col, 1.8); ctx.restore(); txt(str, x, y, { size: 26, font: MONO, weight: 800, color: col, alpha: a }); };
        lab('p = (4, 5)', S(...p)[0] + 10, S(...p)[1] - 50, C.ink, P(t, 2.2, .5) * (1 - P(t, 12.8, .4)));
        arrow(...o, ...S(...v1), P(t, 4.2, .6), { color: C.amber, w: 5, glow: 18 }); arrow(...o, ...S(...v2), P(t, 4.8, .6), { color: C.violet, w: 5, glow: 18 });
        txt('v₁', S(...v1)[0] + 26, S(...v1)[1] + 10, { size: 30, weight: 900, font: SERIF, color: C.amber, alpha: P(t, 4.5, .4) }); txt('v₂', S(...v2)[0] - 28, S(...v2)[1] - 6, { size: 30, weight: 900, font: SERIF, color: C.violet, alpha: P(t, 5.1, .4) });
        if (t > 9.6) { const w1 = P(t, 9.8, .9), w2 = P(t, 11, 1.8); const a0 = S(0, 0), a1 = S(...v1), a2 = S(v1[0] + 2 * v2[0], v1[1] + 2 * v2[1]); const fade = 1 - P(t, 14.8, .5);
          arrow(...a0, ...a1, w1, { color: C.amber, w: 7, glow: 24, alpha: fade }); if (w2 > 0) arrow(...a1, ...a2, w2, { color: C.violet, w: 7, glow: 24, alpha: fade }); }
        lab('B 座標 = (1, 2)', W / 2 + 80, 360, C.green, P(t, 13, .5)); burst(...S(...p), t, 13, C.green, 28, 111, 120);
        const v3a = P(t, 15.2, .6); if (v3a > 0) { arrow(...o, ...S(3, 3), v3a, { color: C.coral, w: 5, glow: 20 }); txt('v₃', S(3, 3)[0] + 26, S(3, 3)[1] + 6, { size: 30, weight: 900, font: SERIF, color: C.coral, alpha: v3a });
          const da = win(t, 16.4, 20.4, .4); line(...S(...v1), ...S(3, 3), 1, { color: C.coral, w: 2.5, dash: [8, 8], alpha: da }); line(...S(...v2), ...S(3, 3), 1, { color: C.coral, w: 2.5, dash: [8, 8], alpha: da });
          lab('v₃ = v₁ + v₂', W / 2 + 80, 420, C.coral, win(t, 16.6, 20.4, .4)); }
        pop(t, 20.6, W / 2, 960, () => { rrect(-300, -52, 600, 104, 24, 'rgba(8,13,28,.9)', C.teal, 2); txt('基底 = 線性獨立 + 生成', 0, -16, { size: 32, weight: 900 }); txt('基底的個數 = 維度 = 2', 0, 26, { size: 26, weight: 700, color: C.teal }); });
        caps(t, [[.4, 4.1, '標準基底下，p 的座標是 (4, 5)'], [4.2, 9.5, '換一組基底 v₁ = (2,1)、v₂ = (1,2)，格子跟著變形'], [9.6, 15, 'p = 1·v₁ + 2·v₂ → 新座標 (1, 2)'], [15.1, 20.5, '再加 v₃ = v₁ + v₂：沒有新方向，線性相依'], [20.6, 25.7, '座標只是「在這組基底下的說明書」']]);
      } });
  })();

  /* ================= 計組：IEEE 754 ================= */
  (() => {
    const bits = '11000000110010000000000000000000'.split(''), bx = i => 40 + i * 20, BY = 660;
    def({ id: 'co-arith', subject: 'co', lesson: 'co-arith', chip: '計算機結構 · IEEE 754', hook: ['−6.25 存進電腦', '長什麼樣子？'], dur: 26,
      sfx: [[.8, 'pop'], [2.4, 'tick'], [4.6, 'whoosh'], [6, 'land'], [8, 'pop'], [10.4, 'pop'], [12.6, 'pop'], [14.5, 'rise'], [17.6, 'success'], [20.5, 'ding']],
      draw(t) {
        txt('−6.25', W / 2, 330, { size: 64, font: SERIF, weight: 900, grad: [C.amber, C.coral], glow: 20, alpha: P(t, .8, .5) });
        txt(typeIn('= −(4 + 2 + 0.25) = −110.01₂', P(t, 2.4, 1.4, E.lin)), W / 2, 410, { size: 30, font: MONO, weight: 800, alpha: 1 });
        const mv = P(t, 4.6, 1.4); const binA = P(t, 4.4, .4);
        if (binA > 0) { txt('−110.01₂', W / 2, 490, { size: 48, font: MONO, weight: 900, color: C.teal, alpha: binA * (1 - mv) });
          txt('−1.1001₂ × 2²', W / 2, 490, { size: 48, font: MONO, weight: 900, color: C.amber, alpha: binA * mv, glow: 14 });
          if (mv > 0 && mv < 1) curve(W / 2 + 20, 455, W / 2 - 60, 455, 50, mv, { color: C.amber, w: 3, glow: 12 }); }
        txt('正規化：小數點左移 2 位', W / 2, 550, { size: 24, weight: 700, color: C.dim, alpha: win(t, 4.8, 7.8, .3) });
        txt('符號 1（負數）', W / 2, 560, { size: 28, weight: 800, color: C.coral, alpha: win(t, 8, 10.2, .3) });
        txt('指數 2 + 127 = 129 = 1000 0001', W / 2, 560, { size: 28, font: MONO, weight: 800, color: C.amber, alpha: win(t, 10.4, 12.4, .3) });
        txt('小數 = 1. 後面的 1001（開頭 1 不存）', W / 2, 560, { size: 26, weight: 800, color: C.teal, alpha: win(t, 12.6, 14.4, .3) });
        const seg = i => i === 0 ? [C.coral, 8] : i < 9 ? [C.amber, 10.4] : [C.teal, 12.6];
        bits.forEach((b, i) => { const [col, t0] = seg(i), a = P(t, .9 + i * .03, .3), on = P(t, t0 + (i % 23) * .03, .3);
          ctx.save(); ctx.globalAlpha = a; rrect(bx(i) + 1, BY - 22, 18, 44, 4, on > 0 ? col + '44' : 'rgba(255,255,255,.05)', on > 0 ? col : 'rgba(255,255,255,.18)', 1.2); ctx.restore();
          txt(on > 0 ? b : '', bx(i) + 10, BY + 1, { size: 18, font: MONO, weight: 800, alpha: on, color: '#fff' }); });
        [[0, 0, 'S', C.coral], [1, 8, '指數 8', C.amber], [9, 31, '小數 23', C.teal]].forEach(([a, b, s, col]) => { const al = P(t, 1.4, .5); line(bx(a) + 2, BY + 32, bx(b) + 18, BY + 32, 1, { color: col, w: 2, alpha: al }); txt(s, (bx(a) + bx(b) + 20) / 2, BY + 54, { size: 18, weight: 800, color: col, alpha: al }); });
        txt('分組看：1100 0000 1100 1000 0000 …', W / 2, 780, { size: 26, font: MONO, weight: 700, alpha: P(t, 14.6, .5) });
        pop(t, 17.6, W / 2, 860, () => txt('= 0xC0C80000', 0, 0, { size: 52, font: MONO, weight: 900, color: C.amber, glow: 24 }));
        burst(W / 2, 860, t, 17.7, C.amber, 34, 121, 240);
        txt('bias 127：指數可以直接當無號數比大小', W / 2, 950, { size: 24, weight: 700, color: C.dim, alpha: P(t, 20.5, .5) });
        caps(t, [[.4, 4.3, '先把 6.25 換成二進位：110.01'], [4.4, 7.9, '正規化成 1.xxx × 2ᵉ：1.1001 × 2²'], [8, 14.4, '依序填：符號、加了 bias 的指數、小數部分'], [14.5, 20.4, '32 個位元，換成 16 進位'], [20.5, 25.7, '考試常考：反過來把 16 進位解碼成小數']]);
      } });
  })();

  /* ================= OS：競爭條件 ================= */
  (() => {
    const steps = [[0, 'load r ← x', 5, null], [1, 'load r ← x', 5, null], [0, 'r = r + 1', 6, null], [1, 'r = r + 1', 6, null], [0, 'store x ← r', null, 6], [1, 'store x ← r', null, 6]];
    const st = i => 2.6 + i * 1.3, cx = th => th ? 520 : 200;
    def({ id: 'os-sync', subject: 'os', lesson: 'os-sync', chip: '作業系統 · 同步', hook: ['兩個執行緒各 +1', '結果竟然只 +1？'], dur: 27,
      sfx: [[.8, 'pop'], ...steps.map((_, i) => [st(i), 'tick']), [st(5) + .5, 'error'], [11.6, 'whoosh'], [13.4, 'land'], [15.6, 'pop'], [17.8, 'land'], [19.6, 'success']],
      draw(t) {
        const A1 = 1 - P(t, 11.4, .5);
        let x = 5; steps.forEach(([, , , w], i) => { if (w != null && t >= st(i)) x = w; });
        const x2 = t < 13.4 ? 5 : t < 17.8 ? 6 : 7, xv = t < 11.6 ? x : x2;
        ctx.save(); ctx.globalAlpha = P(t, .8, .5); ctx.shadowColor = C.amber; ctx.shadowBlur = 18; rrect(260, 330, 200, 84, 18, 'rgba(255,197,71,.12)', C.amber, 2.5); ctx.restore();
        txt('共享 x', 360, 352, { size: 20, color: C.dim, weight: 700, alpha: P(t, .8, .5) }); txt(String(xv), 360, 392, { size: 36, font: MONO, weight: 900, color: C.amber, alpha: P(t, .8, .5) });
        if (A1 > 0) { ctx.save(); ctx.globalAlpha = A1;
          [0, 1].forEach(th => { txt(th ? 'T2' : 'T1', cx(th), 470, { size: 30, font: MONO, weight: 900, color: th ? C.violet : C.teal }); let r = '—'; steps.forEach(([h, , rv], i) => { if (h === th && rv != null && t >= st(i)) r = rv; }); txt(`r = ${r}`, cx(th), 510, { size: 22, font: MONO, color: C.dim }); });
          steps.forEach(([th, s], i) => { const y = 570 + i * 56, a = P(t, st(i), .3), cur = bell(t, st(i) - .05, 1); if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.shadowColor = th ? C.violet : C.teal; ctx.shadowBlur = 20 * cur; rrect(cx(th) - 130, y - 22, 260, 44, 10, (th ? C.violet : C.teal) + '26', th ? C.violet : C.teal, 1.6); ctx.restore(); txt(s, cx(th), y, { size: 22, font: MONO, weight: 800, alpha: a }); txt(String(i + 1), 360, y, { size: 18, font: MONO, color: C.dim, alpha: a }); });
          ctx.restore(); }
        txt('預期 7，實際 6 ✗', W / 2, 950, { size: 44, weight: 900, font: SERIF, color: C.coral, glow: 22, alpha: win(t, st(5) + .5, 11.4, .3) });
        if (t > st(5) + .5 && t < 11.4) ring(360, 372, t, st(5) + .5, C.coral, 40, 140);
        const B = P(t, 11.6, .5); if (B > 0) { ctx.save(); ctx.globalAlpha = B;
          const lockOwner = t < 17.8 ? 'T1' : 'T2'; txt('🔒 mutex', 360, 480, { size: 26, weight: 800, color: C.green });
          txt(`持有者：${lockOwner}`, 360, 520, { size: 22, font: MONO, color: C.dim });
          [['T1', C.teal, 12, ['lock()', 'load / add / store', 'unlock()']], ['T2', C.violet, 15.6, ['lock()  ← 等待中…', 'load / add / store', 'unlock()']]].forEach(([nm, col, t0, lines], q) => { const y0 = 590 + q * 190;
            txt(nm, 90, y0, { size: 28, font: MONO, weight: 900, color: col }); lines.forEach((s, j) => { const tt = q ? (j === 0 ? 15.6 : 17.8 + j * .5) : 12 + j * .7; const a = P(t, tt, .3); const wait = q && j === 0 && t < 17.8; ctx.save(); ctx.globalAlpha *= a; rrect(150, y0 - 22 + j * 52, 480, 44, 10, wait ? C.coral + '22' : col + '22', wait ? C.coral : col, 1.5); ctx.restore(); txt(wait ? s : s.replace('  ← 等待中…', ''), 390, y0 + j * 52, { size: 22, font: MONO, weight: 800, alpha: a, color: wait ? C.coral : C.ink }); }); });
          ctx.restore(); }
        pop(t, 19.6, W / 2, 985, () => txt('x = 7 ✓', 0, 0, { size: 50, weight: 900, font: SERIF, grad: [C.green, C.teal], glow: 24 }));
        caps(t, [[.4, 2.5, 'x++ 在機器裡其實是三條指令'], [2.6, 11.4, '交錯執行：兩邊都讀到 5，最後都寫回 6'], [11.5, 15.5, '把讀－改－寫包進臨界區，一次只准一個人進去'], [15.6, 19.5, 'T2 只能等 T1 解鎖'], [19.6, 26.7, '臨界區三條件：互斥、進展、有限等待']]);
      } });
  })();

  /* ================= 線代：行列式 = 面積倍率 ================= */
  (() => {
    const o = [210, 820], s = 80, S = (x, y) => [o[0] + x * s, o[1] - y * s];
    const keys = [[0, [1, 0], [0, 1]], [1.2, [1, 0], [0, 1]], [3.4, [3, 1], [1, 2]], [7, [3, 1], [1, 2]], [9, [3, 1], [0, 5 / 3]], [11.6, [3, 1], [0, 5 / 3]], [13.4, [0, 5 / 3], [3, 1]], [16, [0, 5 / 3], [3, 1]], [16.2, [3, 1], [1, 2]], [17.4, [3, 1], [1, 2]], [19.4, [3, 1], [1.5, .5]], [99, [3, 1], [1.5, .5]]];
    const at = t => { for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [t0, a0, b0] = keys[i - 1], [t1, a1, b1] = keys[i]; const u = E.io(cl((t - t0) / (t1 - t0))); return [[L(a0[0], a1[0], u), L(a0[1], a1[1], u)], [L(b0[0], b1[0], u), L(b0[1], b1[1], u)]]; } return [keys[keys.length - 1][1], keys[keys.length - 1][2]]; };
    def({ id: 'la-det', subject: 'la', lesson: 'la-det', chip: '線性代數 · 行列式', hook: ['行列式', '其實是面積的放大倍率'], dur: 26,
      sfx: [[.8, 'whoosh'], [1.2, 'pop'], [3.4, 'rise'], [5.4, 'ding'], [7, 'whoosh'], [9.2, 'ding'], [11.6, 'whoosh'], [13.4, 'error'], [17.4, 'rise'], [19.4, 'boom'], [21.4, 'success']],
      draw(t) {
        const [a, b] = at(t), det = a[0] * b[1] - a[1] * b[0], col = det < -.01 ? C.coral : Math.abs(det) < .05 ? C.dim : C.violet;
        ctx.save(); ctx.beginPath(); ctx.rect(20, 280, 680, 740); ctx.clip(); for (let k = -3; k <= 7; k++) { line(...S(k, -2), ...S(k, 7), 1, { color: C.faint, w: 1, alpha: P(t, .5, .8) }); line(...S(-3, k), ...S(7, k), 1, { color: C.faint, w: 1, alpha: P(t, .5, .8) }); } ctx.restore();
        const pts = [S(0, 0), S(...a), S(a[0] + b[0], a[1] + b[1]), S(...b)]; ctx.save(); ctx.globalAlpha = P(t, 1.2, .5); ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fillStyle = col + '44'; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 22; ctx.fill(); ctx.stroke(); ctx.restore();
        arrow(...o, ...S(...a), P(t, 1.2, .5), { color: C.amber, w: 5, glow: 16 }); arrow(...o, ...S(...b), P(t, 1.2, .5), { color: C.teal, w: 5, glow: 16 });
        if (t > 11.6 && t < 16.4) { const cxy = S((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); ctx.save(); ctx.globalAlpha = win(t, 11.8, 16.2, .3); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); const dir = t > 13.4 ? -1 : 1; ctx.arc(cxy[0], cxy[1], 40, 0, dir * 4.8, dir < 0); ctx.stroke(); ctx.restore(); txt(t > 13.4 ? '↻ 順時針' : '↺ 逆時針', cxy[0], cxy[1] - 70, { size: 22, weight: 800, color: col, alpha: win(t, 11.8, 16.2, .3) }); }
        const fmt = v => Math.abs(v - Math.round(v)) < .02 ? String(Math.round(v)) : v.toFixed(2);
        ctx.save(); ctx.globalAlpha = P(t, 1.2, .5); rrect(W / 2 - 170, 300, 340, 70, 20, 'rgba(8,13,28,.9)', col, 2); ctx.restore();
        txt(`det = ${fmt(det).replace('-', '−')}`, W / 2, 336, { size: 40, font: MONO, weight: 900, color: col, glow: 14, alpha: P(t, 1.2, .5) });
        txt('列（行）相加：剪切，面積不變', W / 2, 900, { size: 28, weight: 800, color: C.teal, alpha: win(t, 7, 11.4, .3) });
        txt('交換兩行：方向翻轉，變號', W / 2, 900, { size: 28, weight: 800, color: C.coral, alpha: win(t, 11.6, 16.2, .3) });
        txt('兩行平行：壓成一條線，det = 0', W / 2, 900, { size: 28, weight: 800, color: C.ink, alpha: win(t, 17.4, 21.2, .3) });
        burst(...S(2.25, .75), t, 19.4, C.coral, 30, 131, 160);
        pop(t, 21.4, W / 2, 960, () => { rrect(-300, -56, 600, 112, 24, 'rgba(8,13,28,.9)', C.violet, 2); txt('det = 0 ⟺ 不可逆', 0, -18, { size: 34, weight: 900 }); txt('det(AB) = det A · det B', 0, 26, { size: 26, font: MONO, weight: 800, color: C.violet }); });
        caps(t, [[.4, 3.3, '單位正方形，面積 1'], [3.4, 6.9, '經過 A = [3 1; 1 2]：面積變成 5'], [7, 11.5, '把一行的倍數加到另一行：形狀變了，面積沒變'], [11.6, 17.3, '交換兩行：面積一樣，但方向反了 → 負號'], [17.4, 25.7, '兩行共線：面積 0，資訊被壓掉，不可逆']]);
      } });
  })();

  /* ================= 資結：雜湊與線性探測 ================= */
  (() => {
    const M = 11, keys = [22, 1, 13, 11, 24, 33], sx = i => 42 + i * 58 + 26, SY = 540;
    const ins = []; const tab = Array(M).fill(null); keys.forEach(k => { const h = k % M, pr = []; let j = h; while (tab[j] != null) { pr.push(j); j = (j + 1) % M; } pr.push(j); tab[j] = k; ins.push({ k, h, pr }); });
    const t0 = i => 1.8 + [0, 1.4, 2.8, 4.2, 6.4, 8.6][i];
    def({ id: 'ds-hash', subject: 'ds', lesson: 'ds-hash', chip: '資料結構 · 雜湊', hook: ['雜湊碰撞了', '線性探測為什麼會結塊？'], dur: 27,
      sfx: ins.flatMap((q, i) => q.pr.map((_, j) => [t0(i) + .5 + j * .32, j === q.pr.length - 1 ? 'land' : 'error'])), draw(t) {
        const A1 = 1 - P(t, 15.4, .5);
        for (let i = 0; i < M; i++) { const occ = ins.filter((q, n) => t >= t0(n) + .5 + (q.pr.length - 1) * .32 + .2 && q.pr[q.pr.length - 1] === i)[0]; const inClu = t > 13 && i <= 5;
          ctx.save(); ctx.globalAlpha = P(t, .5 + i * .04, .3) * A1; rrect(sx(i) - 26, SY - 30, 52, 60, 8, occ ? (inClu ? C.coral + '55' : C.teal + '44') : 'rgba(255,255,255,.04)', occ ? (inClu ? C.coral : C.teal) : 'rgba(255,255,255,.2)', 1.5); ctx.restore();
          txt(String(i), sx(i), SY + 50, { size: 16, font: MONO, color: C.dim, alpha: P(t, .5, .5) * A1 }); if (occ) txt(String(occ.k), sx(i), SY, { size: 22, font: MONO, weight: 800, alpha: A1 }); }
        ins.forEach((q, n) => { const s0 = t0(n); if (t < s0 || A1 <= 0) return; const tEnd = s0 + .5 + (q.pr.length - 1) * .32 + .2; if (t > tEnd) return;
          const steps = Math.min(q.pr.length - 1, Math.max(0, Math.floor((t - s0 - .5) / .32))), slot = q.pr[steps], [x, y] = [sx(slot), SY - 80], ap = P(t, s0, .4, E.back);
          node(t < s0 + .5 ? W / 2 : x, t < s0 + .5 ? 380 : y, 26, q.k, { stroke: q.pr.length > 1 ? C.amber : C.teal, glow: 18, scale: ap, size: 20 });
          if (t >= s0 + .5) for (let j = 0; j < steps; j++) { const xa = sx(q.pr[j]); txt('✗', xa, SY - 44, { size: 20, color: C.coral, weight: 900 }); } });
        const cur = ins.find((q, n) => t >= t0(n) && t < t0(n) + .5 + (q.pr.length - 1) * .32 + .5); if (cur && A1 > 0) txt(`${cur.k} mod 11 = ${cur.h}${cur.pr.length > 1 ? `　探測 ${cur.pr.length} 次` : ''}`, W / 2, 720, { size: 30, font: MONO, weight: 800, color: cur.pr.length > 1 ? C.amber : C.teal });
        if (t > 13 && A1 > 0) { line(sx(0) - 26, SY + 76, sx(5) + 26, SY + 76, P(t, 13, .6), { color: C.coral, w: 4, glow: 16, alpha: A1 }); txt('主叢集：落在這段的都要排隊', (sx(0) + sx(5)) / 2, SY + 110, { size: 24, weight: 800, color: C.coral, alpha: P(t, 13.3, .5) * A1 }); }
        const B = P(t, 15.6, .6); if (B > 0) { const al = [.5, .8, .9], lin = a => .5 * (1 + 1 / ((1 - a) * (1 - a))), dbl = a => 1 / (1 - a), y0 = 930, sc2 = 7;
          txt('不成功搜尋的平均探測次數', W / 2, 520, { size: 28, weight: 800, alpha: B });
          al.forEach((a, i) => { const x = 170 + i * 200, u = P(t, 16.2 + i * .5, .9, E.out); txt(`α = ${a}`, x, y0 + 30, { size: 22, font: MONO, weight: 800, alpha: B });
            [[lin(a), C.coral, -34], [dbl(a), C.teal, 34]].forEach(([v, col, dx]) => { const h = Math.min(v, 40) * sc2 * u; ctx.save(); ctx.globalAlpha = B; ctx.shadowColor = col; ctx.shadowBlur = 14; rrect(x + dx - 24, y0 - h, 48, h, 8, col); ctx.restore(); txt(v >= 40 ? '50.5' : v.toFixed(1), x + dx, y0 - h - 18, { size: 18, font: MONO, weight: 800, color: col, alpha: B * cl(u * 2) }); }); });
          txt('■ 線性探測', 230, 575, { size: 22, weight: 800, color: C.coral, alpha: B }); txt('■ 雙重雜湊', 490, 575, { size: 22, weight: 800, color: C.teal, alpha: B });
          pop(t, 21, W / 2, 1008, () => txt('α 接近 1 時，線性探測爆炸', 0, 0, { size: 36, weight: 900, font: SERIF, color: C.amber, glow: 20 })); }
        caps(t, [[.4, 1.7, 'h(k) = k mod 11，撞到就往下一格找'], [1.8, 12.9, '撞的人越多，連續被佔的區段越長'], [13, 15.4, '叢集越大，越容易再變大：主叢集'], [15.5, 20.9, '雙重雜湊每把 key 的跳距不同，叢集打散'], [21, 26.7, '負載因子 α 是雜湊表效能的關鍵']]);
      } });
  })();

  /* ================= 計組：單週期 vs 多週期 ================= */
  (() => {
    const stg = [['IF', 200, C.blue], ['Reg', 100, C.violet], ['ALU', 200, C.amber], ['Mem', 200, C.coral], ['WB', 100, C.green]];
    const ins = [['lw', [0, 1, 2, 3, 4]], ['sw', [0, 1, 2, 3]], ['R 型', [0, 1, 2, 4]], ['beq', [0, 1, 2]]], k = .5, X0 = 130, ry = i => 430 + i * 92;
    def({ id: 'co-datapath', subject: 'co', lesson: 'co-datapath', chip: '計算機結構 · 資料路徑', hook: ['單週期 CPU', '為什麼全被 lw 拖慢？'], dur: 26,
      sfx: [...ins.map((_, i) => [1 + i * .9, 'whoosh']), [5.2, 'rise'], [6.4, 'error'], [11.4, 'whoosh'], [13.5, 'ding'], [18.6, 'success']],
      draw(t) {
        const mc = P(t, 11.4, 1.2);
        ins.forEach(([nm, ss], i) => { const y = ry(i), a = P(t, 1 + i * .9, .5); txt(nm, 70, y, { size: 26, font: MONO, weight: 900, alpha: a }); let x = X0;
          ss.forEach((si, j) => { const [sn, ps, col] = stg[si], w0 = ps * k, w1 = 200 * k, w = L(w0, w1, mc), u = P(t, 1 + i * .9 + j * .15, .4); if (u <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = col; ctx.shadowBlur = 10; rrect(x + 1, y - 26, Math.max(2, w * u - 2), 52, 8, col + '55', col, 1.5); ctx.restore(); if (u > .6) txt(sn, x + w / 2, y, { size: 18, font: MONO, weight: 800, alpha: a }); x += w; });
          const tot = ss.reduce((s2, si) => s2 + stg[si][1], 0); if (mc < .5) { const wx = X0 + tot * k, ww = (800 - tot) * k, wa = P(t, 6.4, .5) * (1 - mc * 2); if (ww > 0 && wa > 0) { ctx.save(); ctx.globalAlpha = wa; ctx.setLineDash([6, 6]); rrect(wx + 1, y - 26, ww - 2, 52, 8, 'rgba(255,107,139,.12)', C.coral, 1.5); ctx.restore(); txt('閒置', wx + ww / 2, y, { size: 18, weight: 800, color: C.coral, alpha: wa }); }
            txt(`${tot} ps`, 680, y, { size: 18, font: MONO, color: C.dim, alpha: a * (1 - mc * 2) }); }
          else txt(`${ss.length} 週期`, 680, y, { size: 18, weight: 800, color: C.teal, alpha: (mc - .5) * 2 }); });
        const ca = P(t, 5.2, .6); if (ca > 0 && mc < .5) { const x = X0 + 800 * k; line(x, 370, x, 800, 1, { color: C.coral, w: 3, glow: 16, alpha: ca * (1 - mc * 2) }); txt('時脈週期 = 800 ps', x - 6, 352, { size: 24, weight: 900, color: C.coral, alpha: ca * (1 - mc * 2), align: 'right' }); }
        if (mc > .5) for (let c = 0; c <= 5; c++) { const x = X0 + c * 200 * k; line(x, 380, x, 790, 1, { color: C.teal, w: 1.5, dash: [5, 7], alpha: (mc - .5) * 2 * .7 }); }
        txt('多週期：時脈 200 ps，每條指令用自己需要的週期數', W / 2, 352, { size: 22, weight: 800, color: C.teal, alpha: P(t, 12.4, .5) });
        txt('單週期：CPI = 1，但週期 = 最慢的那條', W / 2, 880, { size: 28, weight: 800, color: C.coral, alpha: win(t, 6.6, 11.2, .3) });
        txt('多週期：週期短，CPI 依指令而變', W / 2, 880, { size: 28, weight: 800, color: C.teal, alpha: P(t, 13.5, .5) });
        pop(t, 18.6, W / 2, 960, () => txt('再進一步：管線化，5 段同時做', 0, 0, { size: 36, weight: 900, font: SERIF, grad: [C.amber, C.teal], glow: 20 }));
        caps(t, [[.4, 5.1, '每條指令走過的元件不同，時間也不同'], [5.2, 11.3, '單週期：每條都得等滿最慢的 lw，其他時間全浪費'], [11.4, 18.5, '多週期：時脈縮成最慢的一段，指令按需要走幾步'], [18.6, 25.7, 'CPU 時間 = 指令數 × CPI × 週期：三者互相拉扯']]);
      } });
  })();

  /* ================= 離散：遞迴與特徵方程式 ================= */
  (() => {
    const a = [2, 1, 5, 7, 17, 31, 65], bx = i => 110 + i * 84, base = 700, sc = 3.6;
    def({ id: 'dm-recur-gf', subject: 'dm', lesson: 'dm-recur-gf', chip: '離散數學 · 遞迴關係', hook: ['遞迴式', '怎麼變成一行公式？'], dur: 27,
      sfx: [...a.map((_, i) => [1.4 + i * .5, 'pop']), [5.4, 'whoosh'], [7.6, 'rise'], [9.4, 'land'], [9.9, 'land'], [12, 'pop'], [14.2, 'ding'], ...a.map((_, i) => [16.4 + i * .25, 'tick']), [18.6, 'success'], [21.4, 'ding']],
      draw(t) {
        txt('aₙ = aₙ₋₁ + 2aₙ₋₂', W / 2, 320, { size: 36, font: MONO, weight: 900, color: C.green, glow: 12, alpha: P(t, .6, .5) }); txt('a₀ = 2,  a₁ = 1', W / 2, 368, { size: 24, font: MONO, color: C.dim, alpha: P(t, 1, .5) });
        const bA = 1 - P(t, 5.2, .5) + P(t, 16.2, .5);
        a.forEach((v, i) => { const u = P(t, 1.4 + i * .5, .5, E.back), h = v * sc * Math.min(u, 1.1), ok = t > 16.4 + i * .25; ctx.save(); ctx.globalAlpha = bA * cl(u); ctx.shadowColor = ok ? C.green : C.teal; ctx.shadowBlur = 14; rrect(bx(i) - 26, base - h, 52, h, 8, (ok ? C.green : C.teal) + '66', ok ? C.green : C.teal, 1.5); ctx.restore();
          txt(String(v), bx(i), base - h - 20, { size: 22, font: MONO, weight: 800, alpha: bA * cl(u) }); txt(`a${'₀₁₂₃₄₅₆'[i]}`, bx(i), base + 24, { size: 20, font: MONO, color: C.dim, alpha: bA * cl(u) }); if (ok) txt('✓', bx(i), base + 54, { size: 22, weight: 900, color: C.green }); });
        const ph = win(t, 5.4, 16, .4); if (ph > 0) {
          txt(typeIn('猜 aₙ = rⁿ → r² = r + 2', P(t, 5.4, 1.4, E.lin)), W / 2, 470, { size: 32, font: MONO, weight: 800, color: C.amber, alpha: ph });
          txt('(r − 2)(r + 1) = 0', W / 2, 530, { size: 30, font: MONO, weight: 800, alpha: ph * P(t, 7.6, .5) });
          line(110, 620, 610, 620, P(t, 8, .6), { color: C.dim, w: 2, alpha: ph }); [-2, -1, 0, 1, 2, 3].forEach(v => txt(String(v).replace('-', '−'), 360 + v * 90, 650, { size: 18, font: MONO, color: C.dim, alpha: ph * P(t, 8.3, .4) }));
          [[2, 9.4], [-1, 9.9]].forEach(([r, t1]) => { node(360 + r * 90, 620, 14, '', { stroke: C.amber, fill: C.amber, glow: 24, scale: P(t, t1, .4, E.back), alpha: ph }); ring(360 + r * 90, 620, t, t1, C.amber, 10, 50); });
          txt('aₙ = α·2ⁿ + β·(−1)ⁿ', W / 2, 740, { size: 32, font: MONO, weight: 900, color: C.teal, alpha: ph * P(t, 12, .5) });
          txt('a₀: α + β = 2　a₁: 2α − β = 1', W / 2, 800, { size: 24, font: MONO, weight: 700, alpha: ph * P(t, 12.8, .5) }); txt('→ α = 1, β = 1', W / 2, 846, { size: 26, font: MONO, weight: 800, color: C.amber, alpha: ph * P(t, 14.2, .5) }); }
        pop(t, 18.6, W / 2, 830, () => txt('aₙ = 2ⁿ + (−1)ⁿ', 0, 0, { size: 52, weight: 900, font: SERIF, grad: [C.green, C.teal], glow: 26 }));
        burst(W / 2, 830, t, 18.7, C.green, 34, 141, 240);
        txt('重根 r 時：用 (α + βn)·rⁿ', W / 2, 920, { size: 28, weight: 800, color: C.violet, alpha: P(t, 21.4, .5) });
        caps(t, [[.4, 5.3, '數列一直長：能不能直接算出第 n 項？'], [5.4, 11.9, '代入 rⁿ：遞迴式變成特徵方程式，根是 2 和 −1'], [12, 16.3, '通解 = 根的冪次線性組合，用初始值解係數'], [16.4, 21.3, '每一項都對得上 ✓'], [21.4, 26.7, '非齊次再加特解；也可以用生成函數推']]);
      } });
  })();

  /* ================= 資結：B 樹分裂 ================= */
  (() => {
    const S = [[[10, 20, 30], 360, 430]], st = [S, [[[20], 360, 430], [[10], 200, 620], [[30], 520, 620]], [[[20], 360, 430], [[10], 200, 620], [[25, 30], 520, 620]], [[[20], 360, 430], [[10], 200, 620], [[25, 30, 40], 520, 620]], [[[20, 30], 360, 430], [[10], 150, 620], [[25], 360, 620], [[40], 570, 620]], [[[20, 30], 360, 430], [[10], 150, 620], [[25], 360, 620], [[40, 50], 570, 620]]];
    const T = [0, 4, 5.6, 8, 11, 12.6], KW = 58, waitP = { 25: [620, 330, 2.6], 40: [620, 330, 7], 50: [620, 330, 9.6] };
    const kp = (s, k) => { for (const [ks, x, y] of st[s]) { const i = ks.indexOf(k); if (i >= 0) return [x + (i - (ks.length - 1) / 2) * KW, y]; } return null; };
    def({ id: 'ds-btree', subject: 'ds', lesson: 'ds-btree', chip: '資料結構 · B 樹', hook: ['B 樹節點滿了', '往上分裂，不往下長'], dur: 26,
      sfx: [[.8, 'pop'], [2.6, 'pop'], [3.4, 'error'], [4, 'whoosh'], [5.6, 'land'], [7, 'pop'], [8, 'land'], [9.6, 'pop'], [10.4, 'error'], [11, 'whoosh'], [12.6, 'land'], [14.2, 'success'], [19.6, 'ding']],
      draw(t) {
        let s = 0; for (let i = 0; i < T.length; i++) if (t >= T[i]) s = i; const u = s ? P(t, T[s], .9) : 1, prev = Math.max(0, s - 1);
        const nodesDraw = (sid, al) => { if (al <= 0) return; const root = st[sid][0]; st[sid].slice(1).forEach(([, x, y]) => line(root[1], root[2] + 30, x, y - 30, 1, { color: C.dim, w: 2.5, alpha: al }));
          st[sid].forEach(([ks, x, y], ni) => { const full = ks.length === 3, w = ks.length * KW + 16; ctx.save(); ctx.globalAlpha = al; ctx.shadowColor = full ? C.coral : C.teal; ctx.shadowBlur = full ? 22 : 10; rrect(x - w / 2, y - 34, w, 68, 16, full ? 'rgba(255,107,139,.12)' : 'rgba(46,230,201,.08)', full ? C.coral : C.teal, 2); ctx.restore(); }); };
        nodesDraw(prev, s ? 1 - u : 0); nodesDraw(s, s ? u : P(t, .8, .5));
        for (const k of [10, 20, 30, 25, 40, 50]) { const p1 = kp(s, k), p0 = kp(prev, k); let pos = null, a = 1;
          if (p1 && p0) pos = [L(p0[0], p1[0], u), L(p0[1], p1[1], u) - (k === 20 && s === 1 || k === 30 && s === 4 ? Math.sin(Math.PI * u) * 40 : 0)];
          else if (p1 && !p0) { const w = waitP[k]; pos = [L(w[0], p1[0], u), L(w[1], p1[1], u)]; }
          else if (!p1 && waitP[k]) { const w = waitP[k]; if (t < w[2]) continue; pos = [w[0], w[1]]; a = P(t, w[2], .4); }
          else if (s === 0 && kp(0, k)) pos = kp(0, k); if (!pos) continue;
          const up = (k === 20 && s === 1 || k === 30 && s === 4) ? bell(t, T[s], 1.2) : 0;
          pop(t, k <= 30 && !waitP[k] ? .8 : waitP[k] ? waitP[k][2] : 0, pos[0], pos[1], () => { ctx.globalAlpha *= a; ctx.shadowColor = up ? C.amber : C.ink; ctx.shadowBlur = 24 * up; rrect(-25, -25, 50, 50, 10, up ? C.amber + '55' : '#1a2440', up ? C.amber : 'rgba(255,255,255,.25)', 1.5); ctx.shadowBlur = 0; txt(String(k), 0, 1, { size: 22, font: MONO, weight: 800 }); }, .4); }
        txt('最多 3 個 key（t = 2）', W / 2, 300, { size: 22, color: C.dim, weight: 700, alpha: P(t, 1, .5) });
        txt('中間的 key 往上推', W / 2, 760, { size: 30, weight: 900, color: C.amber, alpha: win(t, 3.6, 5.4, .3) + win(t, 10.6, 12.4, .3), glow: 12 });
        const fa = P(t, 14.2, .5); if (fa > 0) { line(80, 690, 640, 690, P(t, 14.2, .6), { color: C.green, w: 2.5, dash: [8, 8], glow: 10 }); txt('所有葉子永遠在同一層', W / 2, 760, { size: 30, weight: 900, color: C.green, alpha: fa, glow: 10 }); }
        pop(t, 19.6, W / 2, 900, () => txt('高度 ≤ logₜ((n+1)/2)', 0, 0, { size: 46, weight: 900, font: SERIF, grad: [C.teal, C.blue], glow: 24 }));
        txt('節點 = 一個磁碟區塊：樹矮 → I/O 少', W / 2, 975, { size: 26, weight: 700, alpha: P(t, 20.6, .5) });
        caps(t, [[.4, 2.5, '2-3-4 樹（t = 2）：每個節點最多 3 個 key'], [2.6, 7.9, '要插 25，但根已經滿了：先分裂，中間的 20 升上去'], [8, 13.9, '往下走時遇到滿的就先分裂，插入永遠不必回頭'], [14, 19.5, '樹只會從根長高，所以永遠完美平衡'], [19.6, 25.7, '資料庫和檔案系統都用 B / B+ 樹']]);
      } });
  })();

  /* ================= OS：死結 ================= */
  (() => {
    const Pn = { P1: [180, 450], R1: [540, 450], P2: [540, 730], R2: [180, 730] };
    const E2 = [['R1', 'P1', 'h'], ['P1', 'R2', 'r'], ['R2', 'P2', 'h'], ['P2', 'R1', 'r']];
    const conds = ['互斥', '持有並等待', '不可搶占', '循環等待'];
    def({ id: 'os-deadlock', subject: 'os', lesson: 'os-deadlock', chip: '作業系統 · 死結', hook: ['兩個行程互相等', '永遠等不到？'], dur: 26,
      sfx: [[.8, 'pop'], [1.2, 'pop'], [2.4, 'land'], [3.2, 'land'], [4.6, 'whoosh'], [5.4, 'whoosh'], [7, 'error'], ...conds.map((_, i) => [10.4 + i * .7, 'pop']), [14.2, 'boom'], [16.2, 'whoosh'], [18.4, 'success']],
      draw(t) {
        const brk = P(t, 16.2, .8);
        E2.forEach(([a, b, ty], i) => { const [x1, y1] = Pn[a], [x2, y2] = Pn[b], d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d, t0 = [2.4, 4.6, 3.2, 5.4][i];
          const cyc = t > 7 && t < 16.2, isBroken = i === 3 && brk > 0; const col = isBroken ? C.dim : cyc ? C.coral : ty === 'h' ? C.teal : C.amber;
          arrow(x1 + ux * 52, y1 + uy * 52, x2 - ux * 56, y2 - uy * 56, P(t, t0, .7), { color: col, w: cyc ? 5 : 3.5, glow: cyc ? 20 : 8, alpha: isBroken ? 1 - brk * .7 : 1 });
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; txt(ty === 'h' ? '持有' : '要求', mx + (uy ? (ux === 0 && x1 < 360 ? -44 : 44) : 0), my + (ux ? (y1 < 600 ? -26 : 30) : 0), { size: 20, weight: 800, color: col, alpha: P(t, t0 + .4, .4) }); });
        if (t > 7 && t < 16.2) { const u = ((t - 7) * .45) % 1, path = [Pn.P1, Pn.R2, Pn.P2, Pn.R1, Pn.P1], seg = Math.floor(u * 4), f = u * 4 - seg, [ax, ay] = path[seg], [bx2, by2] = path[seg + 1]; node(L(ax, bx2, f), L(ay, by2, f), 9, '', { stroke: '#fff', fill: '#fff', glow: 26 }); }
        for (const [k, [x, y]] of Object.entries(Pn)) { const isP = k[0] === 'P', col = isP ? C.violet : C.blue; pop(t, isP ? .8 : 1.2, x, y, () => { ctx.shadowColor = col; ctx.shadowBlur = 18; if (isP) { ctx.beginPath(); ctx.arc(0, 0, 46, 0, 7); ctx.fillStyle = '#1a1838'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); } else { rrect(-44, -44, 88, 88, 14, '#10203a', col, 3); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill(); } ctx.shadowBlur = 0; txt(k, 0, isP ? 1 : -22, { size: 24, font: MONO, weight: 900 }); }); }
        txt('有環 → 死結', W / 2, 590, { size: 34, weight: 900, color: C.coral, glow: 18, alpha: win(t, 7, 16, .3) });
        conds.forEach((c, i) => { const x = i % 2 ? 530 : 190, y = i < 2 ? 860 : 930, on = P(t, 10.4 + i * .7, .4), killed = i === 3 && brk > 0;
          pop(t, 10.4 + i * .7, x, y, () => { rrect(-150, -26, 300, 52, 14, killed ? 'rgba(255,255,255,.04)' : C.coral + '26', killed ? C.dim : C.coral, 2); txt(c, 0, 1, { size: 24, weight: 800, color: killed ? C.dim : C.ink }); if (killed) line(-120, 0, 120, 0, brk, { color: C.green, w: 4, glow: 12 }); }, .4); });
        txt('四個條件同時成立，才可能死結', W / 2, 790, { size: 24, weight: 700, color: C.dim, alpha: win(t, 12.6, 16, .3) });
        ctx.save(); ctx.globalAlpha = P(t, 16.4, .5); rrect(W / 2 - 200, 562, 400, 56, 18, 'rgba(8,13,28,.92)', C.green, 2); ctx.restore(); txt('規定一律先拿 R1 再拿 R2', W / 2, 590, { size: 28, weight: 900, color: C.green, alpha: P(t, 16.4, .5) });
        txt('P2 不能先占著 R2 再要 R1 → 不會成環', W / 2, 800, { size: 24, weight: 700, color: C.green, alpha: P(t, 17.2, .5) });
        pop(t, 18.4, W / 2, 1000, () => txt('破壞任一條件 → 不會死結', 0, 0, { size: 38, weight: 900, font: SERIF, grad: [C.green, C.teal], glow: 22 }));
        caps(t, [[.4, 6.9, 'P1 拿著 R1 要 R2，P2 拿著 R2 要 R1'], [7, 10.3, '資源配置圖出現環：大家都在等，沒人放手'], [10.4, 16.1, '死結的四個必要條件'], [16.2, 21, '資源排序：破壞循環等待'], [21.1, 25.7, '另外還有：避免（Banker）、偵測後復原']]);
      } });
  })();

  /* ================= 資結：Union-Find ================= */
  (() => {
    const S0 = { R: [360, 410], A: [230, 540], B: [520, 540], C: [170, 670], D: [300, 670], E: [120, 800], F: [230, 800] };
    const S1 = { R: [360, 410], A: [150, 560], C: [290, 560], E: [430, 560], B: [570, 560], D: [150, 700], F: [290, 700] };
    const P0 = { A: 'R', B: 'R', C: 'A', D: 'A', E: 'C', F: 'C' }, P1 = { A: 'R', B: 'R', C: 'R', D: 'A', E: 'R', F: 'C' }, path = ['E', 'C', 'A', 'R'], wt = i => 3 + i * 1;
    def({ id: 'ds-unionfind', subject: 'ds', lesson: 'ds-unionfind', chip: '資料結構 · Union-Find', hook: ['Union-Find', '為什麼幾乎是 O(1)？'], dur: 26,
      sfx: [...Object.keys(S0).map((_, i) => [.6 + i * .2, 'tick']), [2.6, 'pop'], ...path.slice(1).map((_, i) => [wt(i + 1), 'land']), [6.6, 'whoosh'], [8.6, 'ding'], [9.6, 'pop'], [10.4, 'success'], [12, 'pop'], [14.6, 'pop'], [18.6, 'success']],
      draw(t) {
        const u = P(t, 6.6, 1.8), pos = k => [L(S0[k][0], S1[k][0], u), L(S0[k][1], S1[k][1], u)];
        for (const k of Object.keys(P0)) { const [x1, y1] = pos(k); for (const [Pm, a] of [[P0, 1 - u], [P1, u]]) { const [x2, y2] = pos(Pm[k]); const onPath = path.includes(k) && path.includes(Pm[k]) && Pm === P0 && t > wt(path.indexOf(k) + 1) - .3; arrow(x1, y1 - 34, x2, y2 + 34, 1, { color: onPath ? C.amber : u > .5 && Pm === P1 && (k === 'E' || k === 'C') ? C.green : C.dim, w: onPath ? 4.5 : 2.5, glow: onPath ? 16 : 0, alpha: a * P(t, .8, .6) }); } }
        for (const [k, i] of Object.keys(S0).map((k, i) => [k, i])) { const [x, y] = pos(k), pi = path.indexOf(k), lit = pi >= 0 && t > wt(pi) - .1 && t < 9; const second = (k === 'E' || k === 'R') && t > 9.6 && t < 11.6;
          node(x, y, 32, k, { scale: P(t, .6 + i * .2, .4, E.back), stroke: lit || second ? C.amber : k === 'R' ? C.teal : C.dim, glow: lit || second ? 24 : k === 'R' ? 14 : 0, size: 24 }); }
        txt('find(E)', W / 2, 330, { size: 32, font: MONO, weight: 900, color: C.amber, alpha: win(t, 2.6, 9, .3), glow: 12 });
        txt(`走了 ${Math.max(0, Math.min(3, Math.floor((t - 3) / 1) + 1))} 步`, 600, 800, { size: 26, weight: 800, color: C.amber, alpha: win(t, 4, 6.5, .3) });
        txt('路徑壓縮：沿路每個點直接指向根', W / 2, 860, { size: 28, weight: 900, color: C.green, alpha: win(t, 6.8, 9.4, .3), glow: 10 });
        txt('再 find(E)：一步到根', W / 2, 860, { size: 30, weight: 900, color: C.amber, alpha: win(t, 9.6, 11.8, .3), glow: 10 });
        if (t > 9.6 && t < 11.6) { const [x1, y1] = pos('E'), [x2, y2] = pos('R'); line(x1, y1 - 34, x2, y2 + 34, P(t, 9.8, .5), { color: C.amber, w: 6, glow: 22 }); }
        [['union by rank', '矮的樹接到高的樹下 → 高度 ≤ lg n', C.teal, 12], ['path compression', 'find 時順便把路徑壓平', C.green, 14.6]].forEach(([h, d, col, t0], i) => pop(t, t0, W / 2, 790 + i * 0, () => { if (t > (i ? 99 : 14.4)) return; rrect(-300, -50, 600, 100, 22, 'rgba(8,13,28,.92)', col, 2); txt(h, 0, -16, { size: 28, font: MONO, weight: 900, color: col }); txt(d, 0, 22, { size: 24, weight: 700 }); }));
        pop(t, 18.6, W / 2, 940, () => txt('m 次操作 O(m·α(n))', 0, 0, { size: 44, weight: 900, font: SERIF, grad: [C.teal, C.green], glow: 24 }));
        txt('α(n) 在宇宙尺度內都 ≤ 4', W / 2, 1010, { size: 26, weight: 700, alpha: P(t, 19.6, .5) });
        caps(t, [[.4, 2.5, '每個集合是一棵樹，根就是代表元'], [2.6, 6.5, 'find：一路往上走到根'], [6.6, 11.8, '走完順手把路上的點都直接接到根'], [11.9, 18.5, '兩招合用：每次操作幾乎是常數時間'], [18.6, 25.7, 'Kruskal 判斷「會不會成環」就靠它']]);
      } });
  })();

  /* ================= 資結：BFS vs DFS ================= */
  (() => {
    const N = { A: [360, 400], B: [210, 520], C: [510, 520], D: [130, 650], E: [290, 650], F: [430, 650], G: [590, 650] };
    const Ed = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'F'], ['C', 'G'], ['E', 'F']];
    const bfs = { ord: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], tree: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'F'], ['C', 'G']], ds: [['B', 'C'], ['C', 'D', 'E'], ['D', 'E', 'F', 'G'], ['E', 'F', 'G'], ['F', 'G'], ['G'], []], t0: 2.4, col: C.teal };
    const dfs = { ord: ['A', 'B', 'D', 'E', 'F', 'C', 'G'], tree: [['A', 'B'], ['B', 'D'], ['B', 'E'], ['E', 'F'], ['F', 'C'], ['C', 'G']], ds: [['A'], ['A', 'B'], ['A', 'B', 'D'], ['A', 'B', 'E'], ['A', 'B', 'E', 'F'], ['A', 'B', 'E', 'F', 'C'], ['A', 'B', 'E', 'F', 'C', 'G']], t0: 11.2, col: C.violet };
    const vt = (m, i) => m.t0 + i * .95;
    def({ id: 'ds-graph', subject: 'ds', lesson: 'ds-graph', chip: '資料結構 · 圖的走訪', hook: ['BFS 和 DFS', '只差在 queue 和 stack'], dur: 27,
      sfx: [[.8, 'whoosh'], ...bfs.ord.map((_, i) => [vt(bfs, i), 'pop']), [10.6, 'whoosh'], ...dfs.ord.map((_, i) => [vt(dfs, i), 'land']), [18.6, 'success']],
      draw(t) {
        const m = t < 10.6 ? bfs : dfs, mA = t < 10.6 ? win(t, 1.8, 10.4, .3) : win(t, 10.8, 18.4, .3);
        for (const [a, b] of Ed) { const tr = m.tree.find(([p, q]) => (p === a && q === b) || (p === b && q === a)); const ch = tr ? (tr[0] === a ? b : a) : null, i = ch ? m.ord.indexOf(ch) : -1, on = tr && t >= vt(m, i) && mA > 0;
          line(...N[a], ...N[b], P(t, .6, .8), { color: on ? m.col : C.faint, w: on ? 5 : 2.5, glow: on ? 16 : 0 }); }
        for (const k of Object.keys(N)) { const i = m.ord.indexOf(k), vis = mA > 0 && t >= vt(m, i), cur = mA > 0 ? bell(t, vt(m, i) - .05, .9) : 0;
          node(...N[k], 32, k, { scale: P(t, .5, .5, E.back), stroke: vis ? m.col : C.dim, fill: vis ? (m === bfs ? '#0f3a3a' : '#22184a') : '#121b31', glow: vis ? 14 + 22 * cur : 0, size: 24 });
          if (vis) { ctx.save(); ctx.globalAlpha = mA; ctx.beginPath(); ctx.arc(N[k][0] + 30, N[k][1] - 30, 15, 0, 7); ctx.fillStyle = m.col; ctx.fill(); ctx.restore(); txt(String(i + 1), N[k][0] + 30, N[k][1] - 29, { size: 16, font: MONO, weight: 900, color: '#05080f', alpha: mA }); } }
        if (m === bfs && mA > 0) [[1, ['B', 'C']], [2, ['D', 'E', 'F', 'G']]].forEach(([d, ks]) => { const y = N[ks[0]][1]; txt(`距離 ${d}`, 20, y + 46, { size: 18, weight: 800, color: C.teal, align: 'left', alpha: mA * P(t, vt(bfs, d === 1 ? 1 : 3), .4) }); });
        txt(m === bfs ? 'BFS：佇列（先進先出）' : 'DFS：堆疊／遞迴（後進先出）', W / 2, 320, { size: 30, weight: 900, color: m.col, alpha: mA, glow: 12 });
        let ds = m === bfs ? ['A'] : []; m.ord.forEach((_, i) => { if (t >= vt(m, i)) ds = m.ds[i]; });
        ctx.save(); ctx.globalAlpha = mA; rrect(60, 760, 600, 76, 16, 'rgba(8,13,28,.9)', m.col, 2); ctx.restore();
        txt(m === bfs ? '隊首 →' : '底 →', 80, 798, { size: 18, weight: 800, color: C.dim, align: 'left', alpha: mA });
        ds.forEach((k, j) => { const x = 175 + j * 64; ctx.save(); ctx.globalAlpha = mA; rrect(x - 26, 776, 52, 44, 10, m.col + '33', m.col, 1.5); ctx.restore(); txt(k, x, 798, { size: 22, font: MONO, weight: 900, alpha: mA }); });
        txt(`拜訪順序：${m.ord.filter((_, i) => t >= vt(m, i) && mA > 0).join(' ')}`, W / 2, 880, { size: 26, font: MONO, weight: 800, color: m.col, alpha: mA });
        pop(t, 18.6, W / 2, 900, () => { rrect(-310, -84, 620, 168, 24, 'rgba(8,13,28,.92)', C.amber, 2); txt('BFS → 無權重最短路徑（邊數）', 0, -40, { size: 26, weight: 800, color: C.teal }); txt('DFS → 拓撲排序、SCC、找環', 0, 4, { size: 26, weight: 800, color: C.violet }); txt('兩者都是 O(V + E)', 0, 48, { size: 26, font: MONO, weight: 800, color: C.amber }); });
        caps(t, [[.4, 2.3, '同一張圖，兩種走法'], [2.4, 10.5, 'BFS 一層一層往外擴：先拜訪的鄰居先展開'], [10.6, 18.5, 'DFS 一路往深處走，走不下去才回頭'], [18.6, 26.7, '考題常問：給定鄰接順序，寫出拜訪序列']]);
      } });
  })();

  /* ================= OS：分頁與位址轉換 ================= */
  (() => {
    const pt = [5, 2, 9, 7, 1, 4], ry = i => 520 + i * 52, fy = f => 480 + f * 42;
    def({ id: 'os-memory', subject: 'os', lesson: 'os-memory', chip: '作業系統 · 分頁', hook: ['邏輯位址', '怎麼變成實體位址？'], dur: 26,
      sfx: [[.8, 'pop'], [2.4, 'whoosh'], [3.4, 'pop'], [5.2, 'tick'], [6.4, 'ding'], [8, 'whoosh'], [9.6, 'land'], [11, 'success'], [14.6, 'whoosh'], [16.4, 'error'], [18.4, 'pop'], [21.4, 'ding']],
      draw(t) {
        const A1 = 1 - P(t, 14.4, .5), sp = P(t, 2.4, .8);
        if (A1 > 0) { ctx.save(); ctx.globalAlpha = A1;
          txt('邏輯位址 0x3A7F　（頁大小 4 KiB → offset 12 bits）', W / 2, 310, { size: 22, weight: 700, color: C.dim });
          const bx1 = L(260, 140, sp), bx2 = L(360, 330, sp); rrect(bx1, 345, 100, 60, 12, C.teal + '33', C.teal, 2); rrect(bx2, 345, L(100, 160, sp), 60, 12, C.amber + '33', C.amber, 2);
          txt(sp > .5 ? 'p = 3' : '0x3', bx1 + 50, 375, { size: 26, font: MONO, weight: 900 }); txt(sp > .5 ? 'd = A7F' : 'A7F', bx2 + L(50, 80, sp), 375, { size: 26, font: MONO, weight: 900 });
          txt('頁表', 190, 470, { size: 24, weight: 900, color: C.teal, alpha: P(t, 3.4, .5) });
          pt.forEach((f, i) => { const hit = i === 3 && t > 5.2, a = P(t, 3.4 + i * .1, .3); rrect(120, ry(i) - 22, 150, 44, 8, hit ? C.teal + '44' : 'rgba(255,255,255,.04)', hit ? C.teal : 'rgba(255,255,255,.18)', hit ? 2.5 : 1); txt(String(i), 145, ry(i), { size: 20, font: MONO, color: C.dim, alpha: a }); txt(`→ ${f}`, 215, ry(i), { size: 22, font: MONO, weight: 800, alpha: a, color: hit ? C.teal : C.ink }); });
          { const u = P(t, 4.4, .8); poly([[140, 375], [95, 375], [95, ry(3)]], Math.min(1, u * 1.4), { color: C.teal, w: 3, glow: 10 }); if (u > .7) arrow(95, ry(3), 116, ry(3), (u - .7) / .3, { color: C.teal, w: 3, glow: 10 }); }
          txt('實體記憶體', 560, 440, { size: 24, weight: 900, color: C.violet, alpha: P(t, 3.4, .5) });
          for (let f = 0; f < 10; f++) { const hit = f === 7 && t > 8; rrect(470, fy(f) + 2, 180, 38, 6, hit ? C.violet + '55' : 'rgba(255,255,255,.04)', hit ? C.violet : 'rgba(255,255,255,.14)', hit ? 2.5 : 1); txt(`frame ${f}`, 560, fy(f) + 21, { size: 18, font: MONO, color: hit ? '#fff' : C.dim, alpha: P(t, 3.4 + f * .05, .3) }); }
          arrow(272, ry(3), 466, fy(7) + 21, P(t, 6.6, .9), { color: C.violet, w: 4, glow: 16 });
          if (t > 9.6) { const yy = fy(7) + 21 + 10; ctx.save(); ctx.fillStyle = C.amber; ctx.shadowColor = C.amber; ctx.shadowBlur = 16; ctx.fillRect(600, yy - 3, 40, 6); ctx.restore(); txt('+A7F', 680, yy, { size: 16, font: MONO, weight: 800, color: C.amber }); }
          ctx.restore();
          pop(t, 11, W / 2, 960, () => { rrect(-230, -40, 160, 80, 14, C.violet + '44', C.violet, 2); rrect(-60, -40, 290, 80, 14, C.amber + '33', C.amber, 2); txt('f = 7', -150, 0, { size: 28, font: MONO, weight: 900 }); txt('d = A7F', 85, 0, { size: 28, font: MONO, weight: 900 }); });
          txt('→ 實體位址 0x7A7F', W / 2, 1020, { size: 26, font: MONO, weight: 800, color: C.green, alpha: P(t, 11.6, .5) * A1 }); }
        const B = P(t, 14.6, .5); if (B > 0) {
          txt('32 位元、4 KiB 頁：頁表有 2²⁰ 項', W / 2, 360, { size: 28, weight: 800, alpha: B });
          txt('× 4 B = 每個行程 4 MiB 頁表！', W / 2, 420, { size: 32, weight: 900, color: C.coral, glow: 14, alpha: P(t, 16.4, .5) });
          const segs = [[10, '外層', C.teal], [10, '內層', C.violet], [12, 'offset', C.amber]]; let x = 60; segs.forEach(([n, s, col], i) => { const w = n * 600 / 32, a = P(t, 18.4 + i * .3, .4, E.back); ctx.save(); ctx.globalAlpha = cl(a); rrect(x + 2, 520, w - 4, 70, 12, col + '44', col, 2); ctx.restore(); txt(`${n} bits`, x + w / 2, 545, { size: 22, font: MONO, weight: 900, alpha: cl(a) }); txt(s, x + w / 2, 572, { size: 18, weight: 800, color: col, alpha: cl(a) }); x += w; });
          txt('多層頁表：用不到的內層頁表根本不用配置', W / 2, 650, { size: 26, weight: 800, color: C.teal, alpha: P(t, 19.6, .5) });
          pop(t, 21.4, W / 2, 800, () => { rrect(-300, -60, 600, 120, 24, 'rgba(8,13,28,.92)', C.amber, 2); txt('查表要多跑記憶體', 0, -20, { size: 28, weight: 900 }); txt('→ 用 TLB 快取最近的轉換', 0, 24, { size: 26, weight: 800, color: C.amber }); }); }
        caps(t, [[.4, 3.3, '邏輯位址切成：頁號 p + 頁內位移 d'], [3.4, 7.9, '用 p 查頁表，得到頁框號 f'], [8, 14.4, 'f 接上原本的 d：位移不變，只換頁號'], [14.5, 21.3, '問題：單層頁表太大'], [21.4, 25.7, '多層頁表省空間，TLB 省時間']]);
      } });
  })();

  /* ================= 演算法：Karatsuba ================= */
  (() => {
    const lv = [[1, 4, 3], [2, 16, 9], [3, 64, 27]];
    def({ id: 'al-dc', subject: 'al', lesson: 'al-dc', chip: '演算法 · 分治法', hook: ['兩個大數相乘', '少乘一次差多少？'], dur: 27,
      sfx: [[.8, 'pop'], [2.4, 'whoosh'], [4, 'pop'], [4.5, 'pop'], [5, 'pop'], [5.5, 'pop'], [7.6, 'error'], [9, 'pop'], [9.6, 'pop'], [10.2, 'pop'], [12, 'ding'], [14.6, 'whoosh'], [19.4, 'success']],
      draw(t) {
        const A1 = 1 - P(t, 14.4, .5);
        if (A1 > 0) { ctx.save(); ctx.globalAlpha = A1;
          const sp = P(t, 2.4, .8); txt('1234 × 5678', W / 2, 330, { size: 44, font: MONO, weight: 900, alpha: 1 - sp });
          [['a', '12', C.teal, 190], ['b', '34', C.violet, 300], ['c', '56', C.amber, 440], ['d', '78', C.coral, 550]].forEach(([n, v, col, x]) => { const a = sp; ctx.save(); ctx.globalAlpha *= a; rrect(x - 48, 300, 96, 64, 14, col + '33', col, 2); ctx.restore(); txt(v, x, 324, { size: 30, font: MONO, weight: 900, alpha: a }); txt(n, x, 352, { size: 18, font: MONO, weight: 800, color: col, alpha: a }); });
          txt('×', 370, 332, { size: 30, weight: 900, alpha: sp });
          const four = ['ac', 'ad', 'bc', 'bd']; four.forEach((s, i) => { const x = 130 + i * 152, a = P(t, 4 + i * .5, .4, E.back), killed = (s === 'ad' || s === 'bc') && t > 7.6; pop(t, 4 + i * .5, x, 450, () => { rrect(-62, -32, 124, 64, 14, killed ? 'rgba(255,255,255,.04)' : C.teal + '26', killed ? C.dim : C.teal, 2); txt(s, 0, 1, { size: 28, font: MONO, weight: 900, color: killed ? C.dim : C.ink }); if (killed) line(-50, 0, 50, 0, P(t, 7.6, .4), { color: C.coral, w: 4, glow: 12 }); }); });
          txt('一般：4 次乘法', W / 2, 520, { size: 26, weight: 800, color: C.dim, alpha: win(t, 5.6, 8.6, .3) });
          const three = [['ac', '672'], ['bd', '2652'], ['(a+b)(c+d)', '6164']]; three.forEach(([s, v], i) => { pop(t, 9 + i * .6, W / 2, 600 + i * 68, () => { rrect(-230, -28, 460, 56, 14, C.green + '22', C.green, 2); txt(`${s} = ${v}`, 0, 1, { size: 26, font: MONO, weight: 900 }); }); });
          txt('ad + bc = 6164 − 672 − 2652 = 2840', W / 2, 820, { size: 24, font: MONO, weight: 800, color: C.amber, alpha: P(t, 11, .5) });
          pop(t, 12, W / 2, 900, () => txt('= 7006652　只乘 3 次 ✓', 0, 0, { size: 36, weight: 900, font: SERIF, grad: [C.green, C.teal], glow: 18 }));
          ctx.restore(); }
        const B = P(t, 14.6, .5); if (B > 0) { txt('遞迴下去，每層差距越拉越大', W / 2, 340, { size: 28, weight: 800, alpha: B });
          lv.forEach(([d, f, th], i) => { const y = 440 + i * 110, u = P(t, 15.2 + i * .6, .9, E.out); txt(`深度 ${d}`, 80, y, { size: 22, weight: 800, color: C.dim, alpha: B });
            ctx.save(); ctx.globalAlpha = B; ctx.shadowColor = C.coral; ctx.shadowBlur = 12; rrect(150, y - 32, f / 64 * 480 * u, 28, 8, C.coral); ctx.shadowColor = C.green; rrect(150, y + 4, th / 64 * 480 * u, 28, 8, C.green); ctx.restore();
            txt(String(f), 150 + f / 64 * 480 * u + 26, y - 18, { size: 20, font: MONO, weight: 800, color: C.coral, alpha: B * cl(u * 2) }); txt(String(th), 150 + th / 64 * 480 * u + 26, y + 18, { size: 20, font: MONO, weight: 800, color: C.green, alpha: B * cl(u * 2) }); });
          txt('■ 4 個子問題　■ 3 個子問題', W / 2, 790, { size: 22, weight: 800, color: C.dim, alpha: B });
          pop(t, 19.4, W / 2, 900, () => { rrect(-300, -66, 600, 132, 24, 'rgba(8,13,28,.92)', C.green, 2); txt('T(n) = 3T(n/2) + O(n)', 0, -24, { size: 30, font: MONO, weight: 900, color: C.green }); txt('= Θ(n^lg3) ≈ Θ(n^1.585)', 0, 24, { size: 28, font: MONO, weight: 800 }); }); }
        caps(t, [[.4, 3.9, '把數字切成高低兩半'], [4, 8.9, '直接展開要 ac、ad、bc、bd 四次乘法'], [9, 14.4, 'Karatsuba：(a+b)(c+d) 一次算出 ad + bc'], [14.5, 19.3, '每層少一個子問題，乘起來差很多'], [19.4, 26.7, 'Master 定理：葉子主導，n^log₂3']]);
      } });
  })();

  /* ================= 計組：暫存器重新命名 ================= */
  (() => {
    const code = [['DIV', 'F0', 'F2', 'F4'], ['ADD', 'F6', 'F0', 'F8'], ['SUB', 'F8', 'F10', 'F14'], ['MUL', 'F6', 'F10', 'F8']];
    const ren = [['DIV', 'F0', 'F2', 'F4'], ['ADD', 'P1', 'F0', 'F8'], ['SUB', 'P2', 'F10', 'F14'], ['MUL', 'P3', 'F10', 'P2']];
    const deps = [[0, 1, 'RAW', C.green, true, 2.6], [2, 3, 'RAW', C.green, true, 3.4], [1, 2, 'WAR', C.coral, false, 4.6], [1, 3, 'WAW', C.amber, false, 5.6]], ry = i => 430 + i * 82;
    def({ id: 'co-ilp', subject: 'co', lesson: 'co-ilp', chip: '計算機結構 · 指令平行', hook: ['假相依', '改個名字就消失？'], dur: 26,
      sfx: [...code.map((_, i) => [.8 + i * .3, 'tick']), [2.6, 'pop'], [3.4, 'pop'], [4.6, 'error'], [5.6, 'error'], [8.4, 'whoosh'], [10, 'boom'], [12.6, 'whoosh'], [15, 'ding'], [18.4, 'success']],
      draw(t) {
        const rn = P(t, 8.4, 1.2), ro = P(t, 12.6, 1.2), slot = i => i === 2 ? L(2, 1, ro) : i === 1 ? L(1, 2, ro) : i;
        code.forEach((ins, i) => { const y = ry(slot(i)), a = P(t, .8 + i * .3, .4); ctx.save(); ctx.globalAlpha = a; rrect(60, y - 30, 420, 60, 12, 'rgba(255,255,255,.05)', 'rgba(255,255,255,.18)', 1.2); ctx.restore();
          txt(`${i + 1}`, 84, y, { size: 18, font: MONO, color: C.dim, alpha: a }); txt(ins[0], 140, y, { size: 26, font: MONO, weight: 900, color: C.violet, alpha: a });
          [1, 2, 3].forEach(j => { const x = 220 + (j - 1) * 90, old = ins[j], nw = ren[i][j], ch = old !== nw; if (ch && rn > 0) { txt(old, x, y - 24 * rn, { size: 24, font: MONO, weight: 800, alpha: a * (1 - rn) }); txt(nw, x, y + 24 * (1 - rn), { size: 24, font: MONO, weight: 900, color: C.teal, alpha: a * rn, glow: 12 }); } else txt(old + (j < 3 ? ',' : ''), x, y, { size: 24, font: MONO, weight: 800, alpha: a }); }); });
        deps.forEach(([a, b, nm, col, real, t0], k) => { const ya = ry(slot(a)), yb = ry(slot(b)), x = 510 + k * 44, al = real ? 1 : 1 - P(t, 10, .6); const u = P(t, t0, .6); if (u <= 0 || al <= 0) return;
          poly([[480, ya], [x, ya], [x, L(ya, yb, 1)], [486, yb]], u, { color: col, w: 3.5, glow: 12, alpha: al }); txt(nm, x, Math.min(ya, yb) - 16, { size: 16, font: MONO, weight: 900, color: col, alpha: al * cl(u * 2) }); if (!real) burst(x, (ya + yb) / 2, t, 10, col, 18, 151 + k, 70); });
        txt('只有 RAW 是真的資料相依', W / 2, 800, { size: 28, weight: 800, color: C.green, alpha: win(t, 3.6, 8.2, .3) });
        txt('WAR / WAW 只是「名字撞到」', W / 2, 850, { size: 28, weight: 800, color: C.coral, alpha: win(t, 5.8, 8.2, .3) });
        txt('Tomasulo：寫入改用新的實體暫存器', W / 2, 820, { size: 28, weight: 900, color: C.teal, alpha: win(t, 8.6, 12.4, .3), glow: 10 });
        txt('SUB 不必再等 ADD：亂序先做', W / 2, 820, { size: 28, weight: 900, color: C.amber, alpha: win(t, 12.6, 18.2, .3), glow: 10 });
        pop(t, 15, W / 2, 900, () => { rrect(-290, -36, 580, 72, 18, 'rgba(8,13,28,.92)', C.violet, 2); txt('ROB：結果仍依序 commit → 精確例外', 0, 1, { size: 24, weight: 800 }); });
        pop(t, 18.4, W / 2, 990, () => txt('亂序執行，依序提交', 0, 0, { size: 44, weight: 900, font: SERIF, grad: [C.teal, C.violet], glow: 24 }));
        caps(t, [[.4, 4.5, '找出指令之間的相依'], [4.6, 8.3, 'ADD 讀 F8、SUB 寫 F8；ADD 和 MUL 都寫 F6'], [8.4, 12.5, '重新命名之後，假相依全部消失'], [12.6, 18.3, '硬體就能把不相干的指令提前執行'], [18.4, 25.7, '現代 CPU 的核心：renaming + ROB']]);
      } });
  })();

  /* ================= 演算法：動態規劃 ================= */
  (() => {
    const nodes = []; let leaf = 0; const build = (n, d, par) => { const id = nodes.length; nodes.push({ n, d, par, x: 0 }); if (n >= 2) { const c1 = build(n - 1, d + 1, id), c2 = build(n - 2, d + 1, id); nodes[id].x = (nodes[c1].x + nodes[c2].x) / 2; } else nodes[id].x = 70 + (leaf++) * 82; return id; }; build(5, 0, -1);
    const ny = d => 380 + d * 92, cols = [C.dim, C.dim, C.blue, C.amber, C.coral, C.violet], ord = nodes.map((_, i) => i), call = i => .8 + i * .28;
    def({ id: 'al-dp', subject: 'al', lesson: 'al-dp', chip: '演算法 · 動態規劃', hook: ['同一個子問題', '為什麼要算好幾次？'], dur: 27,
      sfx: [...ord.map(i => [call(i), 'tick']), [6, 'error'], [7.6, 'pop'], [8.2, 'pop'], [11, 'whoosh'], ...[0, 1, 2, 3, 4, 5, 6].map(i => [12 + i * .5, 'pop']), [16, 'success'], [19.6, 'ding']],
      draw(t) {
        const A1 = 1 - P(t, 10.8, .5);
        if (A1 > 0) { nodes.forEach((nd, i) => { if (nd.par >= 0) line(nodes[nd.par].x, ny(nodes[nd.par].d) + 22, nd.x, ny(nd.d) - 22, P(t, call(i), .3), { color: C.faint, w: 2, alpha: A1 }); });
          nodes.forEach((nd, i) => { const dup = (nd.n === 3 || nd.n === 2) && win(t, 6, 10.8, .3); node(nd.x, ny(nd.d), 22, `F${nd.n}`, { scale: P(t, call(i), .35, E.back), stroke: cols[nd.n], glow: dup ? 22 * (.6 + .4 * Math.sin(t * 6 + i)) : 6, size: 16, alpha: A1 }); });
          txt(`呼叫次數：${nodes.filter((_, i) => t >= call(i)).length}`, W / 2, 870, { size: 32, font: MONO, weight: 900, color: C.coral, alpha: A1 * P(t, .8, .4) });
          txt('F3 算了 2 次、F2 算了 3 次', W / 2, 930, { size: 28, weight: 800, color: C.amber, alpha: win(t, 7.6, 10.8, .3) });
          txt('F(n) 的呼叫數 ≈ φⁿ：指數爆炸', W / 2, 980, { size: 24, weight: 700, alpha: win(t, 8.2, 10.8, .3) }); }
        const B = P(t, 11, .5); if (B > 0) { txt('改成填表：每格只算一次', W / 2, 380, { size: 32, weight: 900, color: C.teal, alpha: B, glow: 10 }); const f = [0, 1, 1, 2, 3, 5, 8];
          f.forEach((v, i) => { const x = 105 + i * 85, a = P(t, 12 + i * .5, .4, E.back); pop(t, 12 + i * .5, x, 520, () => { rrect(-36, -36, 72, 72, 12, C.teal + '33', C.teal, 2); txt(String(v), 0, 1, { size: 30, font: MONO, weight: 900 }); }); txt(`F${i}`, x, 584, { size: 18, font: MONO, color: C.dim, alpha: B });
            if (i >= 2 && t > 12 + i * .5) { curve(x - 170, 480, x - 6, 482, 40, P(t, 12 + i * .5 - .3, .4), { color: C.amber, w: 2, glow: 8, alpha: B * (1 - P(t, 12 + i * .5 + .5, .4)) }); curve(x - 85, 480, x - 4, 482, 24, P(t, 12 + i * .5 - .3, .4), { color: C.amber, w: 2, glow: 8, alpha: B * (1 - P(t, 12 + i * .5 + .5, .4)) }); } });
          pop(t, 16, W / 2, 680, () => txt('n 次加法：O(n)', 0, 0, { size: 44, weight: 900, font: SERIF, grad: [C.teal, C.green], glow: 24 }));
          pop(t, 19.6, W / 2, 860, () => { rrect(-300, -80, 600, 160, 24, 'rgba(8,13,28,.92)', C.violet, 2); txt('能用 DP 的兩個條件', 0, -40, { size: 28, weight: 900, color: C.violet }); txt('① 最佳子結構', 0, 4, { size: 26, weight: 800 }); txt('② 重疊子問題', 0, 46, { size: 26, weight: 800 }); }); }
        caps(t, [[.4, 5.9, '直接遞迴算 F(5)'], [6, 10.8, '同樣的子問題被算了一次又一次'], [11, 15.9, '由小到大填表，每個子問題只算一次'], [16, 19.5, '指數 → 線性'], [19.6, 26.7, 'LCS、背包、矩陣鏈都是同一個思路']]);
      } });
  })();

  /* ================= 離散：平面圖與 Euler 公式 ================= */
  (() => {
    const V = [[160, 380], [560, 380], [560, 780], [160, 780], [280, 500], [440, 500], [440, 660], [280, 660]];
    const Ed = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const F = [[[4, 5, 6, 7], C.teal], [[0, 1, 5, 4], C.violet], [[1, 2, 6, 5], C.amber], [[2, 3, 7, 6], C.coral], [[3, 0, 4, 7], C.blue]];
    const K = [0, 1, 2, 3, 4].map(i => [360 + 200 * Math.sin(i * 2 * Math.PI / 5), 590 - 200 * Math.cos(i * 2 * Math.PI / 5)]);
    def({ id: 'dm-graph', subject: 'dm', lesson: 'dm-graph', chip: '離散數學 · 平面圖', hook: ['V − E + F', '為什麼永遠等於 2？'], dur: 27,
      sfx: [...V.map((_, i) => [.8 + i * .2, 'tick']), ...Ed.map((_, i) => [3 + i * .15, 'tick']), ...F.map((_, i) => [5.6 + i * .5, 'pop']), [8.4, 'whoosh'], [9.6, 'success'], [13.6, 'whoosh'], [17, 'pop'], [18.4, 'error'], [21.4, 'ding']],
      draw(t) {
        const A1 = 1 - P(t, 13.4, .5);
        if (A1 > 0) {
          F.forEach(([vs, col], i) => { const a = P(t, 5.6 + i * .5, .5) * A1; if (a <= 0) return; ctx.save(); ctx.globalAlpha = a * .5; ctx.beginPath(); vs.forEach((v, j) => j ? ctx.lineTo(...V[v]) : ctx.moveTo(...V[v])); ctx.closePath(); ctx.fillStyle = col + '66'; ctx.fill(); ctx.restore(); });
          const outA = P(t, 8.4, .6) * A1; if (outA > 0) { ctx.save(); ctx.globalAlpha = outA; ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.shadowColor = C.green; ctx.shadowBlur = 14; rrect(110, 330, 500, 500, 40, null, C.green, 3); ctx.restore(); txt('外面也算一面', 360, 860, { size: 22, weight: 800, color: C.green, alpha: outA }); }
          Ed.forEach(([a, b], i) => line(...V[a], ...V[b], P(t, 3 + i * .15, .4), { color: C.ink, w: 3, glow: 8, alpha: A1 }));
          V.forEach((p, i) => node(...p, 16, '', { stroke: C.teal, fill: C.teal, glow: 18, scale: P(t, .8 + i * .2, .4, E.back), alpha: A1 }));
          const cnt = [['V', 8, .8, C.teal], ['E', 12, 3, C.ink], ['F', 6, 5.6, C.violet]]; cnt.forEach(([n, v, t0, col], i) => { const x = 150 + i * 210; txt(`${n} = ${count(t, t0, i === 2 ? 3.4 : 1.8, 0, v)}`, x, 930, { size: 36, font: MONO, weight: 900, color: col, alpha: A1 * P(t, t0, .4) }); });
          pop(t, 9.6, W / 2, 1000, () => txt('8 − 12 + 6 = 2 ✓', 0, 0, { size: 40, font: MONO, weight: 900, color: C.green, glow: 20 })); }
        const B = P(t, 13.6, .5); if (B > 0) {
          for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) line(...K[i], ...K[j], P(t, 13.8 + (i * 5 + j) * .06, .4), { color: C.violet, w: 3, glow: 10, alpha: B });
          K.forEach(p => node(...p, 18, '', { stroke: C.amber, fill: C.amber, glow: 20, alpha: B }));
          txt('K₅：V = 5, E = 10', W / 2, 860, { size: 32, font: MONO, weight: 900, alpha: P(t, 17, .5) });
          txt('平面簡單圖必須 E ≤ 3V − 6 = 9', W / 2, 912, { size: 28, weight: 800, color: C.amber, alpha: P(t, 17.6, .5) });
          pop(t, 18.4, W / 2, 980, () => txt('10 > 9 → 不是平面圖 ✗', 0, 0, { size: 38, weight: 900, font: SERIF, color: C.coral, glow: 20 }));
          txt('K₃,₃ 同理：E ≤ 2V − 4', W / 2, 340, { size: 26, weight: 800, color: C.dim, alpha: P(t, 21.4, .5) }); }
        caps(t, [[.4, 5.5, '一張畫在平面上、邊不交叉的圖'], [5.6, 9.5, '數面：每一塊被圍住的區域，外面也算一塊'], [9.6, 13.5, '連通平面圖永遠 V − E + F = 2'], [13.6, 18.3, '推論：每面至少 3 條邊 → E ≤ 3V − 6'], [18.4, 26.7, 'K₅ 邊太多，怎麼畫都會交叉']]);
      } });
  })();

  /* ================= 演算法：Huffman ================= */
  (() => {
    const Np = { a: [180, 500, 45], b: [460, 740, 13], c: [340, 740, 12], d: [650, 740, 16], e: [590, 860, 9], f: [480, 860, 5], n14: [535, 740, 14], n25: [400, 620, 25], n30: [590, 620, 30], n55: [500, 500, 55], n100: [360, 380, 100] };
    const merges = [['f', 'e', 'n14', 2.6], ['c', 'b', 'n25', 4.6], ['n14', 'd', 'n30', 6.6], ['n25', 'n30', 'n55', 8.6], ['a', 'n55', 'n100', 10.6]];
    const fix = { n14: [530, 740] }; Np.n14 = [fix.n14[0], fix.n14[1], 14]; Np.d = [650, 740, 16];
    const queue0 = ['f', 'e', 'c', 'b', 'd', 'a'], qx = i => 80 + i * 112, QY = 960;
    const born = k => { const m = merges.find(x => x[2] === k); return m ? m[3] + .6 : 0; }, used = k => { const m = merges.find(x => x[0] === k || x[1] === k); return m ? m[3] : 99; };
    const codes = { a: '0', c: '100', b: '101', f: '1100', e: '1101', d: '111' };
    def({ id: 'al-greedy', subject: 'al', lesson: 'al-greedy', chip: '演算法 · 貪婪法', hook: ['Huffman 編碼', '每次只合併最小的兩個'], dur: 27,
      sfx: [...queue0.map((_, i) => [.8 + i * .2, 'tick']), ...merges.flatMap(([, , , t0]) => [[t0, 'whoosh'], [t0 + .6, 'pop']]), [13, 'rise'], [16.4, 'ding'], [19.4, 'success']],
      draw(t) {
        const qAt = tt => Object.keys(Np).filter(k => (k.length === 1 || born(k) - .6 <= tt) && used(k) > tt).sort((p, q) => Np[p][2] - Np[q][2] || (p < q ? -1 : 1));
        const ql = qAt(t), qa = 1 - P(t, 11.4, .5);
        for (const [a, b, p, t0] of merges) { const u = P(t, t0 + .3, .6); if (u <= 0) continue; [a, b].forEach((c, j) => { const tx = Np[p][0], ty = Np[p][1]; line(tx, ty + 26, Np[c][0], Np[c][1] - 26, u, { color: C.dim, w: 2.5 }); if (t > 13) txt(j ? '1' : '0', (tx + Np[c][0]) / 2 + (j ? 12 : -12), (ty + Np[c][1]) / 2 - 6, { size: 18, font: MONO, weight: 900, color: j ? C.coral : C.teal, alpha: P(t, 13, .5) }); }); }
        ql.forEach((k, i) => { const x = qx(i), isLeaf = k.length === 1, a = isLeaf ? P(t, .8 + queue0.indexOf(k) * .2, .4) : P(t, born(k) - .4, .4); if (isLeaf) { node(x, QY, 28, k, { stroke: C.amber, fill: '#2c2410', glow: 10, size: 22, alpha: a * qa }); txt(String(Np[k][2]), x, QY + 42, { size: 16, font: MONO, color: C.dim, alpha: a * qa }); } else { ctx.save(); ctx.globalAlpha = a * qa; rrect(x - 30, QY - 22, 60, 44, 12, C.violet + '33', C.violet, 1.8); ctx.restore(); txt(String(Np[k][2]), x, QY + 1, { size: 20, font: MONO, weight: 900, alpha: a * qa }); } });
        for (const k of Object.keys(Np)) { const isLeaf = k.length === 1, tu = used(k), [fx, fy] = Np[k];
          if (isLeaf) { if (t < tu && k !== 'a') continue; if (k === 'a' && t < tu) continue; const qi = qAt(tu - .01).indexOf(k), u = P(t, tu, .7); const x = L(qx(qi), fx, u), y = L(QY, fy, u);
            node(x, y, 28, k, { stroke: C.amber, fill: '#2c2410', glow: 10 + 20 * bell(t, tu, 1), size: 22 }); txt(String(Np[k][2]), x, y + 40, { size: 16, font: MONO, color: C.dim });
            if (t > 14.4) txt(codes[k], x, y + 62, { size: 20, font: MONO, weight: 900, color: C.green, alpha: P(t, 14.4, .5) }); }
          else { const tb = born(k); if (t < tb - .3) continue; pop(t, tb - .3, fx, fy, () => { node(0, 0, 24, String(Np[k][2]), { stroke: C.violet, fill: '#1d1838', glow: 12 + 16 * bell(t, tb - .3, 1), size: 18 }); }, .5); } }
        if (qa > 0) { ctx.save(); ctx.globalAlpha = P(t, .8, .4) * qa; rrect(30, QY - 44, 660, 88, 18, null, 'rgba(255,255,255,.18)', 1.5); ctx.restore(); txt('min-heap', 60, QY - 58, { size: 18, font: MONO, color: C.dim, align: 'left', alpha: qa }); }
        pop(t, 16.4, W / 2, 330, () => txt('總長 224 bits（定長碼要 300）', 0, 0, { size: 30, weight: 900, color: C.green, glow: 14 }));
        pop(t, 19.4, W / 2, 1010, () => { rrect(-300, -40, 600, 80, 20, 'rgba(8,13,28,.92)', C.amber, 2); txt('交換論證：最小的兩個放最深一定不吃虧', 0, 1, { size: 24, weight: 800 }); });
        caps(t, [[.4, 2.5, '頻率：f 5、e 9、c 12、b 13、d 16、a 45'], [2.6, 12.9, '每次從 heap 拿最小的兩個，合併成新節點放回去'], [13, 16.3, '左 0 右 1：越常用的字，編碼越短'], [16.4, 19.3, '這就是最佳前綴碼'], [19.4, 26.7, 'Greedy 的證明套路：交換論證 + 最佳子結構']]);
      } });
  })();

  /* ================= 線代：SVD ================= */
  (() => {
    const A = [3, 0, 4, 5], o = [360, 650], s = 42, s1 = Math.sqrt(45), s2 = Math.sqrt(5);
    const M = u => [L(1, A[0], u), L(0, A[1], u), L(0, A[2], u), L(1, A[3], u)], T = (m, x, y) => [o[0] + s * (m[0] * x + m[1] * y), o[1] - s * (m[2] * x + m[3] * y)];
    const v1 = [Math.SQRT1_2, Math.SQRT1_2], v2 = [Math.SQRT1_2, -Math.SQRT1_2];
    def({ id: 'la-sym-svd', subject: 'la', lesson: 'la-sym-svd', chip: '線性代數 · SVD', hook: ['任何矩陣', '都把圓變成橢圓'], dur: 26,
      sfx: [[.8, 'whoosh'], [2.4, 'pop'], [3, 'pop'], [4.4, 'rise'], [8.4, 'ding'], [9.4, 'ding'], [12, 'pop'], [15.6, 'whoosh'], [19, 'success']],
      draw(t) {
        const u = P(t, 4.4, 3.6), m = M(u), ga = P(t, .5, .8);
        ctx.save(); ctx.beginPath(); ctx.rect(20, 280, 680, 740); ctx.clip();
        for (let k = -12; k <= 12; k++) { line(...T(m, k, -12), ...T(m, k, 12), 1, { color: C.faint, w: 1, alpha: ga * .7 }); line(...T(m, -12, k), ...T(m, 12, k), 1, { color: C.faint, w: 1, alpha: ga * .7 }); }
        const pts = []; for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2; pts.push(T(m, Math.cos(a), Math.sin(a))); } poly(pts, P(t, .8, 1.4), { color: C.blue, w: 4, glow: 18 });
        ctx.restore();
        arrow(...o, ...T(m, ...v1), P(t, 2.4, .5), { color: C.amber, w: 5, glow: 18 }); arrow(...o, ...T(m, ...v2), P(t, 3, .5), { color: C.teal, w: 5, glow: 18 });
        const e1 = T(m, ...v1), e2 = T(m, ...v2);
        txt(u > .9 ? 'σ₁u₁' : 'v₁', e1[0] + 34, e1[1] - 8, { size: 28, weight: 900, font: SERIF, color: C.amber, alpha: P(t, 2.6, .4) }); txt(u > .9 ? 'σ₂u₂' : 'v₂', e2[0] + 38, e2[1] + 12, { size: 28, weight: 900, font: SERIF, color: C.teal, alpha: P(t, 3.2, .4) });
        txt('A = [3 0; 4 5]', W / 2, 320, { size: 30, font: MONO, weight: 900, alpha: P(t, .6, .5) });
        txt('正交的兩個方向，變換後還是正交', W / 2, 900, { size: 26, weight: 800, color: C.green, alpha: win(t, 8.4, 11.8, .3) });
        txt(`σ₁ = √45 ≈ ${s1.toFixed(2)}　σ₂ = √5 ≈ ${s2.toFixed(2)}`, W / 2, 900, { size: 26, font: MONO, weight: 800, color: C.amber, alpha: win(t, 12, 15.4, .3) });
        txt('σ² = AᵀA 的特徵值（45 和 5）', W / 2, 950, { size: 24, weight: 700, alpha: win(t, 12.6, 15.4, .3) });
        pop(t, 15.6, W / 2, 920, () => { rrect(-300, -64, 600, 128, 24, 'rgba(8,13,28,.92)', C.violet, 2); txt('A = U Σ Vᵀ', 0, -22, { size: 36, font: SERIF, weight: 900, color: C.violet }); txt('轉 → 沿軸拉伸 → 再轉', 0, 26, { size: 26, weight: 800 }); });
        txt('對稱矩陣：U = V，就是特徵分解', W / 2, 1022, { size: 24, weight: 800, color: C.teal, alpha: P(t, 19, .5) });
        caps(t, [[.4, 4.3, '單位圓上取兩個互相垂直的方向 v₁、v₂'], [4.4, 8.3, '套上 A：整個平面被拉歪，圓變成橢圓'], [8.4, 11.9, 'v₁、v₂ 剛好變成橢圓的長軸和短軸'], [12, 15.5, '軸長就是奇異值'], [15.6, 25.7, '低秩近似、PCA 都是只留最大的幾個 σ']]);
      } });
  })();

  /* ================= OS：RAID 5 ================= */
  (() => {
    const dx = i => 120 + i * 160, sy = r => 480 + r * 92, X = (a, b) => (parseInt(a, 2) ^ parseInt(b, 2)).toString(2).padStart(4, '0');
    const D0 = '1011', D1 = '0110', D2 = '1100', Pp = X(X(D0, D1), D2);
    const grid = [[[D0, 'D0'], [D1, 'D1'], [D2, 'D2'], [Pp, 'P']], [['0101', 'D3'], ['1110', 'D4'], [X(X('0101', '1110'), '0011'), 'P'], ['0011', 'D5']], [['1001', 'D6'], [X(X('1001', '0111'), '1010'), 'P'], ['0111', 'D7'], ['1010', 'D8']]];
    def({ id: 'os-storage', subject: 'os', lesson: 'os-storage', chip: '作業系統 · RAID', hook: ['硬碟壞一顆', '資料為什麼還在？'], dur: 26,
      sfx: [...[0, 1, 2, 3].map(i => [.8 + i * .2, 'pop']), [3, 'tick'], [3.6, 'tick'], [4.2, 'tick'], [5.2, 'ding'], [8.4, 'boom'], [11, 'whoosh'], [13.4, 'success'], [17, 'pop'], [17.5, 'pop'], [18, 'pop'], [18.5, 'pop']],
      draw(t) {
        const dead = t > 8.4, rec = P(t, 13.4, .6);
        for (let i = 0; i < 4; i++) { const a = P(t, .8 + i * .2, .5, E.back), x = dx(i), isDead = i === 2 && dead, sh = isDead ? Math.sin(t * 50) * 6 * bell(t, 8.4, .6) : 0;
          ctx.save(); ctx.globalAlpha = cl(a); ctx.translate(sh, 0); ctx.shadowColor = isDead && rec < 1 ? C.coral : C.blue; ctx.shadowBlur = 14; rrect(x - 62, 380, 124, 340, 20, isDead && rec < 1 ? 'rgba(255,107,139,.10)' : 'rgba(90,168,255,.08)', isDead && rec < 1 ? C.coral : C.blue, 2); ctx.restore();
          txt(`Disk ${i}`, x + sh, 410, { size: 20, font: MONO, weight: 800, color: isDead && rec < 1 ? C.coral : C.blue, alpha: cl(a) });
          grid.forEach((row, r) => { const [v, nm] = row[i], isP = nm === 'P', hide = i === 2 && dead && rec < 1, lit = r === 0 && (t > 3 && t < 6 || i !== 2 && t > 11 && t < 13.4); ctx.save(); ctx.globalAlpha = cl(a) * (hide ? .15 : 1); rrect(x - 52 + sh, sy(r) - 34, 104, 68, 12, isP ? C.amber + '33' : C.teal + '22', lit ? '#fff' : isP ? C.amber : C.teal, lit ? 2.5 : 1.5); ctx.restore();
            txt(nm, x + sh, sy(r) - 14, { size: 16, font: MONO, weight: 800, color: isP ? C.amber : C.teal, alpha: cl(a) * (hide ? .15 : 1) }); txt(v, x + sh, sy(r) + 12, { size: 20, font: MONO, weight: 900, alpha: cl(a) * (hide ? .15 : 1) }); }); }
        if (dead && rec < 1) { line(dx(2) - 60, 390, dx(2) + 60, 710, P(t, 8.4, .3), { color: C.coral, w: 6, glow: 18 }); line(dx(2) + 60, 390, dx(2) - 60, 710, P(t, 8.5, .3), { color: C.coral, w: 6, glow: 18 }); }
        txt(`P = D0 ⊕ D1 ⊕ D2 = ${Pp}`, W / 2, 790, { size: 28, font: MONO, weight: 900, color: C.amber, alpha: win(t, 3, 8.2, .3), glow: 8 });
        txt('同位區塊輪流放在不同硬碟', W / 2, 850, { size: 24, weight: 700, alpha: win(t, 5.4, 8.2, .3) });
        txt(`D2 = D0 ⊕ D1 ⊕ P = ${X(X(D0, D1), Pp)}`, W / 2, 790, { size: 28, font: MONO, weight: 900, color: C.green, alpha: P(t, 11, .5) * (1 - P(t, 16.6, .4)), glow: 10 });
        burst(dx(2), sy(0), t, 13.4, C.green, 30, 161, 120);
        [['RAID 0', '條帶，沒有備援'], ['RAID 1', '鏡像，容量 1/2'], ['RAID 5', '同位，容量 (n−1)/n'], ['RAID 6', '雙同位，可壞 2 顆']].forEach(([a, b], i) => pop(t, 17 + i * .5, i % 2 ? 530 : 190, i < 2 ? 820 : 900, () => { rrect(-160, -32, 320, 64, 14, 'rgba(8,13,28,.9)', i === 2 ? C.green : C.dim, i === 2 ? 2.5 : 1.5); txt(a, 0, -10, { size: 20, font: MONO, weight: 900, color: i === 2 ? C.green : C.ink }); txt(b, 0, 14, { size: 17, weight: 700, color: C.dim }); }));
        txt('寫入代價：改一塊要重算同位（小寫入懲罰）', W / 2, 990, { size: 22, weight: 700, color: C.dim, alpha: P(t, 20, .5) });
        caps(t, [[.4, 2.9, 'RAID 5：資料切塊分散在 4 顆硬碟'], [3, 8.3, '同位 = 所有資料區塊 XOR'], [8.4, 10.9, 'Disk 2 壞了！'], [11, 16.9, 'XOR 剩下的區塊，就能算回失去的那塊'], [17, 25.7, '各級 RAID：容量、速度、容錯三選二']]);
      } });
  })();

  /* ================= 演算法：最大流最小割 ================= */
  (() => {
    const N = { s: [90, 610], a: [360, 440], b: [360, 780], t: [630, 610] };
    const Ed = [['s', 'a', 3], ['s', 'b', 2], ['a', 'b', 1], ['a', 't', 2], ['b', 't', 3]];
    const paths = [[['s', 'a'], ['a', 't'], 2, 3, C.teal], [['s', 'b'], ['b', 't'], 2, 6.5, C.violet], [['s', 'a'], ['a', 'b'], ['b', 't'], 1, 10, C.amber]];
    def({ id: 'al-mst-flow', subject: 'al', lesson: 'al-mst-flow', chip: '演算法 · 網路流', hook: ['最大流', '其實等於「最窄的那一刀」'], dur: 27,
      sfx: [[.8, 'pop'], ...paths.flatMap(p => [[p[p.length - 2], 'whoosh'], [p[p.length - 2] + 1.6, 'ding']]), [13.4, 'error'], [15.4, 'rise'], [17.6, 'success']],
      draw(t) {
        const flow = {}; let tot = 0; paths.forEach(p => { const amt = p[p.length - 3], t0 = p[p.length - 2]; if (t >= t0 + 1.6) { p.slice(0, -3).forEach(([a, b]) => flow[a + b] = (flow[a + b] || 0) + amt); tot += amt; } });
        const cut = P(t, 15.4, .8);
        Ed.forEach(([a, b, c]) => { const [x1, y1] = N[a], [x2, y2] = N[b], d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d, f = flow[a + b] || 0, full = f === c, isCut = a === 's' && cut > 0;
          arrow(x1 + ux * 42, y1 + uy * 42, x2 - ux * 46, y2 - uy * 46, P(t, .8, .8), { color: isCut ? C.coral : full ? C.green : C.dim, w: full || isCut ? 5 : 3, glow: full || isCut ? 16 : 0 });
          const mx = (x1 + x2) / 2 + (a === 'a' && b === 'b' ? 34 : uy * 30), my = (y1 + y2) / 2 - (a === 'a' && b === 'b' ? 0 : ux * 30); ctx.save(); ctx.globalAlpha = P(t, 1.4, .5); rrect(mx - 34, my - 18, 68, 36, 12, 'rgba(8,13,28,.92)', full ? C.green : 'rgba(255,255,255,.2)', 1.5); ctx.restore(); txt(`${f}/${c}`, mx, my + 1, { size: 20, font: MONO, weight: 900, color: full ? C.green : C.ink, alpha: P(t, 1.4, .5) }); });
        paths.forEach(p => { const segs = p.slice(0, -3), t0 = p[p.length - 2], col = p[p.length - 1]; const pts = [N[segs[0][0]], ...segs.map(([, b]) => N[b])]; const u = P(t, t0, 1.4, E.lin), w = win(t, t0, t0 + 2.4, .3); if (w > 0) { const hd = poly(pts, u, { color: col, w: 9, glow: 26, alpha: w * .9 }); if (hd && u < 1) node(hd[0], hd[1], 10, '', { stroke: '#fff', fill: '#fff', glow: 24 }); txt(`+${p[p.length - 3]}`, W / 2, 330, { size: 40, font: MONO, weight: 900, color: col, glow: 16, alpha: w }); } });
        for (const [k, p] of Object.entries(N)) node(...p, 36, k, { stroke: k === 's' || k === 't' ? C.amber : C.blue, glow: 14, size: 26, scale: P(t, .6, .5, E.back) });
        txt(`總流量 ${tot}`, W / 2, 900, { size: 40, weight: 900, font: SERIF, color: C.teal, glow: 14, alpha: P(t, 1.2, .5) * (1 - P(t, 17.4, .3)) });
        txt('找不到增廣路徑了', W / 2, 330, { size: 32, weight: 900, color: C.coral, alpha: win(t, 13.4, 15.2, .3) });
        if (cut > 0) { ctx.save(); ctx.globalAlpha = cut; ctx.strokeStyle = C.coral; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.shadowColor = C.coral; ctx.shadowBlur = 14; ctx.beginPath(); ctx.ellipse(N.s[0] + 10, N.s[1], 90, 170, 0, 0, 7); ctx.stroke(); ctx.restore(); txt('割 (S, T)', 120, 400, { size: 24, weight: 900, color: C.coral, alpha: cut }); txt('割容量 = 3 + 2 = 5', W / 2, 330, { size: 32, font: MONO, weight: 900, color: C.coral, alpha: cut, glow: 12 }); }
        pop(t, 17.6, W / 2, 900, () => txt('最大流 = 最小割 = 5', 0, 0, { size: 46, weight: 900, font: SERIF, grad: [C.teal, C.coral], glow: 24 }));
        burst(W / 2, 900, t, 17.7, C.amber, 34, 171, 240);
        caps(t, [[.4, 2.9, '每條邊有容量，從 s 送到 t 最多送多少？'], [3, 13.3, 'Ford-Fulkerson：一直找還有空間的路徑，塞滿'], [13.4, 17.5, '塞不下時，s 出去的邊全滿：這就是最小割'], [17.6, 26.7, '二分圖最大匹配也能化成網路流']]);
      } });
  })();

  /* ================= 計組：MESI 一致性 ================= */
  (() => {
    const steps = [[2.6, 'P1 讀 x', 'BusRd', 0, ['E', 'I'], [5, null], 5], [6.2, 'P2 讀 x', 'BusRd', 1, ['S', 'S'], [5, 5], 5], [9.8, 'P1 寫 x = 9', '失效 Invalidate', 0, ['M', 'I'], [9, null], 5], [13.4, 'P2 讀 x', 'BusRd → P1 寫回', 1, ['S', 'S'], [9, 9], 9]];
    const SC = { M: C.coral, E: C.amber, S: C.teal, I: C.dim }, cx = i => i ? 520 : 200;
    def({ id: 'co-vm-coherence', subject: 'co', lesson: 'co-vm-coherence', chip: '計算機結構 · 快取一致性', hook: ['兩個核心各有 cache', '怎麼保證讀到同一個值？'], dur: 26,
      sfx: [[.8, 'pop'], ...steps.flatMap(([t0]) => [[t0, 'whoosh'], [t0 + 1.2, 'land']]), [9.8 + 1.2, 'error'], [17.4, 'success']],
      draw(t) {
        let k = -1; steps.forEach((s, i) => { if (t >= s[0] + 1.2) k = i; }); const st = k >= 0 ? steps[k][4] : ['I', 'I'], val = k >= 0 ? steps[k][5] : [null, null], mem = k >= 0 ? steps[k][6] : 5;
        [0, 1].forEach(i => { const a = P(t, .8, .5); txt(`P${i + 1}`, cx(i), 330, { size: 30, font: MONO, weight: 900, color: C.violet, alpha: a }); const col = SC[st[i]], fl = k >= 0 ? bell(t, steps[k][0] + 1.2, 1) : 0;
          ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = col; ctx.shadowBlur = 16 + 20 * fl; rrect(cx(i) - 120, 360, 240, 150, 20, col + '22', col, 2.5); ctx.restore();
          txt('cache', cx(i) - 70, 388, { size: 18, color: C.dim, alpha: a }); txt(st[i], cx(i) - 40, 450, { size: 64, font: SERIF, weight: 900, color: col, glow: 16, alpha: a }); txt(val[i] == null ? '—' : `x=${val[i]}`, cx(i) + 50, 450, { size: 28, font: MONO, weight: 900, alpha: a }); });
        ctx.save(); ctx.globalAlpha = P(t, .8, .5); ctx.shadowColor = C.blue; ctx.shadowBlur = 12; rrect(60, 590, 600, 24, 12, C.blue + '44', C.blue, 2); ctx.restore(); txt('匯流排（大家都在偷聽）', W / 2, 640, { size: 18, weight: 700, color: C.blue, alpha: P(t, .8, .5) });
        line(cx(0), 510, cx(0), 590, 1, { color: C.blue, w: 3, alpha: P(t, .8, .5) }); line(cx(1), 510, cx(1), 590, 1, { color: C.blue, w: 3, alpha: P(t, .8, .5) }); line(360, 614, 360, 690, 1, { color: C.blue, w: 3, alpha: P(t, .8, .5) });
        ctx.save(); ctx.globalAlpha = P(t, .8, .5); rrect(230, 690, 260, 90, 18, 'rgba(255,255,255,.05)', C.dim, 2); ctx.restore(); txt('記憶體', 360, 716, { size: 20, color: C.dim, alpha: P(t, .8, .5) }); txt(`x = ${mem}`, 360, 752, { size: 30, font: MONO, weight: 900, alpha: P(t, .8, .5) });
        steps.forEach(([t0, lab, msg, who], i) => { const w = win(t, t0, t0 + 3.3, .3); if (w <= 0) return; txt(lab, W / 2, 860, { size: 34, weight: 900, color: C.violet, alpha: w, glow: 12 }); const u = P(t, t0 + .2, 1, E.io); const x = L(cx(who), cx(1 - who), u); ctx.save(); ctx.globalAlpha = w; rrect(x - 90, 572, 180, 60, 14, 'rgba(8,13,28,.95)', i === 2 ? C.coral : C.amber, 2); ctx.restore(); txt(msg, x, 602, { size: 18, weight: 900, color: i === 2 ? C.coral : C.amber, alpha: w }); });
        ['M 已改、獨占', 'E 乾淨、獨占', 'S 共享', 'I 失效'].forEach((s, i) => pop(t, 17.4 + i * .25, i % 2 ? 530 : 190, i < 2 ? 880 : 950, () => { rrect(-150, -28, 300, 56, 14, 'rgba(8,13,28,.92)', SC['MESI'[i]], 2); txt(s, 0, 1, { size: 24, weight: 800, color: SC['MESI'[i]] }); }));
        caps(t, [[.4, 2.5, '兩個核心、各自的 cache、同一份記憶體'], [2.6, 9.7, '讀：只有自己有是 E，兩個人都有變 S'], [9.8, 13.3, '寫之前先廣播「失效」，別人的副本變 I'], [13.4, 17.3, '別人再讀時，改過的人把新值交出來'], [17.4, 25.7, 'MESI：write-invalidate 的經典協定']]);
      } });
  })();

  /* ================= 演算法：NP 完備歸約鏈 ================= */
  (() => {
    const Nd = { CS: [360, 340, 'CIRCUIT-SAT'], SAT: [360, 420, 'SAT'], C3: [360, 500, '3-CNF-SAT'], CL: [220, 600, 'CLIQUE'], SS: [540, 600, 'SUBSET-SUM'], VC: [220, 700, 'VERTEX-COVER'], HC: [220, 800, 'HAM-CYCLE'], TSP: [220, 900, 'TSP'] };
    const Ed = [['CS', 'SAT'], ['SAT', 'C3'], ['C3', 'CL'], ['C3', 'SS'], ['CL', 'VC'], ['VC', 'HC'], ['HC', 'TSP']];
    def({ id: 'al-np', subject: 'al', lesson: 'al-np', chip: '演算法 · NP 完備', hook: ['證明 NP 完備', '箭頭到底要往哪邊指？'], dur: 27,
      sfx: [...Object.keys(Nd).map((_, i) => [.8 + i * .35, 'pop']), [4.4, 'whoosh'], [7.6, 'error'], [10.4, 'ding'], [14.6, 'whoosh'], [18.6, 'success']],
      draw(t) {
        const A1 = 1 - P(t, 14.4, .5);
        if (A1 > 0) { Ed.forEach(([a, b], i) => { const [x1, y1] = Nd[a], [x2, y2] = Nd[b]; arrow(x1, y1 + 22, x2, y2 - 24, P(t, 1 + i * .35, .5), { color: C.violet, w: 3, glow: 10, alpha: A1 }); });
          Object.entries(Nd).forEach(([k, [x, y, s]], i) => pop(t, .8 + i * .35, x, y, () => { ctx.globalAlpha *= A1; ctx.font = `900 20px ${MONO}`; const w = ctx.measureText(s).width + 30; rrect(-w / 2, -20, w, 40, 12, '#1a1838', k === 'CS' ? C.amber : C.violet, 2); txt(s, 0, 1, { size: 20, font: MONO, weight: 900 }); }, .4));
          ctx.save(); ctx.globalAlpha = A1 * P(t, 4.4, .5); rrect(380, 700, 300, 180, 20, 'rgba(8,13,28,.92)', C.amber, 2); ctx.restore();
          txt('A ≤ₚ B 的意思：', 530, 735, { size: 22, weight: 900, color: C.amber, alpha: A1 * P(t, 4.4, .5) }); txt('會解 B 就會解 A', 530, 775, { size: 22, weight: 800, alpha: A1 * P(t, 4.8, .5) }); txt('→ B 至少和 A 一樣難', 530, 815, { size: 22, weight: 800, alpha: A1 * P(t, 5.2, .5) });
          txt('✗ 把新問題歸約到已知 NPC', 530, 852, { size: 18, weight: 800, color: C.coral, alpha: A1 * P(t, 7.6, .5) }); }
        const B = P(t, 14.6, .5); if (B > 0) { txt('證明 X 是 NP 完備，兩步：', W / 2, 360, { size: 30, weight: 900, alpha: B });
          [['①', 'X ∈ NP', '給一組解，多項式時間能驗證', C.teal, 15.2], ['②', '已知 NPC ≤ₚ X', '箭頭從已知的指向 X', C.amber, 16.4]].forEach(([n, h, d, col, t0], i) => pop(t, t0, W / 2, 480 + i * 150, () => { rrect(-300, -56, 600, 112, 22, 'rgba(8,13,28,.92)', col, 2); txt(`${n} ${h}`, 0, -18, { size: 32, font: MONO, weight: 900, color: col }); txt(d, 0, 26, { size: 24, weight: 700 }); }));
          pop(t, 18.6, W / 2, 820, () => txt('Clique ↔ 補圖的獨立集 ↔ 頂點覆蓋', 0, 0, { size: 30, weight: 900, font: SERIF, grad: [C.violet, C.teal], glow: 16 }));
          txt('大小 k 的 clique ⟺ 補圖有 |V| − k 的點覆蓋', W / 2, 880, { size: 22, font: MONO, weight: 700, alpha: P(t, 19.6, .5) }); }
        caps(t, [[.4, 4.3, 'CLRS 的歸約鏈：全部從 CIRCUIT-SAT 出發'], [4.4, 10.3, 'A ≤ₚ B：把 A 的題目轉成 B 的題目'], [10.4, 14.5, '最常見的錯：箭頭方向弄反'], [14.6, 18.5, 'X ∈ NP，再找一個已知 NPC 歸約到 X'], [18.6, 26.7, '這幾個問題互相轉換，背熟這條鏈']]);
      } });
  })();

  /* ================= 演算法：指示隨機變數 ================= */
  (() => {
    const sc = [3, 1, 6, 2, 7, 5, 4, 9, 8, 10], bx = i => 85 + i * 61, st = i => 2 + i * .7; let mx = 0; const hire = sc.map(v => { const h = v > mx; if (h) mx = v; return h; });
    def({ id: 'al-prob', subject: 'al', lesson: 'al-prob', chip: '演算法 · 機率分析', hook: ['只要遇到更好的就換人', '平均要換幾次？'], dur: 26,
      sfx: [...sc.map((_, i) => [st(i), hire[i] ? 'ding' : 'tick']), [9.6, 'whoosh'], [12.6, 'pop'], [14.4, 'rise'], [17.4, 'success']],
      draw(t) {
        let best = 0, hires = 0; sc.forEach((v, i) => { if (t >= st(i)) { if (v > best) { best = v; hires++; } } });
        sc.forEach((v, i) => { if (t < st(i)) return; const u = P(t, st(i), .5, E.back), h = v * 34 * Math.min(1.1, u), col = hire[i] ? C.green : C.dim; ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = hire[i] ? 18 : 0; rrect(bx(i) - 22, 760 - h, 44, h, 8, col + (hire[i] ? 'aa' : '55'), col, 1.5); ctx.restore();
          txt(String(v), bx(i), 740 - h, { size: 20, font: MONO, weight: 800, alpha: cl(u) }); txt(`#${i + 1}`, bx(i), 784, { size: 16, font: MONO, color: C.dim, alpha: cl(u) }); if (hire[i] && t > st(i) + .3) txt('錄取', bx(i), 812, { size: 16, weight: 900, color: C.green, alpha: P(t, st(i) + .3, .3) }); });
        txt(`錄取次數 ${hires}`, W / 2, 340, { size: 36, weight: 900, color: C.green, alpha: P(t, 2, .4) * (1 - P(t, 17.1, .3)), glow: 12 });
        const B = P(t, 9.6, .5); if (B > 0) { ctx.save(); ctx.globalAlpha = B; rrect(60, 840, 600, 190, 22, 'rgba(8,13,28,.94)', C.amber, 2); ctx.restore();
          txt('Xᵢ = 1 若第 i 位被錄取', W / 2, 880, { size: 26, font: MONO, weight: 800, alpha: B });
          txt('P(第 i 位是前 i 位裡最好的) = 1/i', W / 2, 930, { size: 24, font: MONO, weight: 800, color: C.amber, alpha: P(t, 12.6, .5) });
          txt('E[X] = Σ 1/i = Hₙ ≈ ln n', W / 2, 985, { size: 32, font: MONO, weight: 900, color: C.green, glow: 12, alpha: P(t, 14.4, .5) }); }
        pop(t, 17.4, W / 2, 340, () => { rrect(-280, -40, 560, 80, 20, 'rgba(8,13,28,.92)', C.green, 2); txt('n = 10：平均只要 2.93 次', 0, 1, { size: 30, weight: 900 }); });
        caps(t, [[.4, 1.9, '面試 10 個人，順序隨機'], [2, 9.5, '每遇到比目前最好的還好，就換人'], [9.6, 17.3, '指示隨機變數：把「錄取次數」拆成每個人錄不錄取'], [17.4, 25.7, '期望值線性：不用管彼此相不相關，直接相加']]);
      } });
  })();

  /* ======================= 播放器 ======================= */
  const get = id => LIST.find(c => c.id === id);
  function render(c2d, clip, t) {
    ctx = c2d; ctx.save(); bg(t, SUBC[clip.subject] || C.teal); hook(t, clip); clip.draw(t);
    txt('資工所衝刺站', W / 2, 1238, { size: 18, color: C.dim, weight: 700, spacing: 6, alpha: .7 });
    ctx.restore(); const f = Math.min(cl(t / .35), cl((clip.dur - t) / .35)); if (f < 1) { c2d.fillStyle = `rgba(5,8,15,${1 - f})`; c2d.fillRect(0, 0, W, H); }
  }
  const players = [];
  /* 新版短影音：有 mp4 就播 mp4（字幕燒在畫面裡），沒有才用即時算的畫面 */
  const videoOf = id => ((typeof DATA !== 'undefined' && DATA.shorts) || {})[id];
  function vplayer(host, clip, vid, opts) {
    const box = document.createElement('div'); box.className = 'clip-player vid' + (opts.feed ? ' feed' : '');
    box.innerHTML = `<video playsinline preload="metadata"${vid.poster ? ` poster="${vid.poster}"` : ''} src="${vid.src}"></video><div class="clip-bar seek"><i></i></div><button class="clip-btn snd-btn ${Sound.on ? 'on' : ''}" aria-label="聲音開關">${Sound.on ? '🔊' : '🔇'}</button>`;
    host.appendChild(box);
    const v = box.querySelector('video'), bar = box.querySelector('.clip-bar i'); v.muted = !Sound.on;
    const st = { seen: false };
    v.addEventListener('timeupdate', () => { if (!v.duration) return; bar.style.width = (v.currentTime / v.duration * 100) + '%'; if (!st.seen && v.currentTime >= v.duration * .9) { st.seen = true; if (window.onClipSeen) window.onClipSeen(clip.id); } });
    v.addEventListener('play', () => { players.forEach(p => p !== api && p.pause()); box.classList.add('playing'); });
    v.addEventListener('pause', () => box.classList.remove('playing'));
    v.addEventListener('ended', () => { box.classList.remove('playing'); if (opts.onEnd) opts.onEnd(api); });
    const api = { box, clip, video: v, play() { if (opts.restart) { v.currentTime = 0; opts.restart = false; } v.muted = !Sound.on; const pr = v.play(); if (pr && pr.catch) pr.catch(() => { v.muted = true; v.play().catch(() => { }); }); },
      pause() { if (!v.paused) v.pause(); }, stop() { api.pause(); if (api.io) api.io.disconnect(); } };
    v.addEventListener('click', () => { v.paused ? api.play() : api.pause(); });
    box.querySelector('.clip-bar').addEventListener('click', e => { if (!v.duration) return; const r = e.currentTarget.getBoundingClientRect(); v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * v.duration; });
    box.querySelector('.snd-btn').addEventListener('click', e => { e.stopPropagation(); Sound.wanted = Sound.toggle(); players.forEach(p => { if (p.video) p.video.muted = !Sound.on; }); if (v.paused) api.play(); });
    if (opts.auto && 'IntersectionObserver' in window) { api.io = new IntersectionObserver(es => es.forEach(en => { if (en.intersectionRatio >= .6) { opts.restart = !!opts.feed; api.play(); } else api.pause(); }), { threshold: [0, .6, 1] }); api.io.observe(box); }
    players.push(api); return api;
  }
  function player(host, id, opts = {}) {
    const clip = get(id); if (!clip) return null;
    const vid = videoOf(id); if (vid) return vplayer(host, clip, vid, opts);
    const box = document.createElement('div'); box.className = 'clip-player' + (opts.feed ? ' feed' : '');
    box.innerHTML = `<canvas width="${W}" height="${H}"></canvas><div class="clip-bar"><i></i></div><button class="clip-btn snd-btn ${Sound.on ? 'on' : ''}" aria-label="聲音開關" title="音樂與音效">${Sound.on ? '🔊' : '🔇'}</button><div class="clip-hint">點一下暫停／播放</div>`;
    host.appendChild(box);
    const cv = box.querySelector('canvas'), c2d = cv.getContext('2d'), bar = box.querySelector('.clip-bar i');
    const st = { t: opts.start || 2.2, playing: false, raf: 0, last: 0, clip, fresh: true };
    const draw = () => { render(c2d, clip, st.t); bar.style.width = (st.t / clip.dur * 100) + '%'; };
    const loop = now => { if (!st.playing) return; const dt = Math.min(.1, (now - st.last) / 1000); st.last = now; const p = st.t; st.t += dt;
      if (!st.seen && st.t >= clip.dur * .9) { st.seen = true; if (window.onClipSeen) window.onClipSeen(clip.id); }
      if (st.t >= clip.dur) { st.t = 0; if (opts.onEnd) opts.onEnd(api); } else { for (const [ts, nm] of clip.sfx || []) if (ts > p && ts <= st.t) Sound.sfx(nm); }
      draw(); st.raf = requestAnimationFrame(loop); };
    const api = { box, clip, play() { if (st.playing) return; players.forEach(p => p !== api && p.pause()); if (st.fresh || st.t >= clip.dur - .05 || opts.restart) { st.t = 0; opts.restart = false; st.fresh = false; } st.playing = true; st.last = performance.now(); Sound.use(1); box.classList.add('playing'); st.raf = requestAnimationFrame(loop); },
      pause() { if (!st.playing) return; st.playing = false; cancelAnimationFrame(st.raf); Sound.use(-1); box.classList.remove('playing'); }, stop() { api.pause(); if (api.io) api.io.disconnect(); } };
    cv.addEventListener('click', () => { st.playing ? api.pause() : api.play(); });
    box.querySelector('.snd-btn').addEventListener('click', e => { e.stopPropagation(); Sound.wanted = Sound.toggle(); });
    draw();
    if (opts.auto && 'IntersectionObserver' in window) { api.io = new IntersectionObserver(es => es.forEach(en => { if (en.intersectionRatio >= .6) { opts.restart = !!opts.feed; api.play(); } else api.pause(); }), { threshold: [0, .6, 1] }); api.io.observe(box); }
    players.push(api); return api;
  }
  function stopAll() { players.splice(0).forEach(p => p.stop()); }
  return { list: LIST, get, render, player, stopAll, videoOf, W, H, SUBC };
})();
