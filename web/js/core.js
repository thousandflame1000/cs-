/* 資工所衝刺站 — core: utils, math, markdown, state */
'use strict';

/* ---------- tiny DOM helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
function toast(msg, kind = '') {
  let box = $('#toasts');
  if (!box) { box = h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.appendChild(box); }
  const t = h('div', { class: 'toast ' + kind }, msg);
  box.appendChild(t);
  setTimeout(() => t.classList.add('out'), 3200);
  setTimeout(() => t.remove(), 3800);
}
function uid(prefix = 'm') {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}
function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* ---------- dates (local) ---------- */
const D = {
  fmt(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  today() { return D.fmt(new Date()); },
  parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); },
  add(s, n) { const d = D.parse(s); d.setDate(d.getDate() + n); return D.fmt(d); },
  diff(a, b) { return Math.round((D.parse(b) - D.parse(a)) / 86400000); },
  wd(s) { return '日一二三四五六'[D.parse(s).getDay()]; },
  hm(ts) { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); },
};

/* ---------- seeded RNG ---------- */
function rng(seed) {
  let a = seed >>> 0;
  const f = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.shuffle = arr => { const a2 = arr.slice(); for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; } return a2; };
  return f;
}

/* ---------- math: KaTeX (MathML) if loaded, else mini TeX→MathML ---------- */
const TeX = (() => {
  const SYM = {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
    Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
    infty: '∞', partial: '∂', nabla: '∇', emptyset: '∅', varnothing: '∅', ell: 'ℓ', hbar: 'ℏ', aleph: 'ℵ',
  };
  const OPS = {
    le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', equiv: '≡', sim: '∼', simeq: '≃', cong: '≅', propto: '∝',
    cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓', ast: '∗', star: '⋆', circ: '∘', bullet: '•', oplus: '⊕', otimes: '⊗',
    to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', leftrightarrow: '↔', iff: '⇔', implies: '⇒', mapsto: '↦', uparrow: '↑', downarrow: '↓',
    in: '∈', notin: '∉', ni: '∋', subset: '⊂', subseteq: '⊆', supset: '⊃', supseteq: '⊇', cup: '∪', cap: '∩', setminus: '∖', bigcup: '⋃', bigcap: '⋂',
    forall: '∀', exists: '∃', neg: '¬', lnot: '¬', land: '∧', wedge: '∧', lor: '∨', vee: '∨', top: '⊤', bot: '⊥', perp: '⊥', parallel: '∥', mid: '∣', nmid: '∤',
    sum: '∑', prod: '∏', int: '∫', oint: '∮', coprod: '∐',
    lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉', langle: '⟨', rangle: '⟩', vert: '|', Vert: '‖', lbrace: '{', rbrace: '}',
    cdots: '⋯', ldots: '…', dots: '…', vdots: '⋮', ddots: '⋱', prime: '′', angle: '∠', triangle: '△', square: '□', checkmark: '✓',
    ll: '≪', gg: '≫', prec: '≺', succ: '≻', preceq: '⪯', succeq: '⪰', vdash: '⊢', models: '⊨', therefore: '∴', because: '∵',
  };
  const FN = new Set(['log', 'lg', 'ln', 'exp', 'sin', 'cos', 'tan', 'max', 'min', 'sup', 'inf', 'lim', 'det', 'dim', 'ker', 'gcd', 'lcm', 'deg', 'arg', 'Pr', 'mod', 'rank', 'tr', 'span', 'null', 'col', 'row']);
  const SPACE = { ',': '0.17em', ':': '0.22em', ';': '0.28em', quad: '1em', qquad: '2em', ' ': '0.25em', '!': '0em' };
  function tokenize(s) {
    const t = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === '\\') {
        let j = i + 1;
        if (/[a-zA-Z]/.test(s[j] || '')) { while (j < s.length && /[a-zA-Z]/.test(s[j])) j++; t.push({ k: 'cmd', v: s.slice(i + 1, j) }); i = j; }
        else { t.push({ k: 'cmd', v: s[j] || '' }); i = j + 1; }
      } else if (/\s/.test(c)) { i++; }
      else if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; t.push({ k: 'num', v: s.slice(i, j) }); i = j; }
      else { t.push({ k: 'ch', v: c }); i++; }
    }
    return t;
  }
  function P(tokens) {
    let p = 0;
    const peek = () => tokens[p];
    const next = () => tokens[p++];
    function group() { // after '{' consumed
      const items = [];
      while (p < tokens.length && !(peek().k === 'ch' && peek().v === '}')) items.push(...seq1());
      p++; return row(items);
    }
    function row(items) { return items.length === 1 ? items[0] : '<mrow>' + items.join('') + '</mrow>'; }
    function arg() {
      const t = peek();
      if (!t) return '<mrow></mrow>';
      if (t.k === 'ch' && t.v === '{') { next(); return group(); }
      return atom();
    }
    function rawArg() { // text content
      const t = next(); if (!t) return '';
      if (t.k === 'ch' && t.v === '{') { let depth = 1, out = ''; while (p < tokens.length) { const u = next(); if (u.k === 'ch' && u.v === '{') depth++; if (u.k === 'ch' && u.v === '}' && --depth === 0) break; out += u.k === 'cmd' ? (OPS[u.v] || SYM[u.v] || u.v) : u.v; } return out; }
      return t.v;
    }
    function env(name) {
      const rows = [[[]]];
      while (p < tokens.length) {
        const t = peek();
        if (t.k === 'cmd' && t.v === 'end') { next(); rawArg(); break; }
        if (t.k === 'ch' && t.v === '&') { next(); rows[rows.length - 1].push([]); continue; }
        if (t.k === 'cmd' && t.v === '\\') { next(); rows.push([[]]); continue; }
        const r = rows[rows.length - 1]; r[r.length - 1].push(...seq1());
      }
      if (rows.length > 1 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0].length === 0) rows.pop();
      const tbl = '<mtable>' + rows.map(r => '<mtr>' + r.map(c => '<mtd>' + row(c) + '</mtd>').join('') + '</mtr>').join('') + '</mtable>';
      const fence = { bmatrix: ['[', ']'], pmatrix: ['(', ')'], vmatrix: ['|', '|'], Vmatrix: ['‖', '‖'], cases: ['{', ''], matrix: ['', ''], array: ['', ''], aligned: ['', ''] }[name] || ['', ''];
      return '<mrow>' + (fence[0] ? `<mo>${fence[0]}</mo>` : '') + tbl + (fence[1] ? `<mo>${fence[1]}</mo>` : '') + '</mrow>';
    }
    function atom() {
      const t = next();
      if (!t) return '';
      if (t.k === 'num') return `<mn>${t.v}</mn>`;
      if (t.k === 'ch') {
        if (t.v === '{') return group();
        if (/[a-zA-Z]/.test(t.v)) return `<mi>${t.v}</mi>`;
        if (t.v === "'") return '<mo>′</mo>';
        return `<mo>${esc(t.v)}</mo>`;
      }
      const c = t.v;
      if (c === 'frac' || c === 'dfrac' || c === 'tfrac') { const a = arg(), b = arg(); return `<mfrac>${a}${b}</mfrac>`; }
      if (c === 'binom') { const a = arg(), b = arg(); return `<mrow><mo>(</mo><mfrac linethickness="0">${a}${b}</mfrac><mo>)</mo></mrow>`; }
      if (c === 'sqrt') {
        if (peek() && peek().k === 'ch' && peek().v === '[') { next(); const idx = []; while (p < tokens.length && !(peek().k === 'ch' && peek().v === ']')) idx.push(...seq1()); next(); const b = arg(); return `<mroot>${b}${row(idx)}</mroot>`; }
        return `<msqrt>${arg()}</msqrt>`;
      }
      if (c === 'text' || c === 'textrm' || c === 'mbox' || c === 'texttt') return `<mtext>${esc(rawArg())}</mtext>`;
      if (c === 'mathbf' || c === 'boldsymbol' || c === 'bm') return `<mi mathvariant="bold">${esc(rawArg())}</mi>`;
      if (c === 'mathbb') return `<mi mathvariant="double-struck">${esc(rawArg())}</mi>`;
      if (c === 'mathcal') return `<mi mathvariant="script">${esc(rawArg())}</mi>`;
      if (c === 'mathrm' || c === 'operatorname') return `<mi mathvariant="normal">${esc(rawArg())}</mi>`;
      if (c === 'overline' || c === 'bar') return `<mover accent="true">${arg()}<mo>¯</mo></mover>`;
      if (c === 'hat' || c === 'widehat') return `<mover accent="true">${arg()}<mo>^</mo></mover>`;
      if (c === 'tilde') return `<mover accent="true">${arg()}<mo>~</mo></mover>`;
      if (c === 'vec') return `<mover accent="true">${arg()}<mo>→</mo></mover>`;
      if (c === 'underbrace') return `<munder>${arg()}<mo>⏟</mo></munder>`;
      if (c === 'left' || c === 'right' || c === 'big' || c === 'Big' || c === 'bigg' || c === 'Bigg' || c === 'bigl' || c === 'bigr' || c === 'Bigl' || c === 'Bigr') {
        const d = next(); if (!d) return ''; if (d.k === 'ch' && d.v === '.') return '';
        const v = d.k === 'cmd' ? (OPS[d.v] || (d.v === '{' ? '{' : d.v === '}' ? '}' : d.v === '|' ? '‖' : d.v)) : d.v;
        return `<mo stretchy="true">${esc(v)}</mo>`;
      }
      if (c === 'begin') { const name = rawArg(); if (name === 'array') rawArg(); return env(name); }
      if (c === 'pmod') return `<mrow><mo>(</mo><mi mathvariant="normal">mod</mi><mspace width="0.3em"/>${arg()}<mo>)</mo></mrow>`;
      if (c === 'bmod') return '<mo lspace="0.3em" rspace="0.3em">mod</mo>';
      if (c in SPACE) return `<mspace width="${SPACE[c]}"/>`;
      if (c === '{' || c === '}' || c === '%' || c === '$' || c === '#' || c === '&' || c === '_') return `<mo>${esc(c)}</mo>`;
      if (c === '|') return '<mo>‖</mo>';
      if (FN.has(c)) return `<mi mathvariant="normal">${c}</mi><mspace width="0.17em"/>`;
      if (c in SYM) return `<mi>${SYM[c]}</mi>`;
      if (c in OPS) return `<mo>${OPS[c]}</mo>`;
      if (c === 'not') { const n = atom(); return n.replace(/<mo>(.*?)<\/mo>/, (m, x) => `<mo>${x}̸</mo>`); }
      return `<mi mathvariant="normal">${esc(c)}</mi>`;
    }
    function seq1() { // atom with scripts
      let base = atom();
      let sub = null, sup = null;
      for (;;) {
        const t = peek();
        if (t && t.k === 'ch' && t.v === '_') { next(); sub = arg(); continue; }
        if (t && t.k === 'ch' && t.v === '^') { next(); sup = arg(); continue; }
        if (t && t.k === 'ch' && t.v === "'") { next(); sup = '<mo>′</mo>'; continue; }
        break;
      }
      if (sub && sup) return [`<msubsup>${base || '<mrow></mrow>'}${sub}${sup}</msubsup>`];
      if (sub) return [`<msub>${base || '<mrow></mrow>'}${sub}</msub>`];
      if (sup) return [`<msup>${base || '<mrow></mrow>'}${sup}</msup>`];
      return [base];
    }
    const out = [];
    while (p < tokens.length) {
      const t = peek();
      if (t.k === 'ch' && t.v === '}') { next(); continue; }
      out.push(...seq1());
    }
    return out.join('');
  }
  function mini(src, display) {
    try {
      return `<math${display ? ' display="block"' : ''}><mrow>${P(tokenize(src))}</mrow></math>`;
    } catch (e) { return `<code class="tex">${esc(src)}</code>`; }
  }
  /* 斜線除法 → 分數：a/b、(x+1)/2、1/(1-f) 變成 \frac；兩邊要是「單純的一塊」（數字、單一字母、括號），
     左邊前面不能接著 ^ _ 或字母數字（避免把 2^n/n 的 n 拆走），右邊後面不能接 ^ _ ( 或字母數字 */
  function fracify(t) {
    const hold = []; t = String(t).replace(/\\(?:text|mathrm|operatorname)\{[^{}]*\}/g, m => { hold.push(m); return '\u0006' + (hold.length - 1) + '\u0006'; });
    const SUP = '(?:_\\{[^{}]+\\}|_[A-Za-z0-9])?(?:\\^\\{[^{}]+\\}|\\^[A-Za-z0-9])?!?';
    const BASE = '(?:\\d+(?:\\.\\d+)?[A-Za-z]?|[A-Za-z]|\\([^()]+\\)|\\\\(?:lg|log|ln)\\s*[A-Za-z0-9])';
    const A = '(' + BASE + SUP + ')';
    const re = new RegExp('(^|[\\s=+\\-*,(<>\\[|:;·{]|\\\\l(?:floor|ceil)\\s?)' + A + '\\s*/\\s*' + A + '(?![\\w^_(.!{])', 'g');
    const strip = x => /^\(.*\)$/.test(x) && !/\)\s*\(/.test(x) ? x.slice(1, -1) : x;
    for (let k = 0; k < 3; k++) { const n = t.replace(re, (m, pre, a, b) => pre + '\\frac{' + strip(a) + '}{' + strip(b) + '}'); if (n === t) break; t = n; }
    return t.replace(/\u0006(\d+)\u0006/g, (m, i) => hold[+i]);
  }
  function render(src, display) {
    src = fracify(src);
    if (window.katex) {
      try { return window.katex.renderToString(src, { output: 'htmlAndMathml', displayMode: display, throwOnError: false, strict: false }); }
      catch (e) { /* fall through */ }
    }
    return mini(src, display);
  }
  return { render, mini, fracify };
})();

/* ---------- Markdown (subset + study extensions) ---------- */
const CALLOUT = {
  key: '考點', trap: '陷阱', proof: '證明', ex: '例題', def: '定義', thm: '定理', tip: '技巧', ntu: '台大考法', why: '為什麼', feyn: '費曼自問', gist: '要點',
};
const CALLOUT_ICON = { key: '🎯', trap: '⚠️', proof: '🔍', ex: '✏️', def: '📘', thm: '📐', tip: '💡', ntu: '🏛️', why: '❓', feyn: '🧠', gist: '👉' };
const CALLOUT_ZH = { 考點: 'key', 重點: 'key', 陷阱: 'trap', 注意: 'trap', 證明: 'proof', 例題: 'ex', 例: 'ex', 定義: 'def', 定理: 'thm', 引理: 'thm', 技巧: 'tip', 台大考法: 'ntu', 台大: 'ntu', 為什麼: 'why', 觀念: 'why', 費曼: 'feyn', 費曼自問: 'feyn', 先記住: 'gist' };
function mdInline(s, math) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, (m, x) => `<code>${x}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/==([^=]+)==/g, '<mark class="hl">$1</mark>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\((#[\w-]+|https?:\/\/[^)\s]+)\)/g, (m, t, u) => `<a href="${u}"${u.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`);
  s = s.replace(/\u0000(\d+)\u0000/g, (m, i) => math[+i]);
  return s;
}
// 一般文字裡沒包 $ 的算式：23 × 47、r ≤ 6、2^h、lg 64 = 6、a4 = 5 × 46 − 6 × 14、Aᵀ、K₅ → 排成數學式
const PM_GR = { 'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\varepsilon', 'θ': '\\theta', 'λ': '\\lambda', 'μ': '\\mu', 'π': '\\pi', 'σ': '\\sigma', 'φ': '\\varphi', 'ω': '\\omega', 'ρ': '\\rho', 'τ': '\\tau', 'η': '\\eta', 'κ': '\\kappa', 'ν': '\\nu', 'ξ': '\\xi', 'χ': '\\chi', 'ψ': '\\psi', 'ζ': '\\zeta', 'Θ': '\\Theta', 'Ω': '\\Omega', 'Λ': '\\Lambda', 'Σ': '\\Sigma', 'Φ': '\\Phi', 'Π': '\\Pi', 'Δ': '\\Delta', 'Γ': '\\Gamma', 'ℝ': '\\mathbb{R}' };
const PM_G = 'αβγδεθλμπσφωρτηκνξχψζΘΩΛΣΦΠΔΓ';
const PM_SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿᵀ', PM_SUB = '₀₁₂₃₄₅₆₇₈₉';
const PM_STOP = /^(is|of|or|to|in|on|at|if|as|an|be|by|do|go|no|so|up|we|it|my|me|he|us|am|id|ok|vs|ms|ns|us|kb|mb|gb|th|nd|rd|st|co)$/;
const PM_RUN = (() => {
  const L = 'A-Za-z' + PM_G + 'ℝ';
  const POW = '(?:\\^(?:\\d+|[A-Za-z]|\\{[^{}\\n]{1,16}\\}|\\([^()\\n]{1,16}\\))|[' + PM_SUP + ']+)?(?:[' + PM_SUB + ']+)?';
  const ATOM = '(?:(?:lg|log|ln) ?(?:\\d+|[a-z](?![A-Za-z])|\\([^()\\n]{1,16}\\))|(?:rank|det|dim|tr|nullity) ?[A-Z](?![A-Za-z])|\\d+(?:\\.\\d+)?(?:[a-z](?![A-Za-z]))?|[' + L + '](?:[' + PM_G + '][A-Za-z]?)*\\d*(?:\\([^()\\n]{1,24}\\))?(?![A-Za-z])|[A-Za-z][a-z](?![A-Za-z(])|\\([^()\\n]{1,30}\\)|\\{[^{}\\n]{1,16}\\}|[⌈⌊][^⌉⌋\\n]{1,14}[⌉⌋]|\\d?\\|[A-Za-z]\\||\\u0000\\d+\\u0000)' + POW;
  const OP = '(?:\\s*[×÷+=·/<>≤≥≠≡]\\s*[\\-−]?|\\s[\\-−]\\s|[\\-−]|\\s+mod\\s+|\\s?(?=(?:lg|log|ln)[\\s(])|(?=\\()|(?<=[' + PM_SUP + ')])(?=[A-Z]))';
  const NB = '[A-Za-z0-9_./\\\\^\\-' + PM_G + PM_SUP + PM_SUB + '\\u0000-\\u0006]';
  return new RegExp('(?<!' + NB + ')(?<!\\d )(?<![A-Za-zΘΩ(]\\()(?:[≤≥≠] ?|(?<=[^\\s>] )[<>] |mod )?' + ATOM + '(?:' + OP + ATOM + ')*(?!' + NB.replace('\\-', '(') + ')', 'g');
})();
function plainMath(src, math, msrc) {
  msrc = msrc || [];
  const put = tex => { math.push(TeX.render(tex, false)); msrc[math.length - 1] = tex; return '\u0000' + (math.length - 1) + '\u0000'; };
  src = src.replace(/(?<![A-Za-z\-])(P|NP)\s*(=|≠)\s*(P|NP)(?![A-Za-z\-])/g, (m, a, op, b) => put('\\mathrm{' + a + '}' + (op === '=' ? '=' : '\\ne ') + '\\mathrm{' + b + '}'));
  src = src.replace(/≤p(?![A-Za-z])/g, () => put('\\le_p'));
  const sup = new RegExp('[' + PM_SUP + ']+', 'g'), sub = new RegExp('[' + PM_SUB + ']+', 'g');
  return src.replace(PM_RUN, (run, off, whole) => {
    const top = run.replace(/\([^()]*\)/g, '()');
    const ops = top.match(/[×÷+\-−=·/<>≤≥≠≡]|\smod\s/g) || [];
    const pw = /[\^]/.test(run) || sup.test(run) || sub.test(run); sup.lastIndex = sub.lastIndex = 0;
    let lone = false;
    if (!ops.length && !pw) {   // 單獨一個變數：n、φ(n)、T(n)、(u, v) 這種，前後不是英文字才當數學
      lone = /^[a-z]$/.test(run) || new RegExp('^[' + PM_G + ']$').test(run) || /^[A-Za-z\u03b1-\u03c9](\([^()]{1,12}\))$/.test(run) && !/^[OΘΩo]\(/.test(run) || /^\([a-z0-9]{1,3}(, ?[a-z0-9]{1,3})+\)$/.test(run) && /[a-z]/.test(run);
      if (!lone) return run;
      const pv = whole.slice(0, off).replace(/\s+$/, '').slice(-1), nx = whole.slice(off + run.length).replace(/^\s+/, '').charAt(0);
      if (/[A-Za-z'’\-]/.test(pv) || /[A-Za-z'’\-]/.test(nx) || /^[a-z]$/.test(run) && (/[.]/.test(nx) || /^\s*\d+(\.\d+)?\s*%/.test(whole.slice(off + run.length)))) return run;   // j 5%（指令名）
      if (/[(（]/.test(pv) && /^[a-z]$/.test(run) && /[)）]/.test(nx)) return run;   // (a) 這種小題編號
    }
    if ((run.match(/\u0000(\d+)\u0000/g) || []).some(x => msrc[+x.slice(1, -1)] == null)) return run;
    if ((run.match(/[A-Za-z]{2,}/g) || []).some(w => !/^(lg|log|ln|rank|det|dim|tr|nullity|mod)$/.test(w) && !(/^[A-Za-z][a-z]$/.test(w) && !PM_STOP.test(w.toLowerCase())))) return run;
    if (/[\w)]\s[\-−](?=\S)|[\w)][\-−]\s/.test(top)) return run;          // a→c −4 這種負號不併
    if (ops.length && ops.every(o => o === '-') && !/\s/.test(run) && !/^[a-z](?:-\d+)+$/.test(run)) return run;  // a-b 邊、x86-64
    if (!new RegExp('^[\\w\\s+\\-−×÷·/,.^(){}<>=≤≥≠≡ℝ⌈⌉⌊⌋|!\\u0000' + PM_G + PM_SUP + PM_SUB + ']*$').test(run)) return run;
    if (/^[\d\s+\-−×÷/().^=]+$/.test(run) && ops.includes('=')) {   // 純數字等式：算不對（其實是半句話）就不排
      try { const v = run.split('=').map(x => Function('return (' + x.replace(/([\d)])\s*\(/g, '$1*(').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\^/g, '**') + ')')()); if (v.some(x => !isFinite(x) || Math.abs(x - v[0]) > 0.01 * Math.max(1, Math.abs(v[0])))) return run; } catch (e) { return run; }
    }
    const hasL = new RegExp('[A-Za-z\\u0000' + PM_G + ']').test(run.replace(/\b(lg|log|ln|mod)\b/g, ''));
    const strong = pw || /[×÷≤≥≠·<>≡]/.test(run) || /\b(lg|log|ln|rank|det|dim)\b/.test(run);
    const eq = ops.includes('=');
    const lin = ops.some(o => /[+\-−]/.test(o));
    if (!(lone || strong || eq || (lin && hasL))) return run;
    if (!lone && !strong && !eq && /^[A-Z]/.test(run.trim())) return run;
    let t = run.split(/(\u0000\d+\u0000)/).map((part, j) => j % 2 ? '{' + msrc[+part.slice(1, -1)] + '}' : part.replace(/(?<![\^_])\{([^{}]*)\}/g, '\\{$1\\}').replace(/(?<![A-Za-z\\])([A-Za-z])(\d+)/g, (m, a, d) => /[RFX]/.test(a) ? '\\mathrm{' + a + d + '}' : a + '_{' + d + '}')   // R1、F0 是暫存器名，不下標
      .replace(/(?<![A-Za-z\\])(lg|log|ln) ?/g, '\\$1 ')
      .replace(/(?<![A-Za-z\\])(rank|dim|tr|nullity) ?/g, '\\operatorname{$1} ').replace(/(?<![A-Za-z\\])det ?/g, '\\det ')
      .replace(/(^|\s+)mod\s+/g, ' \\bmod ')
      .replace(/\^\(([^()]+)\)/g, '^{$1}')
      .replace(sup, m => '^{' + [...m].map(c => '0123456789-+nT'[PM_SUP.indexOf(c)]).join('') + '}')
      .replace(sub, m => '_{' + [...m].map(c => PM_SUB.indexOf(c)).join('') + '}')
      .replace(/⌈/g, '\\lceil ').replace(/⌉/g, '\\rceil ').replace(/⌊/g, '\\lfloor ').replace(/⌋/g, '\\rfloor ')
      .replace(/×/g, '\\times ').replace(/÷/g, '\\div ').replace(/·/g, '\\cdot ').replace(/−/g, '-').replace(/≡/g, '\\equiv ')
      .replace(/≤/g, '\\le ').replace(/≥/g, '\\ge ').replace(/≠/g, '\\ne ')
      .replace(new RegExp('[' + PM_G + 'ℝ]', 'g'), c => PM_GR[c] + ' ')).join('');
    return put(t);
  });
}
function md(src, opt) {
  if (!src) return '';
  const BR = !!(opt && opt.br);
  const math = [];
  const codeBlocks = [];
  // protect fenced code
  src = src.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) => { codeBlocks.push(lang === 'fig' && typeof Fig !== 'undefined' ? Fig.svg(code) : `<pre class="code"><code>${esc(code.replace(/\n$/, ''))}</code></pre>`); return `\u0001${codeBlocks.length - 1}\u0001`; });
  // protect inline code from math
  const inl = [];
  src = src.replace(/`[^`\n]+`/g, m => { inl.push(m); return `\u0002${inl.length - 1}\u0002`; });
  const msrc = [];   // 行內數學的 TeX 原文（給 plainMath 把相鄰的式子併成一條）
  const putT = t => { math.push(TeX.render(t, false)); msrc[math.length - 1] = t; return '\u0000' + (math.length - 1) + '\u0000'; };
  src = src.replace(/\$\$([\s\S]+?)\$\$/g, (m, t) => { math.push(`<div class="mblock">${TeX.render(t.trim(), true)}</div>`); return `\u0000${math.length - 1}\u0000`; });
  src = src.replace(/\$([^$\n]+?)\$/g, (m, t) => putT(t));
  // 一般文字裡的漸近符號與對數（沒包 $ 的）：Θ(n lg n) → \Theta(n\lg n)、lg n → \lg n
  const texIn = x => x.replace(/(?<![A-Za-z\\])(lg|log|ln)\s*(?=[A-Za-z0-9(])/g, '\\$1 ').replace(/\*/g, '\\cdot ');
  src = src.replace(/(^|[^A-Za-z0-9_\\\u0000-\u0006])([OΘΩo])\(((?:[A-Za-z0-9 +\-−*/^.!√,αβγδεθλμπσφωρτ⌈⌉⌊⌋]|\([A-Za-z0-9 +\-−*/^.!,αλ]{1,16}\)){1,28})\)/g, (m, pre, f, inner) => {
    if (!/[A-Za-z0-9]/.test(inner) || (inner.match(/[A-Za-z]{2,}/g) || []).some(w => w.length > 2 && !/^(lg|log|ln|min|max|deg)$/.test(w))) return m;
    inner = inner.replace(/−/g, '-').replace(/\b(min|max)\(/g, '\\$1(').replace(/\bdeg\s*/g, '\\deg ').replace(/[αβγδεθλμπσφωρτ]/g, c => PM_GR[c] + ' ').replace(/⌈/g, '\\lceil ').replace(/⌉/g, '\\rceil ').replace(/⌊/g, '\\lfloor ').replace(/⌋/g, '\\rfloor ');
    const F = { 'Θ': '\\Theta', 'Ω': '\\Omega', O: 'O', o: 'o' }[f];
    return pre + putT(F + '(' + texIn(inner.replace(/√\s*([A-Za-z0-9]+)/g, '\\sqrt{$1}')) + ')');
  });
  src = src.replace(/(^|[^A-Za-z0-9_\\\u0000-\u0006])((?:\d+\s?)?(?:lg|log)\s?(?:[a-z](?![A-Za-z])|\([^()]{1,12}\)))/g, (m, pre, ex) => pre + putT(texIn(ex)));
  src = plainMath(src, math, msrc);
  src = src.replace(/(^|[^A-Za-z0-9\/_.:\\\-\u0000-\u0006])(\d+|[a-z])\/(\d+|[a-z])(?![A-Za-z0-9\/_.\u0000-\u0006])/g, (m, pre, a, b) => {
    if (!/\d/.test(a + b)) return m;   // w/o、a/b 這種純字母不動
    math.push(TeX.render('\\frac{' + a + '}{' + b + '}', false)); return pre + '\u0000' + (math.length - 1) + '\u0000';
  });
  src = src.replace(/\u0002(\d+)\u0002/g, (m, i) => inl[+i]);
  const lines = src.split('\n');
  const out = [];
  let i = 0;
  const inline = s => mdInline(s, math);
  function para(buf) { if (buf.length) out.push(`<p>${BR ? inline(buf.join('\u0005')).replace(/\u0005/g, '<br>') : inline(buf.join(' '))}</p>`); }
  let pbuf = [];
  while (i < lines.length) {
    let line = lines[i];
    const t = line.trim();
    if (!t) { para(pbuf); pbuf = []; i++; continue; }
    let m;
    if ((m = t.match(/^\u0001(\d+)\u0001$/))) { para(pbuf); pbuf = []; out.push(codeBlocks[+m[1]]); i++; continue; }
    if ((m = t.match(/^\u0000(\d+)\u0000$/)) && math[+m[1]].startsWith('<div')) { para(pbuf); pbuf = []; out.push(math[+m[1]]); i++; continue; }
    if (/^[\u0003\u0004]\d+[\u0003\u0004]$/.test(t)) { para(pbuf); pbuf = []; out.push(t); i++; continue; }
    if ((m = t.match(/^(#{1,4})\s+(.*)$/))) {
      para(pbuf); pbuf = [];
      const lvl = Math.min(4, m[1].length + 1);
      const id = 'h-' + out.length;
      out.push(`<h${lvl} id="${id}">${inline(m[2])}</h${lvl}>`); i++; continue;
    }
    if (/^---+$/.test(t)) { para(pbuf); pbuf = []; out.push('<hr>'); i++; continue; }
    if ((m = t.match(/^@lab\s+([\w-]+)(?:\s+(.*))?$/))) { para(pbuf); pbuf = []; out.push(`<div class="lab-embed" data-lab="${m[1]}" data-params="${esc(m[2] || '')}"></div>`); i++; continue; }
    if ((m = t.match(/^\+\+\+\s*(.*)$/))) { // collapsible
      para(pbuf); pbuf = [];
      const title = m[1] || '看解答'; const body = []; i++;
      while (i < lines.length && !/^\+\+\+\s*$/.test(lines[i].trim())) body.push(lines[i++]);
      i++;
      out.push(`<details class="sol"><summary>${inline(title)}</summary><div class="sol-body">${mdBody(body.join('\n'), math, codeBlocks)}</div></details>`);
      continue;
    }
    if (t.startsWith('>')) { // callout / quote
      para(pbuf); pbuf = [];
      const body = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) { body.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
      let kind = 'note', title = '';
      const km = body[0] && body[0].match(/^\[!([^\]]+)\]\s*(.*)$/);
      let label = '';
      if (km) { kind = CALLOUT_ZH[km[1]] || km[1]; label = CALLOUT[kind] || km[1]; title = km[2]; body.shift(); if (title.length > 26) { body.unshift(title); title = ''; } }
      out.push(`<aside class="callout c-${kind}">${label ? `<div class="c-label">${label}${title ? '｜' + inline(title) : ''}</div>` : ''}${mdBody(body.join('\n'), math, codeBlocks)}</aside>`);
      continue;
    }
    if (t.startsWith('|') && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      para(pbuf); pbuf = [];
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim()); i++; }
      const cells = r => r.replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
      const head = cells(rows[0]);
      const bodyRows = rows.slice(2).map(cells);
      out.push(`<div class="tbl"><table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${bodyRows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^(\s*)([-*]|\d+\.)\s+/.test(line)) {
      para(pbuf); pbuf = [];
      const items = [];
      while (i < lines.length && (/^(\s*)([-*]|\d+\.)\s+/.test(lines[i]) || (lines[i].startsWith('   ') && lines[i].trim() && items.length))) {
        const lm = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (lm) items.push({ ind: lm[1].length, ord: /\d/.test(lm[2]), text: lm[3] });
        else items[items.length - 1].text += ' ' + lines[i].trim();
        i++;
      }
      out.push(renderList(items, 0, inline).html);
      continue;
    }
    pbuf.push(t); i++;
  }
  para(pbuf);
  return out.join('\n');
}

/* 詳解排版：長的一整段拆成「一行一個重點」；選項標號（B：、F 反例：）加粗並獨立成行；數學式不被切開 */
function fmtExpl(src) {
  if (!src) return '';
  return String(src).split(/\n{2,}/).map(p => {
    if (/^```|^\s*([-*+]|\d+[.)])\s|^\||^#|\$\$|\n/.test(p)) return p;
    if (p.length < 36) return p;
    const hold = []; let t = p.replace(/\$[^$]*\$/g, m => { hold.push(m); return '\u0005' + (hold.length - 1) + '\u0005'; });
    const LAB = '(?:[A-H](?:：|:| (?=[\\u4e00-\\u9fff]))|[甲乙丙丁]：|\\(\\d+\\)|[①②③④⑤⑥])';
    const hasLab = new RegExp('(?:^|[。；])\\s*' + LAB).test(t) && (t.match(new RegExp(LAB, 'g')) || []).length >= 2;
    if (hasLab) {
      t = t.replace(new RegExp('([。；])\\s*(?=' + LAB + ')', 'g'), '$1\n\n').replace(new RegExp('(^|\\n\\n)([A-H])(：|:| (?=[\\u4e00-\\u9fff]))', 'g'), '$1**$2**$3');
    } else if ((t.match(/。/g) || []).length >= 2) {
      t = t.replace(/。(?=\S)/g, '。\n\n');
    }
    return t.replace(/\u0005(\d+)\u0005/g, (m, i) => hold[+i]);
  }).join('\n\n');
}
function mdLine(s) { return md(s).replace(/^<p>/, '').replace(/<\/p>$/, ''); }
function mdBody(src, math, codeBlocks) {
  // nested render that reuses placeholders
  const html = md(src.replace(/\u0000(\d+)\u0000/g, '\u0003$1\u0003').replace(/\u0001(\d+)\u0001/g, '\u0004$1\u0004'));
  return html.replace(/\u0003(\d+)\u0003/g, (m, i) => math[+i]).replace(/\u0004(\d+)\u0004/g, (m, i) => codeBlocks[+i]);
}
function renderList(items, start, inline) {
  const base = items[start].ind; const ord = items[start].ord;
  let html = ord ? '<ol>' : '<ul>'; let i = start;
  while (i < items.length && items[i].ind >= base) {
    if (items[i].ind > base) { const sub = renderList(items, i, inline); html = html.replace(/<\/li>$/, sub.html + '</li>'); i = sub.next; continue; }
    html += `<li>${inline(items[i].text)}</li>`; i++;
  }
  html += ord ? '</ol>' : '</ul>';
  return { html, next: i };
}

/* ---------- data access ---------- */
/* 線條圖示：24 格、線寬 1.75、跟著文字顏色。只用在選單 5 區與媒體控制（見 content/DESIGN.md） */
const ICON_P = {
  today: '<rect x="3.5" y="5" width="17" height="15" rx="2.2"/><path d="M3.5 9.5h17M8 3v4M16 3v4M9 14.6l2.1 2.1 4.1-4.2"/>',
  course: '<path d="M12 6.6C10.1 5.2 7.6 4.5 4.5 4.5v13c3.1 0 5.6.7 7.5 2.1 1.9-1.4 4.4-2.1 7.5-2.1v-13c-3.1 0-5.6.7-7.5 2.1zM12 6.6v13"/>',
  practice: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  records: '<path d="M4 20h16M7.5 16.5v-5M12 16.5V7M16.5 16.5v-8"/>',
  settings: '<path d="M4 7h9.5M18.5 7H20M4 17h3.5M12.5 17H20"/><circle cx="16" cy="7" r="2.4"/><circle cx="10" cy="17" r="2.4"/>',
  star: '<path d="M12 3.9l2.5 5.1 5.6.8-4.05 3.95.95 5.6L12 16.7l-5 2.65.95-5.6L3.9 9.8l5.6-.8z"/>',
  play: '<path d="M8 5.6v12.8L18.4 12z" fill="currentColor"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
};
const ICON = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_P[name] || ''}</svg>`;
const DATA = window.CSDATA || { subjects: [], lessons: [], quiz: [], plan: [] };
const SUBJ = Object.fromEntries(DATA.subjects.map(s => [s.id, s]));
const LESSON = Object.fromEntries(DATA.lessons.map(l => [l.id, l]));
function subjOf(id) { return SUBJ[String(id).split('-')[0]]; }

/* ---------- state ---------- */
const STORE_KEY = window.SELFTEST ? 'csgrad.selftest' : 'csgrad.v1';
function defaultState() {
  return {
    v: 1,
    settings: { examDate: '2027-02-06', startDate: D.today(), dailyMinutes: 360, dailyQuestions: 30, name: '', pomo: 50, brk: 10, notifyWrong: true, retention: .9, newCards: 20 },
    answers: {}, lessons: {}, log: {}, srs: null, elo: null, wrappers: [], msgs: [], seen: {}, agentQuiz: [], agentTasks: {}, timer: { running: false, start: 0 }, wrongNotes: {}, recall: false,
  };
}
const S = {
  st: null,
  load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { raw = null; }
    S.st = Object.assign(defaultState(), raw || {});
    S.st.settings = Object.assign(defaultState().settings, S.st.settings || {});
  },
  saveNow() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S.st)); } catch (e) { /* storage unavailable */ }
    if (window.Bridge) Bridge.queueSync();
  },
  save: null,
  day(date = D.today()) {
    const L = S.st.log;
    if (!L[date]) L[date] = { min: 0, q: 0, c: 0, lessons: [], labs: [], gens: 0, checkin: null, blurt: null, feyn: [] };
    return L[date];
  },
  lesson(id) { return S.st.lessons[id] || (S.st.lessons[id] = { read: null, gate: 'none' }); },
  planDay(date = D.today()) { return D.diff(S.st.settings.startDate, date) + 1; },
  daysLeft() { return D.diff(D.today(), S.st.settings.examDate); },
  streak() {
    let n = 0, d = D.today();
    const ok = x => S.st.log[x] && (S.st.log[x].frozen || (S.st.log[x].checkin && (S.st.log[x].checkin.full || S.st.log[x].checkin.min)));
    if (!ok(d)) d = D.add(d, -1);
    while (ok(d)) { n++; d = D.add(d, -1); }
    return n;
  },
  /* 記錄作答：FSRS 排下次複習、Elo 更新章節掌握度 */
  answer(qid, ok, extra = {}) {
    const a = S.st.answers[qid] || (S.st.answers[qid] = { n: 0, c: 0, box: 0, due: null, last: null, ok: null, hcw: 0, hist: [] });
    const today = D.today();
    a.n++; if (ok) a.c++;
    a.last = today; a.ok = ok;
    a.conf = extra.conf ?? a.conf;
    a.hist = (a.hist || []).concat([{ d: today, ok, conf: extra.conf ?? null }]).slice(-8);
    if (!ok) { a.everWrong = true; if (extra.conf === 3) a.hcw = (a.hcw || 0) + 1; }
    if (ok && extra.conf === 1) a.everWrong = true;
    const c = Learn.review(Learn.keyOf(qid), Learn.gradeOf(ok, extra.conf));
    if (!qid.startsWith('gen:')) a.due = c.due;
    Learn.elo(qid, ok, extra.q);
    const L = S.day(); L.q++; if (ok) L.c++;
    if (extra.cause) a.cause = extra.cause;
    S.save();
    return a;
  },
  /* 今天該複習的題目（FSRS 到期）＋到期的計算題型（每次給一題新的） */
  dueReviews(date = D.today()) {
    return Learn.dueQuestions(date).concat(Learn.dueGens(date).map(g => Learn.freshGen(g)));
  },
};
S.save = debounce(S.saveNow, 250);
/* 關分頁、切 App、手機殺背景前，把還在等的存檔立刻寫下去 */
const flushSave = () => { try { if (S.st) S.saveNow(); } catch (e) { } };
window.addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });

/* ---------- chapter / subject stats ---------- */
function qChapter(qid) {
  if (qid.startsWith('gen:')) return null;
  const q = QBANK.get(qid); return q ? q.ch : null;
}
const QBANK = {
  map: null,
  build() { QBANK.map = new Map(); for (const q of DATA.quiz) QBANK.map.set(q.id, q); for (const q of (S.st.agentQuiz || [])) QBANK.map.set(q.id, q); },
  get(id) { if (!QBANK.map) QBANK.build(); return QBANK.map.get(id); },
  all() { if (!QBANK.map) QBANK.build(); return Array.from(QBANK.map.values()); },
};
function chapterStats(chId) {
  let n = 0, c = 0, att = 0;
  for (const q of QBANK.all()) if (q.ch === chId) { n++; const a = S.st.answers[q.id]; if (a) { att++; if (a.ok) c++; } }
  return { n, att, c, acc: att ? c / att : null };
}
function subjectStats(sid) {
  let att = 0, c = 0, read = 0, pass = 0, total = 0;
  for (const l of DATA.lessons.filter(l => l.subject === sid)) { total++; const st = S.st.lessons[l.id]; if (st && st.read) read++; if (st && (st.gate === 'pass')) pass++; }
  for (const q of QBANK.all()) if (q.subject === sid) { const a = S.st.answers[q.id]; if (a) { att++; if (a.ok) c++; } }
  return { att, c, acc: att ? c / att : null, read, pass, total };
}
