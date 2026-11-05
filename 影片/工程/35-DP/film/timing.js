window.TIMING = {
 "total": 51.6,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 2.175,
   "text": "同一個小問題，算了好多次",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "o2",
   "start": 2.475,
   "end": 4.1,
   "text": "[存起來]，每個只算一次",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.5,
   "end": 7.9,
   "text": "動態規劃",
   "cap": false,
   "card": true,
   "n": 4,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 8.2,
   "end": 11.6,
   "text": "遞迴算 F5，樹長這樣",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 11.9,
   "end": 15.7,
   "text": "F3 算了 2 次，F2 算了 [3 次]",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.0,
   "end": 19.8,
   "text": "存進表格：每格[只算一次]",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 20.3,
   "end": 24.3,
   "text": "LCS：兩個字串最長的共同子序列",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 24.6,
   "end": 29.2,
   "text": "字一樣，左上加 1；不一樣，取[大的]",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 29.5,
   "end": 32.7,
   "text": "右下角就是答案：[3]",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 33.2,
   "end": 37.0,
   "text": "沿著箭頭倒走，拿到 BCB",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 37.3,
   "end": 41.3,
   "text": "路上每一段，也是小問題的最佳解",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 41.6,
   "end": 45.2,
   "text": "4 × 5 格，每格 O(1)：[O(mn)]",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 45.5,
   "end": 50.1,
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
