window.TIMING = {
 "total": 54.0,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 1.8,
   "text": "−6.25 存進電腦",
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
   "end": 3.6,
   "text": "長什麼[樣子]",
   "cap": true,
   "card": false,
   "n": 5,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.0,
   "end": 7.4,
   "text": "IEEE 754 浮點數",
   "cap": false,
   "card": true,
   "n": 10,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 7.7,
   "end": 11.7,
   "text": "32 格：1 符號、8 指數、23 尾數",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 12.0,
   "end": 15.8,
   "text": "6.25 = 4 + 2 + 0.25 = [110.01]",
   "cap": true,
   "card": false,
   "n": 17,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.1,
   "end": 19.9,
   "text": "小數點左移 2 格：1.1001 × 2²",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a4",
   "start": 20.2,
   "end": 23.6,
   "text": "指數存 2 + 127 = [129]",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a5",
   "start": 23.9,
   "end": 27.7,
   "text": "尾數只存點後面：1001，其餘補 0",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 28.2,
   "end": 32.0,
   "text": "數線上，離 0 越遠格子越[稀]",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 32.3,
   "end": 35.9,
   "text": "每過一個 2 的次方，間距[加倍]",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 36.2,
   "end": 40.0,
   "text": "0.1 落在兩格中間：[存不準]",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 40.5,
   "end": 43.9,
   "text": "指數全 0：0 和次正規數",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 44.2,
   "end": 47.6,
   "text": "指數全 1：[∞] 和 NaN",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 47.9,
   "end": 52.5,
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
