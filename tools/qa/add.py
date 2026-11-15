"""draft 用 @q 前綴-? | 知識點 | 難度 | 形式；自動編號、H4 預檢、qlint 模擬；加 go 才真的追加。"""
import sys, os, re, io, subprocess, shutil, glob, tempfile
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # 專案根目錄
TMP = tempfile.mkdtemp(prefix='add-'); Q = R + '/content/quiz'
FILE = {'al': 'b-al5.txt', 'co': 'b-co3.txt', 'dm': 'b-dm3.txt', 'la': 'b-la3.txt', 'os': 'b-os4.txt', 'ds': 'b-ds6.txt', 'en': 'b-en1.txt', 'f': 'b-f1.txt'}
draft = io.open(sys.argv[1], encoding='utf-8').read().replace('\r\n', '\n')
go = len(sys.argv) > 2 and sys.argv[2] == 'go'
mx, pk = {}, {}
for f in glob.glob(Q + '/*.txt'):
    for m in re.finditer(r'^@q ([a-z]+\d*)-(\d+)\s*\|\s*(\S+)', io.open(f, encoding='utf-8').read(), re.M):
        p = m.group(1); mx[p] = max(mx.get(p, 0), int(m.group(2))); pk.setdefault(p, set()).add(m.group(3))
out, err, allb = {}, [], []
for b in re.split(r'^(?=@q )', draft, flags=re.M):
    if not b.startswith('@q '): continue
    m = re.match(r'@q ([a-z]+\d*)-\?\s*\|\s*(\S+)', b)
    if not m: err.append('bad head: ' + b[:40]); continue
    p, kp = m.group(1), m.group(2)
    if p in pk and kp not in pk[p]: err.append(f'prefix {p} 對到 {pk[p]} 不是 {kp}')
    mx[p] = mx.get(p, 0) + 1
    b = b.replace(f'@q {p}-?', f'@q {p}-{mx[p]:02d}', 1).rstrip('\n') + '\n\n\n'
    out.setdefault(FILE[kp.split('-')[0]], []).append(b); allb.append(b)
if err: print('\n'.join(err)); sys.exit(1)
io.open(os.path.join(TMP, 'ready.txt'), 'w', encoding='utf-8').write(''.join(allb))
print('題數', len(allb), {k: len(v) for k, v in out.items()})
h = subprocess.run(['python3', 'tools/qa/h4pre.py', os.path.join(TMP, 'ready.txt')], cwd=R, capture_output=True, text=True)
print(h.stdout.strip()[-1500:], h.stderr[-800:])
S = os.path.join(TMP, 'sim')
os.makedirs(S + '/tools'); os.makedirs(S + '/content/quiz'); shutil.copy(R + '/tools/qlint.py', S + '/tools/')
for f in glob.glob(Q + '/b-*.txt'): shutil.copy(f, S + '/content/quiz/')
for fn, L in out.items():
    with io.open(S + '/content/quiz/' + fn, 'a', encoding='utf-8') as fh: fh.write('\n' + ''.join(L))
r = subprocess.run(['python3', S + '/tools/qlint.py'], capture_output=True, text=True).stdout
kps = set(re.findall(r'^@q \S+ \|\s*(\S+)', ''.join(allb), re.M))
print('\n'.join(l for l in r.split('\n') if any(l.strip().startswith(k + '：') for k in kps) or '違規' in l or l.startswith('  ·')))
okh = 'H4 預檢違規 0' in h.stdout; okq = '違規： 0' in r
if go and okh and okq:
    for fn, L in out.items():
        with io.open(Q + '/' + fn, 'a', encoding='utf-8') as fh: fh.write('\n' + ''.join(L))
    print('已追加', sum(len(L) for L in out.values()))
    p = subprocess.run(['python3', 'tools/qa/progress.py'], cwd=R, capture_output=True, text=True); print('progress', p.stdout.strip())
elif go: print('沒追加（有違規）')
