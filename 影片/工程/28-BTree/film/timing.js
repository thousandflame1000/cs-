window.TIMING = {
 "total": 53.3,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 1.8,
   "text": "B 樹節點滿了",
   "cap": true,
   "card": false,
   "n": 6,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "o2",
   "start": 2.1,
   "end": 3.6,
   "text": "往[上]分裂，不往下長",
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
   "text": "B 樹分裂",
   "cap": false,
   "card": true,
   "n": 4,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 7.7,
   "end": 11.3,
   "text": "每個節點最多放 2 個 key",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 11.6,
   "end": 15.8,
   "text": "放進第 3 個：中間的往上[推]",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.1,
   "end": 19.1,
   "text": "左右各分一半",
   "cap": true,
   "card": false,
   "n": 6,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 19.6,
   "end": 25.6,
   "text": "一直插入：葉子滿了就分裂",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 25.9,
   "end": 30.9,
   "text": "根也滿了：中間的變成[新根]",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 31.2,
   "end": 34.6,
   "text": "所以葉子永遠[一樣深]",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 35.1,
   "end": 39.1,
   "text": "真的 B 樹，一個節點放上千個 key",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 39.4,
   "end": 43.0,
   "text": "10 億筆資料，只要 [3 層]",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 43.3,
   "end": 46.9,
   "text": "一層一次讀硬碟：越矮越快",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 47.2,
   "end": 51.8,
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
