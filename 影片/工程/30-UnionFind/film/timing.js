window.TIMING = {
 "total": 51.275,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 1.8,
   "text": "找老大，要爬好幾層",
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
   "end": 3.975,
   "text": "爬過一次，就[直接接]到老大",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.375,
   "end": 7.775,
   "text": "路徑壓縮",
   "cap": false,
   "card": true,
   "n": 4,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 8.075,
   "end": 11.675,
   "text": "每一群是一棵樹，根是代表",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 11.975,
   "end": 15.575,
   "text": "FIND：一路往上找到根",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 15.875,
   "end": 19.675,
   "text": "UNION：一個根接到另一個根下",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 20.175,
   "end": 23.775,
   "text": "矮的接到[高的]下面",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 24.075,
   "end": 28.475,
   "text": "rank 加 1，點數至少[翻倍]",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 28.775,
   "end": 32.175,
   "text": "所以樹高不超過 [lg n]",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 32.675,
   "end": 37.275,
   "text": "FIND 時，路上每個點[直接接]到根",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 37.575,
   "end": 40.975,
   "text": "下次再找：[一步]就到",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 41.275,
   "end": 44.875,
   "text": "兩招一起：幾乎是[常數]",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 45.175,
   "end": 49.775,
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
