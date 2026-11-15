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
  const WING = { ds: 0, al: 60, co: 120, os: 180, dm: 240, la: 300, en: 330 }, R0 = 11, ZW = 4;   // 館的方位（度）、離中心距離、半寬
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
    st = { renderer, scene, cam, ctl, ghost, objs, raf: 0, tool: 'build', mat: 'stone', mon: null, host, mats, mode: 'fp' };
    // ── 第一人稱：站在廣場中央，面向資結館
    const me = st.me = { x: 0, y: 0, z: 2.5, yaw: 0, pitch: -.32, vy: 0, ground: true, keys: {}, joy: [0, 0] };
    const cross = document.createElement('div'); cross.className = 'pz-cross'; host.appendChild(cross);
    const hint = document.createElement('div'); hint.className = 'pz-hint'; host.appendChild(hint); st.hint = hint;
    const touch = matchMedia('(pointer: coarse)').matches; st.touch = touch;
    hint.innerHTML = touch ? '<b>走進宮殿</b><span>左下搖桿走・拖曳看・點一下放・長按拆</span>' : '<b>點一下走進宮殿</b><span><kbd>W A S D</kbd> 走　<kbd>空白</kbd> 跳　左鍵放　右鍵拆　<kbd>Esc</kbd> 離開</span>';
    if (touch) { const j = document.createElement('div'); j.className = 'pz-joy'; j.innerHTML = '<i></i>'; host.appendChild(j); st.joy = j; const jb = document.createElement('button'); jb.type = 'button'; jb.className = 'pz-jump'; jb.textContent = '跳'; host.appendChild(jb); jb.onpointerdown = e => { e.stopPropagation(); if (me.ground) { me.vy = 7.2; me.ground = false; } };
      let jid = null, j0 = null; j.addEventListener('pointerdown', e => { e.stopPropagation(); jid = e.pointerId; j0 = [e.clientX, e.clientY]; j.setPointerCapture(jid); });
      j.addEventListener('pointermove', e => { if (e.pointerId !== jid) return; const dx = e.clientX - j0[0], dy = e.clientY - j0[1], r = Math.min(1, Math.hypot(dx, dy) / 48), a = Math.atan2(dy, dx); me.joy = [Math.cos(a) * r, Math.sin(a) * r]; j.firstChild.style.transform = `translate(${me.joy[0] * 30}px, ${me.joy[1] * 30}px)`; });
      const jEnd = e => { if (e.pointerId !== jid) return; jid = null; me.joy = [0, 0]; j.firstChild.style.transform = ''; }; j.addEventListener('pointerup', jEnd); j.addEventListener('pointercancel', jEnd); }
    const solid = (x, y, z) => { if (y < 0) return true; const k = key(x, y, z), P = data(); if (P.b[k]) return true; const below = key(x, y - 1, z); return !!(P.m[k] || P.m[below]); };
    const hitsAt = (x, y, z) => { for (const dx of [-.3, .3]) for (const dz of [-.3, .3]) for (const dy of [.05, 1, 1.75]) if (solid(Math.round(x + dx), Math.floor(y + dy), Math.round(z + dz))) return true; return Math.abs(x) > 31.4 || Math.abs(z) > 31.4; };
    st.inMe = (c) => Math.abs(c[0] - me.x) < .8 && Math.abs(c[2] - me.z) < .8 && c[1] >= Math.floor(me.y) - 0 && c[1] <= Math.floor(me.y + 1.75);
    st.stepMe = (dt) => {
      const k = me.keys, f = (k.w ? 1 : 0) - (k.s ? 1 : 0) - me.joy[1], r = (k.d ? 1 : 0) - (k.a ? 1 : 0) + me.joy[0], len = Math.hypot(f, r), sp = (k.shift ? 7 : 4.3) * dt;
      if (len > .01) { const fx = -Math.sin(me.yaw), fz = -Math.cos(me.yaw), rx = Math.cos(me.yaw), rz = -Math.sin(me.yaw), m = Math.min(1, len); const vx = (fx * f + rx * r) / len * sp * m, vz = (fz * f + rz * r) / len * sp * m;
        if (!hitsAt(me.x + vx, me.y, me.z)) me.x += vx; if (!hitsAt(me.x, me.y, me.z + vz)) me.z += vz; }
      if (k[' '] && me.ground) { me.vy = 7.2; me.ground = false; }
      const foot = (x, cy, z) => { for (const dx of [-.3, .3]) for (const dz of [-.3, .3]) if (solid(Math.round(x + dx), cy, Math.round(z + dz))) return true; return false; };
      me.vy = Math.max(-30, me.vy - 22 * dt); const ny = me.y + me.vy * dt;
      if (me.vy <= 0) {
        const cy = Math.floor(ny);
        if (ny <= 0) { me.y = 0; me.vy = 0; me.ground = true; }
        else if (foot(me.x, cy, me.z) && me.y >= cy + 1 - 1e-3) { me.y = cy + 1; me.vy = 0; me.ground = true; }
        else { me.y = ny; me.ground = false; }
      } else if (foot(me.x, Math.floor(ny + 1.8), me.z)) me.vy = 0; else { me.y = ny; me.ground = false; }
      cam.position.set(me.x, me.y + 1.62, me.z); cam.rotation.set(me.pitch, me.yaw, 0, 'YXZ');
    };
    st.setMode = (m) => { st.mode = m; ctl.enabled = m === 'orbit'; cross.hidden = hint.hidden = m !== 'fp'; if (st.joy) st.joy.hidden = m !== 'fp'; host.querySelectorAll('.pz-jump').forEach(b => b.hidden = m !== 'fp');
      if (m === 'orbit') { if (document.pointerLockElement) document.exitPointerLock(); cam.rotation.order = 'XYZ'; cam.position.set(me.x + 14, 18, me.z + 20); ctl.target.set(me.x, 0, me.z); ctl.update(); } else { cam.rotation.order = 'YXZ'; } };
    ctl.enabled = false;
    const pick = e => {
      if (st.mode === 'fp') ptr.set(0, 0); else { const r = renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); }
      ray.setFromCamera(ptr, cam);
      const hits = ray.intersectObjects([ground, ...[...objs.values()]], true).filter(x => x.object.isMesh); const h = hits[0] || null; return st.mode === 'fp' && h && h.distance > 7.5 ? null : h;
    };
    st.pick = pick;
    const cellFor = h => {
      if (!h) return null; const o = h.object;
      if (o === ground) return [Math.round(h.point.x), 0, Math.round(h.point.z)];
      const k = o.userData.k; if (!k) return null; const [x, y, z] = k.split(',').map(Number);
      if (o.userData.mon) return null; const n = h.face.normal; return [x + Math.round(n.x), y + Math.round(n.y), z + Math.round(n.z)];
    };
    const cv = renderer.domElement;
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('mousedown', e => {
      if (st.mode !== 'fp' || st.touch) return;
      if (document.pointerLockElement !== cv) { cv.requestPointerLock && cv.requestPointerLock(); return; }
      const h = pick(e); if (e.button === 2) { const t0 = st.tool; st.tool = 'erase'; act(h, cellFor); st.tool = t0; paintBar(); } else if (e.button === 0) act(h, cellFor);
    });
    document.addEventListener('pointerlockchange', () => { if (!st) return; const on = document.pointerLockElement === cv; st.hint.hidden = on || st.mode !== 'fp'; st.host.classList.toggle('locked', on); });
    document.addEventListener('mousemove', e => { if (!st || st.mode !== 'fp' || document.pointerLockElement !== cv) return; if (Math.abs(e.movementX) > 150 || Math.abs(e.movementY) > 150) return; me.yaw -= e.movementX * .0024; me.pitch = Math.max(-1.5, Math.min(1.5, me.pitch - e.movementY * .0024)); });
    let tl = null;
    cv.addEventListener('pointerdown', e => { if (st.mode !== 'fp' || !st.touch) return; st.hint.hidden = true; tl = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), moved: false }; tl.lp = setTimeout(() => { if (tl && !tl.moved) { const t0 = st.tool; st.tool = 'erase'; act(pick(e), cellFor); st.tool = t0; paintBar(); tl.done = true; } }, 550); });
    cv.addEventListener('pointermove', e => { if (!tl || e.pointerId !== tl.id) return; const dx = e.clientX - tl.x, dy = e.clientY - tl.y; tl.x = e.clientX; tl.y = e.clientY; if (Math.hypot(e.clientX - tl.x0, e.clientY - tl.y0) > 8) tl.moved = true; me.yaw -= dx * .006; me.pitch = Math.max(-1.5, Math.min(1.5, me.pitch - dy * .006)); });
    cv.addEventListener('pointerup', e => { if (!tl || e.pointerId !== tl.id) return; clearTimeout(tl.lp); if (!tl.moved && !tl.done && performance.now() - tl.t < 450) act(pick(e), cellFor); tl = null; });
    renderer.domElement.addEventListener('pointermove', e => {
      if (st.mode === 'fp') return;
      if (st.tool === 'view') { ghost.visible = false; const h = pick(e); renderer.domElement.style.cursor = h && h.object.userData.mon ? 'pointer' : 'grab'; return; }
      const h = pick(e), c = st.tool === 'erase' ? (h && h.object.userData.k ? h.object.userData.k.split(',').map(Number) : null) : cellFor(h);
      if (!c || c[1] < 0 || c[1] > 30 || Math.abs(c[0]) > 31 || Math.abs(c[2]) > 31) { ghost.visible = false; return; }
      ghost.visible = true; ghost.position.set(c[0], c[1] + .5, c[2]); ghost.material.color.set(st.tool === 'erase' ? css('--bad') : css('--accent')); renderer.domElement.style.cursor = 'crosshair';
    });
    let down = null; renderer.domElement.addEventListener('pointerdown', e => { if (st.mode === 'fp') return; down = [e.clientX, e.clientY]; });
    renderer.domElement.addEventListener('pointerup', e => {
      if (st.mode === 'fp') return;
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6 || e.button !== 0) return; down = null; act(pick(e), cellFor);
    });
    let last = performance.now();
    const loop = now => {
      st.raf = requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (st.mode === 'fp') { st.stepMe(dt); const h = pick(null), c = st.tool === 'erase' ? (h && h.object.userData.k ? h.object.userData.k.split(',').map(Number) : null) : st.tool === 'view' ? null : cellFor(h);
        if (c && c[1] >= 0 && c[1] <= 30 && !(st.tool !== 'erase' && st.inMe(c))) { ghost.visible = true; ghost.position.set(c[0], c[1] + .5, c[2]); ghost.material.color.set(st.tool === 'erase' ? css('--bad') : css('--accent')); } else ghost.visible = false;
        cross.classList.toggle('mon', !!(h && h.object.userData.mon)); }
      else ctl.update();
      objs.forEach(o => { if (o.userData.pop) { const k = Math.min(1, (now - o.userData.pop) / 260); o.scale.setScalar(.2 + .8 * (1 + 1.7 * Math.pow(k - 1, 3) + .7 * Math.pow(k - 1, 2))); if (k >= 1) { o.scale.setScalar(1); delete o.userData.pop; } } o.children.forEach(c => { if (c.userData.spin) c.rotation.y = now / 600; }); });
      renderer.render(scene, cam);
    };
    st.raf = requestAnimationFrame(loop);
    st.ro = new ResizeObserver(() => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }); st.ro.observe(host);
    st.addMesh = addMesh; st.monMesh = monMesh;
    st.setMode('fp'); cam.position.set(me.x, 1.62, me.z); cam.rotation.set(me.pitch, me.yaw, 0, 'YXZ');
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
    if (st.mode === 'fp' && h && h.object.userData.mon && st.tool !== 'mon') { if (document.pointerLockElement) document.exitPointerLock(); location.hash = '#' + h.object.userData.mon; return; }
    const c = cellFor(h); if (!c || c[1] < 0 || c[1] > 30) return; const k = key(...c); if (P.b[k] || P.m[k]) return;
    if (st.mode === 'fp' && st.inMe(c)) return;
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
    bar.innerHTML = `<div class="pz-tools">${[['build', '蓋'], ['erase', '拆'], ['mon', `紀念碑 ${mons.length}`], ['view', '逛']].map(([t, n]) => `<button type="button" class="chip${st.tool === t ? ' on' : ''}" data-pt="${t}">${n}</button>`).join('')}<span class="pz-free">${P.free > 0 ? `免費方塊 ${P.free}` : ''}</span><button type="button" class="chip pz-mode" data-pmode="${st.mode === 'fp' ? 'orbit' : 'fp'}">${st.mode === 'fp' ? '俯瞰' : '走進去'}</button></div>
      ${st.tool === 'build' ? `<div class="pz-mats">${MATS.map((m, i) => `<button type="button" class="pz-mat${st.mat === m.id ? ' on' : ''}" data-pm="${m.id}" title="${m.name}"><i style="background:${m.color}"></i><span>${m.name}</span><small>${COIN}${m.cost}</small><kbd>${i + 1}</kbd></button>`).join('')}</div>` : ''}
      ${st.tool === 'mon' ? (mons.length ? `<div class="pz-mons">${mons.map(l => `<button type="button" class="chip${st.mon === l.id ? ' on' : ''}" data-pmon="${l.id}" style="--sc:var(--s-${l.subject})"><span class="sdot"></span>${esc(l.title.split(/[：（、]/)[0])}</button>`).join('')}</div>` : '<p class="muted small">讀完一章或拿到星，就會得到那章的紀念碑。</p>') : ''}
      ${st.tool === 'view' ? `<p class="muted small">${st.mode === 'fp' ? '準星對著紀念碑點一下，回到那一章。' : '點紀念碑回到那一章。'}</p>` : ''}`;
    $$('[data-pt]', bar).forEach(b => b.onclick = () => { st.tool = b.dataset.pt; st.ghost.visible = false; paintBar(); });
    $$('[data-pmode]', bar).forEach(b => b.onclick = () => { st.setMode(b.dataset.pmode); paintBar(); });
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
  const MOVE = { w: 'w', a: 'a', s: 's', d: 'd', arrowup: 'w', arrowdown: 's', arrowleft: 'a', arrowright: 'd', ' ': ' ', shift: 'shift' };
  document.addEventListener('keyup', e => { if (!st || !st.me) return; const m = MOVE[e.key.toLowerCase()]; if (m) st.me.keys[m] = false; });
  window.addEventListener('blur', () => { if (st && st.me) st.me.keys = {}; });
  document.addEventListener('keydown', e => {
    if (!st || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
    const mv = MOVE[e.key.toLowerCase()];
    if (mv && st.mode === 'fp' && location.hash.slice(1) === 'palace') { st.me.keys[mv] = true; e.preventDefault(); return; }
    if (/^[1-7]$/.test(e.key)) { st.tool = 'build'; st.mat = MATS[+e.key - 1].id; paintBar(); }
    else if (e.key === 'e' || e.key === 'E') { st.tool = st.tool === 'erase' ? 'build' : 'erase'; paintBar(); }
    else if (e.key === 'Escape' && st.mode !== 'fp') { st.tool = 'view'; paintBar(); }
  });
  return { view, stop, MATS, earned, _st: () => st };
})();
