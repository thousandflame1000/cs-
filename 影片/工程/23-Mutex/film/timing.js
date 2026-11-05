window.TIMING = {
 "total": 52.9,
 "lines": [
  {
   "id": "o1",
   "start": 0.3,
   "end": 1.8,
   "text": "兩個執行緒各 +1",
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
   "text": "結果竟然只 [+1]",
   "cap": true,
   "card": false,
   "n": 7,
   "scene": false,
   "hook": true,
   "font": "sans"
  },
  {
   "id": "T",
   "start": 4.0,
   "end": 7.4,
   "text": "競爭條件與 mutex",
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
   "end": 11.9,
   "text": "count++ 其實是 3 步：讀、加、寫",
   "cap": true,
   "card": false,
   "n": 15,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a2",
   "start": 12.2,
   "end": 16.0,
   "text": "A 讀到 0，B 也讀到 0",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "a3",
   "start": 16.3,
   "end": 20.3,
   "text": "兩個都寫回 1：[少了一次]",
   "cap": true,
   "card": false,
   "n": 10,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b1",
   "start": 20.8,
   "end": 24.6,
   "text": "結果看交錯順序：這叫[競爭條件]",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "b2",
   "start": 24.9,
   "end": 28.9,
   "text": "20 種交錯裡，只有 [2 種]是對的",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c1",
   "start": 29.4,
   "end": 32.8,
   "text": "加一把鎖：[mutex]",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c2",
   "start": 33.1,
   "end": 37.5,
   "text": "拿到鎖才能進，另一個在門外[等]",
   "cap": true,
   "card": false,
   "n": 13,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "c3",
   "start": 37.8,
   "end": 41.4,
   "text": "讀加寫一次做完 → [2]",
   "cap": true,
   "card": false,
   "n": 9,
   "scene": false,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "d1",
   "start": 41.9,
   "end": 46.5,
   "text": "臨界區要的三件事：互斥、進展、有限等待",
   "cap": true,
   "card": false,
   "n": 16,
   "scene": true,
   "hook": false,
   "font": "sans"
  },
  {
   "id": "E",
   "start": 46.8,
   "end": 51.4,
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
