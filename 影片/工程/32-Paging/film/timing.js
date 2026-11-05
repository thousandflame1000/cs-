window.TIMING = {
 "total": 51.2,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 2.3,
   "text": "程式給的位址不是真的位址",
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
   "text": "[頁號]查表，[位移]照抄",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.5,
   "end": 7.9,
   "text": "分頁",
   "cap": false,
   "card": true,
   "n": 2,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 8.2,
   "end": 11.6,
   "text": "記憶體切成一樣大的頁框",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 11.9,
   "end": 15.7,
   "text": "位址拆兩半：頁號、頁內位移",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.0,
   "end": 20.2,
   "text": "頁號查頁表，換成[頁框號]",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 20.7,
   "end": 24.9,
   "text": "32 位元、4 KB 一頁：頁表要 [4 MB]",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 25.2,
   "end": 28.8,
   "text": "切兩層：外層剛好[一頁]",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 29.1,
   "end": 32.9,
   "text": "只建用到的內層：[12 KB]",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 33.4,
   "end": 37.2,
   "text": "代價：每次多讀一次記憶體",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 37.5,
   "end": 40.9,
   "text": "所以前面放一個 [TLB]",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 41.2,
   "end": 44.8,
   "text": "命中就[跳過]頁表",
   "cap": true,
   "card": false,
   "n": 7,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 45.1,
   "end": 49.7,
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
