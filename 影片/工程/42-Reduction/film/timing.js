window.TIMING = {
 "total": 49.875,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 2.05,
   "text": "要證明一個新問題很難",
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
   "end": 3.975,
   "text": "把[已知的難題]變成它",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.375,
   "end": 7.775,
   "text": "歸約",
   "cap": false,
   "card": true,
   "n": 2,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 8.075,
   "end": 12.475,
   "text": "Y 歸約到 X：Y 的題目能翻譯成 X 的題目",
   "cap": true,
   "card": false,
   "n": 17,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 12.775,
   "end": 15.975,
   "text": "會解 X，就會解 Y",
   "cap": true,
   "card": false,
   "n": 7,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.275,
   "end": 19.675,
   "text": "所以 X 至少跟 Y 一樣[難]",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 20.175,
   "end": 24.175,
   "text": "已知 3-SAT 很難：翻譯成頂點覆蓋",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 24.475,
   "end": 27.675,
   "text": "頂點覆蓋就是 [NP-hard]",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 27.975,
   "end": 31.575,
   "text": "答案又好驗證：[NP 完備]",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 32.075,
   "end": 35.875,
   "text": "反過來：頂點覆蓋翻譯成 SAT",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 36.175,
   "end": 39.775,
   "text": "只說明它不比 SAT 難：[沒用]",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 40.075,
   "end": 43.475,
   "text": "證明變難：已知難題 → 新問題",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 43.775,
   "end": 48.375,
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
