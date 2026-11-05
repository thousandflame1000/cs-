window.TIMING = {
 "total": 49.725,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 2.425,
   "text": "面試 100 個人，你會換幾次人",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "o2",
   "start": 2.725,
   "end": 4.225,
   "text": "平均[只有 5 次]",
   "cap": true,
   "card": false,
   "n": 6,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.625,
   "end": 8.025,
   "text": "雇用問題",
   "cap": false,
   "card": true,
   "n": 4,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 8.325,
   "end": 12.125,
   "text": "遇到比現在更好的，就換人",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 12.425,
   "end": 16.025,
   "text": "最差：一個比一個好，換 [n 次]",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.325,
   "end": 19.125,
   "text": "如果順序是隨機的呢",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 19.625,
   "end": 24.025,
   "text": "第 i 個被雇 ⇔ 他是前 i 個裡最好的",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 24.325,
   "end": 27.325,
   "text": "機率是 [1/i]",
   "cap": true,
   "card": false,
   "n": 6,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 27.625,
   "end": 31.425,
   "text": "用指示變數：雇了記 1，沒雇記 0",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 31.925,
   "end": 35.725,
   "text": "期望值直接相加，不用獨立",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 36.025,
   "end": 39.825,
   "text": "1 + 1/2 + … + 1/n ≈ [ln n]",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 40.125,
   "end": 43.325,
   "text": "100 個人，平均換 5.2 次",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 43.625,
   "end": 48.225,
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
