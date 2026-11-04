# -*- coding: utf-8 -*-
"""資工所衝刺站 本機伺服器（只用 Python 標準函式庫）

用法：python server.py [--port 8765] [--no-browser]
  - 提供 web/ 底下的網站（可安裝成 App；離線也能開）
  - 「手機也能用」：在網站的設定頁打開後，同一個 Wi-Fi 的手機掃 QR code 就能用，進度跟電腦合併
    （只有帶著金鑰的手機能讀寫進度；關掉後立刻停止對外連線）
  - 把網頁送出的訊息「追加」到 bridge/inbox.jsonl
  - 讓網頁讀取 bridge/outbox.jsonl（Agent 寫的回覆）
  - 把進度寫到 bridge/progress.json 與 bridge/state.json
Agent 那一端完全不需要這個伺服器：它只要讀寫 bridge/ 裡的檔案（見 AGENTS.md）。
"""
import http.server
import json
import os
import secrets
import socket
import sys
import threading
import time
import webbrowser
from datetime import datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(ROOT, 'web')
BR = os.path.join(ROOT, 'bridge')
LOCK = threading.Lock()
LAN = {'srv': None, 'ip': None, 'port': None}
META = {'device': None, 'ts': 0, 'mtime': None}


def lan_ip():
    """找這台電腦在區網的 IP（不會真的送封包出去）。"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
        s.close()
        if not ip.startswith('127.'):
            return ip
    except OSError:
        pass
    try:
        ip = socket.gethostbyname(socket.gethostname())
        return None if ip.startswith('127.') else ip
    except OSError:
        return None


def lan_cfg():
    try:
        with open(bpath('lan.json'), encoding='utf-8') as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def lan_save(cfg):
    write_atomic('lan.json', json.dumps(cfg, ensure_ascii=False))


def lan_url():
    if not LAN['srv']:
        return None
    return 'http://%s:%d/#k=%s' % (LAN['ip'], LAN['port'], lan_cfg().get('key', ''))


def lan_start(port):
    """多開一個只綁區網 IP 的伺服器（127.0.0.1 那個照舊）。第一次會跳出 Windows 防火牆詢問，請按允許。"""
    if LAN['srv']:
        return True, lan_url()
    ip = lan_ip()
    if not ip:
        return False, '找不到區網 IP：這台電腦有連上 Wi-Fi 或網路線嗎？'
    cfg = lan_cfg()
    if not cfg.get('key'):
        cfg['key'] = secrets.token_hex(4)
    try:
        srv = http.server.ThreadingHTTPServer((ip, port), Handler)
    except OSError as e:
        return False, '無法在 %s:%d 開啟：%s' % (ip, port, e)
    LAN.update(srv=srv, ip=ip, port=port)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    cfg['on'] = True
    lan_save(cfg)
    print(' 手機也能用：同一個 Wi-Fi 的手機打開  ' + lan_url())
    return True, lan_url()


def lan_stop():
    srv = LAN['srv']
    LAN.update(srv=None)
    if srv:
        threading.Thread(target=srv.shutdown, daemon=True).start()
    cfg = lan_cfg()
    cfg['on'] = False
    lan_save(cfg)
    print(' 手機連線已關閉')


def state_meta():
    """bridge/state.json 是哪台裝置、什麼時候寫的（讓別台裝置知道要不要合併）。
    檔案被別人改過（例如 OneDrive 從另一台電腦同步過來）就重新讀一次裝置代號。"""
    try:
        mt = int(os.stat(bpath('state.json')).st_mtime * 1000)
    except OSError:
        return {'device': None, 'ts': 0}
    if mt != META.get('mtime'):
        try:
            with open(bpath('state.json'), encoding='utf-8') as f:
                d = json.load(f)
            META.update(device=d.get('device'), ts=mt, mtime=mt)
        except (OSError, ValueError):
            pass
    return {'device': META.get('device'), 'ts': META.get('ts', 0)}


def bpath(name):
    return os.path.join(BR, name)


def read_text(name):
    try:
        with open(bpath(name), encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return ''


def write_atomic(name, text):
    tmp = bpath(name + '.tmp')
    with open(tmp, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    os.replace(tmp, bpath(name))


def daily_backup(text, keep=30):
    """每天一份 bridge/backups/state-YYYY-MM-DD.json（同一天覆蓋），保留最近 keep 份。"""
    try:
        bdir = bpath('backups')
        os.makedirs(bdir, exist_ok=True)
        name = os.path.join(bdir, 'state-%s.json' % __import__('datetime').date.today().isoformat())
        with open(name + '.tmp', 'w', encoding='utf-8', newline='\n') as f:
            f.write(text)
        os.replace(name + '.tmp', name)
        olds = sorted(x for x in os.listdir(bdir) if x.startswith('state-') and x.endswith('.json'))
        for x in olds[:-keep]:
            try:
                os.remove(os.path.join(bdir, x))
            except OSError:
                pass
    except OSError:
        pass


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map, **{
        '.webmanifest': 'application/manifest+json', '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png'})

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=WEB, **kw)

    def _local(self):
        return self.client_address[0] in ('127.0.0.1', '::1')

    def _authed(self):
        """本機一律可以；手機（區網）要帶金鑰，而且「手機也能用」要開著。"""
        if self._local():
            return True
        key = lan_cfg().get('key')
        got = self.headers.get('X-Key') or ''
        if not got and 'k=' in (self.path or ''):
            got = self.path.split('k=', 1)[1].split('&')[0]
        return bool(LAN['srv'] and key and secrets.compare_digest(got, key))

    def log_message(self, fmt, *args):
        if '/api/' not in (self.path or ''):
            return
        if self.command == 'POST':
            sys.stdout.write('[%s] %s %s\n' % (datetime.now().strftime('%H:%M:%S'), self.command, self.path))

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def _send(self, code, body, ctype='application/json; charset=utf-8'):
        data = body.encode('utf-8') if isinstance(body, str) else body
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _body(self):
        n = int(self.headers.get('Content-Length') or 0)
        return self.rfile.read(n).decode('utf-8') if n else ''

    def do_GET(self):
        p = self.path.split('?')[0]
        if not self._local() and not LAN['srv']:
            return self._send(403, '{"ok":false}')
        if p == '/api/ping':
            ok = self._authed()
            return self._send(200, json.dumps({'ok': ok, 'mode': 'http', 'auth': ok, 'local': self._local(), 'bridge': BR if self._local() else ''}, ensure_ascii=False))
        if p.startswith('/api/') and not self._authed():
            return self._send(403, '{"ok":false,"error":"need key"}')
        if p == '/api/lan':
            if not self._local():
                return self._send(403, '{"ok":false}')
            return self._send(200, json.dumps({'ok': True, 'on': bool(LAN['srv']), 'url': lan_url(), 'ip': lan_ip()}, ensure_ascii=False))
        if p == '/api/statemeta':
            return self._send(200, json.dumps(state_meta(), ensure_ascii=False))
        if p == '/api/outbox':
            return self._send(200, read_text('outbox.jsonl'), 'text/plain; charset=utf-8')
        if p == '/api/heartbeat':
            return self._send(200, read_text('heartbeat.json'), 'text/plain; charset=utf-8')
        if p == '/api/state':
            return self._send(200, read_text('state.json'), 'text/plain; charset=utf-8')
        if p.startswith('/api/'):
            return self._send(404, '{"ok":false}')
        return super().do_GET()

    def do_POST(self):
        p = self.path.split('?')[0]
        if not self._authed():
            return self._send(403, '{"ok":false,"error":"need key"}')
        try:
            body = self._body()
            if p == '/api/lan':
                if not self._local():
                    return self._send(403, '{"ok":false}')
                want = json.loads(body or '{}').get('on')
                if want:
                    ok, info = lan_start(self.server.server_address[1])
                    return self._send(200 if ok else 500, json.dumps({'ok': ok, 'on': ok, 'url': info if ok else None, 'error': None if ok else info}, ensure_ascii=False))
                lan_stop()
                return self._send(200, '{"ok":true,"on":false}')
            if p == '/api/inbox':
                msg = json.loads(body)
                if not isinstance(msg, dict):
                    raise ValueError('message must be an object')
                line = json.dumps(msg, ensure_ascii=False) + '\n'
                with LOCK:
                    with open(bpath('inbox.jsonl'), 'a', encoding='utf-8', newline='\n') as f:
                        f.write(line)
                kind = msg.get('type', '?')
                title = (msg.get('ctx') or {}).get('title', '')
                print('  → inbox：%s %s %s' % (kind, title, msg.get('id', '')))
                return self._send(200, '{"ok":true}')
            if p == '/api/progress':
                data = json.loads(body)
                with LOCK:
                    if 'progress' in data:
                        write_atomic('progress.json', json.dumps(data['progress'], ensure_ascii=False, indent=2))
                    if 'state' in data:
                        txt = json.dumps(data['state'], ensure_ascii=False)
                        write_atomic('state.json', txt)
                        daily_backup(txt)
                        mt = int(os.stat(bpath('state.json')).st_mtime * 1000)
                        META.update(device=(data['state'] or {}).get('device'), ts=mt, mtime=mt)
                return self._send(200, '{"ok":true}')
            return self._send(404, '{"ok":false}')
        except Exception as e:  # noqa
            return self._send(400, json.dumps({'ok': False, 'error': str(e)}, ensure_ascii=False))


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    port = 8765
    if '--port' in sys.argv:
        port = int(sys.argv[sys.argv.index('--port') + 1])
    os.makedirs(BR, exist_ok=True)
    for name in ('inbox.jsonl', 'outbox.jsonl'):
        if not os.path.exists(bpath(name)):
            open(bpath(name), 'a', encoding='utf-8').close()
    url = 'http://127.0.0.1:%d/' % port
    try:
        srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler)
    except OSError:
        # 已經有一個在跑（例如開機自動啟動過）：直接幫你打開網頁就好
        print('資工所衝刺站已經在執行，幫你打開網頁：' + url)
        if '--no-browser' not in sys.argv:
            webbrowser.open(url)
        return
    print('=' * 60)
    print(' 資工所衝刺站已啟動：' + url)
    print(' bridge 資料夾：' + BR)
    print(' 叫 Agent 監聽：在本資料夾執行  python agent.py watch')
    print(' 關閉：按 Ctrl+C 或直接關掉這個視窗')
    print('=' * 60)
    if lan_cfg().get('on'):
        ok, info = lan_start(port)
        if not ok:
            print(' 手機連線沒開成：' + info)
    if '--no-browser' not in sys.argv:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print('\n已關閉。')


if __name__ == '__main__':
    main()
