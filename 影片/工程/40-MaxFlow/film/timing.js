window.TIMING = {
 "total": 50.8,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 2.175,
   "text": "水管網路，最多能送多少水",
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
   "text": "答案是[最細的那一刀]",
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
   "text": "最大流",
   "cap": false,
   "card": true,
   "n": 3,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 8.2,
   "end": 11.8,
   "text": "管子粗細是容量，從 s 送到 t",
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
   "end": 16.1,
   "text": "找一條還有空間的路，灌滿它",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.4,
   "end": 20.6,
   "text": "再找兩條：一共送了 [6]",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 21.1,
   "end": 25.3,
   "text": "殘餘網路裡，s 走得到的點圈起來",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 25.6,
   "end": 28.8,
   "text": "跨出去的管子[全滿]",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 29.1,
   "end": 32.7,
   "text": "這一刀切掉的，剛好就是 6",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 33.2,
   "end": 37.2,
   "text": "換別的刀：9、9，都比較大",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 37.5,
   "end": 40.7,
   "text": "最大流 = [最小割]",
   "cap": true,
   "card": false,
   "n": 7,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 41.0,
   "end": 44.4,
   "text": "用 BFS 找路：O(VE²)",
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
