window.TIMING = {
 "total": 51.35,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 1.8,
   "text": "同一張圖，兩種走法",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "o2",
   "start": 2.1,
   "end": 3.85,
   "text": "一個像[水波]，一個[走到底]",
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
   "text": "BFS 與 DFS",
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
   "end": 11.95,
   "text": "BFS：從 s 一圈一圈往外",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 12.25,
   "end": 15.85,
   "text": "第一次碰到，就是[最短距離]",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.15,
   "end": 19.95,
   "text": "用佇列排隊：先進先出",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 20.45,
   "end": 24.45,
   "text": "DFS：一條路走到底",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 24.75,
   "end": 28.55,
   "text": "走不下去，從[堆疊]退回",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 28.85,
   "end": 32.45,
   "text": "每個點有進來、離開兩個時間",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 32.95,
   "end": 36.95,
   "text": "有向圖：走到堆疊裡的點",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 37.25,
   "end": 40.65,
   "text": "這條是[後向邊]：有環",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 40.95,
   "end": 44.95,
   "text": "沒有後向邊，就能[拓撲排序]",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
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
