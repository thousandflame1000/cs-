window.TIMING = {
 "total": 58.85,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 1.8,
   "text": "雜湊碰撞了",
   "cap": true,
   "card": false,
   "n": 5,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "o2",
   "start": 2.1,
   "end": 3.85,
   "text": "線性探測為什麼會[結塊]",
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
   "text": "雜湊與線性探測",
   "cap": false,
   "card": true,
   "n": 7,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 7.95,
   "end": 12.15,
   "text": "k mod 11：算出要放第幾格",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 12.45,
   "end": 17.05,
   "text": "被占了，就往[下一格]找",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 17.35,
   "end": 21.75,
   "text": "一格一格往後擠",
   "cap": true,
   "card": false,
   "n": 7,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 22.25,
   "end": 25.85,
   "text": "連在一起的格子：[群聚]",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 26.15,
   "end": 31.35,
   "text": "41 落在塊裡：繞過一圈，走了 [8 格]",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 31.65,
   "end": 35.45,
   "text": "塊越長越容易被打中：[越滾越大]",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 35.95,
   "end": 39.35,
   "text": "裝越滿，找得越久",
   "cap": true,
   "card": false,
   "n": 7,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 39.65,
   "end": 43.85,
   "text": "裝到 90%，找不到平均要 [50 次]",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "d1",
   "start": 44.35,
   "end": 47.95,
   "text": "刪除不能清空，要留[墓碑]",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "d2",
   "start": 48.25,
   "end": 52.45,
   "text": "不然後面的 key 會被當成[找不到]",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 52.75,
   "end": 57.35,
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
