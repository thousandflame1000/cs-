/* 資工所衝刺站 — 對抗惰性：發呆偵測、離開提醒、回來時直接給下一步、桌面通知、時間到了提醒 */
'use strict';

const Nudge = {
  last: Date.now(), hiddenAt: null, idleShown: false, sent: {},
  IDLE_MIN: 8,
  init() {
    ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart', 'wheel'].forEach(ev => document.addEventListener(ev, () => { this.last = Date.now(); }, { passive: true, capture: true }));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { this.hiddenAt = Date.now(); return; }
      const away = this.hiddenAt ? (Date.now() - this.hiddenAt) / 60000 : 0; this.hiddenAt = null; this.last = Date.now();
      if (away >= 15) this.welcome(Math.round(away));
    });
    // 很久沒開（例如隔天第一次開）也給「歡迎回來」
    const prev = +(localStorage.getItem('csgrad.lastSeen') || 0); try { localStorage.setItem('csgrad.lastSeen', Date.now()); } catch (e) { }
    if (prev && Date.now() - prev > 3 * 3600e3 && S.st.onboarded) setTimeout(() => this.welcome(Math.round((Date.now() - prev) / 60000)), 1200);
    setInterval(() => this.tick(), 30000);
  },
  idleMin() { return (Date.now() - this.last) / 60000; },
  /* 專注計時中卻 8 分鐘沒有任何操作：可能在滑手機 → 暫停計時並問一下 */
  checkIdle() {
    const t = S.st.timer; if (!t.running || document.hidden || this.idleShown) return false;
    if (this.idleMin() < this.IDLE_MIN) return false;
    this.idleShown = true;
    this.overlay(`<div class="nd-ic">👀</div><h2>還在嗎？</h2><p class="muted">計時已暫停</p>`,
      [['繼續', () => { this.idleShown = false; this.last = Date.now(); S.st.timer.last = Date.now(); }, 'primary'], ['休息 10 分', () => { this.idleShown = false; this.last = Date.now(); Timer.reset('break'); }]]);
    return true;
  },
  welcome(mins) {
    if (!S.st.onboarded || $('.nd-wrap')) return; const c = Auto.current(); if (!c) return;
    
    this.overlay(`<div class="nd-ic">${c.icon}</div><h2>${esc(c.title)}</h2><p class="muted">${c.mins} 分</p>`,
      [['開始', () => { location.hash = '#go'; setTimeout(() => { if (!S.st.timer.running) Timer.toggle(); c.act(); }, 60); }, 'primary'], ['5 分鐘', () => Nudge.five()], ['稍後', () => { }]]);
  },
  /* 5 分鐘法則：最小的起步，做了通常就會繼續 */
  five() {
    if (!S.st.timer.running) Timer.toggle();
    const cd = Learn.cardDue().length;
    if (cd) startCards({ noNew: true, title: '5 分鐘：到期必背卡', max: 15 });
    else if (S.dueReviews().length) Practice.start(S.dueReviews().slice(0, 4), { title: '5 分鐘：到期複習', review: true });
    else if (Learn.newCards().length && Learn.newLeft()) startCards({ title: '5 分鐘：新的必背卡', max: 12 });
    else { Practice.startAdaptive(); Practice.sess.opts.limit = 4; Practice.sess.opts.title = '5 分鐘：自適應 4 題'; }

  },
  overlay(html, btns) {
    const w = h('div', { class: 'nd-wrap', role: 'dialog', 'aria-modal': 'true' });
    w.innerHTML = `<div class="nd-box">${html}<div class="row center">${btns.map(([t, , cls], i) => `<button class="btn ${cls || ''}" data-nb="${i}">${t}</button>`).join('')}</div></div>`;
    document.body.appendChild(w);
    $$('[data-nb]', w).forEach(b => b.onclick = () => { w.remove(); btns[+b.dataset.nb][1](); });
  },
  /* ---------- 桌面通知（網站開著、在背景時也會跳） ---------- */
  canNotify() { return 'Notification' in window && Notification.permission === 'granted'; },
  async ask() { if (!('Notification' in window)) { toast('這個瀏覽器不支援通知', 'bad'); return false; } const r = await Notification.requestPermission(); S.st.settings.notify = r === 'granted'; S.save(); toast(r === 'granted' ? '提醒已開啟' : '未開啟', r === 'granted' ? 'good' : ''); return r === 'granted'; },
  notify(key, title, body) {
    const k = D.today() + ':' + key; if (this.sent[k] || (S.st.nudged || {})[k]) return; this.sent[k] = 1; (S.st.nudged = S.st.nudged || {})[k] = 1; S.save();
    if (this.canNotify() && document.hidden) { try { const n = new Notification(title, { body, tag: 'csgrad-' + key }); n.onclick = () => { window.focus(); location.hash = '#go'; n.close(); }; } catch (e) { } }
    else if (!document.hidden) toast(title + '：' + body, '');
  },
  tick() {
    if (!S.st.onboarded) return;
    const now = new Date(), hm = now.getHours() * 60 + now.getMinutes(), set = S.st.settings, L = S.day(), c = Auto.current();
    const toMin = s => { const m = String(s || '').match(/^(\d{1,2}):(\d{2})$/); return m ? +m[1] * 60 + +m[2] : null; };
    const start = toMin(set.studyStart), commit = toMin(L.commit || set.commitTime);
    if (start != null && hm >= start && hm < start + 180 && L.min < 1 && L.q === 0 && c) this.notify('start', '到讀書時間了', `下一步：${c.title}（約 ${c.mins} 分）`);
    if (start != null && hm >= start + 60 && hm < start + 240 && L.min < 1 && L.q === 0 && c) this.notify('start2', '已經晚了一小時', '現在只做 5 分鐘也好，打開就有下一步。');
    if (commit != null && !L.checkin && hm >= commit - 60 && hm < commit) { const left = Auto.list().filter(s => !s.done && !s.skipped).length; this.notify('commit', `一小時後要打卡`, `今天還剩 ${left} 步。做不完就切保底模式，至少不要斷。`); }
    if (commit != null && !L.checkin && hm >= commit) this.notify('commit2', '你承諾的打卡時間到了', '誠實打卡也算數：寫下今天卡在哪裡。');
    const t = S.st.timer; if (t.running && document.hidden && this.hiddenAt && Date.now() - this.hiddenAt > 5 * 60000) this.notify('away' + Math.floor(Date.now() / 1800000), '專注計時暫停中', '你切出去 5 分鐘了。回來繼續，下一步已經排好。');
  },
};
