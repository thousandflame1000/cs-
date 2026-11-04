/* palace.js — 資工所衝刺的「記憶宮殿」（依賴 space.js）
 * 中庭在原點；六個館沿六個方向往外延伸，每支短片是館裡的一間房。
 * 同一座宮殿出現在每支片的片頭（飛進這一間）與片尾（指向下一間），把 43 支片串成一條可以走的路。
 */
(function () {
  'use strict';
  const WINGS = [
    { key: '資結', name: '資結館', en: 'DATA STRUCTURES', color: '#5be7ff', deg: 0 },
    { key: '演算法', name: '演算法館', en: 'ALGORITHMS', color: '#ffc14d', deg: 60 },
    { key: '計組', name: '計組館', en: 'ORGANIZATION', color: '#ff6a5c', deg: 120 },
    { key: 'OS', name: '作業系統館', en: 'OPERATING SYSTEMS', color: '#6ee7a8', deg: 180 },
    { key: '離散', name: '離散館', en: 'DISCRETE MATH', color: '#b48cff', deg: 240 },
    { key: '線代', name: '線代館', en: 'LINEAR ALGEBRA', color: '#7aa8ff', deg: 300 },
  ];
  const VIDEOS = [
    ['01', '資結', 'Build-Heap 為何是 O(n)'], ['02', '演算法', 'Master 定理'], ['03', '計組', 'Load-Use 危障'], ['04', 'OS', 'SRTF 排程'],
    ['05', '離散', '鴿籠原理'], ['06', '線代', '特徵向量'], ['07', '資結', 'AVL 旋轉'], ['08', '演算法', 'Dijkstra 與負邊'],
    ['09', '計組', 'Cache 位址切割'], ['10', 'OS', 'LRU 頁面置換'], ['11', '離散', '排容原理'], ['12', '線代', '投影與最小平方'],
    ['13', '離散', 'Catalan 鏡射法'], ['14', '離散', 'Hasse 圖與格'], ['15', '離散', '歐幾里得演算法'], ['16', '線代', '消去法與解的結構'],
    ['17', 'OS', 'fork 會生幾個行程'], ['18', '資結', '攤銷分析'], ['19', '計組', 'Amdahl 定律'], ['20', '資結', '比較排序下界'],
    ['21', '線代', '基底與座標'], ['22', '計組', 'IEEE 754 浮點數'], ['23', 'OS', '競爭條件與 mutex'], ['24', '線代', '行列式是面積倍率'],
    ['25', '資結', '雜湊與線性探測'], ['26', '計組', '單週期 vs 多週期'], ['27', '離散', '遞迴與特徵方程式'], ['28', '資結', 'B 樹分裂'],
    ['29', 'OS', '死結四條件'], ['30', '資結', 'Union-Find 路徑壓縮'], ['31', '資結', 'BFS 與 DFS'], ['32', 'OS', '分頁位址轉換'],
    ['33', '演算法', 'Karatsuba 分治'], ['34', '計組', '暫存器重新命名'], ['35', '演算法', '動態規劃'], ['36', '離散', '平面圖與 Euler 公式'],
    ['37', '演算法', 'Huffman 貪婪法'], ['38', '線代', 'SVD'], ['39', 'OS', 'RAID 5 同位'], ['40', '演算法', '最大流最小割'],
    ['41', '計組', 'MESI 快取一致性'], ['42', '演算法', 'NP 完備歸約'], ['43', '演算法', '指示隨機變數'],
  ];
  const R0 = 4.2, DR = 1.65;
  const wingOf = (k) => WINGS.find((w) => w.key === k);
  const ROOMS = {};
  for (const w of WINGS) { w.rooms = VIDEOS.filter((v) => v[1] === w.key).map((v) => v[0]); }
  for (const [id, wk, title] of VIDEOS) { const w = wingOf(wk), i = w.rooms.indexOf(id), a = w.deg * Math.PI / 180, r = R0 + i * DR; ROOMS[id] = { id, wing: w, idx: i, title, pos: [Math.sin(a) * r, Math.cos(a) * r, 0], r }; }
  const dirOf = (w) => { const a = w.deg * Math.PI / 180; return [Math.sin(a), Math.cos(a)]; };
  /** 從中庭到某間房的路徑（世界座標點列） */
  const pathTo = (id) => { const R = ROOMS[id], [dx, dy] = dirOf(R.wing); const pts = [[0, 0, .02]]; for (let r = 1.4; r < R.r; r += .4) pts.push([dx * r, dy * r, .02]); pts.push([R.pos[0], R.pos[1], .02]); return pts; };
  /** 兩間房之間：先退回中庭再走過去（同一館就直接沿走廊） */
  const pathBetween = (a, b) => {
    const A = ROOMS[a], B = ROOMS[b];
    if (A.wing === B.wing) { const [dx, dy] = dirOf(A.wing), pts = []; const s = Math.sign(B.r - A.r) || 1; for (let r = A.r; s > 0 ? r < B.r : r > B.r; r += .4 * s) pts.push([dx * r, dy * r, .02]); pts.push([B.pos[0], B.pos[1], .02]); return pts; }
    return pathTo(a).reverse().concat(pathTo(b).slice(1));
  };

  function Palace(K, S, V) {
    const P = { WINGS, VIDEOS, ROOMS, pathTo, pathBetween };
    P.next = (id) => { const i = VIDEOS.findIndex((v) => v[0] === id); return VIDEOS[i + 1] ? VIDEOS[i + 1][0] : null; };
    /** 畫整座宮殿；o = {cur（目前房號）, hi（目前房亮度 0..1）, a, t, labels} */
    P.draw = (c, t, o = {}) => {
      const A = o.a ?? 1; if (A <= .003) return;
      c.save(); c.globalAlpha *= A;
      // 地板與中庭
      V.floor(c, { n: 18, step: 1, color: '#7aa8ff', a: .8, major: 3 });
      for (const [r, al] of [[1.1, .9], [2.0, .5], [2.9, .3]]) V.ring(c, [0, 0, .01], r, { color: '#eef3fa', a: al * .6, w: 1.6 });
      for (const w of WINGS) { const [dx, dy] = dirOf(w); V.line(c, [dx * 1.1, dy * 1.1, .01], [dx * 2.9, dy * 2.9, .01], { color: w.color, a: .5, w: 1.6 }); }
      V.core(c, [0, 0, .3], .12, .9, '#eef3fa');
      // 六個館：走廊 + 房間台座
      for (const w of WINGS) {
        const [dx, dy] = dirOf(w), rEnd = R0 + (w.rooms.length - 1) * DR + .9;
        V.line(c, [dx * 3.1, dy * 3.1, .01], [dx * rEnd, dy * rEnd, .01], { color: w.color, a: .35, w: 3 });
        w.rooms.forEach((id, i) => {
          const R = ROOMS[id], isCur = id === o.cur, past = o.cur && +id < +o.cur, lit = isCur ? (o.hi ?? 1) : 0;
          V.pillar(c, R.pos, .62, isCur ? .25 + 1.1 * lit : .22, w.color, (past ? .85 : .45) + .15 * lit, { fill: past || isCur ? .6 : .25 });
          if (isCur && lit > .01) { V.ring(c, [R.pos[0], R.pos[1], .02], .75 + .1 * Math.sin(t * 4), { color: w.color, a: lit, w: 2.4 }); V.glow(c, [R.pos[0], R.pos[1], 1.9 * lit], 1.6, .45 * lit, w.color); }
          if (o.labels !== false) V.label(c, id, [R.pos[0], R.pos[1], (isCur ? .25 + 1.1 * lit : .22) + .35], { size: .32, w: 700, color: isCur ? '#ffffff' : w.color, a: isCur ? 1 : past ? .8 : .45, minPx: 14, maxPx: 44 });
        });
        if (o.labels !== false) V.label(c, w.name, [dx * (rEnd + 1.3), dy * (rEnd + 1.3), .4], { size: .55, w: 700, color: w.color, a: .9, minPx: 18, maxPx: 54 });
      }
      c.restore();
    };
    /** 鏡頭：俯瞰全館 → 停在某間房前（看向房間、背對中庭） */
    P.overview = () => ({ pos: [0, -15, 31], tgt: [0, 1.2, 0], fov: 46 });
    P.closeup = (id, dist = 6.6, h = 3.9) => { const R = ROOMS[id], [dx, dy] = dirOf(R.wing); const back = [R.pos[0] - dx * dist * .7 + dy * dist * .55, R.pos[1] - dy * dist * .7 - dx * dist * .55]; return { pos: [back[0], back[1], h], tgt: [R.pos[0], R.pos[1], .55], fov: 44 }; };
    return P;
  }
  window.Palace = Palace;
})();
