window.TIMING = {
 "total": 51.0,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 2.3,
   "text": "兩個大數相乘，可以少乘一次",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "o2",
   "start": 2.6,
   "end": 4.1,
   "text": "4 次乘法變 [3 次]",
   "cap": true,
   "card": false,
   "n": 7,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.5,
   "end": 7.9,
   "text": "Karatsuba",
   "cap": false,
   "card": true,
   "n": 9,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 8.2,
   "end": 11.8,
   "text": "12 × 34：拆成十位和個位",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 12.1,
   "end": 15.9,
   "text": "面積切四塊：要乘 [4 次]",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.2,
   "end": 20.0,
   "text": "其實中間兩塊只要[加起來]的值",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 20.5,
   "end": 24.1,
   "text": "先乘兩個角：ac、bd",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 24.4,
   "end": 28.2,
   "text": "再乘一次 (a+b)(c+d)：整塊",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 28.5,
   "end": 32.5,
   "text": "整塊減兩角，剩下就是[中間]",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 33.0,
   "end": 36.8,
   "text": "每一層只分 3 支，不是 4 支",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 37.1,
   "end": 40.9,
   "text": "10 層後：59,049 對 1,048,576",
   "cap": true,
   "card": false,
   "n": 17,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 41.2,
   "end": 44.6,
   "text": "所以是 n 的 [1.585] 次方",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 44.9,
   "end": 49.5,
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
