window.TIMING = {
 "total": 49.125,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 1.8,
   "text": "單週期 CPU",
   "cap": true,
   "card": false,
   "n": 6,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "o2",
   "start": 2.1,
   "end": 3.725,
   "text": "為什麼全被 [lw] 拖慢",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.125,
   "end": 7.525,
   "text": "單週期 vs 多週期",
   "cap": false,
   "card": true,
   "n": 8,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a1",
   "start": 7.825,
   "end": 12.025,
   "text": "lw 要走完 5 站：800 ps",
   "cap": true,
   "card": false,
   "n": 12,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 12.325,
   "end": 16.325,
   "text": "時脈只能有一種長度：全部 [800]",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.625,
   "end": 20.625,
   "text": "beq 只要 500，剩下 300 [空等]",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 21.125,
   "end": 25.325,
   "text": "多週期：時脈縮成最慢的一站 200",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 25.625,
   "end": 29.825,
   "text": "lw 5 拍、add 4 拍、beq 3 拍",
   "cap": true,
   "card": false,
   "n": 14,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b3",
   "start": 30.125,
   "end": 33.525,
   "text": "短的指令[早下班]",
   "cap": true,
   "card": false,
   "n": 7,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 34.025,
   "end": 38.425,
   "text": "管線：每一拍都送進一條新指令",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 38.725,
   "end": 42.725,
   "text": "同樣 5 條：4000 ps → [1800 ps]",
   "cap": true,
   "card": false,
   "n": 17,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 43.025,
   "end": 47.625,
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
