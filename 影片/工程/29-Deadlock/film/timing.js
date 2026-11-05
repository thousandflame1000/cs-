window.TIMING = {
 "total": 51.55,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 1.8,
   "text": "兩個行程都卡住了",
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
   "text": "因為它們[繞成一圈]在等",
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
   "text": "死結",
   "cap": false,
   "card": true,
   "n": 2,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 7.95,
   "end": 11.75,
   "text": "P1 拿著 R1，還要 R2",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 12.05,
   "end": 15.65,
   "text": "P2 拿著 R2，還要 R1",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 15.95,
   "end": 19.55,
   "text": "繞成一圈：誰都[等不到]",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 20.05,
   "end": 23.45,
   "text": "死結要四個條件[同時]成立",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 23.75,
   "end": 29.15,
   "text": "互斥、拿著再等、不能搶、繞一圈",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 29.45,
   "end": 32.65,
   "text": "少一個，就[不會死結]",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 33.15,
   "end": 37.35,
   "text": "資源編號：只能由小往大要",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 37.65,
   "end": 41.45,
   "text": "一路往上，就[繞不回來]",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 41.75,
   "end": 45.15,
   "text": "打破的是[循環等待]",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 45.45,
   "end": 50.05,
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
