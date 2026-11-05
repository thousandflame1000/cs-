window.TIMING = {
 "total": 51.35,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 1.8,
   "text": "行列式",
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
   "end": 3.85,
   "text": "其實是面積的[放大倍率]",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.25,
   "end": 7.65,
   "text": "行列式",
   "cap": false,
   "card": true,
   "n": 3,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 7.95,
   "end": 11.15,
   "text": "單位正方形：面積 1",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 11.45,
   "end": 15.25,
   "text": "乘上 A：變成平行四邊形",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 15.55,
   "end": 19.15,
   "text": "面積變 [5]：det A = 5",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a4",
   "start": 19.45,
   "end": 22.85,
   "text": "每一格都放大 5 倍",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 23.35,
   "end": 27.95,
   "text": "det 小於 0：面積照算，但[翻面]了",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 28.25,
   "end": 32.45,
   "text": "det = 0：壓成一條線，[沒有反矩陣]",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 32.95,
   "end": 36.55,
   "text": "3D：單位立方體變斜方體",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 36.85,
   "end": 40.05,
   "text": "體積倍率 = det",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "d1",
   "start": 40.55,
   "end": 44.95,
   "text": "先放大 2 倍，再放大 3 倍 → [6 倍]",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 45.25,
   "end": 49.85,
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
