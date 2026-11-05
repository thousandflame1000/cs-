window.TIMING = {
 "total": 47.6,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 1.8,
   "text": "遞迴式",
   "cap": true,
   "card": false,
   "n": 3,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "o2",
   "start": 2.1,
   "end": 3.6,
   "text": "怎麼變成[一行公式]",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.0,
   "end": 7.4,
   "text": "遞迴與特徵方程式",
   "cap": false,
   "card": true,
   "n": 8,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 7.7,
   "end": 12.3,
   "text": "aₙ = aₙ₋₁ + 2aₙ₋₂：3、3、9、15、33",
   "cap": true,
   "card": false,
   "n": 20,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 12.6,
   "end": 15.6,
   "text": "猜它長得像 rⁿ",
   "cap": true,
   "card": false,
   "n": 7,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 15.9,
   "end": 20.3,
   "text": "代進去：r² = r + 2 → r = [2 或 −1]",
   "cap": true,
   "card": false,
   "n": 16,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 20.8,
   "end": 24.6,
   "text": "兩個等比數列[疊起來]",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 24.9,
   "end": 28.7,
   "text": "用 a₀、a₁ 解出係數：2 和 1",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 29.0,
   "end": 32.6,
   "text": "aₙ = 2·2ⁿ + (−1)ⁿ",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 33.1,
   "end": 37.1,
   "text": "重根時，多乘一個 [n]",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 37.4,
   "end": 41.2,
   "text": "長期看最大的根：成長像 [2ⁿ]",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 41.5,
   "end": 46.1,
   "text": "考試這樣寫",
   "cap": false,
   "card": true,
   "n": 5,
   "scene": true,
   "hook": false,
   "font": "sans"
  }
 ]
};
window.L = Object.fromEntries(window.TIMING.lines.map((l) => [l.id, l]));  // L.o1.start / L.o1.end
