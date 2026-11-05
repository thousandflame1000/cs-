window.TIMING = {
 "total": 49.825,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 1.925,
   "text": "名字撞到，不一定要等",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "o2",
   "start": 2.225,
   "end": 3.725,
   "text": "[換個名字]，就能先做",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.125,
   "end": 7.525,
   "text": "暫存器換名",
   "cap": false,
   "card": true,
   "n": 5,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 7.825,
   "end": 11.425,
   "text": "四條指令，DIV 要算很久",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 11.725,
   "end": 15.525,
   "text": "ADD 要用 DIV 的 F0：[真相依]",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 15.825,
   "end": 19.625,
   "text": "其他兩條線，只是[名字撞到]",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 20.125,
   "end": 24.325,
   "text": "換名：每次寫入都給新的暫存器",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 24.625,
   "end": 27.825,
   "text": "撞名的線全部[消失]",
   "cap": true,
   "card": false,
   "n": 8,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 28.125,
   "end": 31.325,
   "text": "只剩真相依要等",
   "cap": true,
   "card": false,
   "n": 7,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 31.825,
   "end": 35.825,
   "text": "DIV 還在算，SUB、MUL [先做]",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 36.125,
   "end": 39.725,
   "text": "總時間從 18 縮到 [12] 週期",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 40.025,
   "end": 43.425,
   "text": "Tomasulo：硬體自動換名",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 43.725,
   "end": 48.325,
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
