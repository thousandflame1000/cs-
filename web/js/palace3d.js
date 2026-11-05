/* 資工所衝刺站 — 記憶宮殿：用金幣自己蓋（像 Minecraft）
   - 地上分六館（顏色＝科目，跟影片裡的記憶宮殿同一個方位），中間是廣場
   - 蓋：選方塊點地面或方塊的面；拆：退一半金幣；看：點紀念碑就回到那一章
   - 讀完一章（或拿到星）就得到那章的紀念碑，放在哪裡由你決定——這就是「位置記憶法」
   資料：S.st.palace = { b: {"x,y,z": 材質}, m: {"x,y,z": 章節id}, ts } */
'use strict';

const Palace3D = (() => {
  const MATS = [
    { id: 'stone', name: '石', color: '#c9ced6', cost: 10 },
    { id: 'wood', name: '木', color: '#b9824f', cost: 10 },
    { id: 'brick', name: '磚', color: '#c4664e', cost: 12 },
    { id: 'leaf', name: '葉', color: '#5aa864', cost: 10 },
    { id: 'glass', name: '玻璃', color: '#bfe6ff', cost: 15, glass: true },
    { id: 'lamp', name: '燈', color: '#ffe8a3', cost: 25, glow: true },
    { id: 'gold', name: '金', color: '#f2b632', cost: 50, glow: true },
  ];
  const WING = { ds: 0, al: 60, co: 120, os: 180, dm: 240, la: 300 }, R0 = 11, ZW = 4;   // 館的方位（度）、離中心距離、半寬
  let st = null;
  const data = () => { const p = S.st.palace || (S.st.palace = { b: {}, m: {}, ts: 0, gift: 0 }); if (!p.gift) { p.gift = 1; p.free = 40; } return p; };
  const key = (x, y, z) => `${x},${y},${z}`;
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888';
  const earned = () => DATA.lessons.filter(l => { const ls = S.st.lessons[l.id] || {}; return ls.read || (S.st.stars || {})[l.id] > 0 || ['pass', 'self'].includes(ls.gate); });
  const placedMons = () => new Set(Object.values(data().m));

  function label(text, color = '#18202c', bg = 'rgba(255,255,255,.88)') {
    const c = document.createElement('canvas'), g = c.getContext('2d'), fs = 44; g.font = `700 ${fs}px "Noto Sans TC", sans-serif`;
    const w = Math.ceil(g.measureText(text).width) + 36; c.width = w; c.height = fs + 26; g.font = `700 ${fs}px "Noto Sans TC", sans-serif`;
    g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, w, c.height, 14); g.fill(); g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, 18, c.height / 2 + 2);
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.scale.set(w / c.height * .7, .7, 1); sp.renderOrder = 10; return sp;
  }

  function mount(host) {
    stop();
    const W0 = host.clientWidth, H0 = host.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(W0, H0); host.appendChild(renderer.domElement);
    const dark = matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.dataset.theme !== 'light';
    const scene = new THREE.Scene(); scene.background = new THREE.Color(dark ? '#141a26' : '#dfe9f7'); scene.fog = new THREE.Fog(scene.background, 38, 80);
    const cam = new THREE.PerspectiveCamera(45, W0 / H0, .1, 200); cam.position.set(16, 20, 24);
    const ctl = new THREE.OrbitControls(cam, renderer.domElement); ctl.target.set(0, 0, 0); ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI * .47; ctl.minDistance = 6; ctl.maxDistance = 60;
    scene.add(new THREE.HemisphereLight('#ffffff', dark ? '#202838' : '#b9c3d2', .85));
    const sun = new THREE.DirectionalLight('#ffffff', .75); sun.position.set(12, 24, 8); scene.add(sun);
    // 地面：中央廣場＋六館
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), new THREE.MeshLambertMaterial({ color: dark ? '#1e2635' : '#eef2f7' })); ground.rotation.x = -Math.PI / 2; ground.name = 'ground'; scene.add(ground);
    const grid = new THREE.GridHelper(64, 64, dark ? '#2c3648' : '#d3dae5', dark ? '#262f40' : '#dde3ec'); grid.position.y = .002; scene.add(grid);
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), new THREE.MeshLambertMaterial({ color: dark ? '#2a3446' : '#ffffff' })); plaza.rotation.x = -Math.PI / 2; plaza.position.y = .004; scene.add(plaza);
    for (const s of DATA.subjects) {
      const a = (WING[s.id] || 0) * Math.PI / 180, cx = Math.round(Math.sin(a) * R0), cz = Math.round(-Math.cos(a) * R0), col = css('--s-' + s.id);
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(ZW * 2 + 1, ZW * 2 + 1), new THREE.MeshLambertMaterial({ color: col, transparent: true, opacity: .18 })); pad.rotation.x = -Math.PI / 2; pad.position.set(cx, .006, cz); scene.add(pad);
      const lb = label(s.name, col); lb.position.set(cx, 3.2, cz); scene.add(lb);
    }
    const geo = new THREE.BoxGeometry(1, 1, 1), mats = {};
    MATS.forEach(m => { mats[m.id] = new THREE.MeshLambertMaterial({ color: m.color, transparent: !!m.glass, opacity: m.glass ? .45 : 1, emissive: m.glow ? m.color : '#000000', emissiveIntensity: m.glow ? .35 : 0 }); });
    const edges = new THREE.EdgesGeometry(geo), edgeMat = new THREE.LineBasicMaterial({ color: '#000000', transparent: true, opacity: .12 });
    const objs = new Map();   // key → mesh
    const addMesh = (k, mid, anim) => {
      const [x, y, z] = k.split(',').map(Number), m = new THREE.Mesh(geo, mats[mid] || mats.stone); m.position.set(x, y + .5, z); m.userData = { k }; m.add(new THREE.LineSegments(edges, edgeMat));
      scene.add(m); objs.set(k, m); if (anim) { m.scale.setScalar(.2); m.userData.pop = performance.now(); }
    };
    const monMesh = (k, lid, anim) => {
      const [x, y, z] = k.split(',').map(Number), l = LESSON[lid]; if (!l) return; const col = css('--s-' + l.subject);
      const g = new THREE.Group(); g.position.set(x, y, z); g.userData = { k, mon: lid };
      const base = new THREE.Mesh(new THREE.BoxGeometry(.9, .3, .9), new THREE.MeshLambertMaterial({ color: '#ffffff' })); base.position.y = .15; g.add(base);
      const col1 = new THREE.Mesh(new THREE.BoxGeometry(.5, 1.5, .5), new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: .25 })); col1.position.y = 1.05; g.add(col1);
      const top = new THREE.Mesh(new THREE.OctahedronGeometry(.32), new THREE.MeshLambertMaterial({ color: '#f2b632', emissive: '#f2b632', emissiveIntensity: .5 })); top.position.y = 2.1; top.userData.spin = 1; g.add(top);
      const lb = label(l.title.split(/[：（、]/)[0].slice(0, 10), '#18202c'); lb.position.y = 2.8; g.add(lb);
      g.children.forEach(c => { c.userData.k = k; c.userData.mon = lid; });
      scene.add(g); objs.set(k, g); if (anim) { g.scale.setScalar(.2); g.userData.pop = performance.now(); }
    };
    const P = data(); Object.entries(P.b).forEach(([k, mid]) => addMesh(k, mid)); Object.entries(P.m).forEach(([k, lid]) => monMesh(k, lid));
    // 預覽方塊
    const ghost = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: css('--accent'), transparent: true, opacity: .28, depthWrite: false })); ghost.visible = false; scene.add(ghost);
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
    st = { renderer, scene, cam, ctl, ghost, objs, raf: 0, tool: 'build', mat: 'stone', mon: null, host, mats };
    const pick = e => {
      const r = renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, cam);
      const hits = ray.intersectObjects([ground, ...[...objs.values()]], true); return hits[0] || null;
    };
    const cellFor = h => {
      if (!h) return null; const o = h.object;
      if (o === ground) return [Math.round(h.point.x), 0, Math.round(h.point.z)];
      const k = o.userData.k; if (!k) return null; const [x, y, z] = k.split(',').map(Number);
      if (o.userData.mon) return null; const n = h.face.normal; return [x + Math.round(n.x), y + Math.round(n.y), z + Math.round(n.z)];
    };
    renderer.domElement.addEventListener('pointermove', e => {
      if (st.tool === 'view') { ghost.visible = false; const h = pick(e); renderer.domElement.style.cursor = h && h.object.userData.mon ? 'pointer' : 'grab'; return; }
      const h = pick(e), c = st.tool === 'erase' ? (h && h.object.userData.k ? h.object.userData.k.split(',').map(Number) : null) : cellFor(h);
      if (!c || c[1] < 0 || c[1] > 30 || Math.abs(c[0]) > 31 || Math.abs(c[2]) > 31) { ghost.visible = false; return; }
      ghost.visible = true; ghost.position.set(c[0], c[1] + .5, c[2]); ghost.material.color.set(st.tool === 'erase' ? css('--bad') : css('--accent')); renderer.domElement.style.cursor = 'crosshair';
    });
    let down = null; renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    renderer.domElement.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6 || e.button !== 0) return; down = null; act(pick(e), cellFor);
    });
    const loop = now => {
      st.raf = requestAnimationFrame(loop); ctl.update();
      objs.forEach(o => { if (o.userData.pop) { const k = Math.min(1, (now - o.userData.pop) / 260); o.scale.setScalar(.2 + .8 * (1 + 1.7 * Math.pow(k - 1, 3) + .7 * Math.pow(k - 1, 2))); if (k >= 1) { o.scale.setScalar(1); delete o.userData.pop; } } o.children.forEach(c => { if (c.userData.spin) c.rotation.y = now / 600; }); });
      renderer.render(scene, cam);
    };
    st.raf = requestAnimationFrame(loop);
    st.ro = new ResizeObserver(() => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }); st.ro.observe(host);
    st.addMesh = addMesh; st.monMesh = monMesh;
  }

  function act(h, cellFor) {
    const P = data();
    if (st.tool === 'view') { const lid = h && h.object.userData.mon; if (lid) location.hash = '#' + lid; return; }
    if (st.tool === 'erase') {
      const k = h && h.object.userData.k; if (!k) return; const o = st.objs.get(k); if (!o) return;
      st.scene.remove(o); st.objs.delete(k);
      if (P.m[k]) { delete P.m[k]; toast('紀念碑收回背包', 'good'); }
      else { const m = MATS.find(x => x.id === P.b[k]) || MATS[0]; delete P.b[k]; const back = Math.floor(m.cost / 2); if (back) { const r = Rewards.st(); r.bonus = (r.bonus || 0) + back; r.coin0 = Rewards.coins(); Rewards.paintCoin(r.coin0); } }
      P.ts = Date.now(); S.save(); Rewards.chime('pop'); paintBar(); return;
    }
    const c = cellFor(h); if (!c || c[1] < 0 || c[1] > 30) return; const k = key(...c); if (P.b[k] || P.m[k]) return;
    if (st.tool === 'mon') {
      if (!st.mon) { toast('先在下面選一座紀念碑', ''); return; }
      P.m[k] = st.mon; st.monMesh(k, st.mon, true); st.mon = null; P.ts = Date.now(); S.save(); Rewards.chime('big'); paintBar(); return;
    }
    const m = MATS.find(x => x.id === st.mat), free = P.free > 0;
    if (!free && Rewards.coins() < m.cost) { toast(`還差 ${m.cost - Rewards.coins()} 金幣：去答幾題就有`, 'bad'); return; }
    if (free) P.free--; else Rewards.spendCoins(m.cost);
    P.b[k] = m.id; st.addMesh(k, m.id, true); P.ts = Date.now(); S.save(); Rewards.chime('pop'); paintBar();
  }

  function paintBar() {
    const bar = $('#pzBar'); if (!bar || !st) return; const P = data(), mons = earned().filter(l => !placedMons().has(l.id));
    bar.innerHTML = `<div class="pz-tools">${[['build', '蓋'], ['erase', '拆'], ['mon', `紀念碑 ${mons.length}`], ['view', '逛']].map(([t, n]) => `<button type="button" class="chip${st.tool === t ? ' on' : ''}" data-pt="${t}">${n}</button>`).join('')}<span class="pz-free">${P.free > 0 ? `免費方塊 ${P.free}` : ''}</span></div>
      ${st.tool === 'build' ? `<div class="pz-mats">${MATS.map((m, i) => `<button type="button" class="pz-mat${st.mat === m.id ? ' on' : ''}" data-pm="${m.id}" title="${m.name}"><i style="background:${m.color}"></i><span>${m.name}</span><small>${COIN}${m.cost}</small><kbd>${i + 1}</kbd></button>`).join('')}</div>` : ''}
      ${st.tool === 'mon' ? (mons.length ? `<div class="pz-mons">${mons.map(l => `<button type="button" class="chip${st.mon === l.id ? ' on' : ''}" data-pmon="${l.id}" style="--sc:var(--s-${l.subject})"><span class="sdot"></span>${esc(l.title.split(/[：（、]/)[0])}</button>`).join('')}</div>` : '<p class="muted small">讀完一章或拿到星，就會得到那章的紀念碑。</p>') : ''}
      ${st.tool === 'view' ? '<p class="muted small">點紀念碑回到那一章。</p>' : ''}`;
    $$('[data-pt]', bar).forEach(b => b.onclick = () => { st.tool = b.dataset.pt; st.ghost.visible = false; paintBar(); });
    $$('[data-pm]', bar).forEach(b => b.onclick = () => { st.mat = b.dataset.pm; paintBar(); });
    $$('[data-pmon]', bar).forEach(b => b.onclick = () => { st.mon = b.dataset.pmon; paintBar(); });
  }

  function view() {
    const m = main();
    if (typeof THREE === 'undefined') { m.innerHTML = '<header class="page-head"><h1>記憶宮殿</h1></header><p class="muted">這個瀏覽器載不到 3D 引擎。</p>'; return; }
    m.innerHTML = `<div class="pz"><div class="pz-stage" id="pzStage"></div><div class="pz-bar" id="pzBar"></div></div>`;
    mount($('#pzStage')); paintBar();
  }
  function stop() { if (!st) return; cancelAnimationFrame(st.raf); st.ro && st.ro.disconnect(); st.renderer.dispose(); st.renderer.domElement.remove(); st = null; }
  document.addEventListener('keydown', e => {
    if (!st || /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) return;
    if (/^[1-7]$/.test(e.key)) { st.tool = 'build'; st.mat = MATS[+e.key - 1].id; paintBar(); }
    else if (e.key === 'e' || e.key === 'E') { st.tool = st.tool === 'erase' ? 'build' : 'erase'; paintBar(); }
    else if (e.key === 'Escape') { st.tool = 'view'; paintBar(); }
  });
  return { view, stop, MATS, earned };
})();
