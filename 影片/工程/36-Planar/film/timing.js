window.TIMING = {
 "total": 51.725,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 2.425,
   "text": "這 5 個點，畫在紙上一定會交叉",
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
   "text": "數[邊]就能證明",
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
   "text": "平面圖",
   "cap": false,
   "card": true,
   "n": 3,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 8.325,
   "end": 11.925,
   "text": "平面圖：邊可以不交叉地畫平",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 12.225,
   "end": 16.025,
   "text": "歐拉公式：點 − 邊 + 面 = [2]",
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
   "end": 20.725,
   "text": "每個面至少 3 條邊，每條邊碰 2 個面",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 21.225,
   "end": 25.025,
   "text": "代進去：邊數最多 [3v − 6]",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 25.325,
   "end": 29.125,
   "text": "K5 有 10 條邊，上限只有 9",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 29.425,
   "end": 32.425,
   "text": "所以 K5 [畫不平]",
   "cap": true,
   "card": false,
   "n": 7,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 32.925,
   "end": 36.925,
   "text": "K3,3：9 條邊，上限 12，擋不住",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 37.225,
   "end": 41.225,
   "text": "二分圖沒有三角形：每面至少 [4] 條",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 41.525,
   "end": 45.325,
   "text": "上限變 2v − 4 = 8，K3,3 也[不行]",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 45.625,
   "end": 50.225,
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
