window.TIMING = {
 "total": 50.95,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 2.05,
   "text": "壞掉一顆硬碟，資料還在",
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
   "end": 3.85,
   "text": "靠的是 [XOR]",
   "cap": true,
   "card": false,
   "n": 6,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.25,
   "end": 7.65,
   "text": "RAID 5",
   "cap": false,
   "card": true,
   "n": 5,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 7.95,
   "end": 11.55,
   "text": "四顆硬碟，資料切成一條一條",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 11.85,
   "end": 16.05,
   "text": "每一條多存一塊 P：其他三塊的 XOR",
   "cap": true,
   "card": false,
   "n": 16,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.35,
   "end": 20.15,
   "text": "P 輪流放在不同碟，寫入[不塞車]",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 20.65,
   "end": 23.45,
   "text": "第 3 顆壞了",
   "cap": true,
   "card": false,
   "n": 5,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 23.75,
   "end": 28.15,
   "text": "剩下的 XOR 起來，就是[壞掉那塊]",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 28.45,
   "end": 32.05,
   "text": "代價：n 顆只能用 [n − 1] 顆",
   "cap": true,
   "card": false,
   "n": 11,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 32.55,
   "end": 36.55,
   "text": "RAID 0：只切不備份，壞一顆[全毀]",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 36.85,
   "end": 40.45,
   "text": "RAID 1：整顆複製，容量[一半]",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 40.75,
   "end": 44.55,
   "text": "RAID 6：兩塊同位元，可以壞[兩顆]",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 44.85,
   "end": 49.45,
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
