window.TIMING = {
 "total": 50.95,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 2.05,
   "text": "對稱矩陣把圓壓成橢圓",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "o2",
   "start": 2.35,
   "end": 3.85,
   "text": "兩條軸[互相垂直]",
   "cap": true,
   "card": false,
   "n": 7,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.25,
   "end": 7.65,
   "text": "對稱矩陣",
   "cap": false,
   "card": true,
   "n": 4,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 7.95,
   "end": 11.35,
   "text": "對稱矩陣 A 作用在單位圓上",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 11.65,
   "end": 15.65,
   "text": "大部分向量會轉向，兩個方向[不轉]",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 15.95,
   "end": 19.55,
   "text": "它們互相垂直：λ = 3、λ = 1",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 20.05,
   "end": 24.45,
   "text": "A = QΛQᵀ：轉、拉、轉回來",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 24.75,
   "end": 28.55,
   "text": "特徵值都正：xᵀAx 是一個[碗]",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 28.85,
   "end": 32.25,
   "text": "有一個負的：變成[馬鞍]",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 32.75,
   "end": 36.35,
   "text": "不對稱的矩陣也能拆：SVD",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 36.65,
   "end": 40.85,
   "text": "A = UΣVᵀ：轉、拉、再轉",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 41.15,
   "end": 44.55,
   "text": "σ 就是橢圓半軸的長度",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 44.85,
   "end": 49.45,
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
