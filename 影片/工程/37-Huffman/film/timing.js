window.TIMING = {
 "total": 50.8,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 2.175,
   "text": "常出現的字，給它最短的碼",
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
   "text": "每次合併[最少的兩個]",
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
   "text": "Huffman 編碼",
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
   "text": "六個字，柱子高度是出現次數",
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
   "text": "最矮的兩根先合併：5 + 9 = 14",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.2,
   "end": 20.8,
   "text": "一直合併最小的兩個，直到剩[一棵樹]",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 21.3,
   "end": 24.7,
   "text": "往左是 0，往右是 1",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 25.0,
   "end": 28.4,
   "text": "a 只要 [1 位]，f 要 4 位",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 28.7,
   "end": 32.5,
   "text": "沒有碼是別人的開頭：[前綴碼]",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 33.0,
   "end": 36.8,
   "text": "總長 224，固定 3 位要 300",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 37.1,
   "end": 40.9,
   "text": "把 a 換到最深處：反而[更長]",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 41.2,
   "end": 44.4,
   "text": "所以貪婪合併就是[最佳]",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 44.7,
   "end": 49.3,
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
