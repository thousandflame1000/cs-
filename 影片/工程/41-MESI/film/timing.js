window.TIMING = {
 "total": 51.85,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 2.05,
   "text": "兩顆核心存著同一個值",
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
   "end": 4.35,
   "text": "一個人寫，其他人的[副本作廢]",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.75,
   "end": 8.15,
   "text": "MESI",
   "cap": false,
   "card": true,
   "n": 4,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 8.45,
   "end": 12.25,
   "text": "P1 讀：只有它有，狀態 [E]",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 12.55,
   "end": 16.15,
   "text": "P2 也讀：兩邊都變 [S]",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.45,
   "end": 20.65,
   "text": "P1 要寫：先廣播作廢，P2 變 [I]",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 21.15,
   "end": 24.95,
   "text": "P1 寫完是 [M]：記憶體是舊的",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 25.25,
   "end": 29.65,
   "text": "P2 再讀：P1 交出資料、寫回記憶體",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 29.95,
   "end": 32.95,
   "text": "兩邊又回到 S",
   "cap": true,
   "card": false,
   "n": 6,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 33.45,
   "end": 37.45,
   "text": "E 狀態寫入：沒人有副本，不用廣播",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 37.75,
   "end": 41.75,
   "text": "不同變數擠在同一塊：[false sharing]",
   "cap": true,
   "card": false,
   "n": 21,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 42.05,
   "end": 45.45,
   "text": "區塊來回搬，效能掉很多",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 45.75,
   "end": 50.35,
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
