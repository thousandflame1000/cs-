/* 資工所衝刺站 — 變成 App：安裝到桌面／主畫面、離線可開、手機掃 QR code 一起用 */
'use strict';
const App = {
  prompt: null,
  init() {
    // 可安裝、可離線：只有經由 server.py（http://127.0.0.1）打開時才有意義；單檔版與自我檢查頁不註冊
    if (window.SELFTEST || !('serviceWorker' in navigator) || !window.isSecureContext || !document.querySelector('link[rel=manifest]')) return;
    navigator.serviceWorker.register('sw.js').catch(() => { });
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); this.prompt = e; if ((location.hash.slice(1) || 'go') === 'setup') try { route(); } catch (x) { } });
    window.addEventListener('appinstalled', () => { this.prompt = null; toast('已安裝：之後從桌面圖示打開就好', 'good'); });
  },
  standalone() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; },

  /* 設定頁的一張卡：安裝成 App ＋ 手機也能用 */
  card() {
    const http = Bridge.mode === 'http', local = Bridge.local !== false;
    const inst = this.standalone() ? '<p class="small good-t">✓ 已經是 App 了</p>'
      : this.prompt ? '<div class="row"><button class="btn primary" id="appInst">📲 安裝到桌面</button></div>'
        : `<p class="muted small">${location.protocol === 'file:' ? '用 start.bat 打開時，網址列右側會出現「安裝」圖示。' : '瀏覽器選單 →「安裝應用程式」或「加到主畫面」。'}</p>`;
    const phone = Bridge.mode === 'cloud' ? ''
      : !http ? '<p class="muted small">先用 start.bat 打開網站，才能讓手機連進來。</p>'
      : !local ? '<p class="small good-t">✓ 這台是透過電腦連線，進度會跟電腦自動合併。</p>'
        : `<div id="lanBox"><p class="muted small">讀取中…</p></div>`;
    return `<section class="card" id="appCard"><div class="card-h"><h2>App 與手機</h2></div>
      <h3 class="small-h">裝成 App</h3>${inst}
      ${phone ? `<h3 class="small-h">手機也能用</h3>${phone}` : ''}</section>`;
  },
  async wire() {
    const b = $('#appInst'); if (b) b.onclick = async () => { const p = this.prompt; if (!p) return; p.prompt(); try { await p.userChoice; } catch (e) { } this.prompt = null; route(); };
    const box = $('#lanBox'); if (!box) return;
    const paint = j => {
      box.innerHTML = j && j.on && j.url
        ? `<div class="lan-on"><div class="lan-qr">${QR.svg(j.url, 180)}</div><div><p><b>手機連同一個 Wi-Fi，用相機掃這個 QR code。</b></p><p class="muted small">打開後選「加到主畫面」，就像 App 一樣。手機和電腦的進度會自動合併。</p><p class="muted small"><code>${esc(j.url)}</code></p><div class="row"><button class="btn" id="lanOff">關閉手機連線</button></div></div></div>`
        : `<p class="muted small">打開後，同一個 Wi-Fi 的手機掃 QR code 就能用；只有掃過碼的手機能看到你的進度。第一次會跳出 Windows 防火牆詢問，請按「允許」。</p>${j && j.error ? `<p class="small bad-t">${esc(j.error)}</p>` : ''}<div class="row"><button class="btn primary" id="lanOn">📱 打開手機連線</button></div>`;
      const on = $('#lanOn'), off = $('#lanOff');
      if (on) on.onclick = async () => { on.disabled = true; on.textContent = '開啟中…'; paint(await this.lan(true)); };
      if (off) off.onclick = async () => { paint(await this.lan(false)); };
    };
    paint(await this.lan());
  },
  async lan(on) {
    try {
      const r = on === undefined ? await Bridge.api('lan') : await Bridge.api('lan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ on }) });
      return await r.json();
    } catch (e) { return { on: false, error: '連不到 server.py' }; }
  },
};
