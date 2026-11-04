/* 資工所衝刺站 — 迷你 QR code 產生器（位元組模式、錯誤更正 L、版本 1～5，最多 106 字元）
   只用來把「手機打開的網址」變成可以掃的圖；不需要網路、不用外部套件。 */
'use strict';
const QR = (() => {
  const DATA = [0, 19, 34, 55, 80, 108], EC = [0, 7, 10, 15, 20, 26]; // 版本 1～5、L 級：單一區塊
  const mul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 255; };
  const divisor = deg => { const r = new Array(deg - 1).fill(0).concat([1]); let root = 1; for (let i = 0; i < deg; i++) { for (let j = 0; j < r.length; j++) { r[j] = mul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = mul(root, 2); } return r; };
  const remainder = (data, div) => { const r = div.map(() => 0); for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= mul(c, f); }); } return r; };
  const MASK = [
    (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
    (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0,
  ];

  function encode(text) {
    const bytes = [...new TextEncoder().encode(String(text))];
    let ver = 1; while (ver <= 5 && 12 + 8 * bytes.length > DATA[ver] * 8) ver++;
    if (ver > 5) throw new Error('網址太長');
    // 位元串：模式 0100 + 長度 8 位 + 資料 + 結尾 + 補齊
    const bits = []; const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
    put(4, 4); put(bytes.length, 8); bytes.forEach(b => put(b, 8));
    const cap = DATA[ver] * 8; put(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
    const cw = []; for (let i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    for (let p = 0; cw.length < DATA[ver]; p ^= 1) cw.push(p ? 0x11 : 0xec);
    const all = cw.concat(remainder(cw, divisor(EC[ver])));

    const n = 17 + 4 * ver, M = [], F = [];
    for (let y = 0; y < n; y++) { M.push(new Array(n).fill(false)); F.push(new Array(n).fill(false)); }
    const fn = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
    for (let i = 0; i < n; i++) { fn(6, i, i % 2 === 0); fn(i, 6, i % 2 === 0); } // 時序線
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && x < n && y >= 0 && y < n) fn(x, y, d !== 2 && d !== 4); } };
    finder(3, 3); finder(n - 4, 3); finder(3, n - 4);
    if (ver >= 2) { const c = 4 * ver + 10; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) fn(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }
    const format = (mask, draw) => {
      const data = (1 << 3) | mask; let rem = data; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const b = ((data << 10) | rem) ^ 0x5412, g = i => ((b >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) draw(8, i, g(i));
      draw(8, 7, g(6)); draw(8, 8, g(7)); draw(7, 8, g(8));
      for (let i = 9; i < 15; i++) draw(14 - i, 8, g(i));
      for (let i = 0; i < 8; i++) draw(n - 1 - i, 8, g(i));
      for (let i = 8; i < 15; i++) draw(8, n - 15 + i, g(i));
      draw(8, n - 8, true);
    };
    format(0, fn); // 先占位
    // 放資料：從右下角開始，兩欄一組蛇行，跳過第 6 欄
    let k = 0;
    for (let right = n - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let v = 0; v < n; v++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? n - 1 - v : v;
        if (!F[y][x] && k < all.length * 8) { M[y][x] = ((all[k >>> 3] >>> (7 - (k & 7))) & 1) === 1; k++; }
      }
    }
    // 挑罰分最低的遮罩
    let best = null;
    for (let m = 0; m < 8; m++) {
      const G = M.map(r => r.slice());
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!F[y][x] && MASK[m](x, y)) G[y][x] = !G[y][x];
      format(m, (x, y, d) => { G[y][x] = d; });
      const p = penalty(G, n); if (!best || p < best.p) best = { p, G };
    }
    return best.G;
  }
  function penalty(G, n) {
    let p = 0, dark = 0;
    const line = get => { let run = 1, s = 0; const seq = []; for (let i = 0; i < n; i++) { const v = get(i); seq.push(v ? 1 : 0); if (i && v === get(i - 1)) { run++; if (run === 5) s += 3; else if (run > 5) s++; } else run = 1; }
      const t = seq.join(''); s += 40 * ((t.match(/(?=10111010000)/g) || []).length + (t.match(/(?=00001011101)/g) || []).length); return s; };
    for (let y = 0; y < n; y++) p += line(x => G[y][x]);
    for (let x = 0; x < n; x++) p += line(y => G[y][x]);
    for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) { const c = G[y][x]; if (c === G[y][x + 1] && c === G[y + 1][x] && c === G[y + 1][x + 1]) p += 3; }
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (G[y][x]) dark++;
    return p + 10 * Math.max(0, Math.ceil(Math.abs(dark * 20 - n * n * 10) / (n * n)) - 1);
  }
  function svg(text, px = 200) {
    const G = encode(text), n = G.length, q = 4, W = n + 2 * q; let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (G[y][x]) d += `M${x + q},${y + q}h1v1h-1z`;
    return `<svg class="qr" viewBox="0 0 ${W} ${W}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${W}" height="${W}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }
  return { encode, svg };
})();
if (typeof module !== 'undefined') module.exports = QR;
